import { useCallback, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Menu, X, PartyPopper, Construction } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import ChallengePager from '../components/lesson-engine/ChallengePager';
import Celebration from '../components/feedback/Celebration';
import { buildCourse, getChallenge, getModule } from '../data/webdev';

// ---------------------------------------------------------------------------
// WebDevChallengePage — the web-dev course's Module Challenge route.
//
// Sibling of WebDevLessonPage, and the same frame around it: the shared
// Sidebar, the bench styling, the celebration modal. It hosts ChallengePager
// instead of LessonPager, and that is the whole difference.
//
// It does NOT use AssignmentPage. That page is the Python/robotics arcade — a
// fetched JSON of multiple-choice, ordering and matching rounds, with its own
// star scoring. This course's challenge grades real HTML in the sandbox, so it
// shares the arcade's *record* (module101 in `completedAssignments`, written by
// lib/webdev/challenge.js) without sharing its UI.
//
// Nothing here gates anything: the challenge opens whether or not the module's
// sections are finished, and finishing it unlocks nothing yet.
// ---------------------------------------------------------------------------

export default function WebDevChallengePage() {
  const { moduleId } = useParams(); // e.g. "module101"
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [celebration, setCelebration] = useState(null);

  const course = useMemo(() => buildCourse(), []);
  const module = getModule(moduleId);
  const challenge = getChallenge(moduleId);

  // Three outcomes, not two. A module id that names no visible module is a
  // typed URL; a visible module whose challenge is not written yet is a real
  // place that is not ready, and saying "not found" about it would be a lie.
  const known = !!module;
  const ready = known && !!challenge;

  // The sidebar numbers modules by position, so this has to as well.
  const moduleNumber = course.modules.findIndex((m) => m.moduleId === module?.moduleId) + 1;

  const handleResult = useCallback((score) => {
    if (!score.isPass) return; // a fail is reported on the result screen, not celebrated
    setCelebration({
      title: `Module ${moduleNumber} Challenge passed! 🏆`,
      message:
        score.passed === score.total
          ? `Every one of the ${score.total} tasks passed. The Mini Project is next — five milestones that build one profile page, in the sidebar.`
          : `${score.passed} of ${score.total} tasks passed, above the pass mark of ${score.passMark}. Any task you skipped is still there to go back to.`,
    });
  }, [moduleNumber]);

  return (
    <div className="flex w-full flex-col lg:h-[calc(100vh-64px)] lg:flex-row lg:overflow-hidden">
      <Celebration
        open={!!celebration}
        title={celebration?.title}
        message={celebration?.message}
        variant="lesson"
        onClose={() => setCelebration(null)}
      />

      {/* Mobile-only bar to open the section list */}
      <div className="flex items-center gap-3 border-b-2 border-ink/15 bg-paper px-4 py-3 lg:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex items-center gap-2 rounded-lg border-2 border-ink px-3 py-2 text-sm font-bold text-ink active:scale-95"
        >
          <Menu className="h-4 w-4" aria-hidden="true" /> Sections
        </button>
        <span className="truncate text-sm font-semibold text-ink/55">{course.title}</span>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-40 w-72 transform bg-paper shadow-xl transition-transform duration-300 lg:static lg:z-0 lg:w-64 lg:translate-x-0 lg:shadow-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute right-2 top-2 z-10 rounded-md p-1.5 text-ink/55 hover:bg-ink/10 lg:hidden"
          aria-label="Close sections"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
        <Sidebar course={course} onNavigate={() => setSidebarOpen(false)} />
      </div>

      <main className="bench-grid min-w-0 flex-1 overflow-y-auto p-4 sm:p-8">
        <div className="mx-auto w-full max-w-5xl rounded-2xl border-2 border-ink bg-white p-5 shadow-[4px_4px_0_rgba(27,27,27,0.9)] sm:p-10">
          {ready ? (
            <ChallengePager
              challenge={challenge}
              moduleId={module.moduleId}
              onResult={handleResult}
            />
          ) : known ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
              <Construction className="h-12 w-12 text-ink/30" aria-hidden="true" />
              <h1 className="font-lab text-2xl font-extrabold text-ink">
                Module {moduleNumber} Challenge
              </h1>
              <p className="max-w-md text-ink/60">
                This challenge is still being written. The sections of Module {moduleNumber} that
                are ready are in the sidebar.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
              <PartyPopper className="h-12 w-12 text-ink/30" aria-hidden="true" />
              <h1 className="font-lab text-2xl font-extrabold text-ink">Challenge not found</h1>
              <p className="text-ink/60">
                There is no web-dev module challenge with the id “{moduleId}”.
              </p>
              <Link
                to="/course/webdev/lesson/wd1-intro"
                className="lab-btn rounded-xl border-2 border-ink bg-signal px-6 py-3 font-extrabold text-ink"
              >
                Start Module 1
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
