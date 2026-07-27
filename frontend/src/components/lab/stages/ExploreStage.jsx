import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import ContinueBar from '../shared/ContinueBar';

// Explore: free-roam scene — visit every hotspot to continue.
export default function ExploreStage({ stage, onComplete }) {
  const [open, setOpen] = useState(null);
  const [visited, setVisited] = useState({});
  const allVisited = stage.locations.every((l) => visited[l.id]);
  const current = stage.locations.find((l) => l.id === open);

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {stage.locations.map((l) => (
          <button
            key={l.id}
            onClick={() => { setOpen(l.id); setVisited((p) => ({ ...p, [l.id]: true })); }}
            className={`relative flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all active:scale-95 ${
              open === l.id ? 'border-pcb bg-pcb/8' : visited[l.id] ? 'border-pcb/30 bg-pcb/10' : 'border-ink/15 bg-white hover:border-ink/15'
            }`}
          >
            <span className="text-4xl">{l.emoji}</span>
            <span className="text-sm font-bold text-ink/75">{l.label}</span>
            {visited[l.id] && <CheckCircle2 className="absolute right-1.5 top-1.5 h-4 w-4 text-pcb" />}
          </button>
        ))}
      </div>

      {current && (
        <div className="mt-5 flex items-start gap-3 rounded-2xl bg-pcb/8 p-5 text-ink ring-1 ring-pcb/20 animate-slide-up">
          <span className="text-3xl">{current.emoji}</span>
          <div>
            <p className="font-extrabold">{current.label}</p>
            <p className="text-sm font-medium">{current.info}</p>
          </div>
        </div>
      )}

      {allVisited ? (
        <ContinueBar xp={stage.xp} onClick={() => onComplete(true)} />
      ) : (
        <p className="mt-6 text-center text-sm font-semibold text-ink/55">
          Visited {Object.keys(visited).length}/{stage.locations.length} places — tap them all to continue.
        </p>
      )}
    </div>
  );
}
