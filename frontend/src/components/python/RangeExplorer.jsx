import { useState } from 'react';
import NumberDial from './NumberDial';

/**
 * Range Explorer: turn the dials, see exactly which numbers `range()` hands
 * the loop.
 *
 * range() is the first place beginners meet an "up to but not including"
 * boundary, and the off-by-one is much easier to see as a row of chips than to
 * read about. Start and step are shown too, because later lessons use
 * range(1, 6) and counting backwards.
 *
 * Content block shape (all optional):
 *   { "type": "widget", "kind": "range-explorer",
 *     "start": 0, "stop": 5, "step": 1 }
 *
 * Widths use container queries because this renders inside the lesson sheet,
 * which sets `container-type: inline-size` and can sit beside a 600px editor.
 */
const MAX_SHOWN = 40;

function buildRange(start, stop, step) {
  if (step === 0) return { error: 'step cannot be 0' };
  const out = [];
  if (step > 0) {
    for (let v = start; v < stop && out.length <= MAX_SHOWN; v += step) out.push(v);
  } else {
    for (let v = start; v > stop && out.length <= MAX_SHOWN; v += step) out.push(v);
  }
  const clipped = out.length > MAX_SHOWN;
  return { values: clipped ? out.slice(0, MAX_SHOWN) : out, clipped };
}

export default function RangeExplorer({ block }) {
  const [start, setStart] = useState(Number(block?.start ?? 0));
  const [stop, setStop] = useState(Number(block?.stop ?? 5));
  const [step, setStep] = useState(Number(block?.step ?? 1));

  const { values, error, clipped } = buildRange(start, stop, step);

  // Python lets you leave out the parts you are not using, and that is how
  // lessons write it, so show the shortest form that matches the dials.
  const call =
    step !== 1 ? `range(${start}, ${stop}, ${step})`
      : start !== 0 ? `range(${start}, ${stop})`
      : `range(${stop})`;

  return (
    <div className="my-8 overflow-hidden rounded-2xl border-2 border-ink bg-white shadow-[4px_4px_0_rgba(27,27,27,0.9)] [container-type:inline-size]">
      <div className="border-b-2 border-ink bg-pcb px-4 py-3">
        <span className="font-lab text-sm font-bold text-white">Range Explorer</span>
      </div>

      <div className="p-5">
        <div className="mb-5 grid grid-cols-1 gap-4 @min-[28rem]:grid-cols-3">
          <NumberDial label="start" value={start} onChange={setStart} />
          <NumberDial label="stop" value={stop} onChange={setStop} />
          <NumberDial label="step" value={step} onChange={setStep} />
        </div>

        <p className="ref-tag mb-2 text-ink/55">Numbers the loop gets</p>
        <div className={`mb-5 min-h-16 rounded-xl border-2 border-ink p-3 ${error ? 'bg-wire/10' : 'bg-paper'}`}>
          {error ? (
            <p className="px-1 py-2 text-sm font-bold text-wire">
              ValueError: range() arg 3 must not be zero
            </p>
          ) : values.length === 0 ? (
            <p className="px-1 py-2 text-sm font-semibold text-ink/50">
              No numbers at all. The loop body never runs even once.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {values.map((v, i) => (
                <span
                  key={i}
                  className="flex h-9 min-w-9 items-center justify-center rounded-md border-2 border-ink bg-white px-2 font-mono-lab text-sm font-extrabold text-ink"
                >
                  {v}
                </span>
              ))}
              {clipped && (
                <span className="flex h-9 items-center px-1 font-mono-lab text-sm font-bold text-ink/45">
                  and more
                </span>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 @min-[34rem]:grid-cols-[3fr_2fr]">
          <pre className="overflow-x-auto rounded-xl border-2 border-ink bg-well px-4 py-4 font-mono-lab text-sm leading-relaxed text-white/90">
{`for i in ${call}:
    print(i)`}
          </pre>
          <div className="flex min-h-20 flex-col items-center justify-center rounded-xl border-2 border-ink bg-signal px-4 py-4 text-center">
            <p className="ref-tag mb-1 text-ink/60">loop runs</p>
            <p className="font-mono-lab text-3xl font-extrabold leading-none text-ink">
              {error ? '0' : values.length}{clipped ? '+' : ''}
            </p>
            <p className="mt-1 text-xs font-bold text-ink/60">
              {values?.length === 1 && !clipped ? 'time' : 'times'}
            </p>
          </div>
        </div>

        <p className="mt-4 text-sm font-medium leading-relaxed text-ink/70">
          range stops <strong>before</strong> the stop number, never on it. That is why
          range(5) gives 0 to 4, which is five numbers starting at zero.
        </p>
      </div>
    </div>
  );
}
