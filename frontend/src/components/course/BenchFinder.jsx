import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Power, RotateCcw, Lock, Check } from 'lucide-react';
import { FINDER_TRACKS, TRACKS } from '../../data/tracks';
import { useCourseLock } from '../../hooks/useCoursePrerequisite';
import { TRACK_ICONS } from './TrackIcons';

/* ---------------------------------------------------------------------------
   Bench finder — the "not sure where to start?" panel on the Courses page.
   It used to be a hard-coded "start with Python" button. Now it asks a few
   questions and points at the bench that fits the answers.

   How it scales: a question is an object with options, each option carrying
   `tags` (the traits it implies) and the question carrying a `weight`.
   Tracks declare matching `traits` in data/tracks.js. Scoring multiplies the
   three and sums, so adding a subject
   means adding traits to that track, and adding a question means pushing one
   object into QUESTIONS. Nothing here is keyed to a fixed number of courses
   or questions.
--------------------------------------------------------------------------- */

const QUESTIONS = [
  {
    id: 'make',
    // What you want to build decides the bench; the rest only nudges.
    weight: 3,
    prompt: 'What would you love to build first?',
    options: [
      { label: 'A game someone can play', tags: { games: 3, motion: 1 } },
      { label: 'A website I can send to people', tags: { web: 3, share: 2 } },
      { label: 'Something that learns and guesses', tags: { ai: 3, data: 2 } },
      { label: 'A machine that moves on its own', tags: { robots: 3, machines: 2 } },
      { label: 'An experiment I can poke at', tags: { science: 3, machines: 1 } },
    ],
  },
  {
    id: 'code',
    weight: 1,
    prompt: 'How much code have you written before?',
    options: [
      { label: 'None at all, this is day one', tags: { brandNew: 3, noCode: 1, foundation: 2 } },
      { label: 'A little, I can follow along', tags: { someCode: 2, code: 1 } },
      { label: 'Enough to be dangerous', tags: { someCode: 3, code: 2, puzzles: 1 } },
      { label: 'I would rather not code yet', tags: { noCode: 3, science: 1 } },
    ],
  },
  {
    id: 'pull',
    weight: 1.5,
    prompt: 'Which one sounds most like fun?',
    options: [
      { label: 'Cracking puzzles and logic', tags: { puzzles: 3, code: 2 } },
      { label: 'Making things look good', tags: { design: 3, web: 1 } },
      { label: 'Finding patterns in data', tags: { data: 3, ai: 2 } },
      { label: 'Watching something move', tags: { motion: 3, games: 1, robots: 1 } },
      { label: 'Working out why the world works', tags: { science: 3, machines: 1 } },
    ],
  },
];

/** Rank every recommendable track against the picked options. */
function rankTracks(picked) {
  const tally = new Map(FINDER_TRACKS.map((t) => [t.ref, 0]));

  picked.forEach((option, index) => {
    if (!option) return;
    const ask = QUESTIONS[index].weight ?? 1;
    Object.entries(option.tags).forEach(([tag, weight]) => {
      FINDER_TRACKS.forEach((track) => {
        const affinity = track.traits[tag];
        if (affinity) tally.set(track.ref, tally.get(track.ref) + affinity * weight * ask);
      });
    });
  });

  // Catalogue order breaks ties, so Python wins a dead heat by sitting first.
  return FINDER_TRACKS
    .map((track) => ({ track, score: tally.get(track.ref) }))
    .sort((a, b) => b.score - a.score);
}

const PYTHON = TRACKS.find((t) => t.ref === 'TRK-PY');

/** The answer card: the winning bench, the runner-up, and a way to start. */
function Result({ ranked, onRetake }) {
  const [best, second] = ranked;
  // Only one track is gated today, and the hook has to be called
  // unconditionally, so ask about that track and apply the answer if it won.
  const gate = useCourseLock('gamedev');
  const bestLocked = best.track.courseId === 'gamedev' && gate.locked;

  const Icon = TRACK_ICONS[best.track.ref];
  // A locked bench is still the honest match, but you cannot open it yet, so
  // the button sends you to the course that unlocks it.
  const cta = bestLocked ? PYTHON : best.track;

  return (
    <div className="relative">
      <span className="mb-4 inline-flex items-center gap-2 rounded-md border-2 border-ink bg-signal px-3 py-1 ref-tag text-ink">
        <Check className="h-3.5 w-3.5" /> Your bench
      </span>

      <div className="mx-auto mb-6 flex max-w-md items-center gap-4 rounded-xl border-2 border-ink bg-white p-5 text-left">
        <span
          aria-hidden
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border-2 border-ink text-white"
          style={{ background: best.track.led }}
        >
          {Icon ? <Icon className="h-8 w-8" /> : null}
        </span>
        <div>
          <p className="ref-tag text-ink/45">{best.track.ref}</p>
          <h3 className="font-lab text-xl font-bold text-ink">{best.track.title}</h3>
          <p className="font-semibold text-ink/65">{best.track.desc}</p>
        </div>
      </div>

      {bestLocked && (
        <p className="mx-auto mb-6 flex max-w-md items-center justify-center gap-2 ref-tag text-white/80">
          <Lock className="h-3.5 w-3.5" />
          Opens after {gate.required} Python modules ({gate.done} done)
        </p>
      )}

      {second && (
        <p className="mx-auto mb-8 max-w-xl font-semibold text-white/85">
          Also worth a look: <span className="font-extrabold text-white">{second.track.title}</span>.
          Nothing is locked in, you can switch benches whenever you like.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          to={cta.to}
          className="lab-btn inline-flex items-center gap-2 rounded-xl border-2 border-ink bg-signal px-8 py-3.5 text-lg font-extrabold text-ink"
        >
          Start with {cta.title} <ArrowRight className="h-5 w-5" />
        </Link>
        <button
          type="button"
          onClick={onRetake}
          className="inline-flex items-center gap-2 rounded-xl border-2 border-white/60 px-5 py-3 font-extrabold text-white transition-colors hover:bg-white/10"
        >
          <RotateCcw className="h-4 w-4" /> Answer again
        </button>
      </div>
    </div>
  );
}

export default function BenchFinder() {
  // `null` = the panel is still just an invitation; a number = that question
  // is on screen; QUESTIONS.length = show the result.
  const [step, setStep] = useState(null);
  const [picked, setPicked] = useState([]);

  const ranked = useMemo(() => rankTracks(picked), [picked]);
  const question = step === null ? null : QUESTIONS[step];

  const answer = (option) => {
    setPicked((prev) => {
      const next = [...prev];
      next[step] = option;
      return next;
    });
    setStep(step + 1);
  };

  const restart = () => { setPicked([]); setStep(0); };

  return (
    <div className="lab-panel-pcb relative overflow-hidden px-8 py-12 text-center">
      <div className="pointer-events-none absolute inset-0 opacity-15"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.6) 1px,transparent 1px)', backgroundSize: '28px 28px' }} />

      {step === null && (
        <div className="relative">
          <span className="mb-4 inline-flex items-center gap-2 rounded-md border-2 border-ink bg-signal px-3 py-1 ref-tag text-ink">
            <Power className="h-3.5 w-3.5" /> Power on
          </span>
          <h2 className="font-lab mb-3 text-2xl font-extrabold text-white sm:text-3xl">
            Not sure where to start?
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-lg font-semibold text-white/85">
            Answer {QUESTIONS.length} quick questions about what you want to
            make, and we will point you at the bench that fits.
          </p>
          <button
            type="button"
            onClick={restart}
            className="lab-btn inline-flex items-center gap-2 rounded-xl border-2 border-ink bg-signal px-8 py-3.5 text-lg font-extrabold text-ink"
          >
            Find my bench <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      )}

      {question && (
        <div className="relative">
          <span className="mb-4 inline-flex items-center gap-2 rounded-md border-2 border-ink bg-signal px-3 py-1 ref-tag text-ink">
            Question {step + 1} of {QUESTIONS.length}
          </span>
          <h2 className="font-lab mb-8 text-2xl font-extrabold text-white sm:text-3xl">
            {question.prompt}
          </h2>

          <div className="mx-auto mb-8 grid max-w-2xl gap-3 sm:grid-cols-2">
            {question.options.map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => answer(option)}
                className="group flex items-center justify-between gap-3 rounded-xl border-2 border-ink bg-white px-5 py-4 text-left font-extrabold text-ink transition-colors hover:bg-signal"
              >
                {option.label}
                <ArrowRight className="h-4 w-4 shrink-0 opacity-40 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100" />
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => (step === 0 ? setStep(null) : setStep(step - 1))}
            className="ref-tag text-white/70 underline decoration-white/40 underline-offset-4 hover:text-white"
          >
            {step === 0 ? 'Never mind' : 'Back'}
          </button>
        </div>
      )}

      {step === QUESTIONS.length && <Result ranked={ranked} onRetake={restart} />}
    </div>
  );
}
