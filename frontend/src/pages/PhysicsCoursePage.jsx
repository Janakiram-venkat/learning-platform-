import { Link } from 'react-router-dom';
import { ArrowRight, Hourglass, Zap, FlaskConical } from 'lucide-react';
import { PHYSICS_8, isReady } from '../data/physics';
import { PhysicsIcon } from '../components/course/TrackIcons';

/* ---------------------------------------------------------------------------
   Physics — the course hub (formerly the standalone Virtual Lab).
   Physics has no code editor and no backend: every lesson is a widget you
   poke at, so this hub lists experiments rather than the lesson/assignment/
   project triple the coding courses use. Styling follows the Courses page so
   it reads as one more bench on the same workbench, not a separate product.

   Public on purpose, exactly as the Virtual Lab was: these experiments need
   no account and hit no API, so gating them would only cost visitors.
--------------------------------------------------------------------------- */

const PHYSICS_LED = '#0097F8';

// One experiment in a module. A lesson is only playable once it has a widget
// block in `data/physics.js`; the rest render as dead rows so the syllabus
// still reads as a whole without offering a link that goes nowhere.
function ExperimentCard({ lesson, number }) {
  const ready = isReady(lesson.id);

  if (!ready) {
    return (
      <div className="flex items-center gap-3 rounded-xl border-2 border-dashed border-ink/25 bg-paper px-4 py-3 opacity-75">
        <span className="font-mono-lab text-xs text-ink/40">{String(number).padStart(2, '0')}</span>
        <span className="flex-1 font-lab font-bold text-ink/60">{lesson.title}</span>
        <span className="inline-flex shrink-0 items-center gap-1.5 ref-tag text-ink/45">
          <Hourglass className="h-3.5 w-3.5" /> SOON
        </span>
      </div>
    );
  }

  return (
    <Link
      to={`/course/physics/${lesson.id}`}
      className="lab-lift group relative flex items-center gap-3 overflow-hidden rounded-xl border-2 border-ink bg-white px-4 py-3 shadow-[4px_4px_0_rgba(27,27,27,0.9)]"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-1"
        style={{ background: PHYSICS_LED }}
      />
      <span className="ml-1 font-mono-lab text-xs text-ink/50">{String(number).padStart(2, '0')}</span>
      <span className="flex-1 font-lab font-extrabold text-ink">{lesson.title}</span>
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border-2 border-ink bg-signal px-2.5 py-0.5 text-xs font-extrabold text-ink">
        Play <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

export default function PhysicsCoursePage() {
  const allLessons = PHYSICS_8.modules.flatMap((m) => m.lessons);
  const liveCount = allLessons.filter((l) => isReady(l.id)).length;
  // The first playable experiment, so the header CTA always lands somewhere
  // real instead of guessing at a hard-coded lesson id.
  const firstLive = allLessons.find((l) => isReady(l.id));

  return (
    <div className="flex flex-1 flex-col bg-paper text-ink">
      {/* ============ Course header ============ */}
      <section className="bench-grid w-full border-b-2 border-ink/10 py-12 sm:py-16">
        <div className="mx-auto max-w-5xl px-6">
          <Link
            to="/courses"
            className="mb-6 inline-flex items-center gap-1.5 ref-tag text-ink/55 transition-colors hover:text-pcb"
          >
            ← All subjects
          </Link>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <span
                aria-hidden
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border-2 border-ink text-white"
                style={{ background: PHYSICS_LED }}
              >
                <PhysicsIcon className="h-9 w-9" />
              </span>
              <div>
                <p className="ref-tag mb-1 text-pcb">TRK-PHY · Class 8</p>
                <h1 className="font-lab text-3xl font-extrabold sm:text-4xl">Physics</h1>
                <p className="mt-2 max-w-xl text-lg font-semibold text-ink/65">
                  Push, pull, bounce and shake. Every lesson here is a thing you
                  poke at, not a page you read: drag a slider, run the
                  experiment, and watch the rule fall out of it.
                </p>
              </div>
            </div>
          </div>

          {/* Readout gauges, matching the home page's bench language. */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <div className="rounded-lg border-2 border-ink bg-white px-4 py-2">
              <div className="font-lab text-2xl font-extrabold leading-none">{PHYSICS_8.modules.length}</div>
              <div className="ref-tag mt-1 text-ink/55">MODULES</div>
            </div>
            <div className="rounded-lg border-2 border-ink bg-white px-4 py-2">
              <div className="font-lab text-2xl font-extrabold leading-none">{allLessons.length}</div>
              <div className="ref-tag mt-1 text-ink/55">EXPERIMENTS</div>
            </div>
            <div className="rounded-lg border-2 border-ink bg-white px-4 py-2">
              <div className="font-lab text-2xl font-extrabold leading-none">{liveCount}</div>
              <div className="ref-tag mt-1 text-ink/55">PLAYABLE NOW</div>
            </div>
            {firstLive && (
              <Link
                to={`/course/physics/${firstLive.id}`}
                className="lab-btn group ml-auto inline-flex items-center gap-2 rounded-xl border-2 border-ink bg-signal px-6 py-3 font-extrabold text-ink"
              >
                <Zap className="h-4 w-4" /> Start experimenting
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            )}
          </div>

          {/* Honest note: most of the syllabus is still being wired up, and a
              student deserves to know that before scrolling a wall of "soon". */}
          {liveCount < allLessons.length && (
            <p className="mt-6 max-w-2xl rounded-xl border-2 border-dashed border-ink/25 bg-white/60 px-4 py-3 text-sm font-semibold text-ink/60">
              The full Class 8 syllabus is mapped out below.{' '}
              {liveCount === 1
                ? '1 experiment is playable so far'
                : `${liveCount} experiments are playable so far`}{' '}
              out of {allLessons.length}. The rest are on the bench and land as
              they are built.
            </p>
          )}
        </div>
      </section>

      {/* ============ Syllabus ============ */}
      <section className="w-full bg-paper py-12 sm:py-16">
        <div className="mx-auto max-w-5xl px-6">
          {PHYSICS_8.modules.map((mod) => {
            const live = mod.lessons.filter((l) => isReady(l.id)).length;
            return (
              <section key={mod.id} className="mb-10 last:mb-0">
                <div className="mb-4 flex items-baseline justify-between gap-3 border-b-2 border-ink/10 pb-3">
                  <h2 className="font-lab text-xl font-extrabold text-ink">
                    <span className="mr-2" aria-hidden>{mod.emoji}</span>
                    {mod.id}. {mod.title}
                  </h2>
                  <span className="ref-tag shrink-0 text-ink/50">{live}/{mod.lessons.length} live</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {mod.lessons.map((lesson, i) => (
                    <ExperimentCard key={lesson.id} lesson={lesson} number={i + 1} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </section>

      {/* ============ Sibling-science nudge ============ */}
      <section className="w-full bg-paper pb-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="lab-panel flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-2 border-ink bg-paper text-ink/50">
                <FlaskConical className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-lab text-lg font-bold">Chemistry and Biology are next</h3>
                <p className="font-semibold text-ink/60">
                  Same bench, same widgets. They open as soon as their
                  experiments are wired up.
                </p>
              </div>
            </div>
            <Link
              to="/courses"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border-2 border-ink bg-white px-5 py-2.5 font-extrabold text-ink transition-colors hover:bg-pcb hover:text-white"
            >
              Browse all subjects <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
