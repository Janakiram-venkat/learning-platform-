import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import WidgetShell from './shared/WidgetShell';

/** A generic N-stage reveal — voice's four stages, autonomous-nav's five — one config, walked through with Prev/Next. */
export default function PipelineStages({ block }) {
  const { title = '🔄 Pipeline', hint, stages = [] } = block || {};
  const [i, setI] = useState(0);
  if (!stages.length) return null;
  const stage = stages[i];

  return (
    <WidgetShell title={title} hint={hint}>
      <div className="p-4">
        <div className="mb-4 flex items-center justify-center gap-1.5">
          {stages.map((s, idx) => (
            <button key={s.label} onClick={() => setI(idx)} className="flex flex-col items-center">
              <span className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-lg transition-all ${idx === i ? 'border-ink bg-signal' : idx < i ? 'border-pcb bg-pcb/15' : 'border-ink/20 bg-white'}`}>
                {s.emoji}
              </span>
              {idx < stages.length - 1 && <span className="mt-4 h-0.5 w-6 -translate-y-4 bg-ink/15" />}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border-2 border-ink/12 bg-paper/60 p-4 text-center">
          <p className="font-lab text-lg font-extrabold text-ink">{stage.label}</p>
          <p className="mt-1 text-sm font-semibold text-ink/70">{stage.detail}</p>
        </div>

        <div className="mt-4 flex justify-between gap-3">
          <button onClick={() => setI((n) => Math.max(0, n - 1))} disabled={i === 0}
            className="inline-flex items-center gap-1 rounded-xl border-2 border-ink bg-white px-4 py-2 text-sm font-bold text-ink disabled:opacity-40">
            <ChevronLeft className="h-4 w-4" /> Prev
          </button>
          <button onClick={() => setI((n) => Math.min(stages.length - 1, n + 1))} disabled={i === stages.length - 1}
            className="inline-flex items-center gap-1 rounded-xl border-2 border-ink bg-signal px-4 py-2 text-sm font-bold text-ink disabled:opacity-40">
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </WidgetShell>
  );
}
