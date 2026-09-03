import { useState } from 'react';
import { Zap, Flame } from 'lucide-react';
import { awardXPOnce } from '../../lib/progress';
import WidgetShell from './shared/WidgetShell';

const LED_VF = 2; // forward voltage drop, volts
const LED_RATED_MA = 20;

/** I = (V - Vf) / R, clamped to 0 when the path can't carry current. */
function currentMa(voltage, ohms, { closed = true, shorted = false, reversed = false } = {}) {
  if (!closed || shorted || reversed || ohms <= 0) return 0;
  const i = Math.max(0, (voltage - LED_VF) / ohms) * 1000;
  return i;
}

function Led({ x, y, brightness, dead, label }) {
  const glow = Math.min(1, brightness / LED_RATED_MA);
  return (
    <g>
      <circle
        cx={x} cy={y} r="17"
        fill={dead ? '#16241D' : '#23B5D3'}
        opacity={dead ? 0.12 : Math.min(1, 0.18 + glow * 0.9)}
        style={{ filter: !dead && glow > 0.15 ? `drop-shadow(0 0 ${Math.min(9, glow * 10)}px #23B5D3)` : 'none', transition: 'all .25s' }}
      />
      <circle cx={x} cy={y} r="17" fill="none" stroke="#16241D" strokeWidth="2" />
      {label && <text x={x} y={y + 32} textAnchor="middle" fontSize="10" fontWeight="700" fill="#16241D">{label}</text>}
    </g>
  );
}

function Wire({ d, live, ma }) {
  const speed = Math.max(0.2, 1.4 - ma / 40);
  return (
    <g>
      <path d={d} fill="none" stroke="#16241D" strokeWidth="3" />
      {live && (
        <path d={d} fill="none" stroke="#FFC93C" strokeWidth="2" strokeDasharray="6 8" strokeLinecap="round"
          style={{ animation: `csflow ${speed}s linear infinite` }} />
      )}
    </g>
  );
}

export default function CircuitSandbox({ block }) {
  const {
    title = '🔋 Circuit Sandbox',
    hint,
    mode = 'basic',
    voltage = 9,
    xp = 15,
    xpKey,
  } = block || {};

  const [closed, setClosed] = useState(true);
  const [resistance, setResistance] = useState(300);
  const [scenario, setScenario] = useState('normal'); // normal | shorted | reversed
  const [wiring, setWiring] = useState('series'); // series | parallel
  const [visited, setVisited] = useState(() => new Set(mode === 'basic' ? [] : []));
  const [earned, setEarned] = useState(0);

  const markVisited = (key) => setVisited((v) => (v.has(key) ? v : new Set(v).add(key)));

  const requiredMilestones = mode === 'short-reverse' ? ['normal', 'shorted', 'reversed']
    : mode === 'series-parallel' ? ['series', 'parallel']
    : ['lit'];
  const allVisited = requiredMilestones.every((m) => visited.has(m));

  if (allVisited && xpKey && earned === 0) {
    // fire once, on the render that first satisfies it
    const got = awardXPOnce(xpKey, xp);
    if (got) setEarned(got);
  }

  // ---- basic mode ----
  const basicMa = currentMa(voltage, resistance, { closed });
  const basicBrightness = Math.min(1, basicMa / LED_RATED_MA);

  // ---- short/reverse mode ----
  const srShorted = scenario === 'shorted';
  const srReversed = scenario === 'reversed';
  const srMa = currentMa(voltage, 220, { closed: true, shorted: srShorted, reversed: srReversed });

  // ---- series/parallel mode ----
  const R_EACH = 220;
  const seriesMa = currentMa(voltage, R_EACH * 2, { closed: true });
  const parallelMaEach = currentMa(voltage, R_EACH, { closed: true });

  const onSlider = (v) => {
    setResistance(v);
    const ma = currentMa(voltage, v, { closed });
    if (closed && ma / LED_RATED_MA > 0.85) markVisited('lit');
  };
  const onToggleClosed = () => {
    const next = !closed;
    setClosed(next);
    const ma = currentMa(voltage, resistance, { closed: next });
    if (next && ma / LED_RATED_MA > 0.85) markVisited('lit');
  };
  const onScenario = (s) => { setScenario(s); markVisited(s); };
  const onWiring = (w) => { setWiring(w); markVisited(w); };

  const footer = xpKey && (
    <p className="mb-1 text-sm font-bold text-pcb">
      {allVisited ? `All checked ✓${earned ? ` · +${earned} XP` : ''}` : 'Try every control to earn XP.'}
    </p>
  );

  return (
    <WidgetShell title={title} hint={hint} footer={footer}>
      <div className="p-4">
        {mode === 'basic' && (
          <>
            <svg viewBox="0 0 240 130" className="mx-auto w-full max-w-[420px]">
              <rect x="14" y="45" width="16" height="40" rx="2" fill="none" stroke="#16241D" strokeWidth="3" />
              <rect x="16" y="65" width="12" height="18" fill="#FFC93C" />
              <text x="22" y="42" textAnchor="middle" fontSize="10" fontWeight="700" fill="#16241D">+</text>
              <Wire d="M22 45 L22 20 L120 20" live={closed} ma={basicMa} />
              {/* switch */}
              <circle cx="120" cy="20" r="3" fill="#16241D" />
              <circle cx="150" cy="20" r="3" fill="#16241D" />
              <line
                x1="120" y1="20"
                x2={closed ? 150 : 140}
                y2={closed ? 20 : 8}
                stroke="#E8503A" strokeWidth="3" strokeLinecap="round"
              />
              <Wire d="M150 20 L200 20 L200 78" live={closed} ma={basicMa} />
              <Led x={200} y={95} brightness={basicMa} dead={!closed} />
              <Wire d="M200 112 L200 130 L22 130 L22 85" live={closed} ma={basicMa} />
              {/* resistor */}
              <path d="M60 130 L68 116 L76 130 L84 116 L92 130 L100 116 L108 130" fill="none" stroke="#E8503A" strokeWidth="3" strokeLinejoin="round" />
            </svg>
            <p className="mt-2 text-center font-mono-lab text-sm font-bold text-pcb">
              {closed ? `${basicMa.toFixed(0)} mA · ${(basicBrightness * 100).toFixed(0)}% brightness` : 'switch open · 0 mA'}
            </p>
            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
              <button
                onClick={onToggleClosed}
                className={`inline-flex items-center justify-center gap-2 rounded-xl border-2 border-ink px-4 py-2 text-sm font-bold ${closed ? 'bg-pcb text-white' : 'bg-white text-ink'}`}
              >
                <Zap className="h-4 w-4" /> Switch: {closed ? 'Closed' : 'Open'}
              </button>
              <label className="block flex-1">
                <span className="mb-1 flex justify-between text-xs font-bold uppercase tracking-wide text-ink/60">
                  <span>Resistor</span><span className="font-mono-lab text-pcb">{resistance} Ω</span>
                </span>
                <input
                  type="range" min="100" max="1000" step="20" value={resistance}
                  onChange={(e) => onSlider(Number(e.target.value))}
                  className="h-2 w-full cursor-grab accent-pcb active:cursor-grabbing"
                />
              </label>
            </div>
          </>
        )}

        {mode === 'short-reverse' && (
          <>
            <svg viewBox="0 0 240 130" className="mx-auto w-full max-w-[420px]">
              <rect x="14" y="45" width="16" height="40" rx="2" fill="none" stroke="#16241D" strokeWidth="3" />
              <rect x="16" y="65" width="12" height="18" fill="#FFC93C" />
              <Wire d="M22 45 L22 20 L200 20 L200 78" live ma={srMa} />
              {srReversed ? (
                <g>
                  <circle cx="200" cy="95" r="17" fill="#16241D" opacity="0.12" />
                  <circle cx="200" cy="95" r="17" fill="none" stroke="#E8503A" strokeWidth="2" />
                  <text x="200" y="100" textAnchor="middle" fontSize="14" fontWeight="900" fill="#E8503A">✕</text>
                </g>
              ) : (
                <Led x={200} y={95} brightness={srMa} dead={srShorted} />
              )}
              {srShorted && (
                <path d="M182 78 Q200 60 218 78" fill="none" stroke="#E8503A" strokeWidth="3" strokeDasharray="4 4">
                  <animate attributeName="stroke-dashoffset" from="16" to="0" dur="0.5s" repeatCount="indefinite" />
                </path>
              )}
              <Wire d="M200 112 L200 130 L22 130 L22 85" live ma={srMa} />
              <path d="M60 130 L68 116 L76 130 L84 116 L92 130 L100 116 L108 130" fill="none" stroke="#E8503A" strokeWidth="3" strokeLinejoin="round" />
            </svg>
            <p className="mt-2 flex items-center justify-center gap-2 text-center font-mono-lab text-sm font-bold text-pcb">
              {srShorted && <><Flame className="h-4 w-4 text-wire" /> current took the shortcut — LED gets nothing</>}
              {srReversed && 'no current flows backwards through a diode — flat edge = negative'}
              {scenario === 'normal' && `${srMa.toFixed(0)} mA · circuit is healthy`}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {[
                { id: 'normal', label: 'Normal' },
                { id: 'shorted', label: 'Add a shortcut wire' },
                { id: 'reversed', label: 'Flip the LED' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => onScenario(s.id)}
                  className={`rounded-xl border-2 border-ink px-3 py-2 text-sm font-bold ${scenario === s.id ? 'bg-signal text-ink' : 'bg-white text-ink/70'}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </>
        )}

        {mode === 'series-parallel' && (
          <>
            <div className="mb-4 flex justify-center gap-2">
              {['series', 'parallel'].map((w) => (
                <button
                  key={w}
                  onClick={() => onWiring(w)}
                  className={`rounded-xl border-2 border-ink px-4 py-2 text-sm font-bold capitalize ${wiring === w ? 'bg-signal text-ink' : 'bg-white text-ink/70'}`}
                >
                  {w}
                </button>
              ))}
            </div>
            {wiring === 'series' ? (
              <svg viewBox="0 0 260 130" className="mx-auto w-full max-w-[440px]">
                <rect x="14" y="45" width="16" height="40" rx="2" fill="none" stroke="#16241D" strokeWidth="3" />
                <rect x="16" y="65" width="12" height="18" fill="#FFC93C" />
                <Wire d="M22 45 L22 20 L230 20 L230 78" live ma={seriesMa} />
                <Led x={230} y={95} brightness={seriesMa} label="LED 1" />
                <Wire d="M230 112 L230 130 L150 130 L150 112" live ma={seriesMa} />
                <Led x={150} y={95} brightness={seriesMa} label="LED 2" />
                <Wire d="M150 78 L150 20" live ma={seriesMa} />
                <Wire d="M150 130 L22 130 L22 85" live ma={seriesMa} />
              </svg>
            ) : (
              <svg viewBox="0 0 260 130" className="mx-auto w-full max-w-[440px]">
                <rect x="14" y="45" width="16" height="40" rx="2" fill="none" stroke="#16241D" strokeWidth="3" />
                <rect x="16" y="65" width="12" height="18" fill="#FFC93C" />
                <Wire d="M22 45 L22 15 L230 15 L230 78" live ma={parallelMaEach} />
                <Led x={230} y={95} brightness={parallelMaEach} label="LED 1" />
                <Wire d="M150 15 L150 78" live ma={parallelMaEach} />
                <Led x={150} y={95} brightness={parallelMaEach} label="LED 2" />
                <Wire d="M230 112 L230 135 L22 135 L22 85" live ma={parallelMaEach} />
                <Wire d="M150 112 L150 135" live ma={parallelMaEach} />
              </svg>
            )}
            <p className="mt-2 text-center font-mono-lab text-sm font-bold text-pcb">
              {wiring === 'series'
                ? `${seriesMa.toFixed(0)} mA shared by both — each LED is dimmer`
                : `${parallelMaEach.toFixed(0)} mA through each — both LEDs at full brightness`}
            </p>
          </>
        )}
      </div>
      <style>{`@keyframes csflow { from { stroke-dashoffset: 28; } to { stroke-dashoffset: 0; } }`}</style>
    </WidgetShell>
  );
}
