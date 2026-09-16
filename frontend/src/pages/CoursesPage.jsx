import { Link } from 'react-router-dom';
import { Zap, Lock, Hourglass, ArrowRight, Power } from 'lucide-react';
import { useCourseLock } from '../hooks/useCoursePrerequisite';

/* ---------------------------------------------------------------------------
   Pocket Lab — Courses.
   Lifted out of the landing page so a track has a real address to link to and
   the home page stays a pitch rather than a catalogue. Same workbench styling:
   silkscreened panels on graph paper, LED status per module.
--------------------------------------------------------------------------- */

// Learning tracks, framed as bench modules. `status` drives the LED state, and
// `soon` marks a track whose content isn't built yet — it renders as a dead
// panel with no link rather than a button that goes nowhere.
const TRACKS = [
  {
    ref: 'TRK-PY', emoji: '🐍', title: 'Python', line: 'Beginner friendly',
    desc: 'Master the language behind games, AI, and the web, one puzzle at a time.',
    status: 'READY', led: '#3FBF7F', to: '/course/python/lesson/intro',
  },
  {
    ref: 'TRK-AI', emoji: '🤖', title: 'AI & Machine Learning', line: 'Explorer',
    desc: 'Train smart models, teach a computer to see, and build your own mini-AI.',
    status: 'READY', led: '#23B5D3', to: '/course/ai/lesson/intro',
  },
  {
    ref: 'TRK-GAME', emoji: '🎮', title: 'Game Development', line: 'After Python 1–5',
    desc: 'Build real playable games: bouncing balls, falling fruit, and a score to beat.',
    status: 'READY', led: '#E8503A', to: '/course/gamedev/games',
    // Gated: the card reads its own lock state from gamedev/course.json.
    courseId: 'gamedev',
  },
  {
    ref: 'TRK-BOT', emoji: '🦾', title: 'Robotics', line: 'No electronics needed',
    desc: 'Meet the machines that sense, think and act, then design one of your own.',
    status: 'READY', led: '#FFC93C', to: '/course/robotics/lesson/robot-intro',
  },
  {
    ref: 'TRK-PHY', emoji: '🪐', title: 'Physics', line: 'In the workshop',
    desc: 'Simulate motion, gravity and collisions, then bend the rules to see what breaks.',
    soon: true,
  },
  {
    ref: 'TRK-CHEM', emoji: '⚗️', title: 'Chemistry', line: 'In the workshop',
    desc: 'Mix virtual reagents, watch reactions run, and build molecules atom by atom.',
    soon: true,
  },
];

// One track card. Split out because a gated track has to ask the progress layer
// whether it's open yet, and that's a hook per card.
function TrackCard({ track }) {
  const { ref, emoji, title, line, desc, status, led, to, courseId, soon } = track;
  const gate = useCourseLock(courseId);

  return (
    <div className={`lab-panel flex flex-col p-6 ${soon ? 'opacity-70' : 'lab-lift'}`}>
      <div className="mb-4 flex items-center justify-between">
        <span
          className={`flex h-12 w-12 items-center justify-center rounded-lg border-2 border-ink text-2xl ${soon ? 'bg-paper grayscale' : 'bg-white'}`}
          aria-hidden
        >
          {emoji}
        </span>
        <span className="inline-flex items-center gap-1.5 ref-tag text-ink/55">
          {soon ? (
            <><Hourglass className="h-3.5 w-3.5" /> COMING SOON</>
          ) : gate.locked ? (
            <><Lock className="h-3.5 w-3.5" /> LOCKED</>
          ) : (
            <><span className="led" style={{ color: led }} /> {status}</>
          )}
        </span>
      </div>
      <span className="ref-tag mb-1 text-ink/45">{ref}</span>
      <h3 className="font-lab mb-1 text-xl font-bold">{title}</h3>
      <p className="ref-tag mb-3 text-pcb">
        {gate.locked && !soon ? `${gate.done} / ${gate.required} Python modules done` : line}
      </p>
      <p className="mb-5 flex-1 font-semibold text-ink/65">{desc}</p>
      {soon ? (
        <span className="inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink/35 bg-paper px-4 py-2.5 font-extrabold text-ink/45">
          <Hourglass className="h-4 w-4" /> On the bench
        </span>
      ) : (
        <Link
          to={to}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-ink bg-ink px-4 py-2.5 font-extrabold text-white transition-colors hover:bg-pcb"
        >
          {gate.locked ? <><Lock className="h-4 w-4" /> See what unlocks it</>
            : <><Zap className="h-4 w-4" /> Open module</>}
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
            <span className="led" style={{ color: '#1F7A5C' }} />
            Modules
          </span>
          <h1 className="font-lab mb-3 text-3xl font-extrabold sm:text-5xl">Pick your path</h1>
          <p className="mb-12 max-w-2xl text-lg font-semibold text-ink/65">
            Start with Python, then plug in AI, games and robotics as you level up.
            Two more benches are being wired up right now.
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
          <div className="lab-panel-pcb relative overflow-hidden px-8 py-12 text-center">
            <div className="pointer-events-none absolute inset-0 opacity-15"
              style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.6) 1px,transparent 1px)', backgroundSize: '28px 28px' }} />
            <div className="relative">
              <span className="mb-4 inline-flex items-center gap-2 rounded-md border-2 border-ink bg-signal px-3 py-1 ref-tag text-ink">
                <Power className="h-3.5 w-3.5" /> Power on
              </span>
              <h2 className="font-lab mb-3 text-2xl font-extrabold text-white sm:text-3xl">
                Not sure where to start?
              </h2>
              <p className="mx-auto mb-8 max-w-xl text-lg font-semibold text-white/85">
                Python is the front door. Everything else on this page plugs into it.
              </p>
              <Link
                to="/course/python/lesson/intro"
                className="lab-btn inline-flex items-center gap-2 rounded-xl border-2 border-ink bg-signal px-8 py-3.5 text-lg font-extrabold text-ink"
              >
                Start with Python <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
