import { useState } from 'react';
import WidgetShell from './shared/WidgetShell';

const MAX_EVENTS = 14;

/**
 * HIGH/LOW as a light switch, with a trace that remembers your last taps.
 *
 * The trace is event-based (one step per click), not a real-time scroll off
 * a rAF loop — a click history reads just as clearly as continuous time here,
 * and it means this can be a plain DOM widget with zero animation-frame cost
 * while it sits off-screen in a long lesson.
 */
export default function DigitalSignal({ block }) {
  const { title = '📶 HIGH or LOW', hint } = block || {};
  const [level, setLevel] = useState(0);
  const [history, setHistory] = useState([0]);

  const toggle = () => {
    const next = level ? 0 : 1;
    setLevel(next);
    setHistory((h) => [...h, next].slice(-MAX_EVENTS));
  };

  const W = 280, H = 70, step = W / (MAX_EVENTS - 1);
  const pts = history.map((lvl, i) => {
    const x = i * step;
    const y = lvl ? 16 : H - 16;
    return { x, y };
  });
  let d = '';
  pts.forEach((p, i) => {
    if (i === 0) { d += `M${p.x} ${p.y}`; return; }
    const prev = pts[i - 1];
    d += ` L${p.x} ${prev.y} L${p.x} ${p.y}`;
  });
  // pad the trailing edge out to the current level
  d += ` L${W} ${pts.length ? pts[pts.length - 1].y : H - 16}`;

  return (
    <WidgetShell title={title} hint={hint}>
      <div className="p-4">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-xl border-2 border-ink/12 bg-[#0B180F]">
          <line x1="0" y1={H - 16} x2={W} y2={H - 16} stroke="#ffffff20" strokeWidth="1" />
          <line x1="0" y1="16" x2={W} y2="16" stroke="#ffffff20" strokeWidth="1" />
          <text x="4" y="12" fontSize="8" fill="#ffffff60" fontFamily="monospace">HIGH</text>
          <text x="4" y={H - 4} fontSize="8" fill="#ffffff60" fontFamily="monospace">LOW</text>
          <path d={d} fill="none" stroke="#23B5D3" strokeWidth="2.5" strokeLinejoin="round" />
        </svg>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={toggle}
            className={`rounded-2xl border-2 border-ink px-6 py-3 font-extrabold transition-colors ${
              level ? 'bg-signal text-ink' : 'bg-white text-ink/70'
            }`}
          >
            Pin is {level ? 'HIGH (3.3V)' : 'LOW (0V)'} — tap to flip
          </button>
          <div className="flex items-center gap-2">
            <span
              className="h-8 w-8 rounded-full border-2 border-ink transition-all"
              style={{
                backgroundColor: level ? '#23B5D3' : '#16241D',
                boxShadow: level ? '0 0 12px #23B5D3' : 'none',
              }}
            />
            <span className="text-sm font-bold text-ink/60">onboard LED</span>
          </div>
        </div>

        <p className="mt-3 text-center text-sm font-semibold text-ink/60">
          A GPIO pin only ever reports one of two states — there's no "in between" reading.
        </p>
      </div>
    </WidgetShell>
  );
}
