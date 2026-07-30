import { useState } from 'react';
import { Lightbulb, RotateCcw } from 'lucide-react';
import { awardXPOnce } from '../../lib/progress';
import WidgetShell from './shared/WidgetShell';

/**
 * Put each robot part in one of the three boxes of the loop.
 *
 * Answers are revealed together rather than one at a time, and every item gets
 * its reason back — including the ones the student got right, because "a
 * sensor reports 23, it doesn't know that means a wall" is the actual lesson,
 * not the tick mark.
 */
export default function ClassifyParts({ block }) {
  const { title = '🧭 Sense, Think or Act?', prompt, options = [], tasks = [], xp = 20, xpKey } = block || {};
  const [answers, setAnswers] = useState({});
  const [checked, setChecked] = useState(false);
  const [earned, setEarned] = useState(0);

  if (!options.length || !tasks.length) return null;

  const allAnswered = tasks.every((t) => answers[t.id]);
  const correctCount = tasks.filter((t) => answers[t.id] === t.answer).length;

  const reveal = () => {
    setChecked(true);
    const got = tasks.filter((t) => answers[t.id] === t.answer).length;
    if (got === tasks.length && xpKey) setEarned(awardXPOnce(xpKey, xp));
  };

  return (
    <WidgetShell
      title={title}
      hint={prompt}
      controls={checked && (
        <button
          onClick={() => { setChecked(false); setAnswers({}); }}
          className="inline-flex items-center gap-1.5 rounded-lg border-2 border-ink/20 bg-white px-3 py-1.5 text-sm font-bold text-ink transition-colors hover:border-ink"
        >
          <RotateCcw className="h-4 w-4" /> Start over
        </button>
      )}
    >
      <div className="p-4">
        <ul className="space-y-3">
          {tasks.map((t) => {
            const chosen = answers[t.id];
            const right = chosen === t.answer;
            return (
              <li key={t.id} className="rounded-2xl border-2 border-ink/12 bg-white p-3">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-xl">{t.emoji}</span>
                  <span className="font-bold text-ink">{t.label}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {options.map((o) => {
                    const sel = chosen === o.id;
                    let cls = sel
                      ? 'border-pcb bg-pcb/15 text-pcb'
                      : 'border-ink/15 bg-white text-ink/65 hover:border-pcb/40';
                    if (checked) {
                      if (o.id === t.answer) cls = 'border-pcb bg-pcb/10 text-pcb';
                      else if (sel) cls = 'border-wire bg-wire/8 text-wire';
                      else cls = 'border-ink/15 bg-white text-ink/35';
                    }
                    return (
                      <button
                        key={o.id}
                        disabled={checked}
                        onClick={() => setAnswers((p) => ({ ...p, [t.id]: o.id }))}
                        className={`flex items-center gap-1.5 rounded-xl border-2 px-4 py-1.5 text-sm font-bold transition-all active:scale-95 ${cls}`}
                      >
                        <span>{o.emoji}</span> {o.label}
                      </button>
                    );
                  })}
                </div>
                {checked && (
                  <p className={`mt-3 flex animate-slide-up items-start gap-2 rounded-xl p-3 text-sm font-medium ${
                    right ? 'bg-pcb/10 text-ink ring-1 ring-pcb/20' : 'bg-signal/15 text-ink ring-1 ring-ink/15'
                  }`}>
                    <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" />
                    <span><b>{right ? 'Yes. ' : 'Not quite. '}</b>{t.explain}</span>
                  </p>
                )}
              </li>
            );
          })}
        </ul>

        {!checked ? (
          <button
            onClick={reveal}
            disabled={!allAnswered}
            className="lab-btn mt-4 w-full rounded-xl border-2 border-ink bg-signal px-6 py-3 font-extrabold text-ink disabled:cursor-not-allowed disabled:border-ink/20 disabled:bg-ink/10 disabled:text-ink/40"
          >
            {allAnswered ? 'Check my answers' : 'Place every part to check'}
          </button>
        ) : (
          <p className="mt-4 rounded-xl bg-pcb/8 p-3 text-center text-sm font-bold text-pcb ring-1 ring-pcb/20">
            {correctCount}/{tasks.length} in the right box{earned ? ` · +${earned} XP` : ''} 🧠
          </p>
        )}
      </div>
    </WidgetShell>
  );
}
