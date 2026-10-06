import { useState } from 'react';
import { Lightbulb } from 'lucide-react';
import ContinueBar from '../shared/ContinueBar';

// Choose: for each task, decide Human / AI / Both.
export default function ChooseStage({ stage, onComplete }) {
  const [answers, setAnswers] = useState({}); // taskId -> optionId
  const [checked, setChecked] = useState(false);
  const allAnswered = stage.tasks.every((t) => answers[t.id]);
  const correctCount = stage.tasks.filter((t) => answers[t.id] === t.answer).length;

  return (
    <div>
      <ul className="space-y-4">
        {stage.tasks.map((t) => {
          const chosen = answers[t.id];
          const right = chosen === t.answer;
          return (
            <li key={t.id} className="rounded-2xl border border-ink/15 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-3">
                <span className="text-2xl">{t.emoji}</span>
                <span className="font-bold text-ink">{t.label}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {stage.options.map((o) => {
                  const sel = chosen === o.id;
                  let cls = sel ? 'border-pcb bg-pcb/15 text-pcb' : 'border-ink/15 bg-white text-ink/65 hover:border-pcb/40';
                  if (checked) {
                    if (o.id === t.answer) cls = 'border-pcb bg-pcb/10 text-pcb';
                    else if (sel) cls = 'border-wire bg-wire/8 text-wire';
                    else cls = 'border-ink/15 bg-white text-ink/40';
                  }
                  return (
                    <button
                      key={o.id}
                      disabled={checked}
                      onClick={() => setAnswers((p) => ({ ...p, [t.id]: o.id }))}
                      className={`flex items-center gap-1.5 rounded-xl border-2 px-4 py-2 text-sm font-bold transition-all active:scale-95 ${cls}`}
                    >
                      <span>{o.emoji}</span> {o.label}
                    </button>
                  );
                })}
              </div>
              {checked && (
                <p className={`mt-3 flex items-start gap-2 rounded-xl p-3 text-sm font-medium animate-slide-up ${right ? 'bg-pcb/10 text-pcb ring-1 ring-pcb/20' : 'bg-signal/15 text-ink ring-1 ring-ink/15'}`}>
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" />
                  <span><b>{right ? 'Nice! ' : 'Good thinking. '}</b>{t.explain}</span>
                </p>
              )}
            </li>
          );
        })}
      </ul>

      {!checked ? (
        <button
          onClick={() => setChecked(true)}
          disabled={!allAnswered}
          className="mt-6 w-full rounded-2xl bg-ink px-6 py-3.5 font-extrabold text-white shadow-md transition-transform enabled:hover:bg-pcb active:scale-95 disabled:opacity-40"
        >
          {allAnswered ? 'Reveal Answers' : 'Answer every task to continue'}
        </button>
      ) : (
        <>
          <p className="mt-6 rounded-xl bg-pcb/8 p-3 text-center text-sm font-bold text-pcb ring-1 ring-pcb/20">
            You matched {correctCount}/{stage.tasks.length}. Every answer teaches you something! 🧠
          </p>
          <ContinueBar xp={stage.xp} onClick={() => onComplete(true)} />
        </>
      )}
    </div>
  );
}
