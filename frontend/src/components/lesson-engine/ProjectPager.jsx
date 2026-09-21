import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Lock, CheckCircle2, ClipboardCheck, Trophy } from 'lucide-react';
import TaskPage from './TaskPage';
import ProgressDots from './ProgressDots';
import { getDonePages, markPageDone } from '../../lib/webdev/progress';
import { loadCursor, saveCursor } from '../../lib/webdev/storage';
import { recordProjectResult } from '../../lib/webdev/project';
import {
  isPageUnlocked,
  openingPage,
  projectDraftKey,
  projectMilestones,
  projectProgress,
  projectRubricPage,
  unlockedThrough,
} from '../../lib/webdev/projectRules';
import { usePagerKeys } from './usePagerKeys';

// ---------------------------------------------------------------------------
// ProjectPager — one milestone per page, then the rubric.
//
// The third sibling of LessonPager and ChallengePager, and it sits between
// them: it GATES like a section (milestone N opens when N-1 passes) but it
// runs over ONE document like nothing else in the course. Those two rules
// together are why it is its own component:
//
//   * A section's pages are separate exercises, each with its own draft key.
//     Here every page hands TaskPage the SAME `draftKey`, so the editor on
//     milestone 3 opens on the page the student finished milestone 2 with.
//   * A challenge never locks anything; this does, and never locks backwards —
//     a passed milestone stays open for editing forever.
//
// One thing is deliberately different from both siblings: the page is NOT
// keyed by page id. Keying would remount TaskPage, and with it the Monaco
// editor, on every milestone change — throwing away up to 400ms of not-yet-
// autosaved typing on the way. Keeping one editor mounted for the whole
// project makes the carry-over exact rather than nearly exact. TaskPage clears
// its own per-page state in response (see the effect on `page.id` there).
//
// Nothing here gates anything OUTSIDE the project: finishing it records
// `module<N>` in `completedProjects` (which ticks the sidebar) and unlocks
// nothing. See lib/webdev/project.js for the one call a gate would need.
// ---------------------------------------------------------------------------

/**
 * @param {object} props
 * @param {{ id: string, title: string, pages: Array<object> }} props.project
 * @param {number|string} props.moduleId Which module this project belongs to;
 *        decides the `module<N>` key a finished project is recorded under.
 * @param {(progress: object) => void} [props.onComplete] Fired once, the first
 *        time the rubric passes in this visit, after the project has been
 *        recorded. The host page uses it to celebrate; the pager never
 *        navigates.
 */
export default function ProjectPager({ project, moduleId, onComplete }) {
  const pages = useMemo(() => project?.pages || [], [project]);
  const milestones = useMemo(() => projectMilestones(project), [project]);
  const rubric = useMemo(() => projectRubricPage(project), [project]);

  const [done, setDone] = useState(() => getDonePages(project.id));
  const [index, setIndex] = useState(() =>
    openingPage(project, getDonePages(project.id), loadCursor(project.id)));

  const topRef = useRef(null);

  // Remember the position so a reload resumes here.
  useEffect(() => {
    saveCursor(project.id, index);
  }, [project.id, index]);

  const page = pages[index];
  const isRubric = !!rubric && page?.id === rubric.id;
  const progress = useMemo(() => projectProgress(project, done), [project, done]);
  const ceiling = unlockedThrough(project, done);

  const goTo = useCallback((next) => {
    if (next < 0 || next >= pages.length) return;
    // The ceiling is recomputed from storage rather than trusted from props:
    // a jump is the one path a student can drive directly.
    if (!isPageUnlocked(project, getDonePages(project.id), next)) return;
    setIndex(next);
    topRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [pages.length, project]);

  const goNext = useCallback(() => goTo(index + 1), [goTo, index]);
  const goBack = useCallback(() => goTo(index - 1), [goTo, index]);

  // Fired once per completion, not once per render of a completed project.
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  const celebrated = useRef(false);

  const handlePass = useCallback(() => {
    if (!page) return;
    // True only the first time this page is passed, ever.
    const firstTime = markPageDone(project.id, page.id);
    const fresh = getDonePages(project.id);
    setDone(fresh);

    // The rubric passing is what finishes the project: it is the only page
    // that has re-checked every milestone over the finished page.
    const standing = projectProgress(project, fresh);
    if (!standing.isComplete) return;

    // Recorded on every passing run, because it also refreshes the snapshot
    // Module 2 will start from — a student who keeps improving a passing page
    // should hand on the better version. It is idempotent.
    recordProjectResult(project, moduleId, standing);

    // Celebrated only once, though. The rubric re-runs itself every time the
    // page is opened, and a modal on every visit to a finished project would
    // be a punishment for going back to admire it.
    if (firstTime && !celebrated.current) {
      celebrated.current = true;
      onCompleteRef.current?.(standing);
    }
  }, [page, project, moduleId]);

  // Left/right arrows page through, as long as focus is not in an editor.
  usePagerKeys(goNext, goBack);

  if (!page) return null;

  const passed = done.has(page.id);
  const isLast = index === pages.length - 1;
  const nextIsRubric = !!rubric && pages[index + 1]?.id === rubric.id;
  const milestoneNumber = isRubric ? null : index + 1;

  return (
    <div className="flex flex-col gap-6">
      <span ref={topRef} aria-hidden="true" />

      {/* Header: where you are, and how much of the page is signed off */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink/10 pb-4">
        <div className="min-w-0">
          <p className="ref-tag text-ink/45">{project.title}</p>
          <p className="text-sm font-bold text-ink/60">
            {isRubric
              ? 'Final checklist'
              : `Milestone ${milestoneNumber} of ${milestones.length}`}
            <span className="text-ink/40"> · {progress.passed} of {progress.total} done</span>
          </p>
        </div>
        <ProgressDots
          pages={pages}
          index={index}
          maxVisited={ceiling}
          done={done}
          onJump={goTo}
          label="Milestones in this project"
        />
      </div>

      {/* The finished state. Shown above the rubric rather than instead of it,
          so a student can still re-read the ticked list and keep editing. */}
      {progress.isComplete && isRubric && (
        <div
          role="status"
          aria-live="polite"
          className="animate-slide-up rounded-2xl border-2 border-pcb bg-pcb/8 p-6 text-center"
        >
          <Trophy className="mx-auto mb-2 h-10 w-10 text-pcb" aria-hidden="true" />
          <p className="font-lab text-2xl font-extrabold text-ink">Project complete</p>
          <p className="mx-auto mt-2 max-w-lg text-sm font-semibold text-ink/65">
            Every item on the checklist passes, across all {milestones.length} milestones.
            This page is yours now — it is saved, and Module 2 picks it up to style with CSS.
            Keep editing if you like: the checklist re-runs every time you press Run.
          </p>
        </div>
      )}

      {/* The page itself. NOT keyed — see the note at the top of this file. */}
      <div className="min-h-[40vh]">
        <TaskPage
          page={page}
          sectionId={project.id}
          // One draft for the whole project: this is what carries the
          // student's page from milestone to milestone.
          draftKey={projectDraftKey(project.id)}
          // The rubric grades a page that is already written, so it ticks
          // itself on arrival instead of waiting for a Run it has no reason
          // to need.
          autoRun={isRubric}
          passed={passed}
          onPass={handlePass}
        />
      </div>

      {/* Footer navigation */}
      <div className="flex flex-col gap-3 border-t-2 border-ink/10 pt-6">
        {!passed && !isRubric && (
          <p className="flex items-center gap-2 text-sm font-semibold text-wire">
            <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />
            Pass every check on this milestone to unlock the next one. Your page is saved as
            you type, and you can come back and change it at any point.
          </p>
        )}
        {!passed && isRubric && (
          <p className="flex items-center gap-2 text-sm font-semibold text-wire">
            <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />
            Every item has to pass at once. An item from an earlier milestone failing here means
            something on the page got broken or deleted along the way — fix it right in the editor.
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={goBack}
            disabled={index === 0}
            className="flex items-center gap-2 rounded-xl border-2 border-ink px-5 py-3 font-bold text-ink transition-colors hover:bg-ink/5 disabled:cursor-not-allowed disabled:border-ink/20 disabled:text-ink/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pcb"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
          </button>

          {!isLast && (
            <button
              onClick={goNext}
              disabled={!passed}
              className={`lab-btn flex items-center gap-2 rounded-xl border-2 border-ink font-extrabold disabled:cursor-not-allowed disabled:border-ink/20 disabled:bg-ink/10 disabled:text-ink/40 disabled:shadow-none ${
                nextIsRubric
                  ? 'bg-signal px-8 py-4 text-lg text-ink'
                  : 'bg-pcb px-7 py-3 text-white'
              }`}
            >
              {!passed && <Lock className="h-4 w-4" aria-hidden="true" />}
              {nextIsRubric ? (
                <>
                  {passed && <ClipboardCheck className="h-5 w-5" aria-hidden="true" />}
                  Check my finished page
                </>
              ) : (
                <>
                  {passed && <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
                  Next milestone <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
