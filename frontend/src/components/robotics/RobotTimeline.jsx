import { useState } from 'react';
import WidgetShell from './shared/WidgetShell';

/**
 * Five hundred years on one rail, driven by dragging.
 *
 * Scrubbing *is* the interaction — there's no next button — so the student
 * feels the long empty stretch between da Vinci and the first real robot, and
 * how everything bunches up in the last thirty years. The slider is a real
 * range input, so arrow keys work and screen readers announce it.
 */
export default function RobotTimeline({ block }) {
  const items = block?.items || [];
  const [index, setIndex] = useState(0);

  if (!items.length) return null;
  const item = items[index];
  const pct = items.length > 1 ? (index / (items.length - 1)) * 100 : 0;

  return (
    <WidgetShell
      title="🕰️ Drag through 500 years"
      hint="Notice the gap: four centuries between the first mechanical knight and a machine that could decide anything for itself."
    >
      <div className="p-4 pb-2">
        {/* The card for wherever the scrubber is parked */}
        <div
          key={item.year}
          className="mb-6 flex animate-slide-up items-start gap-4 rounded-2xl border-2 border-ink/12 bg-paper/60 p-4"
        >
          <span className="text-4xl leading-none">{item.emoji}</span>
          <div>
            <p className="font-mono-lab text-sm font-bold text-pcb">{item.year}</p>
            <h4 className="font-lab text-lg font-extrabold text-ink">{item.title}</h4>
            <p className="mt-1 text-sm font-semibold text-ink/70">{item.text}</p>
          </div>
        </div>

        {/* The rail */}
        <div className="relative mb-2 h-12">
          <div className="absolute left-0 right-0 top-4 h-1.5 rounded-full bg-ink/12" />
          <div
            className="absolute left-0 top-4 h-1.5 rounded-full bg-pcb transition-[width] duration-200"
            style={{ width: `${pct}%` }}
          />
          {items.map((it, i) => {
            const at = items.length > 1 ? (i / (items.length - 1)) * 100 : 0;
            const past = i <= index;
            const here = i === index;
            return (
              <button
                key={it.year}
                onClick={() => setIndex(i)}
                title={`${it.year}: ${it.title}`}
                aria-label={`${it.year}, ${it.title}`}
                className="absolute top-0 -translate-x-1/2"
                style={{ left: `${at}%` }}
              >
                <span
                  className={`block rounded-full border-2 transition-all ${
                    here
                      ? 'h-6 w-6 border-ink bg-signal shadow-[2px_2px_0_rgba(22,36,29,0.9)]'
                      : past
                        ? 'mt-1.5 h-3 w-3 border-pcb bg-pcb'
                        : 'mt-1.5 h-3 w-3 border-ink/25 bg-white'
                  }`}
                />
                <span
                  className={`mt-1 block font-mono-lab text-[10px] transition-colors ${
                    here ? 'font-bold text-ink' : 'text-ink/35'
                  }`}
                >
                  {it.year}
                </span>
              </button>
            );
          })}
        </div>

        <input
          type="range"
          min="0"
          max={items.length - 1}
          step="1"
          value={index}
          onChange={(e) => setIndex(parseInt(e.target.value, 10))}
          aria-label="Scrub through robot history"
          className="h-2 w-full cursor-grab accent-pcb active:cursor-grabbing"
        />
      </div>
    </WidgetShell>
  );
}
