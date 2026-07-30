import { useRef, useState } from 'react';
import { Home, Layers, Eye, Grid3x3, Box } from 'lucide-react';
import Stage3D from './shared/Stage3D';
import WidgetShell from './shared/WidgetShell';
import RobotBench from './bench/RobotBench';
import { ARIA_PARTS, SYSTEMS, SYSTEM_ORDER, PART_BY_ID } from './bench/ariaParts';

/**
 * The Bench — Module 2's main surface, and the one screen the rest of the
 * course keeps coming back to.
 *
 * Which controls appear is decided by the lesson JSON (`controls`), so the
 * same component is the gentle first look, the systems lesson and the
 * exploded view without three near-identical copies existing.
 */

const VIEWS = [
  { id: 'solid', label: 'Solid', Icon: Box },
  { id: 'xray', label: 'X-ray', Icon: Eye },
  { id: 'wire', label: 'Wire', Icon: Grid3x3 },
];

export default function RobotBenchWidget({ block }) {
  const controls = block?.controls || [];
  const showSystems = controls.includes('systems');
  const showExplode = controls.includes('explode');
  const showViews = controls.includes('views');

  const explodeRef = useRef(0);
  const [viewMode, setViewMode] = useState('solid');
  const [highlightSystem, setHighlightSystem] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [isolatedId, setIsolatedId] = useState(null);
  const [seen, setSeen] = useState(() => new Set());
  const [resetToken, setResetToken] = useState(0);

  const selected = selectedId ? PART_BY_ID[selectedId] : null;
  const hovered = hoveredId ? PART_BY_ID[hoveredId] : null;

  const handleSelect = (id) => {
    setSelectedId(id);
    setIsolatedId(null);
    if (id) setSeen((prev) => new Set(prev).add(id));
  };

  // Both of these are reading material about whatever is on the bench, so on a
  // wide pane they belong beside her rather than under her — see WidgetShell.
  const rail = (
    <>
      {showSystems && (
        <div className="flex flex-wrap gap-2 border-b-2 border-ink/10 p-3">
          {SYSTEM_ORDER.map((key) => {
            const sys = SYSTEMS[key];
            const on = highlightSystem === key;
            return (
              <button
                key={key}
                onClick={() => setHighlightSystem(on ? null : key)}
                className={`flex items-center gap-1.5 rounded-xl border-2 px-3 py-1.5 text-sm font-bold transition-all active:scale-95 ${
                  on ? 'border-ink text-ink shadow-[2px_2px_0_rgba(22,36,29,0.9)]' : 'border-ink/15 bg-white text-ink/60 hover:border-ink/40'
                }`}
                style={on ? { background: sys.color } : undefined}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full ring-1 ring-ink/20"
                  style={{ background: sys.color }}
                />
                {sys.label}
              </button>
            );
          })}
          {highlightSystem && (
            <span className="flex items-center text-sm font-semibold text-ink/60">
              {SYSTEMS[highlightSystem].blurb}
            </span>
          )}
        </div>
      )}

      {/* The card for the selected part */}
      <div className="p-4">
        {selected ? (
          <div className="animate-slide-up">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h3 className="font-lab text-xl font-extrabold text-ink">{selected.label}</h3>
              <span
                className="inline-flex items-center gap-1 rounded-md border-2 border-ink px-2 py-0.5 text-[11px] font-bold text-ink"
                style={{ background: SYSTEMS[selected.system].color }}
              >
                {SYSTEMS[selected.system].emoji} {SYSTEMS[selected.system].label}
              </span>
            </div>
            <p className="mb-2 font-semibold text-ink/75">{selected.blurb}</p>
            <p className="text-sm font-medium text-ink/60">{selected.detail}</p>
            <button
              onClick={() => setIsolatedId(isolatedId === selected.id ? null : selected.id)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border-2 border-ink/20 bg-white px-3 py-1.5 text-xs font-bold text-ink/70 transition-colors hover:border-ink hover:text-ink"
            >
              <Eye className="h-3.5 w-3.5" />
              {isolatedId === selected.id ? 'Show everything again' : 'Show only this part'}
            </button>
          </div>
        ) : (
          <p className="py-2 text-center text-sm font-semibold text-ink/45">
            Click any part of the robot to find out what it does.
          </p>
        )}
      </div>
    </>
  );

  return (
    <WidgetShell
      title={block?.title || '🤖 The Bench'}
      hint={`Clicked ${seen.size} of ${ARIA_PARTS.length} parts. ${block?.hint || 'Drag to spin her round. Every part is clickable.'}`}
      controls={
        <div className="flex items-center gap-2">
          {showViews && (
            <div className="flex overflow-hidden rounded-lg border-2 border-ink">
              {VIEWS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setViewMode(id)}
                  title={label}
                  className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold transition-colors ${
                    viewMode === id ? 'bg-ink text-white' : 'bg-white text-ink/65 hover:bg-ink/5'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" /> {label}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => { setResetToken((t) => t + 1); setIsolatedId(null); }}
            title="Put the camera back"
            className="inline-flex items-center gap-1.5 rounded-lg border-2 border-ink/20 bg-white px-3 py-1.5 text-sm font-bold text-ink transition-colors hover:border-ink"
          >
            <Home className="h-4 w-4" />
          </button>
        </div>
      }
      side={rail}
      footer={showExplode && (
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <label className="flex flex-1 items-center gap-3 text-sm font-bold text-ink/70">
            <Layers className="h-4 w-4 shrink-0" /> Take her apart
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              defaultValue="0"
              onChange={(e) => { explodeRef.current = parseFloat(e.target.value); }}
              className="h-2 flex-1 cursor-pointer accent-pcb"
              aria-label="Exploded view amount"
            />
          </label>
        </div>
      )}
    >
      <div className="relative">
        <Stage3D
          camera={{ position: [0.72, 0.5, 0.82], fov: 42 }}
          height="h-[340px] sm:h-[420px] @min-[68rem]:h-[min(64vh,680px)]"
          fallback="ARIA has fourteen parts in six systems: power, brain, movement, senses, signals and frame."
        >
          <RobotBench
            explodeRef={explodeRef}
            viewMode={viewMode}
            highlightSystem={highlightSystem}
            isolatedId={isolatedId}
            hoveredId={hoveredId}
            selectedId={selectedId}
            resetToken={resetToken}
            onSelect={handleSelect}
            onHover={setHoveredId}
          />
        </Stage3D>

        {/* Name of whatever is under the cursor */}
        {hovered && (
          <span className="pointer-events-none absolute left-3 top-3 rounded-md border-2 border-ink bg-white/95 px-2 py-1 font-mono-lab text-xs font-bold text-ink">
            {hovered.label}
          </span>
        )}
      </div>
    </WidgetShell>
  );
}
