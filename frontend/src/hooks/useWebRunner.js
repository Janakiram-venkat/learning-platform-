import { useCallback, useEffect, useRef, useState } from 'react';
import { BLANK_DOC, RUNNER_SOURCE, buildSrcDoc, partitionChecks } from '../lib/webdev/sandbox';

// ---------------------------------------------------------------------------
// useWebRunner — drives a sandboxed HTML/CSS/JS preview and its terminal.
//
// The counterpart to useCodeRunner (which talks to Pyodide). Here the runtime
// is the browser itself, running inside an <iframe srcDoc sandbox="allow-scripts">.
// Nothing crosses the boundary except postMessage, so this hook's whole job is:
// compose the document, hand it to the frame, and turn the messages that come
// back into terminal lines and task verdicts.
//
// `frameKey` changes on every run. The consumer must pass it as the iframe's
// `key`, which forces React to throw the old frame away and mount a fresh one —
// the only reliable way to stop a run that is still going (a runaway loop, a
// setInterval the student never cleared).
//
// Measure frames
// --------------
// A check with `at: 375` asks what the page looks like in a 375px-wide browser.
// The preview frame is whatever width the student's screen gave it, and a
// `@media (max-width: 600px)` rule simply is not applying at 1100px — so there
// is nothing to read, at any cost, from the wrong width. Those checks are
// therefore graded in extra hidden frames, one per width, each holding the same
// document sized to exactly that width.
//
// The consumer renders them (see CodeRunner) and registers each one through
// `setMeasureRef`, because the message listener below authenticates a frame by
// `event.source` identity — a frame it has no reference to cannot be trusted,
// which is also why the nested-iframe version of this idea was not an option.
//
// Verdicts then arrive from several frames at once, so they are held until
// every expected frame has reported and handed over as ONE list in the authored
// order. A task must never flash "1 of 3 passed" on its way to the real answer.
// With no `at` check anywhere — every task in Module 1, and most of Module 2 —
// there is one reporter and this is exactly the single-frame path it always was.
// ---------------------------------------------------------------------------

const idOf = (() => { let n = 0; return () => ++n; })();

/**
 * How long to wait for every frame to report before giving up on the quiet
 * ones. Generous: this is a backstop for a frame that failed to load at all,
 * not a deadline for a slow one.
 */
const CHECKS_TIMEOUT_MS = 6000;

/** console level -> the line type Terminal renders. */
const LEVEL_TYPE = { log: 'out', info: 'out', warn: 'warn', error: 'err' };

/**
 * @param {object} [options]
 * @param {(results: Array<{index:number,passed:boolean,message:string}>) => void} [options.onChecks]
 *        Called when a run that carried task checks reports its verdicts.
 * @returns {{
 *   iframeRef: React.RefObject<HTMLIFrameElement>,
 *   srcDoc: string, frameKey: number, lines: object[], running: boolean,
 *   title: string|null,
 *   measureFrames: Array<{width: number, srcDoc: string, key: string}>,
 *   setMeasureRef: (key: string, el: HTMLIFrameElement|null) => void,
 *   run: (files: object, checks?: object[]|null) => void,
 *   stop: () => void, reset: () => void,
 *   handleFrameLoad: () => void,
 * }}
 */
export function useWebRunner({ onChecks } = {}) {
  const iframeRef = useRef(null);

  const [srcDoc, setSrcDoc] = useState('');
  const [frameKey, setFrameKey] = useState(0);
  const [lines, setLines] = useState([]);
  const [running, setRunning] = useState(false);
  // The hidden frames for this run's `at` checks, if it has any. Empty for
  // every task that does not ask about another viewport width.
  const [measureFrames, setMeasureFrames] = useState([]);
  // What the frame's <title> says, for the mock tab bar above the preview.
  // Empty string is meaningful ("a page with no title"), so null means
  // "nothing has run yet".
  const [title, setTitle] = useState(null);

  // The run the frame is currently executing. Messages tagged with anything
  // else are from a frame we've already replaced, and are dropped.
  const runIdRef = useRef(0);
  // Keep the callback fresh without re-subscribing the message listener.
  const onChecksRef = useRef(onChecks);
  useEffect(() => { onChecksRef.current = onChecks; }, [onChecks]);

  // The measure frames' elements, by key, so the listener can authenticate a
  // message as having come from one of them.
  const measureRefs = useRef(new Map());
  const setMeasureRef = useCallback((key, el) => {
    if (el) measureRefs.current.set(key, el);
    else measureRefs.current.delete(key);
  }, []);

  // Verdicts collected so far this run, how many frames still owe one, and the
  // message belonging to every check that was sent out — so a frame that never
  // answers can still be reported as a failure rather than as silence.
  const pendingRef = useRef({ runId: 0, expected: 0, received: 0, results: [], messages: new Map() });
  const timeoutRef = useRef(null);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }, []);

  const push = useCallback((type, text) => {
    setLines((prev) => [...prev, { id: idOf(), type, text }]);
  }, []);

  useEffect(() => {
    const onMessage = (event) => {
      // Two gates. `event.source` identity is the real one: only a frame we are
      // currently showing can be the source, so no other page, extension or
      // nested frame can inject terminal output or fake a passing check.
      // (Origin is "null" here by design — the sandbox has an opaque origin —
      // so it can't be checked, which is exactly why identity is used instead.)
      const isPreview = !!iframeRef.current && event.source === iframeRef.current.contentWindow;
      const isMeasure = !isPreview && [...measureRefs.current.values()]
        .some((el) => el && event.source === el.contentWindow);
      if (!isPreview && !isMeasure) return;

      const msg = event.data;
      if (!msg || msg.source !== RUNNER_SOURCE) return;
      if (String(msg.runId) !== String(runIdRef.current)) return;

      // A measure frame exists only to be measured. Its console output and its
      // title are the preview's own, reported a second time, and showing them
      // would double every line in the terminal.
      if (isMeasure && msg.kind !== 'checks') return;

      if (msg.kind === 'console') {
        push(LEVEL_TYPE[msg.level] || 'out', msg.text);
      } else if (msg.kind === 'error') {
        push('err', msg.text);
      } else if (msg.kind === 'checks') {
        const pending = pendingRef.current;
        if (String(pending.runId) !== String(msg.runId)) return;
        pending.received += 1;
        pending.results = [...pending.results, ...(msg.results || [])];
        // Hold until every frame that owes a verdict has given one, then hand
        // the whole set over in the order the author wrote the checks.
        if (pending.received >= pending.expected) {
          clearTimer();
          const results = [...pending.results].sort((a, b) => a.index - b.index);
          pending.results = [];
          onChecksRef.current?.(results);
        }
      } else if (msg.kind === 'title') {
        setTitle(String(msg.text ?? ''));
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [push, clearTimer]);

  useEffect(() => clearTimer, [clearTimer]);

  /**
   * Run one set of files. Clears the terminal and remounts the frame, so a
   * previous run can never bleed into this one.
   */
  const run = useCallback((files, checks = null) => {
    const nextId = runIdRef.current + 1;
    runIdRef.current = nextId;

    const { main, groups, reporters } = partitionChecks(checks);
    pendingRef.current = {
      runId: nextId,
      expected: reporters,
      received: 0,
      results: [],
      messages: new Map((checks || []).map((c, i) => [i, c.message])),
    };
    // Stale elements from the previous run's frames; React has not unmounted
    // them yet, and an authenticated-but-finished frame is exactly the thing
    // the runId gate is for. Clearing here keeps the map from growing forever.
    measureRefs.current.clear();

    // A frame that fails to load reports nothing, and with more than one
    // reporter the verdicts would then be held forever — the student presses
    // Run and nothing ever comes back, which reads as a hang. Report the
    // quiet checks as failures instead, with the reason attached, for the same
    // reason the sandbox never lets a thrown check go silent.
    clearTimer();
    if (reporters > 1) {
      timeoutRef.current = setTimeout(() => {
        const pending = pendingRef.current;
        if (String(pending.runId) !== String(nextId) || pending.received >= pending.expected) return;
        const answered = new Set(pending.results.map((r) => r.index));
        const missing = [...pending.messages.entries()]
          .filter(([index]) => !answered.has(index))
          .map(([index, message]) => ({
            index,
            passed: false,
            message,
            detail: 'this check could not be measured — press Run to try again',
          }));
        const results = [...pending.results, ...missing].sort((a, b) => a.index - b.index);
        pending.results = [];
        pending.received = pending.expected;
        onChecksRef.current?.(results);
      }, CHECKS_TIMEOUT_MS);
    }

    setLines([]);
    setTitle(null);
    setRunning(true);
    setSrcDoc(buildSrcDoc({ ...files, checks: main, runId: nextId }));
    setFrameKey(nextId);
    setMeasureFrames(groups.map(({ width, checks: at }) => ({
      width,
      key: `${nextId}-${width}`,
      // measureWidth is what makes the frame wait for its own width before
      // grading, and refuse to grade if it never arrives. Without it a frame
      // the browser has not sized yet reads 0px wide, where every geometry is
      // zero and every max-width media query is active — so the verdicts come
      // back confidently wrong rather than visibly broken.
      srcDoc: buildSrcDoc({ ...files, checks: at, runId: nextId, measureWidth: width }),
    })));
  }, [clearTimer]);

  /** Tear the frame down — the escape hatch for a run that won't finish. */
  const stop = useCallback(() => {
    const nextId = runIdRef.current + 1;
    runIdRef.current = nextId;
    setSrcDoc(BLANK_DOC);
    setFrameKey(nextId);
    setMeasureFrames([]);
    setRunning(false);
    clearTimer();
    push('sys', '↳ stopped');
  }, [push, clearTimer]);

  /** Back to "nothing has been run yet" — used when the page changes. */
  const reset = useCallback(() => {
    runIdRef.current += 1;
    clearTimer();
    setSrcDoc('');
    setMeasureFrames([]);
    setLines([]);
    setTitle(null);
    setRunning(false);
  }, [clearTimer]);

  /** Wire to the iframe's onLoad: the document has finished parsing. */
  const handleFrameLoad = useCallback(() => setRunning(false), []);

  return {
    iframeRef, srcDoc, frameKey, lines, running, title,
    measureFrames, setMeasureRef,
    run, stop, reset, handleFrameLoad,
  };
}
