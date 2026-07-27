import { useState } from 'react';
import { CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import ContinueBar from '../shared/ContinueBar';

// Pick: multi-select — choose every card that matches the prompt.
export default function PickStage({ stage, onComplete }) {
  const [selected, setSelected] = useState({});
  const [checked, setChecked] = useState(false);

  const toggle = (id) => {
    if (checked) return;
    setSelected((p) => ({ ...p, [id]: !p[id] }));
  };

  const allCorrect = stage.items.every((it) => !!selected[it.id] === it.isAI);

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {stage.items.map((it) => {
          const isSel = !!selected[it.id];
          let ring = isSel ? 'border-pcb bg-pcb/8 ring-2 ring-pcb/30' : 'border-ink/15 bg-white hover:border-ink/15';
          if (checked) {
            const right = isSel === it.isAI;
            ring = right
              ? 'border-pcb/40 bg-pcb/10'
              : 'border-wire/50 bg-wire/8';
          }
          return (
            <button
              key={it.id}
              onClick={() => toggle(it.id)}
              className={`relative flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition-all active:scale-95 ${ring}`}
            >
              <span className="text-4xl">{it.emoji}</span>
              <span className="text-sm font-bold text-ink/75">{it.label}</span>
              {checked && (
                <span className="absolute right-1.5 top-1.5">
                  {isSel === it.isAI
                    ? <CheckCircle2 className="h-5 w-5 text-pcb" />
                    : <XCircle className="h-5 w-5 text-wire" />}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {checked && (
        <ul className="mt-5 space-y-2 animate-slide-up">
          {stage.items.filter((it) => it.isAI !== !!selected[it.id]).length === 0 ? (
            <li className="rounded-xl bg-pcb/10 p-3 text-sm font-bold text-pcb ring-1 ring-pcb/20">
              Perfect! You spotted every AI-powered device. 🎉
            </li>
          ) : (
            stage.items.map((it) => {
              const right = !!selected[it.id] === it.isAI;
              if (right) return null;
              return (
                <li key={it.id} className="rounded-xl bg-signal/15 p-3 text-sm text-ink ring-1 ring-ink/15">
                  <b>{it.emoji} {it.label}:</b> {it.isAI ? stage.feedback.correct : stage.feedback.incorrect}
                </li>
              );
            })
          )}
        </ul>
      )}

      {!checked ? (
        <button
          onClick={() => setChecked(true)}
          className="mt-6 w-full rounded-2xl bg-ink px-6 py-3.5 font-extrabold text-white shadow-md transition-transform hover:bg-pcb active:scale-95"
        >
          Check My Picks
        </button>
      ) : allCorrect ? (
        <ContinueBar xp={stage.xp} onClick={() => onComplete(true)} />
      ) : (
        <button
          onClick={() => { setChecked(false); setSelected({}); }}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-wire px-6 py-3 font-bold text-white transition-colors hover:bg-wire/85"
        >
          <RotateCcw className="h-5 w-5" /> Try Again
        </button>
      )}
    </div>
  );
}
