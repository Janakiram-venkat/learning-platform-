import { useEffect, useRef, useState } from 'react';
import WidgetShell from '../robotics/shared/WidgetShell';
import useReducedMotion from '../robotics/shared/useReducedMotion';
import PredictGate from './shared/PredictGate';
import { blendStages, validateStages } from '../../lib/timeline.js';

/**
 * `process-timeline` engine (E8), minimal version.
 *
 * A scene with a time handle. Drag the handle (or press Play) and the scene
 * changes smoothly: ground layers grow and change colour, things fall, get
 * buried, fade. The stage card and the time chip follow the handle.
 *
 * All the blending is in lib/timeline.js (pure, tested in Node); this file only
 * draws what `blendStages` returns. See that file for the stage shape, and
 * 'chem-coal-formation' in data/chemistry.js for a complete block.
 *
 * Block config:
 *   stages   [...]                       see lib/timeline.js
 *   gauges   [{ id, label, low, high }]  optional bars, e.g. pressure and heat
 *   predict  optional, shown first by PredictGate like every science widget
 *
 * The scene is a cut-away side view, not to scale, hence the tag on it.
 */

const W = 480;
const H = 280;
const GROUND_BOTTOM = 272;
const PLAY_SECONDS = 14;

function Scene({ view }) {
  // Stack the layers upward from the bottom of the scene.
  let cursor = GROUND_BOTTOM;
  const bands = view.layers.map((l) => {
    cursor -= l.h;
    return { ...l, y: cursor };
  });

  const drawItem = (it) => (
    <text
      key={it.id}
      x={it.x}
      y={it.y}
      fontSize={it.size}
      textAnchor="middle"
      opacity={it.opacity}
      transform={it.rot ? `rotate(${it.rot} ${it.x} ${it.y - it.size / 3})` : undefined}
    >
      {it.emoji}
    </text>
  );

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="A cut-away side view of the ground that changes as time passes">
      <rect x="0" y="0" width={W} height={H} fill={view.sky} />
      {view.items.filter((it) => !it.front).map(drawItem)}
      {bands.map((b) => (
        <rect key={b.key} x="0" y={b.y} width={W} height={b.h + 0.5} fill={b.colour} />
      ))}
      {view.items.filter((it) => it.front).map(drawItem)}
    </svg>
  );
}

function TimelineLab({ title, hint, stages, gauges }) {
  const reduced = useReducedMotion();
  const last = stages.length - 1;
  const [p, setP] = useState(0);
  const [playing, setPlaying] = useState(false);
  const pRef = useRef(0);
  pRef.current = p;

  useEffect(() => {
    if (!playing) return undefined;
    const speed = last / PLAY_SECONDS;
    let raf = 0;
    let prev = performance.now();
    const tick = (now) => {
      const next = pRef.current + ((now - prev) / 1000) * speed;
      prev = now;
      if (next >= last) {
        setP(last);
        setPlaying(false);
        return;
      }
      setP(next);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, last]);

  const view = blendStages(stages, p);
  const stage = stages[view.stage];

  const jump = (i) => {
    setPlaying(false);
    setP(i);
  };

  const controls = (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={reduced}
        title={reduced ? 'Autoplay is off because your device prefers reduced motion' : undefined}
        onClick={() => {
          if (playing) {
            setPlaying(false);
          } else {
            if (p >= last) setP(0);
            setPlaying(true);
          }
        }}
        className="rounded-lg border-2 border-ink bg-white px-3 py-1 font-lab text-xs font-extrabold text-ink disabled:opacity-40"
      >
        {playing ? '❚❚ Pause' : '▶ Play through'}
      </button>
      <button
        type="button"
        onClick={() => jump(0)}
        className="rounded-lg border-2 border-ink bg-white px-3 py-1 font-lab text-xs font-extrabold text-ink"
      >
        ↺ Back to the start
      </button>
    </div>
  );

  const side = (
    <div className="space-y-4 p-4">
      <div className="rounded-xl border-2 border-ink bg-well p-3 text-center">
        <p className="font-mono-lab text-[11px] uppercase tracking-[0.18em] text-white/50">Time</p>
        <p className="font-lab text-xl font-extrabold text-signal">{stage.time}</p>
      </div>

      <div className="rounded-xl border-2 border-ink bg-white p-3" aria-live="polite">
        <p className="ref-tag text-ink/50">
          Step {view.stage + 1} of {stages.length}
        </p>
        <h3 className="mt-0.5 font-lab text-base font-extrabold text-ink">{stage.title}</h3>
        <p className="mt-1.5 text-sm font-semibold leading-relaxed text-ink/70">{stage.body}</p>
      </div>

      {gauges.length > 0 && (
        <div className="space-y-2.5">
          {gauges.map((g) => {
            const v = view.gauges[g.id] ?? 0;
            return (
              <div key={g.id}>
                <div className="mb-1 flex justify-between text-xs font-bold uppercase tracking-wide text-ink/60">
                  <span>{g.label}</span>
                  <span className="font-mono-lab text-pcb">{Math.round(v * 100)}%</span>
                </div>
                <div
                  className="h-2.5 w-full overflow-hidden rounded-full border-2 border-ink bg-white"
                  role="meter"
                  aria-label={g.label}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(v * 100)}
                >
                  <div className="h-full bg-wire" style={{ width: `${v * 100}%` }} />
                </div>
                {(g.low || g.high) && (
                  <div className="mt-0.5 flex justify-between font-mono-lab text-[10px] text-ink/40">
                    <span>{g.low}</span>
                    <span>{g.high}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div>
        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-ink/60">Jump to a step</p>
        <div className="flex flex-wrap gap-2">
          {stages.map((s, i) => (
            <button
              key={s.id}
              type="button"
              title={s.title}
              aria-label={`Step ${i + 1}: ${s.title}`}
              aria-current={i === view.stage ? 'step' : undefined}
              onClick={() => jump(i)}
              className={
                i === view.stage
                  ? 'h-8 w-8 rounded-lg border-2 border-ink bg-signal font-lab text-sm font-extrabold text-ink'
                  : 'h-8 w-8 rounded-lg border-2 border-ink/30 bg-white font-lab text-sm font-bold text-ink/70'
              }
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <WidgetShell title={title} hint={hint} controls={controls} side={side}>
      <div className="relative bg-well p-3">
        <span className="absolute right-4 top-4 z-10 rounded bg-black/30 px-2 py-0.5 font-mono-lab text-[10px] text-white/70">
          cut-away, not to scale
        </span>
        <Scene view={view} />
        <label className="mt-3 block">
          <span className="mb-1 flex justify-between font-mono-lab text-[11px] uppercase tracking-[0.18em] text-white/50">
            <span>Drag to move through time</span>
            <span className="text-signal">{stage.time}</span>
          </span>
          <input
            type="range"
            min="0"
            max={last}
            step="0.01"
            value={p}
            aria-label="Time"
            aria-valuetext={`Step ${view.stage + 1}: ${stage.title}, ${stage.time}`}
            onChange={(e) => {
              setPlaying(false);
              setP(Number(e.target.value));
            }}
            className="h-2 w-full cursor-grab accent-signal active:cursor-grabbing"
          />
        </label>
      </div>
    </WidgetShell>
  );
}

export default function ProcessTimeline({ block }) {
  const { title = 'Timeline', hint, stages = [], gauges = [], predict } = block || {};

  const problems = validateStages(stages, gauges);
  if (problems.length) {
    return (
      <WidgetShell title={title}>
        <p className="p-6 text-center font-semibold text-ink/60">
          This timeline has a configuration problem: {problems[0]}
        </p>
      </WidgetShell>
    );
  }

  return (
    <PredictGate predict={predict}>
      <TimelineLab title={title} hint={hint} stages={stages} gauges={gauges} />
    </PredictGate>
  );
}
