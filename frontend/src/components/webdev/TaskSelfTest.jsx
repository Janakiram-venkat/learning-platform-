// TEMPORARY — part of the /webdev-demo harness. Delete with it in Phase 7.
//
// Why this exists: task checks are graded by the browser (querySelector,
// getComputedStyle) inside a sandboxed frame. There is no DOM in Node and the
// repo has no headless-browser dependency, so "does this task's starter fail
// and its solution pass?" cannot be answered from a script.
//
// This answers it here instead. It runs every task's starter and solution
// through the real sandbox and the real check grader, and reports whether each
// behaved as it must:
//
//   starter  -> NOT every check passes  (otherwise the task is already done)
//   solution -> every check passes      (otherwise the task is impossible)
//
// Two things this harness has to get right, learned the hard way:
//
//  1. ONE iframe for the whole run. An earlier version remounted the frame per
//     job via `key`, which raced the listener against the first frame's load
//     and timed out job #1. Only `srcDoc` changes now; the element, and so the
//     identity `event.source` is compared against, is stable for the run.
//  2. A timeout is always a FAILURE, never "failed as expected". A silent
//     frame tells you nothing about whether the checks work, so it must never
//     be able to masquerade as a pass.

import { useCallback, useEffect, useRef, useState } from 'react';
import { Play, CheckCircle2, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import { RUNNER_SOURCE, buildSrcDoc } from '../../lib/webdev/sandbox';

const TIMEOUT_MS = 4000;
const MAX_ATTEMPTS = 2; // one retry

/** A trivial document whose verdict proves the whole pipeline is awake. */
const WARMUP_CHECKS = [{ type: 'dom', selector: '#warmup', message: 'warm-up' }];
const warmupDoc = (runId) =>
  buildSrcDoc({ html: '<p id="warmup">warming up</p>', checks: WARMUP_CHECKS, runId });

/** Flatten sections into the jobs we need to run. */
function buildJobs(sections) {
  const jobs = [];
  sections.forEach((section) => {
    (section.pages || [])
      .filter((p) => p.type === 'task')
      .forEach((page) => {
        jobs.push({ page: page.id, which: 'starter', files: page.starter, checks: page.checks, expectPass: false });
        jobs.push({ page: page.id, which: 'solution', files: page.solution, checks: page.checks, expectPass: true });
      });
  });
  return jobs;
}

/**
 * @param {{ sections: Array<object> }} props
 */
export default function TaskSelfTest({ sections }) {
  const [phase, setPhase] = useState('idle'); // idle | warmup | running | done
  const [jobs, setJobs] = useState([]);
  const [cursor, setCursor] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [results, setResults] = useState([]);
  const [srcDoc, setSrcDoc] = useState('');
  const [warmupNote, setWarmupNote] = useState(null);

  const iframeRef = useRef(null);
  const runIdRef = useRef(0);
  const timerRef = useRef(null);
  // Errors the frame reported during the current run, so a timeout can explain
  // itself instead of just saying "nothing came back".
  const errorsRef = useRef([]);

  const record = useCallback((verdict) => {
    clearTimeout(timerRef.current);
    setResults((prev) => [...prev, verdict]);
    setAttempt(0);
    setCursor((c) => c + 1);
  }, []);

  // --- Listen for the frame -------------------------------------------------
  useEffect(() => {
    if (phase === 'idle') return undefined;

    const onMessage = (event) => {
      if (!iframeRef.current || event.source !== iframeRef.current.contentWindow) return;
      const msg = event.data;
      if (!msg || msg.source !== RUNNER_SOURCE) return;
      if (String(msg.runId) !== String(runIdRef.current)) return;

      if (msg.kind === 'error') {
        errorsRef.current.push(msg.text);
        return;
      }
      if (msg.kind !== 'checks') return;

      if (phase === 'warmup') {
        clearTimeout(timerRef.current);
        setPhase('running');
        setCursor(0);
        setAttempt(0);
        return;
      }

      const job = jobs[cursor];
      if (!job) return;

      const checks = msg.results || [];
      const passedCount = checks.filter((r) => r.passed).length;
      const allPassed = checks.length > 0 && passedCount === checks.length;

      // An empty verdict means the grader gave up. Like a timeout, that says
      // nothing about whether the task works, so it must never be allowed to
      // read as "fails as expected".
      if (checks.length === 0) {
        record({
          ...job,
          results: [],
          correct: false,
          detail: errorsRef.current.length
            ? `grader returned no results — frame reported: ${errorsRef.current.join(' | ')}`
            : 'grader returned no results',
        });
        return;
      }

      record({
        ...job,
        results: checks,
        // A starter may satisfy a check incidentally, but it must not satisfy
        // all of them, or there is nothing left for the student to do.
        correct: job.expectPass ? allPassed : !allPassed,
        detail: job.expectPass
          ? `${passedCount}/${checks.length} passed`
          : passedCount === 0
            ? `all ${checks.length} checks fail (clean start)`
            : `${passedCount}/${checks.length} already passing`,
      });
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [phase, jobs, cursor, record]);

  // --- Drive the queue ------------------------------------------------------
  useEffect(() => {
    if (phase !== 'warmup' && phase !== 'running') return undefined;
    // Queue drained — "done" is derived from the cursor, not a state of its
    // own, so there's no extra render to schedule here.
    if (phase === 'running' && cursor >= jobs.length) return undefined;

    const id = runIdRef.current + 1;
    runIdRef.current = id;
    errorsRef.current = [];

    if (phase === 'warmup') {
      setSrcDoc(warmupDoc(id));
      timerRef.current = setTimeout(() => {
        // Don't strand the whole run on a slow first frame — carry on, but say
        // so, because it makes any later timeout much easier to interpret.
        setWarmupNote('The warm-up frame did not answer in time; results below may be unreliable.');
        setPhase('running');
        setCursor(0);
        setAttempt(0);
      }, TIMEOUT_MS);
      return () => clearTimeout(timerRef.current);
    }

    const job = jobs[cursor];
    setSrcDoc(buildSrcDoc({ ...job.files, checks: job.checks, runId: id }));

    timerRef.current = setTimeout(() => {
      if (attempt + 1 < MAX_ATTEMPTS) {
        setAttempt((a) => a + 1); // retry this job once
        return;
      }
      const reported = errorsRef.current;
      record({
        ...job,
        results: [],
        correct: false, // a timeout is never a pass, whatever was expected
        timedOut: true,
        detail: reported.length
          ? `timed out after ${MAX_ATTEMPTS} attempts — frame reported: ${reported.join(' | ')}`
          : `timed out after ${MAX_ATTEMPTS} attempts — the frame reported no error`,
      });
    }, TIMEOUT_MS);

    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-runs when the queue advances or a retry is scheduled
  }, [phase, cursor, attempt]);

  const start = () => {
    setJobs(buildJobs(sections));
    setResults([]);
    setWarmupNote(null);
    setCursor(0);
    setAttempt(0);
    setPhase('warmup');
  };

  const done = phase === 'running' && jobs.length > 0 && cursor >= jobs.length;
  const busy = (phase === 'warmup' || phase === 'running') && !done;
  const failures = results.filter((r) => !r.correct);

  return (
    <div className="rounded-2xl border-2 border-ink bg-white p-5 shadow-[4px_4px_0_rgba(22,36,29,0.9)] sm:p-7">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-lab text-2xl font-extrabold text-ink">Task self-test</h2>
          <p className="text-sm text-ink/60">
            Runs every task&apos;s starter and solution through the real sandbox. Starters must fail; solutions must pass.
          </p>
        </div>
        <button
          onClick={start}
          disabled={busy}
          className="lab-btn flex items-center gap-2 rounded-xl border-2 border-ink bg-signal px-5 py-2.5 font-extrabold text-ink disabled:opacity-60"
        >
          {busy
            ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            : <Play className="h-4 w-4" aria-hidden="true" />}
          {phase === 'warmup'
            ? 'Warming up'
            : busy
              ? `Running ${cursor + 1}/${jobs.length}${attempt ? ' (retry)' : ''}`
              : 'Run self-test'}
        </button>
      </div>

      {warmupNote && (
        <p className="mb-4 flex items-start gap-2 rounded-xl border-2 border-signal bg-signal/15 p-4 text-sm font-semibold text-ink">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {warmupNote}
        </p>
      )}

      {done && (
        <p
          role="status"
          className={`mb-4 rounded-xl border-2 p-4 font-bold ${
            failures.length ? 'border-wire bg-wire/10 text-ink' : 'border-pcb bg-pcb/10 text-ink'
          }`}
        >
          {failures.length
            ? `${failures.length} of ${results.length} runs behaved wrongly — see below.`
            : `All ${results.length} runs behaved correctly.`}
        </p>
      )}

      {results.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr>
                <th className="border-2 border-ink/15 bg-paper px-3 py-2 font-bold text-ink">Task</th>
                <th className="border-2 border-ink/15 bg-paper px-3 py-2 font-bold text-ink">Code</th>
                <th className="border-2 border-ink/15 bg-paper px-3 py-2 font-bold text-ink">Expected</th>
                <th className="border-2 border-ink/15 bg-paper px-3 py-2 font-bold text-ink">Actual</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i} className={r.correct ? '' : 'bg-wire/8'}>
                  <td className="border-2 border-ink/15 px-3 py-2 font-mono-lab text-xs text-ink/75">{r.page}</td>
                  <td className="border-2 border-ink/15 px-3 py-2 text-ink/75">{r.which}</td>
                  <td className="border-2 border-ink/15 px-3 py-2 text-ink/75">
                    {r.expectPass ? 'all pass' : 'not all pass'}
                  </td>
                  <td className="border-2 border-ink/15 px-3 py-2">
                    <span className={`flex items-start gap-1.5 font-semibold ${r.correct ? 'text-pcb' : 'text-wire'}`}>
                      {r.correct
                        ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                        : <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />}
                      {r.detail}
                    </span>
                    {!r.correct && r.results?.length > 0 && (
                      <ul className="mt-1 space-y-0.5 text-xs text-ink/55">
                        {r.results.map((c) => (
                          <li key={c.index}>
                            {c.passed ? '✔' : '✘'} {c.message}
                            {c.detail ? ` — ${c.detail}` : ''}
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* One frame for the whole run — see the note at the top of this file.
          Positioned off-screen rather than display:none, because a frame with
          no layout has no computed styles for the style checks to read. */}
      <iframe
        ref={iframeRef}
        title="Task self-test sandbox"
        srcDoc={srcDoc}
        sandbox="allow-scripts"
        aria-hidden="true"
        tabIndex={-1}
        className="pointer-events-none fixed h-[300px] w-[400px] border-0 opacity-0"
        style={{ left: '-9999px', top: 0 }}
      />
    </div>
  );
}
