import { useState } from 'react';
import { Flame } from 'lucide-react';
import WidgetShell from './shared/WidgetShell';

/**
 * The H-bridge as four tappable switches on a diamond, exactly as the
 * blueprint asks for. Direction is derived from which diagonal pair is
 * closed; closing a same-side pair is the short-circuit callback to
 * Module 3, on purpose — the same failure, a different part.
 */
function Switch({ id, x, y, closed, onToggle }) {
  return (
    <g style={{ cursor: 'pointer' }} onClick={() => onToggle(id)}>
      <circle cx={x} cy={y} r="14" fill={closed ? '#1F7A5C' : 'white'} stroke="#16241D" strokeWidth="2.5" />
      <text x={x} y={y + 4} textAnchor="middle" fontSize="11" fontWeight="800" fill={closed ? 'white' : '#16241D'}>
        {id}
      </text>
    </g>
  );
}

export default function HBridge({ block }) {
  const { title = '🔀 The H-Bridge', hint } = block || {};
  const [sw, setSw] = useState({ A: false, B: false, C: false, D: false });

  const toggle = (k) => setSw((s) => ({ ...s, [k]: !s[k] }));

  const forward = sw.A && sw.D && !sw.B && !sw.C;
  const reverse = sw.B && sw.C && !sw.A && !sw.D;
  const shorted = (sw.A && sw.B) || (sw.C && sw.D);
  const spinning = forward || reverse;

  let status = 'Motor stopped (coasting)';
  if (shorted) status = 'SHORT CIRCUIT — same-side switches closed';
  else if (forward) status = 'Motor spins forward';
  else if (reverse) status = 'Motor spins reverse';
  else if (Object.values(sw).some(Boolean)) status = 'Incomplete path — motor stays stopped';

  return (
    <WidgetShell title={title} hint={hint}>
      <div className="p-4">
        <svg viewBox="0 0 220 220" className="mx-auto w-full max-w-[320px]">
          {/* rails */}
          <line x1="30" y1="30" x2="190" y2="30" stroke="#16241D" strokeWidth="3" />
          <line x1="30" y1="190" x2="190" y2="190" stroke="#16241D" strokeWidth="3" />
          <line x1="30" y1="30" x2="30" y2="190" stroke="#16241D" strokeWidth="3" />
          <line x1="190" y1="30" x2="190" y2="190" stroke="#16241D" strokeWidth="3" />
          <text x="10" y="16" fontSize="10" fontWeight="700" fill="#16241D">+</text>
          <text x="10" y="204" fontSize="10" fontWeight="700" fill="#16241D">−</text>

          {/* switch legs */}
          <line x1="30" y1="30" x2="60" y2="65" stroke="#16241D" strokeWidth="2.5" />
          <line x1="190" y1="30" x2="160" y2="65" stroke="#16241D" strokeWidth="2.5" />
          <line x1="30" y1="190" x2="60" y2="155" stroke="#16241D" strokeWidth="2.5" />
          <line x1="190" y1="190" x2="160" y2="155" stroke="#16241D" strokeWidth="2.5" />
          <line x1="60" y1="65" x2="95" y2="110" stroke="#16241D" strokeWidth="2.5" />
          <line x1="160" y1="65" x2="125" y2="110" stroke="#16241D" strokeWidth="2.5" />
          <line x1="60" y1="155" x2="95" y2="110" stroke="#16241D" strokeWidth="2.5" />
          <line x1="160" y1="155" x2="125" y2="110" stroke="#16241D" strokeWidth="2.5" />

          <Switch id="A" x={60} y={65} closed={sw.A} onToggle={toggle} />
          <Switch id="B" x={160} y={65} closed={sw.B} onToggle={toggle} />
          <Switch id="C" x={60} y={155} closed={sw.C} onToggle={toggle} />
          <Switch id="D" x={160} y={155} closed={sw.D} onToggle={toggle} />

          {/* motor */}
          <circle cx="110" cy="110" r="26" fill="none" stroke="#16241D" strokeWidth="3" />
          <g
            style={{
              transformOrigin: '110px 110px',
              animation: spinning ? `hbspin ${0.6}s linear infinite ${reverse ? 'reverse' : ''}` : 'none',
            }}
          >
            <line x1="110" y1="90" x2="110" y2="130" stroke="#16241D" strokeWidth="2" />
            <line x1="90" y1="110" x2="130" y2="110" stroke="#16241D" strokeWidth="2" />
          </g>

          {shorted && (
            <g>
              <text x="110" y="115" textAnchor="middle" fontSize="20" fontWeight="900" fill="#E8503A">✕</text>
            </g>
          )}
        </svg>

        <p className={`mt-2 flex items-center justify-center gap-2 text-center font-mono-lab text-sm font-bold ${shorted ? 'text-wire' : 'text-pcb'}`}>
          {shorted && <Flame className="h-4 w-4" />} {status}
        </p>
        <p className="mt-3 text-center text-sm font-semibold text-ink/60">
          Forward: close A + D. Reverse: close B + C. Never close two on the same side.
        </p>
      </div>
      <style>{`@keyframes hbspin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </WidgetShell>
  );
}
