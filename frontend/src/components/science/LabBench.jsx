import { useEffect, useMemo, useState } from 'react';
import WidgetShell from '../robotics/shared/WidgetShell';
import useReducedMotion from '../robotics/shared/useReducedMotion';
import PredictGate from './shared/PredictGate';
import { matchRule } from '../../lib/matchRule.js';

/**
 * `lab-bench` engine (E6), minimal version.
 *
 * One beaker, a shelf of solids and solutions. Tap a solid and a solution and
 * the pair is handed to `matchRule`, which says what happens; this component
 * only draws it. Nothing about any reaction lives in here: change the rule
 * table (data/chemistryRules.js) and the bench changes with it.
 *
 * What it draws so far:
 *   - `solution-colour`  the liquid fades from one colour to another
 *   - `coat-solid`       the dipped solid grows a coating
 *   - `bubbles`          gas rising through the liquid (rate and size from the rule)
 *   - `flame`            a small flame, used for sodium on water
 *   - `gas-test` (pop)   a "pop!" at the mouth when a burning matchstick is held there
 *   - `litmus`           a dipped paper strip turns red or blue (or stays put)
 *   - `smoke`, `glow`    smoke curling up and a halo, for things that burn
 *   - `no-change`        an explicit "nothing happens" message
 * A rule can also carry `residue: '#hex'`: the burnt solid shrinks and a heap
 * of ash in that colour builds up. Every other effect in the vocabulary
 * (precipitate, heat-shimmer ...) is skipped for now, but the written
 * observation and word equation still appear, so a lesson is never silent.
 * Add an effect = add a branch in `BenchScene`.
 *
 * Block config (see 'chem-displacement' and 'chem-water-acid-reactions' in
 * data/chemistry.js):
 *   items  [{ id, label, emoji, kind: 'solid' | 'liquid' | 'tool', colour, float, paper, condition }]
 *            `colour` is the liquid's colour, or the solid's colour.
 *            `float: true` draws a solid as a blob on the surface (sodium).
 *            `paper: true` draws a solid as a short thin strip (litmus paper).
 *            A `tool` is added to the rule contents (the burning matchstick),
 *            unless it has a `condition` (the burner: condition 'heated'),
 *            in which case it sets that condition instead. Tools stack: the
 *            student can hold a matchstick AND run the burner.
 *            A solid alone can run a rule that needs a condition (magnesium
 *            plus the burner). Without one, a lone solid just waits.
 *   grid   optional { rows: [solid ids], cols: [liquid ids] } for the results
 *          table in the notebook
 *   predict optional, shown first by PredictGate like every science widget
 */

const W = 240;
const H = 290;
const CX = 120;
const LIQUID_TOP = 120;
const RUN_MS = 6000;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.replace(/./g, '$&$&') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Blend two #rrggbb colours; t = 0 gives `a`, t = 1 gives `b`. */
function mixHex(a, b, t) {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  const mix = (x, y) => Math.round(x + (y - x) * t);
  return `rgb(${mix(r1, r2)}, ${mix(g1, g2)}, ${mix(b1, b2)})`;
}

/** Points of an n-spike starburst, for the "pop!" burst. */
function starPoints(cx, cy, outer, inner, spikes = 8) {
  const pts = [];
  for (let i = 0; i < spikes * 2; i += 1) {
    const r = i % 2 ? inner : outer;
    const a = (Math.PI * i) / spikes - Math.PI / 2;
    pts.push(`${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)}`);
  }
  return pts.join(' ');
}

/** A teardrop flame with its base at (0, 0), `h` tall. */
const flamePath = (h) => `M0 0 C-9 -${h * 0.35} -6 -${h * 0.7} 0 -${h} C6 -${h * 0.7} 9 -${h * 0.35} 0 0 Z`;

const BUBBLE_COUNT = { slow: 5, steady: 9, fast: 16 };
const BUBBLE_RADIUS = { small: 3, medium: 4.5, large: 6 };

/** 0 to 1 over `ms`, restarting whenever `runKey` changes. null = idle at 0. */
function useProgress(runKey, ms) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!runKey) {
      setT(0);
      return undefined;
    }
    if (ms <= 0) {
      setT(1);
      return undefined;
    }
    setT(0);
    const start = performance.now();
    let raf = 0;
    const tick = (now) => {
      const v = clamp((now - start) / ms, 0, 1);
      setT(v);
      if (v < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [runKey, ms]);
  return t;
}

const findFx = (result, name) => result?.effects.find((e) => e.fx === name) || null;
// A litmus strip that stays the same colour is a result, but not a reaction.
const didReact = (result) =>
  Boolean(result) &&
  result.effects.some((e) => e.fx !== 'no-change' && !(e.fx === 'litmus' && e.result === 'no-change'));

const LITMUS_TO = { 'to-blue': '#3f6fd9', 'to-red': '#d9503f' };
const drawKind = (tool) => tool.draw ?? (tool.id === 'burning-matchstick' ? 'matchstick' : null);

function Bubbles({ rate, size, animate, opacity }) {
  const count = BUBBLE_COUNT[rate] ?? 8;
  const base = BUBBLE_RADIUS[size] ?? 3.5;
  const startY = 236;
  const endY = LIQUID_TOP + 6;
  return (
    <g opacity={opacity}>
      {Array.from({ length: count }, (_, i) => {
        const x = 74 + ((i * 53) % 92);
        const dur = 1.6 + ((i * 7) % 5) * 0.25;
        const r = base * (0.7 + (i % 3) * 0.2);
        return (
          <circle key={i} cx={x} cy={animate ? startY : startY - ((i * 29) % 100)} r={r} fill="none" stroke="#ffffffcc" strokeWidth="1.5">
            {animate && (
              <animate
                attributeName="cy" from={startY} to={endY} dur={`${dur}s`}
                begin={`-${((i * 0.41) % dur).toFixed(2)}s`} repeatCount="indefinite"
              />
            )}
          </circle>
        );
      })}
    </g>
  );
}

function Smoke({ colour, animate, opacity, y }) {
  return (
    <g opacity={opacity}>
      {[0, 1, 2].map((i) => {
        const x = CX - 14 + i * 14;
        const startY = y - i * 6;
        const dur = 3 + i * 0.6;
        return (
          <circle key={i} cx={x} cy={animate ? startY : startY - 30 - i * 14} r={9 + i * 3} fill={colour} opacity="0.35">
            {animate && (
              <>
                <animate attributeName="cy" from={startY} to={startY - 70} dur={`${dur}s`} begin={`-${i * 0.9}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.35;0.35;0" dur={`${dur}s`} begin={`-${i * 0.9}s`} repeatCount="indefinite" />
              </>
            )}
          </circle>
        );
      })}
    </g>
  );
}

function BenchScene({ solid, liquid, tools, result, t, animate }) {
  const colourFx = findFx(result, 'solution-colour');
  const coatFx = findFx(result, 'coat-solid');
  const bubblesFx = findFx(result, 'bubbles');
  const flameFx = findFx(result, 'flame');
  const popFx = findFx(result, 'gas-test');
  const litmusFx = findFx(result, 'litmus');
  const smokeFx = findFx(result, 'smoke');
  const glowFx = findFx(result, 'glow');
  const coating = coatFx && solid && coatFx.target === solid.id ? coatFx : null;
  const match = tools.some((x) => drawKind(x) === 'matchstick');
  const heated = tools.some((x) => x.condition === 'heated');
  const litmusTarget = litmusFx ? LITMUS_TO[litmusFx.result] : null;

  const liquidFill = !liquid
    ? null
    : colourFx
      ? mixHex(colourFx.from, colourFx.to, t)
      : liquid.colour;

  const paper = Boolean(solid?.paper);
  const stripW = paper ? 14 : 18;
  const stripTop = paper ? 80 : 30;
  const stripBottom = 205;
  const blobY = liquid ? LIQUID_TOP - 6 : 233;
  const flameH = flameFx ? (flameFx.height === 'tall' ? 44 : 24) : 0;

  // Burning a solid with no liquid: the strip shortens as it burns and the
  // flame rides its burning end.
  const burning = Boolean(solid) && !liquid && !solid.float && Boolean(flameFx);
  const burnTop = 100;
  const burnBottom = burning ? Math.max(burnTop + 12, 215 - 95 * t) : stripBottom;
  const solidTop = burning ? burnTop : stripTop;
  const solidBottom = burning ? burnBottom : stripBottom;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="mx-auto w-full max-w-[320px]"
      role="img"
      aria-label={
        liquid || solid
          ? `A beaker holding ${liquid ? liquid.label.toLowerCase() : 'nothing yet'}${solid ? ` with ${solid.label.toLowerCase()} added` : ''}${tools.length ? `, with ${tools.map((x) => x.label.toLowerCase()).join(' and ')} in use` : ''}`
          : 'An empty beaker'
      }
    >
      <defs>
        <radialGradient id="lb-glow">
          <stop offset="0%" stopColor={glowFx?.colour || '#ffffff'} stopOpacity="0.9" />
          <stop offset="100%" stopColor={glowFx?.colour || '#ffffff'} stopOpacity="0" />
        </radialGradient>
      </defs>

      {burning && glowFx && (
        <circle cx={CX} cy={burnBottom - 20} r="80" fill="url(#lb-glow)" opacity={Math.min(1, t * 3)} />
      )}

      {liquidFill && (
        <path
          d={`M62 ${LIQUID_TOP} H178 V232 Q178 244 166 244 H74 Q62 244 62 232 Z`}
          fill={liquidFill}
          opacity="0.9"
        />
      )}

      {liquid && bubblesFx && (
        <Bubbles rate={bubblesFx.rate} size={bubblesFx.size} animate={animate} opacity={Math.min(1, t * 5)} />
      )}

      {burning && result?.residue && (
        <path d={`M${CX - 26} 240 Q${CX} ${240 - 24 * t} ${CX + 26} 240 Z`} fill={result.residue} />
      )}

      {solid && !solid.float && (
        <g>
          <rect x={CX - stripW / 2} y={solidTop} width={stripW} height={solidBottom - solidTop} rx="2" fill={solid.colour} stroke="#1B1B1B" strokeWidth="1.5" />
          {coating && liquid && (
            <rect
              x={CX - stripW / 2 - 3 * t}
              y={LIQUID_TOP}
              width={stripW + 6 * t}
              height={stripBottom - LIQUID_TOP}
              rx="3"
              fill={coating.colour}
              opacity={0.95 * t}
            />
          )}
          {litmusTarget && liquid && (
            <rect
              x={CX - stripW / 2}
              y={LIQUID_TOP}
              width={stripW}
              height={stripBottom - LIQUID_TOP}
              rx="2"
              fill={mixHex(solid.colour, litmusTarget, t)}
            />
          )}
        </g>
      )}

      {/* A floating solid (sodium) skates about on the surface while it reacts. */}
      {solid && solid.float && (
        <g>
          <circle cx={CX} cy={blobY} r="9" fill={solid.colour} stroke="#1B1B1B" strokeWidth="1.5" />
          {flameFx && result && (
            <path d={flamePath(flameH)} transform={`translate(${CX} ${blobY - 8})`} fill={flameFx.colour} opacity="0.9" />
          )}
          {animate && bubblesFx && (
            <animateTransform attributeName="transform" type="translate" values="-30 0; 30 0; -30 0" dur="3s" repeatCount="indefinite" />
          )}
        </g>
      )}

      {/* The flame of a burning solid, riding its burning end. */}
      {burning && (
        <path d={flamePath(flameH)} transform={`translate(${CX} ${burnBottom})`} fill={flameFx.colour} opacity="0.95" />
      )}
      {burning && smokeFx && (
        <Smoke colour={smokeFx.colour} animate={animate} opacity={Math.min(1, t * 3)} y={burnBottom - 20} />
      )}

      {/* The burner under the beaker. */}
      {heated && (
        <g>
          <rect x={CX - 18} y="276" width="36" height="9" rx="2" fill="#555" />
          <rect x={CX - 5} y="256" width="10" height="20" fill="#777" />
          <path d={flamePath(16)} transform={`translate(${CX} 256)`} fill="#4aa3ff" />
        </g>
      )}

      {/* The burning matchstick held at the mouth of the beaker. */}
      {match && (
        <g>
          <line x1={CX + 60} y1="4" x2={CX + 36} y2="30" stroke="#c8a165" strokeWidth="3" strokeLinecap="round" />
          <circle cx={CX + 35} cy="31" r="3.5" fill="#b5472f" />
          <path d={flamePath(14)} transform={`translate(${CX + 35} 26)`} fill="#FFB40A" />
        </g>
      )}
      {popFx && popFx.test === 'pop' && t > 0.2 && (
        <g>
          <polygon points={starPoints(CX + 35, 22, 24, 11)} fill="#FFB40A" stroke="#1B1B1B" strokeWidth="1.5" />
          <text x={CX + 35} y="26" textAnchor="middle" fontSize="11" fontWeight="800" fill="#1B1B1B" fontFamily="monospace">pop!</text>
        </g>
      )}

      {/* Glass drawn last so its edge sits over the liquid and the strip. */}
      <path d="M60 40 V232 Q60 246 74 246 H166 Q180 246 180 232 V40" fill="none" stroke="#ffffffcc" strokeWidth="3" strokeLinecap="round" />
      <line x1="52" y1="40" x2="68" y2="40" stroke="#ffffffcc" strokeWidth="3" strokeLinecap="round" />
      <line x1="172" y1="40" x2="188" y2="40" stroke="#ffffffcc" strokeWidth="3" strokeLinecap="round" />

      {!liquid && !solid && (
        <text x={CX} y="150" textAnchor="middle" fontSize="11" fill="#ffffff80" fontFamily="monospace">
          empty beaker
        </text>
      )}
    </svg>
  );
}

function BenchLab({ title, hint, items, grid }) {
  const reduced = useReducedMotion();
  const [solidId, setSolidId] = useState(null);
  const [liquidId, setLiquidId] = useState(null);
  const [toolIds, setToolIds] = useState([]);
  const [replay, setReplay] = useState(0);
  // Every run so far, for the notebook. Pairs are keyed "solid|liquid" so the
  // results grid can find them; runs with a condition get the condition added.
  const [log, setLog] = useState({});

  const solids = items.filter((i) => i.kind === 'solid');
  const liquids = items.filter((i) => i.kind === 'liquid');
  const tools = items.filter((i) => i.kind === 'tool');
  const solid = solids.find((i) => i.id === solidId) || null;
  const liquid = liquids.find((i) => i.id === liquidId) || null;
  const activeTools = tools.filter((i) => toolIds.includes(i.id));
  const conditionTools = activeTools.filter((i) => i.condition);
  const condKey = conditionTools.map((i) => i.condition).sort().join('+');

  const result = useMemo(() => {
    if (!solid && !liquid) return null;
    const contents = [
      ...(solid ? [solid.id] : []),
      ...(liquid ? [liquid.id] : []),
      ...activeTools.filter((i) => !i.condition).map((i) => i.id),
    ];
    const conditions = Object.fromEntries(conditionTools.map((i) => [i.condition, true]));
    const r = matchRule(contents, conditions);
    // A solid and a solution is always an experiment. Anything less only
    // counts when a rule really covers it (magnesium on the burner).
    return (solid && liquid) || r.matched ? r : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solid, liquid, toolIds]);
  const runKey = result ? `${solid?.id ?? ''}|${liquid?.id ?? ''}|${toolIds.join('+')}|${replay}` : null;
  const t = useProgress(runKey, reduced ? 0 : RUN_MS);

  const reacted = didReact(result);
  const finished = Boolean(result) && (t >= 1 || !reacted);

  useEffect(() => {
    if (!result) return;
    const base = solid && liquid ? `${solid.id}|${liquid.id}` : `${solid?.id ?? ''}|`;
    const how = conditionTools.map((i) => i.label.toLowerCase()).join(' + ');
    const title = `${solid ? solid.label : ''}${liquid ? ` in ${liquid.label}` : ''}${how ? ` (${how})` : ''}`;
    setLog((prev) => ({
      ...prev,
      [condKey ? `${base}|${condKey}` : base]: {
        title,
        reacted: didReact(result),
        observation: result.observation,
        wordEquation: result.wordEquation,
      },
    }));
    // Log once per run, not on every animation frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runKey]);

  const toggle = (setter, current, id) => setter(current === id ? null : id);
  const toggleTool = (id) =>
    setToolIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  const empty = () => {
    setSolidId(null);
    setLiquidId(null);
    setToolIds([]);
  };

  const controls = (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={empty}
        className="rounded-lg border-2 border-ink bg-white px-3 py-1 font-lab text-xs font-extrabold text-ink"
      >
        ↺ Empty the beaker
      </button>
      <button
        type="button"
        disabled={!result}
        onClick={() => setReplay((r) => r + 1)}
        className="rounded-lg border-2 border-ink bg-white px-3 py-1 font-lab text-xs font-extrabold text-ink disabled:opacity-40"
      >
        ▶ Run again
      </button>
    </div>
  );

  const shelf = (label, list, isOn, onPick) => (
    <div>
      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-ink/60">{label}</p>
      <div className="flex flex-wrap gap-2">
        {list.map((it) => {
          const on = isOn(it.id);
          return (
            <button
              key={it.id}
              type="button"
              aria-pressed={on}
              onClick={() => onPick(it.id)}
              className={
                on
                  ? 'rounded-lg border-2 border-ink bg-signal px-3 py-1.5 font-lab text-sm font-extrabold text-ink'
                  : 'rounded-lg border-2 border-ink/30 bg-white px-3 py-1.5 font-lab text-sm font-bold text-ink/70'
              }
            >
              <span aria-hidden>{it.emoji}</span> {it.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  const tried = Object.values(log);

  const side = (
    <div className="space-y-4 p-4">
      {shelf('Solutions · pour in', liquids, (id) => liquidId === id, (id) => toggle(setLiquidId, liquidId, id))}
      {shelf('Solids · drop in', solids, (id) => solidId === id, (id) => toggle(setSolidId, solidId, id))}
      {tools.length > 0 && shelf('Tools', tools, (id) => toolIds.includes(id), toggleTool)}

      {/* --- What is happening now --- */}
      <div className="rounded-xl border-2 border-ink bg-well p-3" aria-live="polite">
        <p className="font-mono-lab text-[11px] uppercase tracking-[0.18em] text-white/50">Notebook</p>
        {!result && (
          <p className="mt-1 font-mono-lab text-xs text-white/70">
            Pick one solution and one solid to start an experiment.
            {tools.some((i) => i.condition) ? ' Or light the burner under a solid.' : ''}
          </p>
        )}
        {result && !finished && (
          <>
            <p className="mt-1 font-mono-lab text-xs text-white/70">Watching… (time is sped up)</p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full bg-signal" style={{ width: `${Math.round(t * 100)}%` }} />
            </div>
          </>
        )}
        {result && finished && (
          <>
            <p className="mt-1 font-lab text-sm font-extrabold text-signal">{result.observation}</p>
            {result.wordEquation && (
              <p className="mt-2 border-t border-white/10 pt-2 font-mono-lab text-xs text-white/70">
                {result.wordEquation}
              </p>
            )}
            {result.safety === 'watch-only' && (
              <p className="mt-2 font-mono-lab text-[10px] text-white/50">watch here, don't try at home</p>
            )}
          </>
        )}
      </div>

      {/* --- Results grid --- */}
      {grid && (
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-ink/60">Your results</p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-center text-xs">
              <thead>
                <tr>
                  <th className="p-1" />
                  {grid.cols.map((c) => (
                    <th key={c} className="p-1 font-bold text-ink/60">
                      {items.find((i) => i.id === c)?.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grid.rows.map((r) => (
                  <tr key={r}>
                    <th className="p-1 text-left font-bold text-ink/60">{items.find((i) => i.id === r)?.label}</th>
                    {grid.cols.map((c) => {
                      const entry = log[`${r}|${c}`];
                      return (
                        <td
                          key={c}
                          className={`border-2 border-ink/15 p-1.5 font-lab text-sm font-extrabold ${
                            entry ? (entry.reacted ? 'bg-pcb/15 text-pcb' : 'bg-wire/10 text-wire') : 'text-ink/25'
                          }`}
                        >
                          <span aria-label={entry ? (entry.reacted ? 'reacted' : 'no reaction') : 'not tried'}>
                            {entry ? (entry.reacted ? '✓' : '✗') : '·'}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!grid && tried.length > 0 && (
        <ul className="space-y-1 text-xs font-semibold text-ink/70">
          {tried.map((e) => (
            <li key={e.title}>
              {e.reacted ? '✓' : '✗'} {e.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <WidgetShell title={title} hint={hint} controls={controls} side={side}>
      <div className="relative bg-well p-3">
        <span className="absolute right-4 top-4 rounded bg-white/10 px-2 py-0.5 font-mono-lab text-[10px] text-white/50">
          simplified model
        </span>
        <BenchScene solid={solid} liquid={liquid} tools={activeTools} result={result} t={t} animate={!reduced} />
        {result && finished && !reacted && (
          <p className="pb-2 text-center font-mono-lab text-xs text-white/70">
            {findFx(result, 'no-change')?.message}
          </p>
        )}
      </div>
    </WidgetShell>
  );
}

export default function LabBench({ block }) {
  const { title = 'Lab bench', hint, items = [], grid, predict } = block || {};

  const hasBoth = items.some((i) => i.kind === 'solid') && items.some((i) => i.kind === 'liquid');
  if (!hasBoth) {
    return (
      <WidgetShell title={title}>
        <p className="p-6 text-center font-semibold text-ink/60">
          This bench needs at least one solid and one solution.
        </p>
      </WidgetShell>
    );
  }

  return (
    <PredictGate predict={predict}>
      <BenchLab title={title} hint={hint} items={items} grid={grid} />
    </PredictGate>
  );
}
