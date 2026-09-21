import { useCallback, useEffect, useRef, useState } from 'react';
import { BLANK_DOC, RUNNER_SOURCE, buildSrcDoc } from '../lib/webdev/sandbox';

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
// ---------------------------------------------------------------------------

const idOf = (() => { let n = 0; return () => ++n; })();

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

  const push = useCallback((type, text) => {
    setLines((prev) => [...prev, { id: idOf(), type, text }]);
  }, []);

  useEffect(() => {
    const onMessage = (event) => {
      // Two gates. `event.source` identity is the real one: only the frame we
      // are currently showing can be the source, so no other page, extension
      // or nested frame can inject terminal output or fake a passing check.
      // (Origin is "null" here by design — the sandbox has an opaque origin —
      // so it can't be checked, which is exactly why identity is used instead.)
      if (!iframeRef.current || event.source !== iframeRef.current.contentWindow) return;

      const msg = event.data;
      if (!msg || msg.source !== RUNNER_SOURCE) return;
      if (String(msg.runId) !== String(runIdRef.current)) return;

      if (msg.kind === 'console') {
        push(LEVEL_TYPE[msg.level] || 'out', msg.text);
      } else if (msg.kind === 'error') {
        push('err', msg.text);
      } else if (msg.kind === 'checks') {
        onChecksRef.current?.(msg.results || []);
      } else if (msg.kind === 'title') {
        setTitle(String(msg.text ?? ''));
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [push]);

  /**
   * Run one set of files. Clears the terminal and remounts the frame, so a
   * previous run can never bleed into this one.
   */
  const run = useCallback((files, checks = null) => {
    const nextId = runIdRef.current + 1;
    runIdRef.current = nextId;

    setLines([]);
    setTitle(null);
    setRunning(true);
    setSrcDoc(buildSrcDoc({ ...files, checks, runId: nextId }));
    setFrameKey(nextId);
  }, []);

  /** Tear the frame down — the escape hatch for a run that won't finish. */
  const stop = useCallback(() => {
    const nextId = runIdRef.current + 1;
    runIdRef.current = nextId;
    setSrcDoc(BLANK_DOC);
    setFrameKey(nextId);
    setRunning(false);
    push('sys', '↳ stopped');
  }, [push]);

  /** Back to "nothing has been run yet" — used when the page changes. */
  const reset = useCallback(() => {
    runIdRef.current += 1;
    setSrcDoc('');
    setLines([]);
    setTitle(null);
    setRunning(false);
  }, []);

  /** Wire to the iframe's onLoad: the document has finished parsing. */
  const handleFrameLoad = useCallback(() => setRunning(false), []);

  return { iframeRef, srcDoc, frameKey, lines, running, title, run, stop, reset, handleFrameLoad };
}
