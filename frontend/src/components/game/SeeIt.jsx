import { useEffect, useMemo, useRef } from 'react';
import { ArrowRight } from 'lucide-react';

// The "See it" beat: two looping mini-animations side by side — the game as it
// is now, and the game after this step. Deliberately NOT real Pyodide games:
// only one canvas can be attached to the worker at a time, and a 4-second hook
// should never wait on a 10MB runtime. These are pure CSS/SVG.

const STAGE_W = 200;
const STAGE_H = 130;

// Each preset maps a frame counter (0..1 progress) to a position/rotation.
const MOTIONS = {
  still: () => ({ x: 0.5, y: 0.5 }),
  slide: (p) => ({ x: p, y: 0.5 }),
  bounce: (p) => ({ x: 0.5, y: 0.15 + Math.abs(Math.sin(p * Math.PI * 2)) * 0.6 }),
  bounce_x: (p) => ({ x: 0.1 + Math.abs(Math.sin(p * Math.PI)) * 0.8, y: 0.5 }),
  fall: (p) => ({ x: 0.5, y: (p * 1.2) % 1.2 }),
  fall_many: (p, i) => ({ x: 0.2 + i * 0.3, y: ((p + i * 0.33) * 1.2) % 1.2 }),
  drive: (p) => ({ x: 0.5 + Math.sin(p * Math.PI * 2) * 0.35, y: 0.75 }),
  jump: (p) => ({ x: 0.5, y: 0.75 - Math.abs(Math.sin(p * Math.PI)) * 0.5 }),
  chase: (p, i) => ({ x: (p + i * 0.25) % 1, y: 0.4 + i * 0.18 }),
  wiggle: (p) => ({ x: 0.5 + Math.sin(p * Math.PI * 6) * 0.06, y: 0.5 }),
};

function MiniStage({ spec, label, tone }) {
  const actorRefs = useRef([]);

  const actors = useMemo(() => spec?.actors || [], [spec]);
  const motion = MOTIONS[spec?.motion] || MOTIONS.still;

  // Two of these run on every step, plus whatever the Get-it widget is doing.
  // Driving them through React state at 60fps was enough to make the whole page
  // stutter, so the loop writes straight to each element's style instead —
  // no re-renders, same animation.
  useEffect(() => {
    let raf = 0;
    let t0 = 0;
    const period = (spec?.seconds || 2.4) * 1000;
    const loop = (t) => {
      if (!t0) t0 = t;
      const p = ((t - t0) % period) / period;
      actorRefs.current.forEach((el, i) => {
        if (!el) return;
        const a = actors[i];
        if (a?.fixed) return;             // pinned actors never move
        const pos = motion(p, i);
        el.style.left = `${pos.x * 100}%`;
        el.style.top = `${pos.y * 100}%`;
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [spec, actors, motion]);

  return (
    <div className="flex-1">
      <p className={`mb-2 text-center ref-tag ${tone === 'after' ? 'text-pcb' : 'text-ink/45'}`}>{label}</p>
      <div
        className="relative overflow-hidden rounded-xl border-2 border-ink"
        style={{ background: spec?.background || '#0B1020', aspectRatio: `${STAGE_W} / ${STAGE_H}` }}
      >
        {spec?.ground && (
          <div className="absolute inset-x-0 bottom-0 h-1/5" style={{ background: spec.ground }} />
        )}
        {actors.map((a, i) => {
          const start = a.fixed ?? motion(0, i);
          return (
            <span
              key={i}
              ref={(el) => { actorRefs.current[i] = el; }}
              className="absolute select-none"
              style={{
                left: `${start.x * 100}%`,
                top: `${start.y * 100}%`,
                transform: 'translate(-50%, -50%)',
                fontSize: `${a.size || 26}px`,
                lineHeight: 1,
              }}
            >
              {a.look}
            </span>
          );
        })}
        {spec?.caption && (
          <span className="absolute left-2 top-1.5 font-mono text-[10px] font-bold text-white/70">
            {spec.caption}
          </span>
        )}
      </div>
    </div>
  );
}

export default function SeeIt({ before, after, note }) {
  if (!before && !after) return null;
  return (
    <div className="lab-panel p-4 sm:p-5">
      <h3 className="mb-1 font-lab font-bold text-ink">See what you're about to build</h3>
      <p className="mb-4 text-sm text-ink/55">Left is your game now. Right is your game after this step.</p>
      <div className="flex items-stretch gap-3">
        <MiniStage spec={before} label="NOW" tone="before" />
        <div className="flex items-center">
          <ArrowRight className="h-6 w-6 shrink-0 text-ink/30" />
        </div>
        <MiniStage spec={after} label="AFTER THIS STEP" tone="after" />
      </div>
      {note && <p className="mt-4 text-ink/75">{note}</p>}
    </div>
  );
}
