import { useState } from 'react';

/**
 * Call Tracer: steps through a short program so the order of execution is
 * visible, line by line.
 *
 * It exists for one misconception: beginners read `def` as an instruction that
 * runs. Here the definition lights up once and produces no output at all, then
 * the call jumps into the body and comes back out again, so "defining is not
 * running" is something the student watches rather than something they are told.
 */
const LINES = [
  'def cheer():',
  '    print("Go!")',
  '    print("Team!")',
  '',
  'print("Start")',
  'cheer()',
  'print("End")',
];

const STEPS = [
  { at: [0, 1, 2], say: 'Python reads the definition and remembers it. Not one line inside the function runs yet.', out: null },
  { at: [4], say: 'This line is not inside the function, so it runs normally.', out: 'Start' },
  { at: [5], say: 'The call. Python jumps up into the function body.', out: null },
  { at: [1], say: 'Now the first line of the body really does run.', out: 'Go!' },
  { at: [2], say: 'And the second one.', out: 'Team!' },
  { at: [5], say: 'The body is finished, so Python comes back to the line that called it.', out: null },
  { at: [6], say: 'Carries on from there, and the program ends.', out: 'End' },
];

export default function CallTracer() {
  const [i, setI] = useState(0);
  const step = STEPS[i];
  const output = STEPS.slice(0, i + 1).map((s) => s.out).filter(Boolean);
  const atEnd = i === STEPS.length - 1;

  return (
    <div className="my-8 overflow-hidden rounded-2xl border-2 border-ink bg-white shadow-[4px_4px_0_rgba(27,27,27,0.9)] [container-type:inline-size]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-ink bg-pcb px-4 py-3">
        <span className="font-lab text-sm font-bold text-white">Call Tracer</span>
        <span className="ref-tag text-white/60">step {i + 1} of {STEPS.length}</span>
      </div>

      <div className="p-5">
        <div className="mb-5 grid grid-cols-1 gap-4 @min-[34rem]:grid-cols-[3fr_2fr]">
          {/* Every line keeps its row whether or not it is the active one, so
              the program never shifts under the highlight. */}
          <div className="overflow-hidden rounded-xl border-2 border-ink bg-well py-2">
            {LINES.map((line, n) => {
              const active = step.at.includes(n);
              return (
                <div
                  key={n}
                  className={`flex items-start gap-3 px-3 py-0.5 ${active ? 'bg-signal/25' : ''}`}
                >
                  <span className={`w-4 shrink-0 select-none text-right font-mono-lab text-xs leading-6 ${active ? 'text-signal' : 'text-white/25'}`}>
                    {n + 1}
                  </span>
                  <code className={`min-h-6 whitespace-pre font-mono-lab text-sm leading-6 ${active ? 'font-extrabold text-white' : 'text-white/60'}`}>
                    {line || ' '}
                  </code>
                </div>
              );
            })}
          </div>

          <div>
            <p className="ref-tag mb-1 text-ink/55">output so far</p>
            <pre className="min-h-32 overflow-x-auto rounded-xl border-2 border-ink bg-well px-4 py-3 font-mono-lab text-sm leading-relaxed text-signal">
{output.length ? output.join('\n') : '(nothing yet)'}
            </pre>
          </div>
        </div>

        <div className="mb-5 flex min-h-14 items-center rounded-xl border-2 border-ink bg-paper px-4 py-3">
          <p className="text-sm font-medium leading-relaxed text-ink/75">{step.say}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setI(Math.max(0, i - 1))}
            disabled={i === 0}
            className="h-11 rounded-xl border-2 border-ink bg-white px-4 font-lab text-sm font-bold text-ink transition-colors hover:bg-paper disabled:cursor-not-allowed disabled:border-ink/20 disabled:text-ink/30 disabled:hover:bg-white"
          >
            Back
          </button>
          <button
            onClick={() => setI(Math.min(STEPS.length - 1, i + 1))}
            disabled={atEnd}
            className="h-11 flex-1 rounded-xl border-2 border-ink bg-ink px-4 font-lab text-sm font-bold text-white transition-colors hover:bg-pcb disabled:cursor-not-allowed disabled:border-ink/20 disabled:bg-ink/10 disabled:text-ink/30"
          >
            {atEnd ? 'Finished' : 'Next step'}
          </button>
          <button
            onClick={() => setI(0)}
            className="h-11 rounded-xl border-2 border-ink bg-white px-4 font-lab text-sm font-bold text-ink transition-colors hover:bg-paper"
          >
            Start over
          </button>
        </div>

        <p className="mt-4 text-sm font-medium leading-relaxed text-ink/70">
          Notice that lines 2 and 3 only light up after the call on line 6. The
          definition put the steps on the shelf. The call took them down and used them.
        </p>
      </div>
    </div>
  );
}
