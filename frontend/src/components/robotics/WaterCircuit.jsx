import { useMemo, useState } from 'react';
import WidgetShell from './shared/WidgetShell';

/**
 * The water analogy, split-screen, both sides driven by the same two numbers.
 *
 * Tank height stands in for voltage, pipe width for resistance (wider pipe =
 * less resistance, same as a fatter wire). Flow rate is current, computed the
 * same way on both sides — I = V/R — so dragging one slider visibly moves
 * both the water and the electrons together instead of two separate demos
 * that merely look similar.
 */
export default function WaterCircuit({ block }) {
  const { title = '💧 The Water Analogy', hint } = block || {};
  const [voltage, setVoltage] = useState(6);
  const [resistance, setResistance] = useState(5);

  const flow = useMemo(() => voltage / resistance, [voltage, resistance]);
  const pipeWidth = 14 + (10 - resistance) * 3.2; // wider pipe → less resistance
  const dashSpeed = Math.max(0.25, 1.6 - flow * 0.35); // faster flow → shorter duration
  const tankLevel = 10 + voltage * 7;

  return (
    <WidgetShell title={title} hint={hint}>
      <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
        {/* Water side */}
        <div className="rounded-2xl border-2 border-ink/12 bg-paper/60 p-3">
          <p className="mb-2 text-center font-mono-lab text-xs font-bold uppercase tracking-wide text-ink/50">
            Water
          </p>
          <svg viewBox="0 0 220 160" className="w-full">
            {/* tank */}
            <rect x="10" y="10" width="50" height="130" rx="4" fill="none" stroke="#16241D" strokeWidth="3" />
            <rect
              x="12"
              y={140 - tankLevel}
              width="46"
              height={tankLevel}
              fill="#23B5D3"
              opacity="0.55"
              className="transition-all duration-300"
            />
            {/* pipe */}
            <rect
              x="60"
              y={95 - pipeWidth / 2}
              width="120"
              height={pipeWidth}
              fill="#23B5D3"
              opacity="0.35"
              className="transition-all duration-300"
            />
            <rect x="60" y={95 - pipeWidth / 2} width="120" height={pipeWidth} fill="none" stroke="#16241D" strokeWidth="2" className="transition-all duration-300" />
            {/* flow dashes */}
            <line
              x1="65" y1="95" x2="175" y2="95"
              stroke="#1F7A5C" strokeWidth="4" strokeDasharray="8 10" strokeLinecap="round"
              style={{ animation: `waterflow ${dashSpeed}s linear infinite` }}
            />
            {/* wheel (waterwheel = the load) */}
            <circle cx="195" cy="95" r="22" fill="none" stroke="#16241D" strokeWidth="3" />
            <g style={{ transformOrigin: '195px 95px', animation: `spin ${Math.max(0.4, 2.4 - flow * 0.5)}s linear infinite` }}>
              <line x1="195" y1="75" x2="195" y2="115" stroke="#16241D" strokeWidth="2" />
              <line x1="175" y1="95" x2="215" y2="95" stroke="#16241D" strokeWidth="2" />
            </g>
          </svg>
          <p className="mt-2 text-center font-mono-lab text-sm font-bold text-pcb">
            flow ≈ {flow.toFixed(1)} L/s
          </p>
        </div>

        {/* Electricity side */}
        <div className="rounded-2xl border-2 border-ink/12 bg-paper/60 p-3">
          <p className="mb-2 text-center font-mono-lab text-xs font-bold uppercase tracking-wide text-ink/50">
            Electricity
          </p>
          <svg viewBox="0 0 220 160" className="w-full">
            {/* battery */}
            <rect x="15" y="55" width="18" height="80" rx="2" fill="none" stroke="#16241D" strokeWidth="3" />
            <rect
              x="17"
              y={135 - tankLevel * 0.55}
              width="14"
              height={tankLevel * 0.55}
              fill="#FFC93C"
              className="transition-all duration-300"
            />
            <text x="24" y="50" textAnchor="middle" fontSize="10" fontWeight="700" fill="#16241D">+</text>
            {/* wire top */}
            <path d="M24 55 L24 30 L195 30 L195 60" fill="none" stroke="#16241D" strokeWidth="3" />
            {/* resistor (zig-zag, width = wire "thickness" analog via stroke) */}
            <path
              d={`M60 95 L${70} ${95 - pipeWidth / 6} L${80} ${95 + pipeWidth / 6} L${90} ${95 - pipeWidth / 6} L${100} ${95 + pipeWidth / 6} L${110} ${95 - pipeWidth / 6} L120 95`}
              fill="none" stroke="#E8503A" strokeWidth="3" strokeLinejoin="round"
              className="transition-all duration-300"
            />
            <path d="M24 135 L24 150 L195 150 L195 130" fill="none" stroke="#16241D" strokeWidth="3" />
            <path d="M33 95 L60 95" fill="none" stroke="#16241D" strokeWidth="3" />
            <path d="M120 95 L165 95" fill="none" stroke="#16241D" strokeWidth="3" />
            {/* current dashes */}
            <path
              d="M24 30 L195 30 L195 60 M33 95 L60 95 M120 95 L165 95 M24 135 L24 150 L195 150 L195 130"
              fill="none" stroke="#FFC93C" strokeWidth="2" strokeDasharray="6 8" strokeLinecap="round"
              style={{ animation: `waterflow ${dashSpeed}s linear infinite` }}
            />
            {/* LED (the load) */}
            <circle
              cx="180" cy="95" r="18" fill="#23B5D3"
              opacity={Math.min(1, 0.15 + flow * 0.12)}
              style={{ filter: flow > 0.6 ? `drop-shadow(0 0 ${Math.min(10, flow * 2)}px #23B5D3)` : 'none' }}
              className="transition-all duration-300"
            />
            <circle cx="180" cy="95" r="18" fill="none" stroke="#16241D" strokeWidth="2" />
          </svg>
          <p className="mt-2 text-center font-mono-lab text-sm font-bold text-pcb">
            current ≈ {flow.toFixed(1)} A
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 border-t-2 border-ink/10 bg-white/60 p-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 flex justify-between text-xs font-bold uppercase tracking-wide text-ink/60">
            <span>Tank height (voltage)</span><span className="font-mono-lab text-pcb">{voltage} V</span>
          </span>
          <input
            type="range" min="1" max="12" step="1" value={voltage}
            onChange={(e) => setVoltage(Number(e.target.value))}
            className="h-2 w-full cursor-grab accent-pcb active:cursor-grabbing"
          />
        </label>
        <label className="block">
          <span className="mb-1 flex justify-between text-xs font-bold uppercase tracking-wide text-ink/60">
            <span>Pipe width (1 ÷ resistance)</span><span className="font-mono-lab text-pcb">{resistance} Ω</span>
          </span>
          <input
            type="range" min="1" max="10" step="1" value={resistance}
            onChange={(e) => setResistance(Number(e.target.value))}
            className="h-2 w-full cursor-grab accent-pcb active:cursor-grabbing"
          />
        </label>
      </div>
      <p className="border-t-2 border-ink/10 bg-paper/60 px-4 py-3 text-sm font-semibold text-ink/70">
        Raise the tank and the water pushes harder — that's more voltage. Widen the pipe and
        the water meets less resistance. Both sliders move both sides, because it's the same
        idea twice: <span className="font-mono-lab font-bold text-ink">flow = height ÷ narrowness</span>,
        or in the wire: <span className="font-mono-lab font-bold text-ink">I = V ÷ R</span>.
      </p>
      <style>{`
        @keyframes waterflow { from { stroke-dashoffset: 36; } to { stroke-dashoffset: 0; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </WidgetShell>
  );
}
