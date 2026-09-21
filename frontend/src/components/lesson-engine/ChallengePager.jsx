import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ClipboardCheck, CheckCircle2 } from 'lucide-react';
import TaskPage from './TaskPage';
import ProgressDots from './ProgressDots';
import ChallengeResult from './ChallengeResult';
import { getDonePages, markPageDone } from '../../lib/webdev/progress';
import { loadCursor, saveCursor } from '../../lib/webdev/storage';
import {
  getChallengeAttempts,
  recordChallengeAttempt,
  recordChallengeResult,
} from '../../lib/webdev/challenge';
import { challengeBreakdown, scoreChallenge } from '../../lib/webdev/challengeScore';

// ---------------------------------------------------------------------------
// ChallengePager — one task per page, then a result screen.
//
// A sibling of LessonPager rather than a mode of it, because the two have
// opposite rules. LessonPager GATES: a required page holds the student there
// until it passes, and the section cannot be completed until every one of them
// has. A challenge must do the reverse — a task you cannot solve is a task you
// walk past and come back to, or the score would only ever be 6/6 or nothing.
// Bolting "and sometimes ignore all of that" onto the pager would have made the
// gating logic, which five shipped sections depend on, conditional everywhere.
//
// What IS shared is everything below the header: the same TaskPage renders the
// tasks, with the same checks, hints and "Show me the solution" behaviour, and
// per-task passes are recorded in the same `webdevPages` document a section
// uses. Nothing about the challenge locks anything: see lib/webdev/challenge.js
// for the one call a gate would need.
//
// Page index N (where N is the task count) is the result screen. It is not a
// page in the data, so `checkSection` still validates the challenge and the
// result screen can never be mistaken for something to grade.
// ---------------------------------------------------------------------------

/** Don't hijack arrow keys while the student is typing. */
function isTypingTarget(el) {
  if (!el) return false;
  return !!el.closest?.('input, textarea, select, [contenteditable="true"], .monaco-editor');
}

/**
 * @param {object} props
 * @param {{ id: string, title: string, pages: Array<object> }} props.challenge
 * @param {number|string} props.moduleId Which module this challenge belongs to;
 *        decides the `module<N>` key a pass is recorded under.
 * @param {(score: object) => void} [props.onResult] Fired once per visit to the
 *        result screen, after any pass has been recorded. The host page uses it
 *        to celebrate; the pager itself never navigates.
 */
export default function ChallengePager({ challenge, moduleId, onResult }) {
  const pages = useMemo(() => challenge?.pages || [], [challenge]);
  const resultIndex = pages.length;

  const [done, setDone] = useState(() => getDonePages(challenge.id));
  const [attempts, setAttempts] = useState(() => getChallengeAttempts(challenge.id));
  // Resume where they were, including on the result screen. Unlike a section
  // there is no gate to clamp against — only the ends of the run.
  const [index, setIndex] = useState(() => {
    const saved = loadCursor(challenge.id);
    return saved == null ? 0 : Math.max(0, Math.min(saved, pages.length));
  });

  const topRef = useRef(null);

  // Remember the position so a reload resumes here.
  useEffect(() => {
    saveCursor(challenge.id, index);
  }, [challenge.id, index]);

  const page = index < resultIndex ? pages[index] : null;
  const score = useMemo(
    () => scoreChallenge(challenge, done),
    [challenge, done],
  );

  const goTo = useCallback((next) => {
    if (next < 0 || next > resultIndex) return;
    setIndex(next);
    topRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [resultIndex]);

  const goNext = useCallback(() => goTo(index + 1), [goTo, index]);
  const goBack = useCallback(() => goTo(index - 1), [goTo, index]);

  const handlePass = useCallback(() => {
    if (!page) return;
    markPageDone(challenge.id, page.id);
    setDone(getDonePages(challenge.id));
  }, [page, challenge.id]);

  const handleFail = useCallback(() => {
    if (!page) return;
    setAttempts(recordChallengeAttempt(challenge.id, page.id));
  }, [page, challenge.id]);

  // Reaching the result screen is what banks a pass. Recording is idempotent
  // and never lowers a previous score, so arriving here again after a retry can
  // only ever improve the record.
  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; }, [onResult]);

  useEffect(() => {
    if (index !== resultIndex) return;
    const fresh = scoreChallenge(challenge, getDonePages(challenge.id));
    recordChallengeResult(challenge, moduleId, fresh);
    onResultRef.current?.(fresh);
  }, [index, resultIndex, challenge, moduleId]);

  // Left/right arrows page through, as long as focus isn't in an editor.
  useEffect(() => {
    const onKey = (e) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); goNext(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goBack(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goBack]);

  if (!pages.length) return null;

  const onResultScreen = index === resultIndex;
  const isLastTask = index === resultIndex - 1;

  return (
    <div className="flex flex-col gap-6">
      <span ref={topRef} aria-hidden="true" />

      {/* Header: where you are, and how you are doing */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink/10 pb-4">
        <div className="min-w-0">
          <p className="ref-tag text-ink/45">{challenge.title}</p>
          <p className="text-sm font-bold text-ink/60">
            {onResultScreen ? 'Your result' : `Task ${index + 1} of ${pages.length}`}
            <span className="text-ink/40"> · {score.passed} of {score.total} passed</span>
          </p>
        </div>
        {/* Every task is reachable at all times — nothing here is gated — so the
            strip's "furthest visited" ceiling is simply the last task. */}
        <ProgressDots
          pages={pages}
          index={onResultScreen ? -1 : index}
          maxVisited={pages.length - 1}
          done={done}
          onJump={goTo}
        />
      </div>

      <div key={onResultScreen ? 'result' : page.id} className="animate-slide-up min-h-[40vh]">
        {onResultScreen ? (
          <ChallengeResult
            score={score}
            breakdown={challengeBreakdown(challenge, done, attempts)}
            onRetry={goTo}
            onReview={() => goTo(0)}
          />
        ) : (
          <TaskPage
            page={page}
            // The challenge id namespaces both the pass record and the editor
            // draft, so challenge task "c1-skeleton" can never share storage
            // with a section's page of the same name.
            sectionId={challenge.id}
            passed={done.has(page.id)}
            onPass={handlePass}
            onFail={handleFail}
          />
        )}
      </div>

      {/* Footer navigation. Deliberately never disabled on a failed task: you
          can always move on, and always come back. */}
      {!onResultScreen && (
        <div className="flex flex-col gap-3 border-t-2 border-ink/10 pt-6">
          <p className="text-sm font-semibold text-ink/50">
            Stuck on this one? Move on and come back to it — you need{' '}
            {score.passMark} of {score.total} to pass, and every task can be retried.
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={goBack}
              disabled={index === 0}
              className="flex items-center gap-2 rounded-xl border-2 border-ink px-5 py-3 font-bold text-ink transition-colors hover:bg-ink/5 disabled:cursor-not-allowed disabled:border-ink/20 disabled:text-ink/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pcb"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
            </button>

            {isLastTask ? (
              <button
                onClick={goNext}
                className="lab-btn flex items-center gap-2 rounded-xl border-2 border-ink bg-signal px-8 py-4 text-lg font-extrabold text-ink"
              >
                <ClipboardCheck className="h-5 w-5" aria-hidden="true" /> See my result
              </button>
            ) : (
              <button
                onClick={goNext}
                className="lab-btn flex items-center gap-2 rounded-xl border-2 border-ink bg-pcb px-7 py-3 font-extrabold text-white"
              >
                {done.has(page.id) && <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
                Next task <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
