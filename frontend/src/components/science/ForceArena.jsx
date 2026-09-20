import { useEffect, useRef, useState } from 'react';
import WidgetShell from '../robotics/shared/WidgetShell';
import useReducedMotion from '../robotics/shared/useReducedMotion';
import PredictGate from './shared/PredictGate';

/**
 * `force-arena` engine (E2). This file ships the `pressure` mode: a brick
 * pressing into sand. Pressure is really F / A; the dent depth is a stylised
 * log scale of it, so the widget carries a "not to scale" tag.
 * More modes (friction-types, effects, charges) = add a branch in ForceArena.
 */

const W = 420;
const H = 250;
const SAND_TOP = 150;
const CX = 210;
const MAX_DENT = 70;
const GRAINS = Array.from({ length: 70 }, (_, i) => ({
  x: (i * 97) % W,
  y: SAND_TOP + 8 + ((i * 53) % 84),
  r: 1 + (i % 3) * 0.6,
}));

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const pressurePa = (forceN, areaCm2) => forceN / (areaCm2 / 10000);
const dentFraction = (pa) => clamp(Math.log10(pa / 300) / 3.6, 0, 1);
const areaFromSlider = (v) => Number((0.01 * 10 ** ((v / 100) * 5)).toPrecision(3));
const sliderFromArea = (a) => Math.round((Math.log10(a / 0.01) / 5) * 100);

function fmtPressure(pa) {
  if (pa >= 1e6) return `${(pa / 1e6).toFixed(1)} MPa`;
  if (pa >= 1e4) return `${Math.round(pa / 1000)} kPa`;
  if (pa >= 1e3) return `${(pa / 1000).toFixed(1)} kPa`;
  return `${Math.round(pa)} Pa`;
}

function fmtArea(a) {
  if (a >= 100) return a.toFixed(0);
  if (a >= 1) return a.toFixed(1);
  return a.toFixed(2);
}

/** Eases a number toward `target`. Restarts from 0 when `runKey` changes. */
function useTween(target, ms, runKey) {
  const [value, setValue] = useState(0);
  const current = useRef(0);
  const lastRun = useRef(runKey);

  useEffect(() => {
    if (lastRun.current !== runKey) {
      current.current = 0;
      lastRun.current = runKey;
    }
    const from = current.current;
    const start = performance.now();
    let raf = 0;
    const tick = (now) => {
      const t = ms <= 0 ? 1 : clamp((now - start) / ms, 0, 1);
      const next = from + (target - from) * (1 - (1 - t) ** 3);
      current.current = next;
      setValue(next);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms, runKey]);

  return value;
}

function PressureLab({ title, hint, object, faces, presets }) {
  const reduced = useReducedMotion();
  const [force, setForce] = useState(object.weightN);
  const [area, setArea] = useState(faces[0]?.areaCm2 ?? 300);
  const [slow, setSlow] = useState(false);
  const [run, setRun] = useState(0);

  const pa = pressurePa(force, area);
  const depth = useTween(dentFraction(pa) * MAX_DENT, reduced ? 0 : slow ? 2400 : 600, run);

  const bw = clamp(Math.sqrt(area) * 6, 4, 240);
  const bh = clamp(3600 / bw, 22, 100);
  const half = bw / 2;
  const bottom = SAND_TOP + depth;
  const top = bottom - bh;
  const arrow = Math.max(8, Math.min(clamp(10 + force * 0.35, 14, 90), top - 22));
  const sand = `M0 ${SAND_TOP} L${CX - half - 14} ${SAND_TOP} L${CX - half} ${bottom} L${CX + half} ${bottom} L${CX + half + 14} ${SAND_TOP} L${W} ${SAND_TOP} L${W} ${H} L0 ${H} Z`;

  const controls = (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setRun((r) => r + 1)}
        className="rounded-lg border-2 border-ink bg-white px-3 py-1 font-lab text-xs font-extrabold text-ink"
      >
        ▶ Press again
      </button>
      <button
        type="button"
        aria-pressed={slow}
        onClick={() => setSlow((s) => !s)}
        className={
          slow
            ? 'rounded-lg border-2 border-ink bg-ink px-3 py-1 font-lab text-xs font-extrabold text-white'
            : 'rounded-lg border-2 border-ink bg-white px-3 py-1 font-lab text-xs font-extrabold text-ink'
        }
      >
        0.25× slow
      </button>
    </div>
  );

  const side = (
    <div className="space-y-4 p-4">
      <div className="rounded-xl border-2 border-ink bg-[#0B180F] p-3 text-center">
        <p className="font-mono-lab text-[11px] uppercase tracking-[0.18em] text-white/50">Pressure</p>
        <p className="font-lab text-3xl font-extrabold text-signal">{fmtPressure(pa)}</p>
        <p className="mt-1 font-mono-lab text-xs text-white/60">
          {force} N ÷ {fmtArea(area)} cm²
        </p>
        <p className="font-mono-lab text-[10px] text-white/40">1 cm² = 0.0001 m²</p>
      </div>

      {faces.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-ink/60">{object.name} face</p>
          <div className="flex flex-wrap gap-2">
            {faces.map((f) => {
              const on = force === object.weightN && area === f.areaCm2;
              return (
                <button
                  key={f.label}
                  type="button"
                  onClick={() => {
                    setForce(object.weightN);
                    setArea(f.areaCm2);
                  }}
                  className={
                    on
                      ? 'rounded-lg border-2 border-ink bg-signal px-3 py-1.5 font-lab text-sm font-extrabold text-ink'
                      : 'rounded-lg border-2 border-ink/30 bg-white px-3 py-1.5 font-lab text-sm font-bold text-ink/70'
                  }
                >
                  {f.label} · {f.areaCm2} cm²
                </button>
              );
            })}
          </div>
        </div>
      )}

      <label className="block">
        <span className="mb-1 flex justify-between text-xs font-bold uppercase tracking-wide text-ink/60">
          <span>Force</span>
          <span className="font-mono-lab text-pcb">{force} N</span>
        </span>
        <input
          type="range" min="1" max="500" step="1" value={force}
          onChange={(e) => setForce(Number(e.target.value))}
          className="h-2 w-full cursor-grab accent-pcb active:cursor-grabbing"
        />
      </label>

      <label className="block">
        <span className="mb-1 flex justify-between text-xs font-bold uppercase tracking-wide text-ink/60">
          <span>Contact area</span>
          <span className="font-mono-lab text-pcb">{fmtArea(area)} cm²</span>
        </span>
        <input
          type="range" min="0" max="100" step="1" value={sliderFromArea(area)}
          onChange={(e) => setArea(areaFromSlider(Number(e.target.value)))}
          className="h-2 w-full cursor-grab accent-pcb active:cursor-grabbing"
        />
      </label>

      {presets.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-ink/60">Try one</p>
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setForce(p.forceN);
                  setArea(p.areaCm2);
                }}
                className="rounded-full border-2 border-ink/30 bg-white px-3 py-1 text-xs font-bold text-ink/70 hover:border-ink hover:text-ink"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <WidgetShell title={title} hint={hint} controls={controls} side={side}>
      <div className="relative bg-[#0B180F] p-3">
        <span className="absolute right-4 top-4 rounded bg-white/10 px-2 py-0.5 font-mono-lab text-[10px] text-white/50">
          dent not to scale
        </span>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="A block pressing into sand">
          <path d={sand} fill="#C9A66B" />
          {GRAINS.map((g, i) => (
            <circle key={i} cx={g.x} cy={g.y} r={g.r} fill="#A98652" opacity="0.6" />
          ))}
          <rect x={CX - half} y={top} width={bw} height={bh} rx="2" fill="#B5472F" stroke="#16241D" strokeWidth="2" />
          <rect x={CX - half} y={bottom - 3} width={bw} height="3" fill="#FFC93C" />
          <line x1={CX} y1={top - 4 - arrow} x2={CX} y2={top - 12} stroke="#E8503A" strokeWidth="3" strokeLinecap="round" />
          <polygon points={`${CX - 7},${top - 12} ${CX + 7},${top - 12} ${CX},${top - 3}`} fill="#E8503A" />
          <text x={CX + 14} y={top - 4 - arrow / 2} fontSize="11" fill="#ffffffcc" fontFamily="monospace">
            F = {force} N
          </text>
          <text x={CX} y={H - 8} textAnchor="middle" fontSize="10" fill="#ffffff80" fontFamily="monospace">
            yellow strip = contact area, {fmtArea(area)} cm²
          </text>
        </svg>
      </div>
    </WidgetShell>
  );
}

export default function ForceArena({ block }) {
  const {
    mode = 'pressure',
    title = 'Force arena',
    hint,
    object = { name: 'Brick', weightN: 30 },
    faces = [],
    presets = [],
    predict,
  } = block || {};

  if (mode !== 'pressure') {
    return (
      <WidgetShell title={title}>
        <p className="p-6 text-center font-semibold text-ink/60">This force-arena mode is not built yet.</p>
      </WidgetShell>
    );
  }

  return (
    <PredictGate predict={predict}>
      <PressureLab title={title} hint={hint} object={object} faces={faces} presets={presets} />
    </PredictGate>
  );
}
