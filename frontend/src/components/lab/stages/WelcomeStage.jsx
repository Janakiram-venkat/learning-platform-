import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';

// Welcome: narrated intro steps that reveal one at a time.
export default function WelcomeStage({ stage, onComplete }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (shown >= stage.steps.length) return;
    const t = setTimeout(() => setShown((s) => s + 1), 900);
    return () => clearTimeout(t);
  }, [shown, stage.steps.length]);
  const ready = shown >= stage.steps.length;

  return (
    <div>
      <ul className="space-y-3">
        {stage.steps.slice(0, shown).map((s, i) => (
          <li
            key={i}
            className="flex items-center gap-4 rounded-2xl border border-ink/15 bg-white p-4 shadow-sm animate-bounce-in"
          >
            <span className="text-3xl">{s.emoji}</span>
            <span className="text-lg font-semibold text-ink/75">{s.text}</span>
          </li>
        ))}
      </ul>
      {ready && (
        <div className="mt-6 animate-slide-up">
          <p className="rounded-2xl bg-pcb/8 p-5 text-center text-lg font-bold text-ink ring-1 ring-pcb/20">
            “{stage.narration}”
          </p>
          <button
            onClick={() => onComplete(true)}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-pcb px-6 py-4 text-lg font-extrabold text-white shadow-md transition-transform hover:scale-[1.02] active:scale-95"
          >
            {stage.cta || 'Start Exploring'} <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}
