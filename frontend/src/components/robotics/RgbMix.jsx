import { useState } from 'react';
import WidgetShell from './shared/WidgetShell';

const HEART = [
  '0110110',
  '1111111',
  '1111111',
  '0111110',
  '0011100',
  '0001000',
];

function toHex(n) { return n.toString(16).padStart(2, '0'); }

export default function RgbMix({ block }) {
  const { title = '🌈 RGB Mixing', hint } = block || {};
  const [r, setR] = useState(255);
  const [g, setG] = useState(60);
  const [b, setB] = useState(120);

  const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;

  return (
    <WidgetShell title={title} hint={hint}>
      <div className="p-4">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <div
            className="h-20 w-20 shrink-0 rounded-full border-2 border-ink"
            style={{ backgroundColor: hex, boxShadow: `0 0 18px ${hex}` }}
          />
          <div className="grid grid-cols-7 gap-1 rounded-xl border-2 border-ink bg-[#0B180F] p-2">
            {HEART.map((row, y) => row.split('').map((c, x) => (
              <div
                key={`${x}-${y}`}
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: c === '1' ? hex : '#ffffff10' }}
              />
            )))}
          </div>
        </div>
        <p className="mt-2 text-center font-mono-lab text-sm font-bold text-pcb">{hex}</p>

        <div className="mt-4 space-y-3">
          {[['Red', r, setR, '#E8503A'], ['Green', g, setG, '#1F7A5C'], ['Blue', b, setB, '#23B5D3']].map(([label, val, setter, color]) => (
            <label key={label} className="block">
              <span className="mb-1 flex justify-between text-xs font-bold uppercase tracking-wide" style={{ color }}>
                <span>{label}</span><span className="font-mono-lab">{val}</span>
              </span>
              <input type="range" min="0" max="255" step="5" value={val}
                onChange={(e) => setter(Number(e.target.value))}
                className="h-2 w-full cursor-grab active:cursor-grabbing" style={{ accentColor: color }} />
            </label>
          ))}
        </div>
        <p className="mt-3 text-center text-sm font-semibold text-ink/60">
          One RGB LED is really three tiny LEDs — red, green, blue — sharing one lens. A display is just a grid of these, one per pixel.
        </p>
      </div>
    </WidgetShell>
  );
}
