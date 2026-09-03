import { useEffect, useRef, useState } from 'react';
import WidgetShell from './shared/WidgetShell';
import useInView from './shared/useInView';

const CX = 110, CY = 80, HX = 90, HY = 60; // sensor at the exact centre of a rectangular room
const DEG_PER_SEC = 140;

// Closed-form ray/rectangle distance, valid because the sensor sits at the room's centre.
function castDistance(deg) {
  const rad = (deg * Math.PI) / 180;
  const c = Math.cos(rad), s = Math.sin(rad);
  const tx = c !== 0 ? HX / Math.abs(c) : Infinity;
  const ty = s !== 0 ? HY / Math.abs(s) : Infinity;
  return Math.min(tx, ty);
}

/** A spinning ray sweeps once every ~2.5s, dropping a point roughly every 4° — the room's shape accumulates from nothing, then resets and sweeps again. */
export default function LidarSweep({ block }) {
  const { title = '🔦 LiDAR Point Cloud', hint } = block || {};
  const [angle, setAngle] = useState(0);
  const [points, setPoints] = useState([]);
  const [ref, inView] = useInView();
  const angleRef = useRef(0);
  const pointsRef = useRef([]);

  useEffect(() => {
    if (!inView) return undefined;
    let raf, last = performance.now();
    const tick = (now) => {
      const dt = (now - last) / 1000;
      last = now;
      let next = angleRef.current + DEG_PER_SEC * dt;
      if (next >= 360) {
        next -= 360;
        pointsRef.current = [];
      }
      const dist = castDistance(next);
      const rad = (next * Math.PI) / 180;
      const px = CX + dist * Math.cos(rad), py = CY + dist * Math.sin(rad);
      const pts = pointsRef.current;
      if (!pts.length || Math.abs(pts[pts.length - 1].a - next) >= 3.5) {
        pointsRef.current = [...pts, { a: next, x: px, y: py }].slice(-100);
      }
      angleRef.current = next;
      setAngle(next);
      setPoints(pointsRef.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView]);

  const rayRad = (angle * Math.PI) / 180;
  const rayDist = castDistance(angle);
  const rayX = CX + rayDist * Math.cos(rayRad), rayY = CY + rayDist * Math.sin(rayRad);

  return (
    <WidgetShell title={title} hint={hint}>
      <div ref={ref} className="p-4">
        <svg viewBox="0 0 220 160" className="mx-auto w-full max-w-[380px] rounded-xl border-2 border-ink/12 bg-[#0B180F]">
          <rect x={CX - HX} y={CY - HY} width={HX * 2} height={HY * 2} fill="none" stroke="#ffffff12" strokeWidth="2" />
          <line x1={CX} y1={CY} x2={rayX} y2={rayY} stroke="#E8503A" strokeWidth="1.5" opacity="0.8" />
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="2" fill="#23B5D3" opacity={0.4 + 0.6 * (i / points.length)} />
          ))}
          <circle cx={CX} cy={CY} r="4" fill="#FFC93C" />
        </svg>
        <p className="mt-3 text-center text-sm font-semibold text-ink/60">
          One spinning laser, one distance reading per degree. Give it one full rotation and the room's shape appears out of nothing.
        </p>
      </div>
    </WidgetShell>
  );
}
