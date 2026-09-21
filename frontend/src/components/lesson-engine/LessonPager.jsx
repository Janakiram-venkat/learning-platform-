import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';
import ContentPage from './ContentPage';
import TaskPage from './TaskPage';
import QuizPage from './QuizPage';
import ProgressDots from './ProgressDots';
import {
  getDonePages,
  markPageDone,
  markSectionComplete,
  requiredPageIds,
} from '../../lib/webdev/progress';
import { loadCursor, saveCursor } from '../../lib/webdev/storage';

/**
 * Where to drop a returning student.
 *
 * Two rules, in this order:
 *  - Never past a gate. The first required page they haven't passed is a hard
 *    ceiling, because landing beyond it would show them a Next button that
 *    their own progress says they haven't earned.
 *  - Otherwise, back where they were. Opening at page 1 every time is the thing
 *    that makes a long section feel like a punishment to resume.
 *
 * With no saved position (a fresh device, or progress synced from another one)
 * it falls back to the gate if they've done anything at all, and to the very
 * beginning if they haven't.
 *
 * @param {Array<object>} pages
 * @param {Set<string>} done
 * @param {number|null} saved
 * @returns {number}
 */
function openingPage(pages, done, saved) {
  const gateIndex = pages.findIndex((p) => p.required && !done.has(p.id));
  const ceiling = gateIndex === -1 ? pages.length - 1 : gateIndex;

  if (saved != null) return Math.max(0, Math.min(saved, ceiling));
  return done.size > 0 ? ceiling : 0;
}

// ---------------------------------------------------------------------------
// LessonPager — renders one page of a section at a time.
//
// The engine is deliberately ignorant of routing, courses and the sidebar: it
// takes a section of data and two callbacks. Whatever page hosts it decides
// what "next" means. That's what lets the same component serve a lesson
// section, the module challenge and the mini project.
// ---------------------------------------------------------------------------

/** Don't hijack arrow keys while the student is typing. */
function isTypingTarget(el) {
  if (!el) return false;
  return !!el.closest?.('input, textarea, select, [contenteditable="true"], .monaco-editor');
}

/**
 * @param {object} props
 * @param {{ id: string, title: string, pages: Array<object> }} props.section
 * @param {(sectionId: string) => void} [props.onSectionComplete]
 *        Fired once, the first time every required page is passed and the
 *        student presses the final button.
 * @param {string} [props.completeLabel]
 */
export default function LessonPager({ section, onSectionComplete, completeLabel = 'Complete & Continue' }) {
  const pages = useMemo(() => section?.pages || [], [section]);

  const [done, setDone] = useState(() => getDonePages(section.id));
  const [index, setIndex] = useState(() =>
    openingPage(section.pages || [], getDonePages(section.id), loadCursor(section.id)));
  const [maxVisited, setMaxVisited] = useState(index);

  const topRef = useRef(null);

  // A different section is a different lesson: reload that section's own
  // progress and resume wherever it left the student.
  useEffect(() => {
    const freshDone = getDonePages(section.id);
    const start = openingPage(section.pages || [], freshDone, loadCursor(section.id));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- re-seed the pager when the section changes
    setDone(freshDone);
    setIndex(start);
    setMaxVisited(start);
  }, [section.id, section.pages]);

  // Remember the position so a reload resumes here.
  useEffect(() => {
    saveCursor(section.id, index);
  }, [section.id, index]);

  const page = pages[index];
  const isLast = index === pages.length - 1;

  const required = useMemo(() => requiredPageIds(section), [section]);
  const allRequiredDone = required.every((id) => done.has(id));

  // A required page holds the student there until its task or quiz passes.
  const pageSatisfied = !page?.required || done.has(page.id);

  const handlePass = useCallback(() => {
    if (!page) return;
    markPageDone(section.id, page.id);
    setDone(getDonePages(section.id));
  }, [page, section.id]);

  const goTo = useCallback((next) => {
    if (next < 0 || next >= pages.length) return;
    setIndex(next);
    setMaxVisited((m) => Math.max(m, next));
    // A new page starts at its own beginning, not wherever the last one was
    // scrolled to.
    topRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [pages.length]);

  const goNext = useCallback(() => {
    if (!pageSatisfied || isLast) return;
    goTo(index + 1);
  }, [pageSatisfied, isLast, goTo, index]);

  const goBack = useCallback(() => goTo(index - 1), [goTo, index]);

  const finish = () => {
    if (!allRequiredDone) return;
    markSectionComplete(section.id);
    onSectionComplete?.(section.id);
  };

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

  if (!page) return null;

  return (
    <div className="flex flex-col gap-6">
      <span ref={topRef} aria-hidden="true" />

      {/* Header: where you are in the section */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink/10 pb-4">
        <div className="min-w-0">
          <p className="ref-tag text-ink/45">{section.title}</p>
          <p className="text-sm font-bold text-ink/60">
            Page {index + 1} of {pages.length}
          </p>
        </div>
        <ProgressDots
          pages={pages}
          index={index}
          maxVisited={maxVisited}
          done={done}
          onJump={goTo}
        />
      </div>

      {/* The page itself. Keyed so each one animates in as its own thing. */}
      <div key={page.id} className="animate-slide-up min-h-[40vh]">
        {page.type === 'content' && <ContentPage page={page} />}
        {page.type === 'task' && (
          <TaskPage
            page={page}
            sectionId={section.id}
            passed={done.has(page.id)}
            onPass={handlePass}
          />
        )}
        {page.type === 'quiz' && (
          <QuizPage page={page} passed={done.has(page.id)} onPass={handlePass} />
        )}
      </div>

      {/* Footer navigation */}
      <div className="flex flex-col gap-3 border-t-2 border-ink/10 pt-6">
        {!pageSatisfied && (
          <p className="flex items-center gap-2 text-sm font-semibold text-wire">
            <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />
            {page.type === 'quiz'
              ? 'Answer every question correctly to carry on.'
              : 'Pass every check on this task to carry on.'}
          </p>
        )}
        {isLast && !allRequiredDone && (
          <p className="flex items-center gap-2 text-sm font-semibold text-wire">
            <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />
            Finish every task and quiz in this section to complete it.
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

          {isLast ? (
            <button
              onClick={finish}
              disabled={!allRequiredDone}
              className="lab-btn flex items-center gap-2 rounded-xl border-2 border-ink bg-signal px-8 py-4 text-lg font-extrabold text-ink disabled:cursor-not-allowed disabled:border-ink/20 disabled:bg-ink/10 disabled:text-ink/40 disabled:shadow-none"
            >
              {allRequiredDone
                ? <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                : <Lock className="h-5 w-5" aria-hidden="true" />}
              {completeLabel}
            </button>
          ) : (
            <button
              onClick={goNext}
              disabled={!pageSatisfied}
              className="lab-btn flex items-center gap-2 rounded-xl border-2 border-ink bg-pcb px-7 py-3 font-extrabold text-white disabled:cursor-not-allowed disabled:border-ink/20 disabled:bg-ink/10 disabled:text-ink/40 disabled:shadow-none"
            >
              {!pageSatisfied && <Lock className="h-4 w-4" aria-hidden="true" />}
              Next <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
