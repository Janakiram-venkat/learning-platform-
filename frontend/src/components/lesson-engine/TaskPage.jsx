import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Lightbulb, Eye, Wrench } from 'lucide-react';
import CodeRunner from '../webdev/CodeRunner';
import Markdown from './blocks/Markdown';

// How many failed runs before the solution is offered. Low enough that nobody
// gets stuck, high enough that it isn't the first thing they reach for.
const ATTEMPTS_BEFORE_SOLUTION = 2;

/**
 * A graded exercise. The student's code runs in the sandbox with the page's
 * `checks` attached; the verdicts come back from inside the frame (the parent
 * can't read it) and are shown one line per check using the authored message.
 *
 * @param {object} props
 * @param {object} props.page      The task page from the section data.
 * @param {string} props.sectionId Used to namespace the autosave key.
 * @param {boolean} props.passed   Already passed on a previous visit.
 * @param {() => void} props.onPass
 * @param {() => void} [props.onFail] Fired on a run that did not pass every
 *        check. Sections ignore it; the module challenge counts attempts with
 *        it, so its result screen can tell "tried and failed" from "skipped".
 * @param {string} [props.draftKey] Override the autosave key. Sections and the
 *        challenge leave this alone and get one draft per task. The mini
 *        project passes ONE key for all of its milestones, because they are
 *        stages of a single document rather than separate exercises — see
 *        lib/webdev/projectRules.js.
 * @param {boolean} [props.autoRun] Run as soon as this page opens, instead of
 *        waiting for the student to press Run. Used by the project's rubric,
 *        which grades a page that is already written.
 */
export default function TaskPage({ page, sectionId, passed, onPass, onFail, draftKey, autoRun }) {
  const [results, setResults] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  // A different page is a different exercise. Hosts that key this component by
  // page id (LessonPager, ChallengePager) remount it and never reach this; the
  // project pager deliberately does NOT remount — that is what keeps one Monaco
  // editor, and so one unsaved buffer, alive across its milestones — so the
  // per-page state has to be cleared here instead.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- clear last page's verdicts when the page changes
    setResults(null);
    setAttempts(0);
    setShowHint(false);
    setShowSolution(false);
  }, [page.id]);

  const handleResults = useCallback((next) => {
    setResults(next);
    const allPassed = next.length > 0 && next.every((r) => r.passed);
    if (allPassed) {
      onPass();
    } else {
      setAttempts((n) => n + 1);
      onFail?.();
    }
  }, [onPass, onFail]);

  const allPassed = !!results && results.length > 0 && results.every((r) => r.passed);
  const solutionOffered = attempts >= ATTEMPTS_BEFORE_SOLUTION && !allPassed;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex items-center gap-1.5 rounded-full border-2 border-ink bg-signal px-3 py-1 text-xs font-extrabold text-ink">
          <Wrench className="h-3.5 w-3.5" aria-hidden="true" /> Task
        </span>
        {(passed || allPassed) && (
          <span className="flex items-center gap-1.5 text-sm font-bold text-pcb">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Passed
          </span>
        )}
      </div>

      {page.title && (
        <h2 className="font-lab text-2xl font-extrabold text-ink sm:text-3xl">{page.title}</h2>
      )}

      <Markdown md={page.prompt} />

      <CodeRunner
        label="Your turn"
        storageKey={draftKey ?? `${sectionId}/${page.id}`}
        starter={page.starter}
        tabs={page.tabs}
        checks={page.checks}
        initialPane={page.pane}
        autoRun={autoRun}
        onCheckResults={handleResults}
      />

      {/* Per-check verdicts, in the order they were authored. */}
      {results && (
        <div
          role="status"
          aria-live="polite"
          className={`animate-slide-up rounded-2xl border-2 p-5 ${
            allPassed ? 'border-pcb bg-pcb/8' : 'border-signal bg-signal/12'
          }`}
        >
          <p className="font-lab mb-3 font-bold text-ink">
            {allPassed
              ? 'All checks passed — nice work.'
              : `${results.filter((r) => r.passed).length} of ${results.length} checks passed.`}
          </p>
          <ul className="space-y-2">
            {results.map((r) => (
              <li key={r.index} className="flex items-start gap-2 text-sm font-semibold">
                {r.passed
                  ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-pcb" aria-hidden="true" />
                  : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-wire" aria-hidden="true" />}
                <span className={r.passed ? 'text-ink/70' : 'text-ink'}>
                  {r.message}
                  {r.detail && <span className="font-normal text-ink/50"> — {r.detail}</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Help, in escalating order. */}
      <div className="flex flex-wrap items-center gap-3">
        {page.hint && !showHint && (
          <button
            onClick={() => setShowHint(true)}
            className="flex items-center gap-1.5 rounded-lg border-2 border-ink px-4 py-2 text-sm font-bold text-ink transition-colors hover:bg-signal/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pcb"
          >
            <Lightbulb className="h-4 w-4" aria-hidden="true" /> Need a hint?
          </button>
        )}
        {page.solution && solutionOffered && !showSolution && (
          <button
            onClick={() => setShowSolution(true)}
            className="flex items-center gap-1.5 rounded-lg border-2 border-ink/25 px-4 py-2 text-sm font-bold text-ink/60 transition-colors hover:border-ink hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pcb"
          >
            <Eye className="h-4 w-4" aria-hidden="true" /> Show me the solution
          </button>
        )}
      </div>

      {showHint && page.hint && (
        <div className="animate-slide-up rounded-r-lg border-l-4 border-led bg-led/8 p-5" role="note">
          <p className="font-lab mb-2 flex items-center gap-2 font-bold text-led">
            <Lightbulb className="h-5 w-5 shrink-0" aria-hidden="true" /> Hint
          </p>
          <Markdown md={page.hint} className="text-ink" />
        </div>
      )}

      {showSolution && page.solution && (
        <div className="animate-slide-up space-y-2">
          <p className="font-lab text-sm font-bold text-ink/60">
            One way to do it — read it, then try to write it yourself:
          </p>
          {/* Read-only and separate from the student's own editor on purpose:
              the solution is there to be understood, not pasted over their
              work. They can still run it to see the target behaviour.
              Note the absence of `storageKey` — that is load-bearing. Without
              one this runner never calls saveCode, so revealing a solution
              cannot write into the student's draft, and in the mini project
              (where every milestone shares one draft) it cannot overwrite the
              page they have been building for five milestones. */}
          <CodeRunner
            label="Solution"
            starter={page.solution}
            tabs={page.tabs}
            initialPane={page.pane}
            readOnly
          />
        </div>
      )}
    </div>
  );
}
