import { useState } from 'react';
import WidgetShell from './shared/WidgetShell';

/**
 * A canned scene with bounding boxes that fade in, confidence ticking up —
 * scripted against known scene contents, exactly as the module's own
 * deviation note describes. Reused for object detection, face landmarks and
 * gesture recognition via `block.boxes` / `block.sceneEmoji`.
 */
export default function DetectionReveal({ block }) {
  const { title = '🔎 Detection', hint, sceneEmoji = '🏠', boxes = [], note } = block || {};
  const [revealed, setRevealed] = useState(0); // how many boxes are showing

  const detect = () => {
    setRevealed(0);
    boxes.forEach((_, i) => {
      setTimeout(() => setRevealed((n) => Math.max(n, i + 1)), i * 500);
    });
  };
  const reset = () => setRevealed(0);

  return (
    <WidgetShell title={title} hint={hint}>
      <div className="p-4">
        <div className="relative mx-auto aspect-video w-full max-w-md overflow-hidden rounded-xl border-2 border-ink/12 bg-[#0B180F]">
          <span className="absolute inset-0 flex items-center justify-center text-6xl opacity-70">{sceneEmoji}</span>
          {boxes.map((b, i) => (
            <div
              key={b.label}
              className="absolute rounded border-2 transition-opacity duration-300"
              style={{
                left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%`,
                borderColor: '#23B5D3', opacity: i < revealed ? 1 : 0,
              }}
            >
              <span className="absolute -top-5 left-0 whitespace-nowrap rounded bg-[#23B5D3] px-1.5 py-0.5 font-mono-lab text-[10px] font-bold text-[#0B180F]">
                {b.label} {b.confidence}%
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={revealed >= boxes.length ? reset : detect}
          className="lab-btn mt-4 w-full rounded-xl border-2 border-ink bg-signal px-6 py-2.5 font-extrabold text-ink"
        >
          {revealed >= boxes.length && revealed > 0 ? 'Run again' : 'Detect'}
        </button>
        {note && <p className="mt-3 text-center text-sm font-semibold text-ink/60">{note}</p>}
      </div>
    </WidgetShell>
  );
}
