import { useState } from 'react';

/**
 * Predict-then-watch gate shared by every science widget.
 *
 * Shows a one-tap prediction first. The widget (children) only mounts after
 * the student commits, so the animation never spoils the answer. No `predict`
 * config means no gate: children render straight away.
 */
export default function PredictGate({ predict, children }) {
  const [picked, setPicked] = useState(null);
  const [open, setOpen] = useState(!predict);

  if (open) return children;

  const answered = picked !== null;
  const correct = answered && picked === predict.answer;

  return (
    <div className="my-8 rounded-2xl border-2 border-ink bg-white p-5 shadow-[4px_4px_0_rgba(22,36,29,0.9)]">
      <p className="font-mono-lab text-[11px] uppercase tracking-[0.18em] text-ink/50">Predict first</p>
      <h3 className="mt-1 font-lab text-lg font-extrabold text-ink">{predict.question}</h3>

      <div className="mt-4 flex flex-wrap gap-3">
        {predict.options.map((label, i) => (
          <button
            key={label}
            type="button"
            disabled={answered}
            onClick={() => setPicked(i)}
            className={
              answered && i === predict.answer
                ? 'rounded-xl border-2 border-ink bg-pcb px-5 py-2.5 font-lab font-extrabold text-white'
                : answered && i === picked
                  ? 'rounded-xl border-2 border-ink bg-wire px-5 py-2.5 font-lab font-extrabold text-white'
                  : 'rounded-xl border-2 border-ink bg-signal px-5 py-2.5 font-lab font-extrabold text-ink shadow-[3px_3px_0_rgba(22,36,29,0.9)] transition-transform active:translate-x-[3px] active:translate-y-[3px] active:shadow-none disabled:opacity-60'
            }
          >
            {label}
          </button>
        ))}
      </div>

      {answered && (
        <div className="mt-4 rounded-xl border-2 border-ink/15 bg-paper p-4">
          <p className="font-lab font-extrabold text-ink">
            {correct ? 'Nice call.' : 'Not quite. That is the interesting part.'}
          </p>
          <p className="mt-1 text-sm font-semibold text-ink/70">{predict.explain}</p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-3 rounded-xl border-2 border-ink bg-white px-4 py-2 font-lab text-sm font-extrabold text-ink"
          >
            Show me it happen
          </button>
        </div>
      )}
    </div>
  );
}
