import { useState } from 'react';
import WidgetShell from './shared/WidgetShell';

/**
 * A flat pinout diagram, not a 3D board — the teaching job here is "what does
 * this pin do", and a clickable list of labelled rectangles answers that in
 * one glance without paying for a GLTF load. Selecting a pin just swaps which
 * card shows in the reader below; nothing here needs to touch three.js.
 */
export default function GpioPinout({ block }) {
  const { title = '📌 ESP32 Pinout', hint, pins = [] } = block || {};
  const [selected, setSelected] = useState(pins[0]?.id || null);
  if (!pins.length) return null;

  const left = pins.filter((_, i) => i % 2 === 0);
  const right = pins.filter((_, i) => i % 2 === 1);
  const active = pins.find((p) => p.id === selected);

  const kindColor = { power: '#FFC93C', ground: '#16241D', gpio: '#1F7A5C', special: '#23B5D3' };

  const Pin = ({ p, side }) => (
    <button
      onClick={() => setSelected(p.id)}
      className={`flex items-center gap-2 rounded-lg border-2 px-2 py-1.5 text-xs font-bold transition-colors ${
        selected === p.id ? 'border-ink bg-signal text-ink' : 'border-ink/15 bg-white text-ink/70 hover:border-pcb/40'
      } ${side === 'right' ? 'flex-row-reverse text-right' : ''}`}
    >
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full border border-ink/30"
        style={{ backgroundColor: kindColor[p.kind] || '#1F7A5C' }}
      />
      {p.label}
    </button>
  );

  return (
    <WidgetShell title={title} hint={hint}>
      <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-[1fr_auto_1fr]">
        <div className="flex flex-col gap-1.5">
          {left.map((p) => <Pin key={p.id} p={p} side="left" />)}
        </div>
        <div className="mx-auto flex h-full w-16 flex-col items-center justify-center rounded-xl border-2 border-ink bg-pcb/90 py-4 sm:w-20">
          <span className="rotate-90 whitespace-nowrap font-mono-lab text-[10px] font-bold text-white/80 sm:rotate-0 sm:[writing-mode:vertical-rl]">
            ESP32
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          {right.map((p) => <Pin key={p.id} p={p} side="right" />)}
        </div>
      </div>

      {active && (
        <div className="border-t-2 border-ink/10 bg-paper/60 p-4">
          <p className="font-lab text-sm font-extrabold text-ink">{active.label}</p>
          <p className="mt-1 text-sm font-medium text-ink/70">{active.detail}</p>
        </div>
      )}
    </WidgetShell>
  );
}
