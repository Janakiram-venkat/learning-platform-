import { useCallback, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Menu, X, Hammer } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import ProjectPager from '../components/lesson-engine/ProjectPager';
import Celebration from '../components/feedback/Celebration';
import { buildCourse, getProject, MODULE } from '../data/webdev/module1';

// ---------------------------------------------------------------------------
// WebDevProjectPage — the web-dev course's Mini Project route.
//
// Sibling of WebDevChallengePage, and the same frame around it: the shared
// Sidebar, the bench styling, the celebration modal. It hosts ProjectPager
// instead of ChallengePager, and that is the whole difference.
//
// It does NOT use ProjectPage. That page is the Python one — it fetches a
// project JSON from the backend, runs the student's code through
// /api/run-python and grades stdout. This course has no server-side runner:
// the milestones are graded in the browser sandbox, from data that ships with
// the bundle. What the two DO share is the record: finishing this writes
// `module101` into `completedProjects` through lib/webdev/project.js, which is
// the same key ProjectPage writes and the same one Sidebar.jsx reads to tick
// the Mini Project entry.
//
// Nothing here gates anything: the project opens whether or not the module's
// sections are finished, and finishing it unlocks nothing yet. Module 2 is
// deliberately NOT locked behind it — see isProjectPassed() for the one call
// that would do it.
// ---------------------------------------------------------------------------

export default function WebDevProjectPage() {
  const { moduleId } = useParams(); // e.g. "module101"
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [celebration, setCelebration] = useState(null);

  const course = useMemo(() => buildCourse(), []);
  const project = getProject();

  // The route is per-module, but this course has one module so far. Anything
  // else is a typed URL, not a real place.
  const projectKey = `module${MODULE.moduleId}`;
  const known = String(moduleId) === projectKey;

  const handleComplete = useCallback((progress) => {
    setCelebration({
      title: 'Mini Project complete! 🛠️',
      message:
        `All ${progress.total} milestones and every item on the final checklist. ` +
        'Your profile page is saved — Module 2 starts from this exact page and styles it with CSS.',
    });
  }, []);

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
        <Sidebar
          course={course}
          currentProjectKey={known ? projectKey : undefined}
          onNavigate={() => setSidebarOpen(false)}
        />
      </div>

      <main className="bench-grid min-w-0 flex-1 overflow-y-auto p-4 sm:p-8">
        <div className="mx-auto w-full max-w-5xl rounded-2xl border-2 border-ink bg-white p-5 shadow-[4px_4px_0_rgba(22,36,29,0.9)] sm:p-10">
          {known ? (
            <ProjectPager
              project={project}
              moduleId={MODULE.moduleId}
              onComplete={handleComplete}
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
              <Hammer className="h-12 w-12 text-ink/30" aria-hidden="true" />
              <h1 className="font-lab text-2xl font-extrabold text-ink">Project not found</h1>
              <p className="text-ink/60">
                There is no web-dev mini project with the id “{moduleId}”.
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
