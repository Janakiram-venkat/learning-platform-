import { Sparkles, ArrowRight } from 'lucide-react';


// Shared "Continue" footer button shown once a stage is solved.
export default function ContinueBar({ onClick, xp, last }) {
  return (
    <div className="mt-8 flex items-center justify-between gap-3 border-t border-ink/12 pt-5 animate-slide-up">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-signal/15 px-3 py-1.5 text-sm font-extrabold text-ink ring-1 ring-ink/15">
        <Sparkles className="h-4 w-4" /> +{xp} XP
      </span>
      <button
        onClick={onClick}
        className="inline-flex items-center gap-2 rounded-2xl border-2 border-ink bg-pcb px-6 py-3 font-extrabold text-white shadow-md transition-transform hover:scale-[1.02] active:scale-95"
      >
        {last ? 'Finish Lab' : 'Continue'} <ArrowRight className="h-5 w-5" />
      </button>
    </div>
  );
}
