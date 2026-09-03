import { useMemo, useState } from 'react';
import WidgetShell from './shared/WidgetShell';

function GearShape({ teeth, radius, color }) {
  const pts = [];
  const toothH = radius * 0.16;
  const n = teeth;
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * 360;
    const a1 = ((i + 0.5) / n) * 360;
    const a2 = ((i + 1) / n) * 360;
    pts.push([a0, radius], [a1, radius + toothH], [a2, radius]);
  }
  const d = pts.map(([a, r], i) => {
    const rad = (a * Math.PI) / 180;
    const x = (r * Math.cos(rad)).toFixed(1);
    const y = (r * Math.sin(rad)).toFixed(1);
    return `${i === 0 ? 'M' : 'L'}${x} ${y}`;
  }).join(' ') + ' Z';
  return (
    <g>
      <path d={d} fill={color} stroke="#16241D" strokeWidth="2" />
      <circle r={radius * 0.28} fill="#16241D" />
      <line x1={-radius * 0.7} y1="0" x2={radius * 0.7} y2="0" stroke="#EDF3EE" strokeWidth="2" />
    </g>
  );
}

/**
 * Two meshing gears, teeth counts driving both their size and their rotation
 * ratio. The driving gear spins at a fixed visual rate; the driven gear's
 * rate and direction come straight from `-teethA/teethB`, so resizing either
 * slider changes the animation, not just the numbers underneath it.
 */
export default function GearRatio({ block }) {
  const { title = '⚙️ Gear Ratio', hint } = block || {};
  const [teethA, setTeethA] = useState(12);
  const [teethB, setTeethB] = useState(24);

  const { radiusA, radiusB, durB } = useMemo(() => {
    const rA = 14 + teethA * 1.6;
    const rB = 14 + teethB * 1.6;
    const r = teethA / teethB;
    const durA = 3; // seconds per rotation, fixed
    return { radiusA: rA, radiusB: rB, ratio: r, durB: durA / r };
  }, [teethA, teethB]);

  const gap = radiusA + radiusB - 6; // slight mesh overlap
  const cx = 90, cy = 100;

  return (
    <WidgetShell title={title} hint={hint}>
      <div className="p-4">
        <svg viewBox="0 0 260 200" className="mx-auto w-full max-w-[380px]">
          <g style={{ animation: `gearspinA 3s linear infinite` }}>
            <GearShape teeth={teethA} radius={radiusA} color="#1F7A5C" />
          </g>
          <g style={{ animation: `gearspinB ${Math.abs(durB)}s linear infinite reverse` }}>
            <GearShape teeth={teethB} radius={radiusB} color="#23B5D3" />
          </g>
        </svg>

        <p className="mt-2 text-center font-mono-lab text-sm font-bold text-pcb">
          {teethB > teethA
            ? `Small gear turns ${(teethB / teethA).toFixed(2)}× for every 1 turn of the big gear — more speed, less torque`
            : teethA > teethB
              ? `Big gear turns ${(teethA / teethB).toFixed(2)}× slower, but with ${(teethA / teethB).toFixed(2)}× the torque`
              : 'Equal size — same speed, same torque, just reversed direction'}
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 flex justify-between text-xs font-bold uppercase tracking-wide text-ink/60">
              <span>Driving gear teeth</span><span className="font-mono-lab text-pcb">{teethA}</span>
            </span>
            <input type="range" min="6" max="30" step="1" value={teethA}
              onChange={(e) => setTeethA(Number(e.target.value))}
              className="h-2 w-full cursor-grab accent-pcb active:cursor-grabbing" />
          </label>
          <label className="block">
            <span className="mb-1 flex justify-between text-xs font-bold uppercase tracking-wide text-ink/60">
              <span>Driven gear teeth</span><span className="font-mono-lab text-pcb">{teethB}</span>
            </span>
            <input type="range" min="6" max="30" step="1" value={teethB}
              onChange={(e) => setTeethB(Number(e.target.value))}
              className="h-2 w-full cursor-grab accent-pcb active:cursor-grabbing" />
          </label>
        </div>
      </div>
      <style>{`
        @keyframes gearspinA { from { transform: translate(${cx}px, ${cy}px) rotate(0deg); } to { transform: translate(${cx}px, ${cy}px) rotate(360deg); } }
        @keyframes gearspinB { from { transform: translate(${cx + gap}px, ${cy}px) rotate(0deg); } to { transform: translate(${cx + gap}px, ${cy}px) rotate(360deg); } }
      `}</style>
    </WidgetShell>
  );
}
