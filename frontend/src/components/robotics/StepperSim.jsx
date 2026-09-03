import { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import WidgetShell from './shared/WidgetShell';

const COIL_ANGLES = [0, 90, 180, 270];

/**
 * One STEP press = one coil-pattern change = one fixed rotor increment,
 * exactly matching the blueprint's "big STEP button" spec. Hold auto-repeats
 * via a plain interval — no rAF needed since a stepper's motion is
 * inherently discrete, not continuous.
 */
export default function StepperSim({ block }) {
  const { title = '🧭 Stepper Stepper', hint } = block || {};
  const [coilIndex, setCoilIndex] = useState(0);
  const [angle, setAngle] = useState(0);
  const [count, setCount] = useState(0);
  const [half, setHalf] = useState(false);
  const holdRef = useRef(null);

  const stepSize = half ? 0.9 : 1.8;

  const step = () => {
    setCoilIndex((i) => (i + 1) % 4);
    setAngle((a) => a + stepSize);
    setCount((c) => c + 1);
  };

  const startHold = () => {
    if (holdRef.current) return;
    step();
    holdRef.current = setInterval(step, 90);
  };
  const stopHold = () => {
    clearInterval(holdRef.current);
    holdRef.current = null;
  };
  useEffect(() => () => clearInterval(holdRef.current), []);

  const reset = () => { setAngle(0); setCount(0); setCoilIndex(0); };

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
      <div className="p-4">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <svg viewBox="0 0 160 160" className="w-40 shrink-0">
            <circle cx="80" cy="80" r="55" fill="none" stroke="#16241D22" strokeWidth="4" />
            {COIL_ANGLES.map((a, i) => {
              const rad = (a * Math.PI) / 180;
              const cx = 80 + 62 * Math.sin(rad);
              const cy = 80 - 62 * Math.cos(rad);
              const active = i === coilIndex;
              return (
                <g key={a}>
                  <rect x={cx - 10} y={cy - 8} width="20" height="16" rx="3"
                    fill={active ? '#1F7A5C' : 'white'} stroke="#16241D" strokeWidth="2" />
                </g>
              );
            })}
            <g style={{ transformOrigin: '80px 80px', transform: `rotate(${angle}deg)` }}>
              <line x1="80" y1="80" x2="80" y2="35" stroke="#16241D" strokeWidth="5" strokeLinecap="round" />
              <circle cx="80" cy="35" r="6" fill="#FFC93C" stroke="#16241D" strokeWidth="1.5" />
            </g>
            <circle cx="80" cy="80" r="8" fill="#16241D" />
          </svg>
          <div className="text-center sm:text-left">
            <p className="font-mono-lab text-lg font-extrabold text-pcb">{count} steps</p>
            <p className="font-mono-lab text-xs font-bold text-ink/50">{(angle % 360).toFixed(1)}° so far</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <button
            onMouseDown={startHold} onMouseUp={stopHold} onMouseLeave={stopHold}
            onTouchStart={startHold} onTouchEnd={stopHold}
            className="rounded-2xl border-2 border-ink bg-signal px-8 py-3 font-extrabold text-ink active:scale-95"
          >
            STEP (hold for continuous)
          </button>
          <button
            onClick={() => setHalf((h) => !h)}
            className={`rounded-xl border-2 border-ink px-4 py-2 text-sm font-bold ${half ? 'bg-pcb text-white' : 'bg-white text-ink/70'}`}
          >
            Microstepping: {half ? 'Half-step (0.9°)' : 'Full-step (1.8°)'}
          </button>
        </div>
        <p className="mt-3 text-center text-sm font-semibold text-ink/60">
          Each press energises the next coil in sequence, and the rotor snaps exactly {stepSize}° to line up with it.
        </p>
      </div>
    </WidgetShell>
  );
}
