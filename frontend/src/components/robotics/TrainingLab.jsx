import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { awardXPOnce } from '../../lib/progress';
import WidgetShell from './shared/WidgetShell';

const CARDS = [
  { id: 1, emoji: '🐱', truth: 'cat' }, { id: 2, emoji: '🐶', truth: 'dog' },
  { id: 3, emoji: '🐈', truth: 'cat' }, { id: 4, emoji: '🐕', truth: 'dog' },
  { id: 5, emoji: '🐈‍⬛', truth: 'cat' }, { id: 6, emoji: '🐩', truth: 'dog' },
  { id: 7, emoji: '🐱', truth: 'cat' }, { id: 8, emoji: '🐶', truth: 'dog' },
];
const MYSTERY = { emoji: '🐺', looksLike: 'dog', truth: 'neither — a wolf' };

/** Label training cards, watch an accuracy bar climb, then meet a blurry example that fools the model anyway — the module's "data quality is the whole game" moment. */
export default function TrainingLab({ block }) {
  const { title = '🏷️ Teach the Robot', hint, xp = 25, xpKey } = block || {};
  const [labels, setLabels] = useState({});
  const [showMystery, setShowMystery] = useState(false);
  const [earned, setEarned] = useState(0);

  const labeledCount = Object.keys(labels).length;
  const correctCount = CARDS.filter((c) => labels[c.id] === c.truth).length;
  const accuracy = labeledCount ? Math.round((correctCount / labeledCount) * 100) : 0;
  const allDone = labeledCount === CARDS.length;

  const label = (id, choice) => {
    if (showMystery) return;
    setLabels((l) => ({ ...l, [id]: choice }));
  };

  const reveal = () => {
    setShowMystery(true);
    if (xpKey) {
      const got = awardXPOnce(xpKey, xp);
      if (got) setEarned(got);
    }
  };

  return (
    <WidgetShell title={title} hint={hint}>
      <div className="p-4">
        <div className="mb-3">
          <div className="mb-1 flex justify-between text-xs font-bold uppercase tracking-wide text-ink/50">
            <span>Training accuracy</span><span className="font-mono-lab text-pcb">{accuracy}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full border border-ink/20 bg-white">
            <div className="h-full bg-pcb transition-all" style={{ width: `${accuracy}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
          {CARDS.map((c) => {
            const picked = labels[c.id];
            return (
              <div key={c.id} className="flex flex-col items-center gap-1 rounded-xl border-2 border-ink/12 bg-white p-2">
                <span className="text-2xl">{c.emoji}</span>
                <div className="flex gap-1">
                  <button onClick={() => label(c.id, 'cat')} className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${picked === 'cat' ? 'bg-signal text-ink' : 'bg-paper text-ink/50'}`}>Cat</button>
                  <button onClick={() => label(c.id, 'dog')} className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${picked === 'dog' ? 'bg-signal text-ink' : 'bg-paper text-ink/50'}`}>Dog</button>
                </div>
                {picked && (picked === c.truth
                  ? <Check className="h-3 w-3 text-pcb" />
                  : <X className="h-3 w-3 text-wire" />)}
              </div>
            );
          })}
        </div>

        {allDone && !showMystery && (
          <button onClick={reveal} className="lab-btn mt-4 w-full rounded-xl border-2 border-ink bg-pcb px-6 py-2.5 font-extrabold text-white">
            Now test it on a new image
          </button>
        )}

        {showMystery && (
          <div className="mt-4 rounded-2xl border-2 border-wire/40 bg-wire/5 p-4 text-center">
            <span className="text-4xl">{MYSTERY.emoji}</span>
            <p className="mt-2 font-mono-lab text-sm font-bold text-wire">
              model guess: "{MYSTERY.looksLike}" · actually: {MYSTERY.truth}
              {earned ? ` · +${earned} XP` : ''}
            </p>
            <p className="mt-2 text-sm font-semibold text-ink/70">
              None of your training cards looked quite like this one. A model can only be as good as the examples it learned from — this is exactly what "data quality is the whole game" means.
            </p>
          </div>
        )}
      </div>
    </WidgetShell>
  );
}
