import { useMemo, useState } from 'react';
import WidgetShell from './shared/WidgetShell';

/**
 * Duty-cycle slider drives both an LED and the square wave underneath it.
 *
 * The "aha" is built with one CSS trick rather than a rAF loop: a keyframe
 * animation whose stops sit right at `duty%` (with a hair's gap so the
 * browser doesn't interpolate across the edge) snaps the LED between full
 * and near-off exactly like a real PWM pin does — no JS ticking required.
 * At a high frequency the flips are too fast to track and it reads as a
 * dimmed steady glow; drag frequency down to ~1Hz and the illusion breaks
 * into visible blinking, which is the whole point of the lesson.
 */
export default function PwmSim({ block }) {
  const { title = '🔆 PWM: Fake Brightness', hint } = block || {};
  const [duty, setDuty] = useState(50);
  const [freq, setFreq] = useState(20);

  const period = 1 / freq;
  const eps = Math.min(1, duty * 0.02);
  const animName = 'pwmDuty';

  const keyframes = useMemo(() => {
    const d = Math.max(1, Math.min(99, duty));
    return `
      @keyframes ${animName} {
        0% { opacity: 1; }
        ${Math.max(0, d - eps).toFixed(2)}% { opacity: 1; }
        ${d.toFixed(2)}% { opacity: 0.08; }
        100% { opacity: 0.08; }
      }
    `;
  }, [duty, eps]);

  // static square-wave picture of the current setting, one period wide
  const W = 260, H = 70, highY = 14, lowY = H - 14;
  const highW = (duty / 100) * W;
  const wave = `M0 ${highY} L${highW} ${highY} L${highW} ${lowY} L${W} ${lowY}`;

  return (
    <WidgetShell title={title} hint={hint}>
      <div className="p-4">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <div
            className="h-20 w-20 shrink-0 rounded-full border-2 border-ink"
            style={{
              backgroundColor: '#23B5D3',
              animation: duty === 0 ? 'none' : duty === 100 ? 'none' : `${animName} ${period}s steps(1,jump-none) infinite`,
              opacity: duty === 0 ? 0.08 : duty === 100 ? 1 : undefined,
              boxShadow: duty > 0 ? '0 0 16px #23B5D3' : 'none',
            }}
          />
          <div className="min-w-0 flex-1">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-xl border-2 border-ink/12 bg-[#0B180F]">
              <text x="4" y="12" fontSize="8" fill="#ffffff60" fontFamily="monospace">HIGH</text>
              <text x="4" y={H - 4} fontSize="8" fill="#ffffff60" fontFamily="monospace">LOW</text>
              <path d={wave} fill="none" stroke="#FFC93C" strokeWidth="2.5" strokeLinejoin="round" />
            </svg>
            <p className="mt-1 text-center font-mono-lab text-xs text-ink/50">one period, drawn to scale</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 flex justify-between text-xs font-bold uppercase tracking-wide text-ink/60">
              <span>Duty cycle</span><span className="font-mono-lab text-pcb">{duty}%</span>
            </span>
            <input
              type="range" min="0" max="100" step="1" value={duty}
              onChange={(e) => setDuty(Number(e.target.value))}
              className="h-2 w-full cursor-grab accent-pcb active:cursor-grabbing"
            />
          </label>
          <label className="block">
            <span className="mb-1 flex justify-between text-xs font-bold uppercase tracking-wide text-ink/60">
              <span>Frequency</span><span className="font-mono-lab text-pcb">{freq} Hz</span>
            </span>
            <input
              type="range" min="1" max="40" step="1" value={freq}
              onChange={(e) => setFreq(Number(e.target.value))}
              className="h-2 w-full cursor-grab accent-pcb active:cursor-grabbing"
            />
          </label>
        </div>
        <p className="mt-3 text-center text-sm font-semibold text-ink/60">
          {freq <= 3
            ? "Slow enough to see: that's not really a dimmer LED, it's a fast blinker."
            : 'At this speed the flicker blends into what looks like a steady, dimmed brightness.'}
        </p>
      </div>
      <style>{keyframes}</style>
    </WidgetShell>
  );
}
