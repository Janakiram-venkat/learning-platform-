import { Link } from 'react-router-dom';
import { Zap, Lock, Hourglass, ArrowRight, Sparkles } from 'lucide-react';
import { useCourseLock } from '../hooks/useCoursePrerequisite';
import { TRACK_ICONS } from '../components/course/TrackIcons';
import BenchFinder from '../components/course/BenchFinder';
import { TRACKS } from '../data/tracks';

/* ---------------------------------------------------------------------------
   Pocket Lab — Courses.
   The catalogue lives here so the home page can stay a pitch. Every subject
   sits on the same workbench: silkscreened panel, LED hairline in the
   track's accent, silkscreened bench icon, tagline in violet ref-type, then
   the description and a single call to action. The card is the workbench
   identity for a course — reused nowhere else — so it can afford this
   density.
--------------------------------------------------------------------------- */

// Status chip up top-right of every card. One component so READY / NEW /
// LOCKED / SOON share their typography and colour rules exactly.
function StatusChip({ mode, led, gate }) {
  if (mode === 'soon') {
    return (
      <span className="inline-flex items-center gap-1.5 ref-tag text-ink/45">
        <Hourglass className="h-3.5 w-3.5" /> COMING SOON
      </span>
    );
  }
  if (mode === 'locked') {
    return (
      <span className="inline-flex items-center gap-1.5 ref-tag text-ink/55">
        <Lock className="h-3.5 w-3.5" /> {gate.done} / {gate.required}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 ref-tag text-ink/55">
      <span className="led" style={{ color: led }} /> {mode}
    </span>
  );
}

// One track card. Split out because a gated track has to ask the progress
// layer whether it's open yet, and that's a hook per card.
function TrackCard({ track }) {
  const { ref, title, tagline, line, desc, status, led, to, courseId, soon } = track;
  const gate = useCourseLock(courseId);
  const Icon = TRACK_ICONS[ref];

  const chipMode = soon ? 'soon' : gate.locked ? 'locked' : (status || 'READY');
  const lockedLine = gate.locked && !soon
    ? `Finish ${gate.required} Python modules to open this bench (${gate.done} done)`
    : line;

  return (
    <div className={`lab-panel relative flex flex-col overflow-hidden p-6 ${soon ? 'opacity-80' : 'lab-lift'}`}>
      {/* LED hairline along the top edge — the bench-panel signature that
          separates one subject from the next at a glance. Rendered inside the
          border so it hugs the panel corners cleanly. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-1"
        style={{ background: soon ? 'transparent' : led }}
      />

      <div className="mb-4 flex items-start justify-between gap-3">
        <span
          aria-hidden
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border-2 border-ink ${soon ? 'bg-paper text-ink/40' : 'text-white'}`}
          style={soon ? undefined : { background: led, color: '#FFFFFF' }}
        >
          {Icon ? <Icon className="h-8 w-8" /> : null}
        </span>
        <StatusChip mode={chipMode} led={led} gate={gate} />
      </div>

      <span className="ref-tag mb-1 text-ink/45">{ref}</span>
      <h3 className="font-lab mb-1 text-xl font-bold">{title}</h3>
      <p className="ref-tag mb-3 text-pcb">{tagline}</p>
      <p className="mb-5 flex-1 font-semibold text-ink/65">{desc}</p>
      {(gate.locked || soon) && (
        <p className="ref-tag mb-4 text-ink/45">{lockedLine}</p>
      )}

      {soon ? (
        <span className="inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink/35 bg-paper px-4 py-2.5 font-extrabold text-ink/45">
          <Hourglass className="h-4 w-4" /> On the bench
        </span>
      ) : (
        <Link
          to={to}
          className="group inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-ink bg-ink px-4 py-2.5 font-extrabold text-white transition-colors hover:bg-pcb"
        >
          {gate.locked ? (
            <><Lock className="h-4 w-4" /> See what unlocks it</>
          ) : (
            <>
              <Zap className="h-4 w-4" /> Open the bench
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </Link>
      )}
    </div>
  );
}

export default function CoursesPage() {
  return (
    <div className="flex flex-1 flex-col bg-paper text-ink">
      <section className="bench-grid w-full border-b-2 border-ink/10 py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <span className="mb-4 inline-flex items-center gap-2 rounded-md border-2 border-ink bg-white px-3 py-1 ref-tag text-ink">
            <Sparkles className="h-3.5 w-3.5" />
            The workshop · nine benches
          </span>
          <h1 className="font-lab mb-3 text-3xl font-extrabold sm:text-5xl">Every subject, one bench</h1>
          <p className="mb-12 max-w-2xl text-lg font-semibold text-ink/65">
            Pick any door: Python, Java, AI, web, games, robotics, or physics.
            Chemistry and biology are wired up next. The tools, the editor, and
            the live preview travel with you between subjects.
          </p>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TRACKS.map((track) => (
              <TrackCard key={track.ref} track={track} />
            ))}
          </div>
        </div>
      </section>

      <section className="w-full bg-paper py-16">
        <div className="mx-auto max-w-6xl px-6">
          <BenchFinder />
        </div>
      </section>
    </div>
  );
}
