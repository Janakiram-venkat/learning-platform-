import { Fragment, useEffect, useRef, useState } from 'react';
import WidgetShell from '../robotics/shared/WidgetShell';
import useReducedMotion from '../robotics/shared/useReducedMotion';
import PredictGate from './shared/PredictGate';

/**
 * `force-arena` engine (E2). This file ships the `pressure` mode: a block
 * pressing into sand.
 *
 * Pressure is really F / A, but a bare number in pascals means nothing to a
 * student, so the lab wraps it in three supports:
 *   - the formula strip restates P = F ÷ A with this run's numbers in it,
 *   - the landmark scale places the answer against things they have touched
 *     (a snowshoe, a car tyre, a drawing pin), which is the only way "4 MPa"
 *     becomes intuitive,
 *   - pinning a setup keeps it on screen so the next one can be compared
 *     against it, which is what actually teaches "half the area, double the
 *     pressure".
 *
 * The dent depth is a stylised log scale of pressure, hence the "not to
 * scale" tag on the scene.
 * More modes (friction-types, effects, charges) = add a branch in ForceArena.
 */

const W = 480;
const H = 280;
const SAND_TOP = 165;
const CX = 240;
const MAX_DENT = 80;
const GRAINS = Array.from({ length: 84 }, (_, i) => ({
  x: (i * 97) % W,
  y: SAND_TOP + 8 + ((i * 53) % 96),
  r: 1 + (i % 3) * 0.6,
}));

// The landmark scale spans 100 Pa to 1 GPa: seven decades, which covers
// everything from a snowshoe to a drawing pin without wasting rail.
const SCALE_LO_LOG = 2;
const SCALE_HI_LOG = 9;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const pressurePa = (forceN, areaCm2) => forceN / (areaCm2 / 10000);
const dentFraction = (pa) => clamp(Math.log10(pa / 300) / 3.6, 0, 1);
const areaFromSlider = (v) => Number((0.01 * 10 ** ((v / 100) * 5)).toPrecision(3));
const sliderFromArea = (a) => Math.round((Math.log10(a / 0.01) / 5) * 100);
const scalePos = (pa) =>
  clamp((Math.log10(Math.max(pa, 1)) - SCALE_LO_LOG) / (SCALE_HI_LOG - SCALE_LO_LOG), 0, 1);

function fmtPressure(pa) {
  if (pa >= 1e9) return `${(pa / 1e9).toFixed(1)} GPa`;
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

/** Area in m², the unit the pascal is actually defined with. */
function fmtAreaM2(cm2) {
  const m2 = cm2 / 10000;
  if (m2 >= 0.01) return m2.toFixed(3);
  if (m2 >= 0.0001) return m2.toFixed(5);
  return m2.toExponential(1);
}

/** How many times bigger a is than b, phrased for a 13-year-old. */
function fmtRatio(a, b) {
  if (!b) return null;
  const r = a / b;
  if (r >= 1) return `${r >= 100 ? Math.round(r) : r.toFixed(1)}× more`;
  const inv = b / a;
  return `${inv >= 100 ? Math.round(inv) : inv.toFixed(1)}× less`;
}

/** The landmark nearest this pressure on the log scale. */
function nearestLandmark(pa, scale) {
  if (!scale?.length) return null;
  let best = scale[0];
  let bestGap = Infinity;
  for (const s of scale) {
    const gap = Math.abs(Math.log10(s.pa) - Math.log10(Math.max(pa, 1)));
    if (gap < bestGap) {
      bestGap = gap;
      best = s;
    }
  }
  // Past about half a decade (roughly 3x) the nearest landmark stops being a
  // fair comparison, so the card hides rather than overclaim.
  return bestGap <= 0.5 ? best : null;
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

/* The landmark scale. A log bar from 100 Pa to 1 GPa with everyday objects
   ticked along it, the live value as a filled needle, and the pinned value
   as a hollow one. This is what turns "4 MPa" into "harder than an elephant". */
function PressureScale({ pa, pinnedPa, scale }) {
  if (!scale?.length) return null;
  const pos = scalePos(pa);
  const pinPos = pinnedPa ? scalePos(pinnedPa) : null;

  return (
    <div className="border-t-2 border-ink/10 bg-white px-4 py-4">
      <div className="mb-2 flex items-baseline justify-between">
        <p className="ref-tag text-ink/50">Where that sits in real life</p>
        <p className="font-mono-lab text-[10px] text-ink/35">log scale · 100 Pa → 1 GPa</p>
      </div>

      {/* The live value rides above the bar so it never collides with the
          landmark labels stacked below it. */}
      <div className="relative mb-1.5 h-5">
        <span
          className="absolute -translate-x-1/2 whitespace-nowrap rounded border-2 border-ink bg-ink px-1.5 py-0.5 font-mono-lab text-[10px] font-bold text-signal transition-[left] duration-300"
          style={{ left: `${pos * 100}%` }}
        >
          {fmtPressure(pa)}
        </span>
      </div>

      <div className="relative h-3 rounded-full border-2 border-ink bg-gradient-to-r from-[#0097F8] via-[#FFB40A] to-[#E63C22]">
        {/* Landmark ticks */}
        {scale.map((s) => (
          <span
            key={s.label}
            className="absolute top-1/2 h-4 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-ink/50"
            style={{ left: `${scalePos(s.pa) * 100}%` }}
          />
        ))}

        {/* Pinned value, hollow */}
        {pinPos !== null && (
          <span
            className="absolute -top-2 h-7 w-1 -translate-x-1/2 rounded-full border-2 border-ink bg-white"
            style={{ left: `${pinPos * 100}%` }}
            title={`Pinned · ${fmtPressure(pinnedPa)}`}
          />
        )}

        {/* Live value, filled */}
        <span
          className="absolute -top-2.5 h-8 w-1.5 -translate-x-1/2 rounded-full border-2 border-ink bg-ink transition-[left] duration-300"
          style={{ left: `${pos * 100}%` }}
        />
      </div>

      {/* Landmark labels, staggered across three rows with a leader line back
          up to the bar. Six labels on one row collide badly — the elephant
          and the car tyre sit three percent apart — and two rows still
          collide once the widget stacks on a phone. Three rows means each
          row carries only two labels, which stays legible down to roughly a
          290px container. */}
      <div className="relative mt-1 h-16">
        {scale.map((s, i) => {
          const left = scalePos(s.pa) * 100;
          const topRem = (i % 3) * 1.3;
          return (
            <Fragment key={s.label}>
              <span
                aria-hidden
                className="absolute w-px bg-ink/20"
                style={{ left: `${left}%`, top: 0, height: `${topRem + 0.2}rem` }}
              />
              <span
                className="absolute -translate-x-1/2 whitespace-nowrap font-mono-lab text-[9px] leading-tight text-ink/55"
                style={{ left: `${left}%`, top: `${topRem + 0.25}rem` }}
              >
                {s.label}
              </span>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

function PressureLab({ title, hint, object, faces, presets, scale }) {
  const reduced = useReducedMotion();
  const [force, setForce] = useState(object.weightN);
  const [area, setArea] = useState(faces[0]?.areaCm2 ?? 300);
  const [slow, setSlow] = useState(false);
  const [run, setRun] = useState(0);
  // A frozen copy of an earlier setup, so two runs can be compared directly.
  const [pinned, setPinned] = useState(null);

  const pa = pressurePa(force, area);
  const depth = useTween(dentFraction(pa) * MAX_DENT, reduced ? 0 : slow ? 2400 : 600, run);
  const near = nearestLandmark(pa, scale);
  const ratio = pinned ? fmtRatio(pa, pinned.pa) : null;

  const bw = clamp(Math.sqrt(area) * 6, 4, 240);
  const bh = clamp(3600 / bw, 22, 100);
  const half = bw / 2;
  const bottom = SAND_TOP + depth;
  const top = bottom - bh;
  const arrow = Math.max(8, Math.min(clamp(10 + force * 0.35, 14, 90), top - 22));
  const sand = `M0 ${SAND_TOP} L${CX - half - 14} ${SAND_TOP} L${CX - half} ${bottom} L${CX + half} ${bottom} L${CX + half + 14} ${SAND_TOP} L${W} ${SAND_TOP} L${W} ${H} L0 ${H} Z`;
  // Where the pinned run's dent bottomed out, drawn as a ghost line.
  const pinnedDepth = pinned ? dentFraction(pinned.pa) * MAX_DENT : null;

  const controls = (
    <div className="flex flex-wrap items-center gap-2">
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
      <button
        type="button"
        onClick={() => setPinned(pinned ? null : { force, area, pa })}
        className={
          pinned
            ? 'rounded-lg border-2 border-ink bg-ink px-3 py-1 font-lab text-xs font-extrabold text-white'
            : 'rounded-lg border-2 border-ink bg-white px-3 py-1 font-lab text-xs font-extrabold text-ink'
        }
      >
        {pinned ? '✕ Clear pin' : '📌 Pin this'}
      </button>
    </div>
  );

  const side = (
    <div className="space-y-4 p-4">
      {/* --- The formula, with this run's numbers in it --- */}
      <div className="rounded-xl border-2 border-ink bg-well p-3 text-center">
        <p className="font-mono-lab text-[11px] uppercase tracking-[0.18em] text-white/50">Pressure</p>
        <p className="font-lab text-3xl font-extrabold text-signal">{fmtPressure(pa)}</p>
        <div className="mt-2 border-t border-white/10 pt-2">
          <p className="font-mono-lab text-xs text-white/70">
            P = {force} N ÷ {fmtAreaM2(area)} m²
          </p>
          <p className="mt-0.5 font-mono-lab text-[10px] text-white/40">
            {fmtArea(area)} cm² ÷ 10,000 = {fmtAreaM2(area)} m²
          </p>
        </div>
      </div>

      {/* --- Nearest everyday landmark --- */}
      {near && (
        <div className="rounded-xl border-2 border-ink/20 bg-paper px-3 py-2 text-center">
          <p className="ref-tag text-ink/45">Closest everyday thing</p>
          <p className="font-lab text-sm font-extrabold text-ink">{near.label}</p>
        </div>
      )}

      {/* --- Comparison against the pinned run --- */}
      {pinned && (
        <div className="rounded-xl border-2 border-ink bg-signal/20 px-3 py-2.5">
          <p className="ref-tag mb-1 text-ink/55">Vs your pin</p>
          <p className="font-lab text-lg font-extrabold text-ink">{ratio}</p>
          <p className="mt-1 font-mono-lab text-[10px] leading-relaxed text-ink/55">
            pinned: {pinned.force} N on {fmtArea(pinned.area)} cm² = {fmtPressure(pinned.pa)}
          </p>
          {pinned.force === force && pinned.area !== area && (
            <p className="mt-1.5 text-[11px] font-bold leading-relaxed text-ink/70">
              Same force, different area. All of the change is the area.
            </p>
          )}
        </div>
      )}

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
      <div className="relative bg-well p-3">
        <span className="absolute right-4 top-4 rounded bg-white/10 px-2 py-0.5 font-mono-lab text-[10px] text-white/50">
          dent not to scale
        </span>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`A block of ${fmtArea(area)} square centimetres pressing into sand with ${force} newtons, giving ${fmtPressure(pa)}`}>
          <path d={sand} fill="#C9A66B" />
          {GRAINS.map((g, i) => (
            <circle key={i} cx={g.x} cy={g.y} r={g.r} fill="#A98652" opacity="0.6" />
          ))}

          {/* Ghost of the pinned run's depth, so the two are comparable at a glance */}
          {pinnedDepth !== null && (
            <>
              <line
                x1="12" y1={SAND_TOP + pinnedDepth} x2={W - 12} y2={SAND_TOP + pinnedDepth}
                stroke="#ffffff" strokeWidth="1.5" strokeDasharray="6 5" opacity="0.5"
              />
              <text x="16" y={SAND_TOP + pinnedDepth - 5} fontSize="10" fill="#ffffff99" fontFamily="monospace">
                pinned depth
              </text>
            </>
          )}

          <rect x={CX - half} y={top} width={bw} height={bh} rx="2" fill="#B5472F" stroke="#1B1B1B" strokeWidth="2" />
          <rect x={CX - half} y={bottom - 3} width={bw} height="3" fill="#FFB40A" />
          <line x1={CX} y1={top - 4 - arrow} x2={CX} y2={top - 12} stroke="#E63C22" strokeWidth="3" strokeLinecap="round" />
          <polygon points={`${CX - 7},${top - 12} ${CX + 7},${top - 12} ${CX},${top - 3}`} fill="#E63C22" />
          <text x={CX + 14} y={top - 4 - arrow / 2} fontSize="11" fill="#ffffffcc" fontFamily="monospace">
            F = {force} N
          </text>
          <text x={CX} y={H - 8} textAnchor="middle" fontSize="10" fill="#ffffff80" fontFamily="monospace">
            yellow strip = contact area, {fmtArea(area)} cm²
          </text>
        </svg>
      </div>

      <PressureScale pa={pa} pinnedPa={pinned?.pa ?? null} scale={scale} />
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
    scale = [],
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
      <PressureLab
        title={title}
        hint={hint}
        object={object}
        faces={faces}
        presets={presets}
        scale={scale}
      />
    </PredictGate>
  );
}
