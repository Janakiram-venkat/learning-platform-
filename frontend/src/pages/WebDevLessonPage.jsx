import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Menu, X, Construction, PartyPopper } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import LessonPager from '../components/lesson-engine/LessonPager';
import Celebration from '../components/feedback/Celebration';
import { buildCourse, getSection, getNextSection, isKnownSection } from '../data/webdev/module1';

// ---------------------------------------------------------------------------
// WebDevLessonPage — the web-dev course's lesson route.
//
// Separate from LessonPage (the Python/robotics one) on purpose. That page
// renders a whole lesson as one scroll with a Python editor bolted to the side;
// this course is paged, and its editor is a browser sandbox. Sharing one
// component would have meant a second mode threaded through 590 lines that the
// Python course depends on. What IS shared is everything visual: the Sidebar,
// the celebration modal, the progress layer and the bench styling.
//
// Content comes from frontend data (src/data/webdev/), not the API, so the page
// draws its own navigation with no request and no loading flash.
// ---------------------------------------------------------------------------

/** Shown for a section that's announced in the sidebar but not written yet. */
function ComingSoon({ title }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <Construction className="h-12 w-12 text-ink/30" aria-hidden="true" />
      <h1 className="font-lab text-2xl font-extrabold text-ink">{title}</h1>
      <p className="max-w-md text-ink/60">
        This section is still being written. Everything before it is ready to work through.
      </p>
      <Link
        to="/course/webdev/lesson/wd1-intro"
        className="lab-btn rounded-xl border-2 border-ink bg-signal px-6 py-3 font-extrabold text-ink"
      >
        Back to the start of Module 1
      </Link>
    </div>
  );
}

export default function WebDevLessonPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [celebration, setCelebration] = useState(null);

  const course = useMemo(() => buildCourse(), []);
  const section = getSection(lessonId);
  const next = getNextSection(lessonId);

  const handleSectionComplete = useCallback(() => {
    // The section is already recorded by the pager; this decides where to go.
    const nextReady = next?.section ? next : null;
    // No next section at all means the last section of the module, not an
    // unfinished course — so say what actually comes next instead of leaving
    // the student on a full stop. Neither the challenge nor the project is
    // built yet, so both are named and neither is linked.
    const endOfModule = !next;
    setCelebration({
      title: endOfModule ? 'Module 1 complete! 🏆' : 'Section complete! ✅',
      message: nextReady
        ? `Nice work. Up next: ${nextReady.title}.`
        : endOfModule
          ? 'That is every section of Module 1. The Module Challenge and the Mini Project come next — both are still being written, and they will appear in the sidebar when they are ready.'
          : 'That is every section written so far. More of Module 1 is on the way.',
      next: nextReady?.id ?? null,
    });
  }, [next]);

  const closeCelebration = () => {
    const goTo = celebration?.next;
    setCelebration(null);
    if (goTo) navigate(`/course/webdev/lesson/${goTo}`);
  };

  return (
    <div className="flex w-full flex-col lg:h-[calc(100vh-64px)] lg:flex-row lg:overflow-hidden">
      <Celebration
        open={!!celebration}
        title={celebration?.title}
        message={celebration?.message}
        variant="lesson"
        onClose={closeCelebration}
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
        <Sidebar course={course} currentLessonId={lessonId} onNavigate={() => setSidebarOpen(false)} />
      </div>

      {/* The lesson sheet. Single column: unlike the Python page there's no
          side-by-side editor, because each runnable block carries its own. */}
      <main className="bench-grid min-w-0 flex-1 overflow-y-auto p-4 sm:p-8">
        <div className="mx-auto w-full max-w-5xl rounded-2xl border-2 border-ink bg-white p-5 shadow-[4px_4px_0_rgba(22,36,29,0.9)] sm:p-10">
          {section ? (
            <LessonPager section={section} onSectionComplete={handleSectionComplete} />
          ) : isKnownSection(lessonId) ? (
            <ComingSoon title={course.modules[0].lessons.find((l) => l.lessonId === lessonId)?.title || 'Coming soon'} />
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
              <PartyPopper className="h-12 w-12 text-ink/30" aria-hidden="true" />
              <h1 className="font-lab text-2xl font-extrabold text-ink">Section not found</h1>
              <p className="text-ink/60">There is no web-dev section with the id “{lessonId}”.</p>
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
