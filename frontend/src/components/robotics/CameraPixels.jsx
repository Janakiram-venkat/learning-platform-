import { useState } from 'react';
import WidgetShell from './shared/WidgetShell';

// A tiny synthetic "photo" — an 8x6 grid of hex colours forming a simple arrow icon.
// Baked in rather than a real image: the teaching point is "pixels have RGB numbers",
// which a small deliberate grid demonstrates without an asset pipeline.
const W = 10, H = 7;
const BG = '#1F7A5C', FG = '#FFC93C', EDGE = '#16241D';
const GRID = [
  'BBBBBBBBBB',
  'BBBBFBBBBB',
  'BBBFFFBBBB',
  'BEEFFFEEBB',
  'BBBFFFBBBB',
  'BBBBFBBBBB',
  'BBBBBBBBBB',
].map((row) => row.split('').map((c) => (c === 'F' ? FG : c === 'E' ? EDGE : BG)));

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export default function CameraPixels({ block }) {
  const { title = '📷 Light → Grid → Numbers', hint } = block || {};
  const [zoom, setZoom] = useState(1);
  const [selected, setSelected] = useState(null);

  const cell = 6 + zoom * 3;
  const showGrid = zoom > 2;
  const sel = selected ? GRID[selected.y][selected.x] : null;
  const rgb = sel ? hexToRgb(sel) : null;

  return (
    <WidgetShell title={title} hint={hint}>
      <div className="p-4">
        <div className="overflow-auto rounded-xl border-2 border-ink/12 bg-[#0B180F] p-3">
          <svg width={cell * W} height={cell * H} className="mx-auto block">
            {GRID.map((row, y) => row.map((color, x) => (
              <rect
                key={`${x}-${y}`}
                x={x * cell} y={y * cell} width={cell} height={cell}
                fill={color}
                stroke={showGrid ? '#00000055' : 'none'}
                strokeWidth="1"
                onClick={() => setSelected({ x, y })}
                style={{ cursor: 'pointer' }}
                opacity={selected && selected.x === x && selected.y === y ? 0.7 : 1}
              />
            )))}
          </svg>
        </div>

        <p className="mt-2 text-center font-mono-lab text-sm font-bold text-pcb">
          {rgb ? `pixel (${selected.x}, ${selected.y}) → R:${rgb.r} G:${rgb.g} B:${rgb.b}` : 'zoom in and click a pixel'}
        </p>

        <label className="mt-4 block">
          <span className="mb-1 flex justify-between text-xs font-bold uppercase tracking-wide text-ink/60">
            <span>Zoom</span><span className="font-mono-lab text-pcb">{zoom}×</span>
          </span>
          <input type="range" min="1" max="6" step="1" value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="h-2 w-full cursor-grab accent-pcb active:cursor-grabbing" />
        </label>
        <p className="mt-3 text-center text-sm font-semibold text-ink/60">
          Zoomed out, this reads as a picture. Zoomed in, it's nothing but a grid of numbers — that's all a camera ever actually captures.
        </p>
      </div>
    </WidgetShell>
  );
}
