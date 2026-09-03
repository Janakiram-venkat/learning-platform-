import { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import WidgetShell from './shared/WidgetShell';
import useInView from './shared/useInView';

const W = 320, H = 220, WHEEL_BASE = 26, MAX_TRACE = 400;
const HOME = { x: W / 2, y: H / 2, heading: 0, trace: [] };

/**
 * Two sliders, real differential-drive kinematics, a robot that actually
 * moves. v = (vL+vR)/2, ω = (vR-vL)/L — the same two lines every real
 * differential robot runs, just driven by sliders instead of code.
 *
 * Runs its own rAF loop, paused via `useInView` the same way the 3D widgets
 * are — a DOM widget ticking off-screen is just as wasteful as an
 * unmounted-but-rendering Canvas. Pose lives in `useState` (not a ref) since
 * plain SVG is redrawn by React itself, unlike the three.js widgets where
 * `useFrame` mutates a ref straight into the scene graph outside React.
 */
export default function DriveTrainer({ block }) {
  const { title = '🕹️ Drive Trainer', hint } = block || {};
  const [left, setLeft] = useState(0);
  const [right, setRight] = useState(0);
  const [pose, setPose] = useState(HOME);
  const [ref, inView] = useInView();
  const speedsRef = useRef({ left, right });
  useEffect(() => { speedsRef.current = { left, right }; }, [left, right]);

  useEffect(() => {
    if (!inView) return undefined;
    let raf;
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const { left: l, right: r } = speedsRef.current;
      const vL = (l / 100) * 40; // px/s
      const vR = (r / 100) * 40;
      const v = (vL + vR) / 2;
      const w = (vR - vL) / WHEEL_BASE;
      setPose((p) => {
        const heading = p.heading + w * dt;
        const x = Math.max(12, Math.min(W - 12, p.x + v * Math.cos(heading) * dt));
        const y = Math.max(12, Math.min(H - 12, p.y + v * Math.sin(heading) * dt));
        const trace = l !== 0 || r !== 0 ? [...p.trace, [x, y]].slice(-MAX_TRACE) : p.trace;
        return { x, y, heading, trace };
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView]);

  const reset = () => {
    setPose(HOME);
    setLeft(0);
    setRight(0);
  };

  const tracePath = pose.trace.length > 1
    ? 'M' + pose.trace.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L')
    : '';

  return (
    <WidgetShell
      title={title}
      hint={hint}
      controls={
        <button onClick={reset} className="inline-flex items-center gap-1.5 rounded-lg border-2 border-ink bg-white px-3 py-1.5 text-xs font-bold text-ink">
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </button>
      }
    >
      <div ref={ref} className="p-4">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-xl border-2 border-ink/12 bg-[#0B180F]">
          {tracePath && <path d={tracePath} fill="none" stroke="#23B5D3" strokeWidth="2" opacity="0.6" />}
          <g transform={`translate(${pose.x} ${pose.y}) rotate(${(pose.heading * 180) / Math.PI})`}>
            <rect x="-14" y="-10" width="28" height="20" rx="3" fill="#1F7A5C" stroke="#EDF3EE" strokeWidth="1.5" />
            <polygon points="14,0 4,-6 4,6" fill="#FFC93C" />
          </g>
        </svg>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 flex justify-between text-xs font-bold uppercase tracking-wide text-ink/60">
              <span>Left wheel</span><span className="font-mono-lab text-pcb">{left}</span>
            </span>
            <input type="range" min="-100" max="100" step="5" value={left}
              onChange={(e) => setLeft(Number(e.target.value))}
              className="h-2 w-full cursor-grab accent-pcb active:cursor-grabbing" />
          </label>
          <label className="block">
            <span className="mb-1 flex justify-between text-xs font-bold uppercase tracking-wide text-ink/60">
              <span>Right wheel</span><span className="font-mono-lab text-pcb">{right}</span>
            </span>
            <input type="range" min="-100" max="100" step="5" value={right}
              onChange={(e) => setRight(Number(e.target.value))}
              className="h-2 w-full cursor-grab accent-pcb active:cursor-grabbing" />
          </label>
        </div>
        <p className="mt-3 text-center text-sm font-semibold text-ink/60">
          Try: both sliders equal → straight. Opposite signs, equal size → spin on the spot. One at zero → arcs around that wheel.
        </p>
      </div>
    </WidgetShell>
  );
}
