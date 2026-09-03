import { useEffect, useRef, useState } from 'react';
import WidgetShell from './shared/WidgetShell';
import useInView from './shared/useInView';

const PRESETS = [0, 45, 90, 180];

/**
 * Drag or preset an angle; the horn eases toward it with a slew rate and a
 * small overshoot, the way a real closed-loop servo corrects rather than
 * teleporting — the horn's own rebound *is* the "commanded vs measured,
 * error shrinking to zero" feedback loop the blueprint asks to show.
 *
 * A light critically-under-damped spring drives `current` toward `target`;
 * position lives in state (not a ref) since plain SVG re-renders through
 * React, unlike the three.js widgets that mutate a scene-graph ref instead.
 */
export default function ServoDial({ block }) {
  const { title = '🎯 Servo Dial', hint } = block || {};
  const [target, setTarget] = useState(90);
  const [current, setCurrent] = useState(90);
  const [ref, inView] = useInView();
  const vel = useRef(0);
  const targetRef = useRef(target);
  useEffect(() => { targetRef.current = target; }, [target]);

  useEffect(() => {
    if (!inView) return undefined;
    let raf;
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      setCurrent((c) => {
        const err = targetRef.current - c;
        if (Math.abs(err) < 0.05 && Math.abs(vel.current) < 0.5) return targetRef.current;
        const k = 220, damping = 12; // slightly under-damped -> a small overshoot
        const accel = k * err - damping * vel.current;
        vel.current += accel * dt;
        return c + vel.current * dt;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView]);

  const pulseMs = (1 + (target / 180)).toFixed(2);
  const rad = ((current - 90) * Math.PI) / 180;
  const hx = 70 + 50 * Math.sin(rad);
  const hy = 70 - 50 * Math.cos(rad);

  return (
    <WidgetShell title={title} hint={hint}>
      <div ref={ref} className="p-4">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <svg viewBox="0 0 140 90" className="w-56 shrink-0">
            <path d="M10 78 A60 60 0 0 1 130 78" fill="none" stroke="#16241D22" strokeWidth="6" />
            <circle cx="70" cy="78" r="10" fill="#16241D" />
            <line x1="70" y1="78" x2={hx} y2={hy} stroke="#1F7A5C" strokeWidth="6" strokeLinecap="round" />
            <circle cx={hx} cy={hy} r="5" fill="#FFC93C" stroke="#16241D" strokeWidth="1.5" />
          </svg>
          <div className="text-center sm:text-left">
            <p className="font-mono-lab text-lg font-extrabold text-pcb">{Math.round(current)}°</p>
            <p className="font-mono-lab text-xs font-bold text-ink/50">pulse ≈ {pulseMs} ms</p>
          </div>
        </div>

        <label className="mt-4 block">
          <span className="mb-1 flex justify-between text-xs font-bold uppercase tracking-wide text-ink/60">
            <span>Commanded angle</span><span className="font-mono-lab text-pcb">{target}°</span>
          </span>
          <input type="range" min="0" max="180" step="1" value={target}
            onChange={(e) => setTarget(Number(e.target.value))}
            className="h-2 w-full cursor-grab accent-pcb active:cursor-grabbing" />
        </label>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {PRESETS.map((p) => (
            <button key={p} onClick={() => setTarget(p)}
              className={`rounded-lg border-2 border-ink px-3 py-1.5 text-sm font-bold ${target === p ? 'bg-signal text-ink' : 'bg-white text-ink/70'}`}>
              {p}°
            </button>
          ))}
        </div>
        <p className="mt-3 text-center text-sm font-semibold text-ink/60">
          Notice the tiny overshoot before it settles — that's the servo's own feedback loop correcting itself, not a bug.
        </p>
      </div>
    </WidgetShell>
  );
}
