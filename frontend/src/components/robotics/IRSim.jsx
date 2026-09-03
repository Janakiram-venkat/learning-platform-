import { useState } from 'react';
import WidgetShell from './shared/WidgetShell';

const STRIP = [
  { from: 0, to: 22, color: 'white' },
  { from: 22, to: 45, color: 'black' },
  { from: 45, to: 68, color: 'white' },
  { from: 68, to: 100, color: 'black' },
];

/** Slide a black/white strip under a fixed IR sensor; the pin flips HIGH/LOW as the surface underneath changes. */
export default function IRSim({ block }) {
  const { title = '⚫⚪ IR Reflectance', hint } = block || {};
  const [pos, setPos] = useState(0);

  const seg = STRIP.find((s) => pos >= s.from && pos < s.to) || STRIP[STRIP.length - 1];
  const isWhite = seg.color === 'white';
  const high = isWhite; // white reflects IR back -> detected -> HIGH

  return (
    <WidgetShell title={title} hint={hint}>
      <div className="p-4">
        <div className="relative mx-auto h-16 w-full max-w-md overflow-hidden rounded-lg border-2 border-ink">
          {STRIP.map((s) => (
            <div
              key={s.from}
              className="absolute top-0 h-full"
              style={{ left: `${s.from}%`, width: `${s.to - s.from}%`, backgroundColor: s.color === 'white' ? '#EDF3EE' : '#16241D' }}
            />
          ))}
          <div className="absolute top-0 h-full w-1 bg-wire" style={{ left: `${pos}%` }} />
          <div className="absolute -top-3 flex -translate-x-1/2 flex-col items-center" style={{ left: `${pos}%` }}>
            <div className="h-5 w-5 rounded-full border-2 border-ink bg-signal" />
          </div>
        </div>

        <p className="mt-3 text-center font-mono-lab text-sm font-bold text-pcb">
          surface: {isWhite ? 'white (reflects IR)' : 'black (absorbs IR)'} → pin reads {high ? 'HIGH' : 'LOW'}
        </p>

        <label className="mt-4 block">
          <span className="mb-1 flex justify-between text-xs font-bold uppercase tracking-wide text-ink/60">
            <span>Slide the surface</span><span className="font-mono-lab text-pcb">{pos}%</span>
          </span>
          <input type="range" min="0" max="99" step="1" value={pos}
            onChange={(e) => setPos(Number(e.target.value))}
            className="h-2 w-full cursor-grab accent-pcb active:cursor-grabbing" />
        </label>
        <p className="mt-3 text-center text-sm font-semibold text-ink/60">
          White bounces the sensor's own IR light back to it; black soaks it up. That's the whole sensor — no camera, no image, just reflected light.
        </p>
      </div>
    </WidgetShell>
  );
}
