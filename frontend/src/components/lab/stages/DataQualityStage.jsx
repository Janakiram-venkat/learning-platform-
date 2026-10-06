import { useState } from 'react';
import { Lightbulb } from 'lucide-react';
import ContinueBar from '../shared/ContinueBar';

// Garbage In, Garbage Out — clean the dataset.
// Learners toss mislabeled cards. A live accuracy meter rewards removing bad
// data and penalizes removing good data; 100% (all bad gone, all good kept)
// passes the stage.
export default function DataQualityStage({ stage, onComplete }) {
  const [removed, setRemoved] = useState({}); // cardId -> true
  const totalGood = stage.cards.filter((c) => !c.bad).length;

  const goodKept = stage.cards.filter((c) => !c.bad && !removed[c.id]).length;
  const badKept = stage.cards.filter((c) => c.bad && !removed[c.id]).length;
  // Each remaining mislabeled card drags accuracy down; removing a good card
  // costs you a correct example too.
  const accuracy = Math.max(0, Math.round(((goodKept - badKept) / totalGood) * 100));
  const passed = accuracy >= 100;

  const toggle = (id) => setRemoved((p) => ({ ...p, [id]: !p[id] }));

  return (
    <div>
      {/* Live accuracy meter */}
      <div className="mb-5 rounded-2xl bg-pcb/8 p-4 ring-1 ring-pcb/20">
        <div className="mb-1 flex items-center justify-between text-xs font-bold text-ink/55">
          <span>{stage.meterLabel || 'Model Accuracy'}</span>
          <span className={passed ? 'text-pcb' : 'text-pcb'}>{accuracy}%</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-white ring-1 ring-pcb/20">
          <div
            className={`h-full rounded-full transition-all duration-500 ${passed ? 'bg-pcb' : 'bg-signal'}`}
            style={{ width: `${accuracy}%` }}
          />
        </div>
      </div>

      {/* Dataset cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stage.cards.map((c) => {
          const gone = removed[c.id];
          return (
            <button
              key={c.id}
              onClick={() => toggle(c.id)}
              className={`relative flex flex-col items-center gap-1 rounded-2xl border-2 p-3 text-center transition-all active:scale-95 ${
                gone ? 'border-ink/15 bg-paper opacity-40' : 'border-ink/15 bg-white hover:border-wire/50'
              }`}
            >
              <span className={`text-4xl ${gone ? 'grayscale' : ''}`}>{c.emoji}</span>
              <span className="text-xs font-bold text-ink/65">labeled “{c.label}”</span>
              <span className={`mt-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${gone ? 'bg-ink/15 text-ink/55' : 'bg-wire/8 text-wire'}`}>
                {gone ? 'removed · tap to undo' : 'tap to remove'}
              </span>
            </button>
          );
        })}
      </div>

      {stage.note && passed && (
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-pcb/8 p-3 text-sm font-medium text-ink ring-1 ring-pcb/20 animate-slide-up">
          <Lightbulb className="mt-0.5 h-5 w-5 shrink-0" /> {stage.note}
        </p>
      )}

      {passed ? (
        <ContinueBar xp={stage.xp} onClick={() => onComplete(true)} />
      ) : (
        <p className="mt-6 text-center text-sm font-semibold text-ink/55">
          Get the accuracy to 100% by removing every wrong label and keeping the good ones.
        </p>
      )}
    </div>
  );
}
