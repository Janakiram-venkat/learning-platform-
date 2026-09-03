import { useEffect, useRef, useState } from 'react';
import WidgetShell from './shared/WidgetShell';
import useInView from './shared/useInView';

const SPEED_OF_SOUND = 0.0343; // cm per microsecond
const OUT_MS = 700, BACK_MS = 700; // fixed visual pacing, independent of real distance

/**
 * A ping travels out at a fixed visual pace (real flight times are
 * microseconds — imperceptible if animated to scale), hits the wall, and
 * either bounces straight back (angle ≤ 45°) or scatters away and never
 * returns. The distance readout is computed from the *real* physics
 * (distance = speed × time ÷ 2) using the actual time-of-flight for the
 * chosen distance, so the number is honest even though the animation's
 * timing is stylised for visibility.
 */
export default function UltrasonicSim({ block }) {
  const { title = '📡 Ultrasonic Echo', hint } = block || {};
  const [distance, setDistance] = useState(60);
  const [wallAngle, setWallAngle] = useState(0);
  const [phase, setPhase] = useState('idle'); // idle | out | back | lost | done
  const [progress, setProgress] = useState(0);
  const [ref, inView] = useInView();
  const startRef = useRef(0);

  const flightUs = Math.round((2 * distance) / SPEED_OF_SOUND);
  const echoLost = wallAngle > 45;

  useEffect(() => {
    if (!inView || phase === 'idle' || phase === 'done' || phase === 'lost') return undefined;
    let raf;
    const dur = phase === 'out' ? OUT_MS : BACK_MS;
    const tick = (now) => {
      if (!startRef.current) startRef.current = now;
      const p = Math.min(1, (now - startRef.current) / dur);
      setProgress(p);
      if (p >= 1) {
        startRef.current = 0;
        if (phase === 'out') {
          setPhase(echoLost ? 'lost' : 'back');
        } else {
          setPhase('done');
        }
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, inView, echoLost]);

  const ping = () => {
    startRef.current = 0;
    setProgress(0);
    setPhase('out');
  };

  const W = 280, H = 120, emitterX = 30, wallBaseX = 30 + (distance / 150) * 220;
  const ringX = phase === 'out' || phase === 'lost'
    ? emitterX + (wallBaseX - emitterX) * progress
    : phase === 'back'
      ? wallBaseX - (wallBaseX - emitterX) * progress
      : emitterX;
  const wallDx = Math.sin((wallAngle * Math.PI) / 180) * 40;

  return (
    <WidgetShell title={title} hint={hint}>
      <div ref={ref} className="p-4">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-xl border-2 border-ink/12 bg-[#0B180F]">
          <circle cx={emitterX} cy={60} r="8" fill="#FFC93C" />
          <line
            x1={wallBaseX} y1={60 - 45 - wallDx} x2={wallBaseX} y2={60 + 45 + wallDx}
            stroke="#E8503A" strokeWidth="4"
            transform={`rotate(${wallAngle} ${wallBaseX} 60)`}
          />
          {phase !== 'idle' && phase !== 'done' && (
            <circle cx={ringX} cy="60" r="10" fill="none" stroke="#23B5D3" strokeWidth="2.5" opacity={phase === 'lost' ? Math.max(0, 1 - progress) : 1} />
          )}
        </svg>

        <div className="mt-3 text-center">
          {phase === 'idle' && <p className="font-mono-lab text-sm font-bold text-ink/50">ready to ping</p>}
          {(phase === 'out' || phase === 'back') && <p className="font-mono-lab text-sm font-bold text-pcb">ping travelling…</p>}
          {phase === 'lost' && <p className="font-mono-lab text-sm font-bold text-wire">echo scattered away — no reading (timeout)</p>}
          {phase === 'done' && (
            <p className="font-mono-lab text-sm font-bold text-pcb">
              {flightUs} µs round trip → distance = (343 m/s × {flightUs} µs) ÷ 2 ≈ {distance} cm
            </p>
          )}
        </div>

        <button
          onClick={ping}
          disabled={phase !== 'idle' && phase !== 'done' && phase !== 'lost'}
          className="lab-btn mt-3 w-full rounded-xl border-2 border-ink bg-signal px-6 py-2.5 font-extrabold text-ink disabled:opacity-50"
        >
          Ping
        </button>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 flex justify-between text-xs font-bold uppercase tracking-wide text-ink/60">
              <span>Wall distance</span><span className="font-mono-lab text-pcb">{distance} cm</span>
            </span>
            <input type="range" min="10" max="150" step="5" value={distance}
              onChange={(e) => { setDistance(Number(e.target.value)); setPhase('idle'); }}
              className="h-2 w-full cursor-grab accent-pcb active:cursor-grabbing" />
          </label>
          <label className="block">
            <span className="mb-1 flex justify-between text-xs font-bold uppercase tracking-wide text-ink/60">
              <span>Wall angle</span><span className="font-mono-lab text-pcb">{wallAngle}°</span>
            </span>
            <input type="range" min="0" max="80" step="5" value={wallAngle}
              onChange={(e) => { setWallAngle(Number(e.target.value)); setPhase('idle'); }}
              className="h-2 w-full cursor-grab accent-pcb active:cursor-grabbing" />
          </label>
        </div>
      </div>
    </WidgetShell>
  );
}
