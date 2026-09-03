import { useState } from 'react';
import { Check, X } from 'lucide-react';
import WidgetShell from './shared/WidgetShell';

const W = 220, H = 60;

/**
 * A scripted (not computed) side-by-side: same broken-line track, two fixed
 * outcomes. Honest about being canned — the module's own deviation note
 * explains why (no real inference in the browser) — but the animation is
 * still real CSS motion, not just a static picture.
 */
export default function RulesVsLearning({ block }) {
  const { title = '🆚 Rules vs Learning', hint } = block || {};
  const [phase, setPhase] = useState('idle'); // idle | running | done

  const run = () => {
    setPhase('running');
    setTimeout(() => setPhase('done'), 1500);
  };
  const reset = () => setPhase('idle');

  const dashTrack = `M10 30 L90 30 M130 30 L${W - 10} 30`; // a gap between 90 and 130

  return (
    <WidgetShell title={title} hint={hint}>
      <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
        {[
          { key: 'rule', label: 'Rule-based', desc: '"if line is under the sensor, keep going straight"' },
          { key: 'learned', label: 'Learned', desc: 'trained on many tracks, including ones with gaps' },
        ].map((side) => (
          <div key={side.key} className="rounded-2xl border-2 border-ink/12 bg-paper/60 p-3">
            <p className="mb-1 font-lab text-sm font-extrabold text-ink">{side.label}</p>
            <p className="mb-2 text-xs font-semibold text-ink/50">{side.desc}</p>
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-lg border-2 border-ink/10 bg-[#0B180F]">
              <path d={dashTrack} stroke="#FFC93C" strokeWidth="4" fill="none" opacity="0.7" />
              <circle
                cy="30"
                r="7"
                fill={side.key === 'rule' ? '#E8503A' : '#23B5D3'}
                cx={
                  phase === 'idle' ? 15
                    : side.key === 'rule'
                      ? (phase === 'running' ? 92 : 92)
                      : (phase === 'running' ? W - 15 : W - 15)
                }
                style={{ transition: phase === 'running' ? `cx ${side.key === 'rule' ? '0.6s' : '1.4s'} ease-out` : 'none' }}
              />
            </svg>
            <div className="mt-2 min-h-[1.5rem]">
              {phase === 'done' && side.key === 'rule' && (
                <p className="flex items-center gap-1.5 text-xs font-bold text-wire"><X className="h-4 w-4" /> lost the line at the gap, stopped</p>
              )}
              {phase === 'done' && side.key === 'learned' && (
                <p className="flex items-center gap-1.5 text-xs font-bold text-pcb"><Check className="h-4 w-4" /> predicted the line continued, kept going</p>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t-2 border-ink/10 bg-white/60 p-4">
        <button
          onClick={phase === 'done' ? reset : run}
          disabled={phase === 'running'}
          className="lab-btn w-full rounded-xl border-2 border-ink bg-signal px-6 py-2.5 font-extrabold text-ink disabled:opacity-60"
        >
          {phase === 'done' ? 'Run again' : phase === 'running' ? 'Running…' : 'Run both'}
        </button>
      </div>
    </WidgetShell>
  );
}
