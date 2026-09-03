import { useMemo, useState } from 'react';
import WidgetShell from './shared/WidgetShell';

/**
 * Voltage + load, computed into RPM and current the way a real DC motor
 * behaves: torque available scales with voltage, and cranking the load past
 * what that voltage can supply stalls the rotor and spikes the current
 * instead of just slowing down smoothly. That stall is the whole teaching
 * point — "this is how motors burn out."
 */
export default function MotorBench({ block }) {
  const { title = '⚙️ DC Motor Bench', hint } = block || {};
  const [voltage, setVoltage] = useState(6);
  const [load, setLoad] = useState(30);
  const [reverse, setReverse] = useState(false);

  const { rpm, current, stalled } = useMemo(() => {
    const maxTorque = voltage * 3;
    const requiredTorque = load * 0.3;
    if (requiredTorque > maxTorque) {
      return { rpm: 0, current: 2.4 + load * 0.01, stalled: true };
    }
    const fraction = maxTorque > 0 ? requiredTorque / maxTorque : 0;
    return {
      rpm: Math.round(voltage * 400 * (1 - fraction * 0.6)),
      current: 0.15 + fraction * 0.9,
      stalled: false,
    };
  }, [voltage, load]);

  const spinDuration = rpm > 0 ? Math.max(0.15, 60 / rpm) : 0;
  const currentPct = Math.min(1, current / 2.5);

  return (
    <WidgetShell title={title} hint={hint}>
      <div className="p-4">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
          <svg viewBox="0 0 140 140" className="w-36 shrink-0">
            <circle cx="70" cy="70" r="50" fill="none" stroke="#16241D" strokeWidth="4" />
            <circle cx="70" cy="70" r="50" fill={stalled ? '#E8503A22' : '#1F7A5C11'} />
            <g
              style={{
                transformOrigin: '70px 70px',
                animation: rpm > 0 ? `motorspin ${spinDuration}s linear infinite ${reverse ? 'reverse' : ''}` : 'none',
              }}
            >
              <line x1="70" y1="24" x2="70" y2="116" stroke="#16241D" strokeWidth="4" />
              <line x1="24" y1="70" x2="116" y2="70" stroke="#16241D" strokeWidth="4" />
              <circle cx="70" cy="70" r="6" fill="#16241D" />
            </g>
          </svg>

          <div className="flex flex-col gap-2 text-center sm:text-left">
            <p className="font-mono-lab text-lg font-extrabold text-pcb">
              {stalled ? 'STALLED' : `${rpm} RPM`}
            </p>
            <div className="h-2.5 w-40 overflow-hidden rounded-full border border-ink/20 bg-white">
              <div
                className={`h-full transition-all ${stalled ? 'bg-wire' : 'bg-signal'}`}
                style={{ width: `${currentPct * 100}%` }}
              />
            </div>
            <p className="font-mono-lab text-xs font-bold text-ink/60">{current.toFixed(2)} A drawn</p>
            {stalled && <p className="text-xs font-bold text-wire">too much load for this voltage — current spikes, motor can't turn</p>}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 flex justify-between text-xs font-bold uppercase tracking-wide text-ink/60">
              <span>Voltage</span><span className="font-mono-lab text-pcb">{voltage} V</span>
            </span>
            <input type="range" min="0" max="12" step="1" value={voltage}
              onChange={(e) => setVoltage(Number(e.target.value))}
              className="h-2 w-full cursor-grab accent-pcb active:cursor-grabbing" />
          </label>
          <label className="block">
            <span className="mb-1 flex justify-between text-xs font-bold uppercase tracking-wide text-ink/60">
              <span>Load</span><span className="font-mono-lab text-pcb">{load}%</span>
            </span>
            <input type="range" min="0" max="100" step="5" value={load}
              onChange={(e) => setLoad(Number(e.target.value))}
              className="h-2 w-full cursor-grab accent-pcb active:cursor-grabbing" />
          </label>
        </div>
        <button
          onClick={() => setReverse((r) => !r)}
          className="mt-4 w-full rounded-xl border-2 border-ink bg-white px-4 py-2 text-sm font-bold text-ink"
        >
          Direction: {reverse ? 'Reverse' : 'Forward'}
        </button>
      </div>
      <style>{`@keyframes motorspin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </WidgetShell>
  );
}
