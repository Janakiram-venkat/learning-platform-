import { useMemo, useState } from 'react';
import WidgetShell from './shared/WidgetShell';

// A synthetic but realistic bounce: several rapid flickers in the first ~14ms, then settles HIGH.
const BOUNCE = [
  { t: 0, level: 0 }, { t: 3, level: 1 }, { t: 5, level: 0 },
  { t: 8, level: 1 }, { t: 10, level: 0 }, { t: 14, level: 1 },
];
const END_T = 60;

function levelAt(t) {
  let lvl = 0;
  for (const p of BOUNCE) { if (p.t <= t) lvl = p.level; else break; }
  return lvl;
}

function stepPath(points, endT, H) {
  const y = (lvl) => (lvl ? H * 0.22 : H * 0.78);
  let d = `M0 ${y(points[0].level)}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L${(points[i].t / endT) * 300} ${y(points[i - 1].level)} L${(points[i].t / endT) * 300} ${y(points[i].level)}`;
  }
  d += ` L300 ${y(points[points.length - 1].level)}`;
  return d;
}

/** A button press bounces a few times before settling; a debounce window waits it out before trusting the level. */
export default function ButtonDebounce({ block }) {
  const { title = '🔘 Button Bounce', hint } = block || {};
  const [debounceMs, setDebounceMs] = useState(0);
  const [pressCount, setPressCount] = useState(0);

  const rawCount = BOUNCE.filter((p) => p.level === 1).length; // naive "press" triggers if you trust every edge

  const debounced = useMemo(() => {
    const firstEdge = BOUNCE.find((p) => p.level === 1)?.t ?? 0;
    const settleT = firstEdge + debounceMs;
    const settledLevel = levelAt(settleT);
    return [
      { t: 0, level: 0 },
      { t: firstEdge, level: 0 },
      { t: settleT, level: settledLevel },
      { t: END_T, level: settledLevel },
    ];
  }, [debounceMs]);

  const H = 60;
  const rawPath = stepPath(BOUNCE.concat([{ t: END_T, level: BOUNCE[BOUNCE.length - 1].level }]), END_T, H);
  const debouncedPath = stepPath(debounced, END_T, H);
  const clean = debounceMs >= 14;

  return (
    <WidgetShell title={title} hint={hint}>
      <div className="p-4">
        <button
          onClick={() => setPressCount((c) => c + 1)}
          className="lab-btn mx-auto mb-4 block rounded-2xl border-2 border-ink bg-signal px-8 py-3 font-extrabold text-ink active:scale-95"
        >
          Press the button
        </button>

        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-ink/50">Raw signal (real mechanical bounce)</p>
        <svg key={`raw-${pressCount}`} viewBox={`0 0 300 ${H}`} className="w-full rounded-lg border-2 border-ink/12 bg-[#0B180F]">
          <path d={rawPath} fill="none" stroke="#E8503A" strokeWidth="2.5" className="animate-slide-up" />
        </svg>
        <p className="mt-1 text-xs font-semibold text-ink/50">{rawCount} separate HIGH edges — a naive counter would think the button was pressed {rawCount} times.</p>

        <p className="mb-1 mt-4 text-xs font-bold uppercase tracking-wide text-ink/50">Debounced signal (what your code should trust)</p>
        <svg key={`db-${pressCount}-${debounceMs}`} viewBox={`0 0 300 ${H}`} className="w-full rounded-lg border-2 border-ink/12 bg-[#0B180F]">
          <path d={debouncedPath} fill="none" stroke="#23B5D3" strokeWidth="2.5" className="animate-slide-up" />
        </svg>

        <label className="mt-4 block">
          <span className="mb-1 flex justify-between text-xs font-bold uppercase tracking-wide text-ink/60">
            <span>Debounce window</span><span className="font-mono-lab text-pcb">{debounceMs} ms</span>
          </span>
          <input type="range" min="0" max="30" step="2" value={debounceMs}
            onChange={(e) => setDebounceMs(Number(e.target.value))}
            className="h-2 w-full cursor-grab accent-pcb active:cursor-grabbing" />
        </label>
        <p className="mt-3 text-center text-sm font-semibold text-ink/60">
          {clean ? 'Long enough — the bounce is fully hidden, one clean press.' : 'Too short — some of the bounce still leaks through.'}
        </p>
      </div>
    </WidgetShell>
  );
}
