import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Play, Pause, RotateCcw, CheckCircle2 } from 'lucide-react';
import Stage3D from './shared/Stage3D';
import WidgetShell from './shared/WidgetShell';
import useReducedMotion from './shared/useReducedMotion';
import { benchMat, brushedAlu } from './shared/labTextures';
import { ZOO } from './zoo/registry';

/**
 * The turntable, and the clock that drives whichever robot is standing on it.
 *
 * "Signature-move time" lives here, inside the canvas, in a ref: a robot that
 * re-rendered React sixty times a second would make the whole lesson stutter.
 * It only advances while playing, so pausing holds the pose rather than
 * snapping the arm back to its start.
 */
function ZooScene({ id, playing, spin, replayToken }) {
  const entry = ZOO[id];
  const group = useRef();
  const moveTime = useRef(0);
  const lastReplay = useRef(replayToken);

  useFrame((_, delta) => {
    const d = Math.min(delta, 0.05);
    if (lastReplay.current !== replayToken) {
      lastReplay.current = replayToken;
      moveTime.current = 0;
    }
    if (playing) moveTime.current += d;
    if (group.current && spin) group.current.rotation.y += d * 0.35;
  });

  if (!entry) return null;
  const { Model, scale, y } = entry;

  return (
    <>
      {/* Turntable plinth: a matted deck inside a machined rim, so the robot
          standing on it has a surface with a finish rather than a flat disc. */}
      <mesh position={[0, y - 0.03, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.95, 1, 0.06, 48]} />
        <meshStandardMaterial {...benchMat(5, 5)} roughness={0.92} metalness={0.05} />
      </mesh>
      <mesh position={[0, y - 0.028, 0]} receiveShadow>
        <cylinderGeometry args={[0.99, 0.99, 0.02, 48]} />
        <meshStandardMaterial {...brushedAlu(12, 1)} metalness={0.88} roughness={0.38} envMapIntensity={1.2} />
      </mesh>
      <mesh position={[0, y + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.84, 0.93, 48]} />
        <meshBasicMaterial color="#1F7A5C" toneMapped={false} />
      </mesh>

      <group ref={group}>
        <group position={[0, y, 0]} scale={scale}>
          <Model t={moveTime} />
        </group>
      </group>
    </>
  );
}

export default function RobotZoo({ block }) {
  const items = useMemo(
    () => (block?.items || []).filter((i) => ZOO[i.id]),
    [block],
  );
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [visited, setVisited] = useState(() => new Set([0]));
  const [playing, setPlaying] = useState(!reduced);
  const [replayToken, setReplayToken] = useState(0);

  const item = items[index];
  if (!item) return null;

  // Picking a robot puts it on the turntable and starts its move from the top.
  const pick = (i) => {
    setIndex(i);
    setVisited((prev) => new Set(prev).add(i));
    setReplayToken((t) => t + 1);
    setPlaying(true);
  };

  const replay = () => {
    setReplayToken((t) => t + 1);
    setPlaying(true);
  };

  return (
    <WidgetShell
      title="🦾 The Robot Zoo"
      hint={`Seen ${visited.size} of ${items.length} families. Every one of them runs the same sense, think, act loop.`}
      controls={
        <div className="flex items-center gap-2">
          <button
            onClick={replay}
            title="Play the move from the start"
            className="inline-flex items-center gap-1.5 rounded-lg border-2 border-ink/20 bg-white px-3 py-1.5 text-sm font-bold text-ink transition-colors hover:border-ink"
          >
            <RotateCcw className="h-4 w-4" /> Replay
          </button>
          <button
            onClick={() => setPlaying((p) => !p)}
            className="lab-btn inline-flex items-center gap-1.5 rounded-lg border-2 border-ink bg-pcb px-4 py-1.5 text-sm font-bold text-white"
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {playing ? 'Pause' : 'Play its move'}
          </button>
        </div>
      }
      side={
        <>
          {/* Pick a family. Above the card on a wide pane, because that's the
              order you use them in: choose, then read. */}
          <div className="grid grid-cols-4 gap-2 p-3 @min-[68rem]:grid-cols-2">
            {items.map((it, i) => {
              const active = i === index;
              return (
                <button
                  key={it.id}
                  onClick={() => pick(i)}
                  className={`relative flex flex-col items-center gap-1 rounded-xl border-2 p-2 transition-all active:scale-95 ${
                    active
                      ? 'border-ink bg-signal/25 shadow-[2px_2px_0_rgba(22,36,29,0.9)]'
                      : 'border-ink/15 bg-white hover:border-ink/40'
                  }`}
                >
                  <span className="text-xl">{it.emoji}</span>
                  <span className="text-center text-[11px] font-bold leading-tight text-ink/75">{it.name}</span>
                  {visited.has(i) && !active && (
                    <CheckCircle2 className="absolute right-1 top-1 h-3.5 w-3.5 text-pcb" />
                  )}
                </button>
              );
            })}
          </div>

          {/* The card for whichever robot is on the turntable */}
          <div className="border-t-2 border-ink/10 p-4">
            <div className="mb-3 flex items-baseline gap-2">
              <span className="text-2xl">{item.emoji}</span>
              <h3 className="font-lab text-xl font-extrabold text-ink">{item.name}</h3>
            </div>
            <p className="mb-4 font-semibold text-ink/70">{item.tagline}</p>
            <dl className="grid gap-3 sm:grid-cols-3 @min-[68rem]:grid-cols-1">
              {[
                ['What it does', item.does],
                ['Where it works', item.where],
                ['Why not a human', item.why],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border-2 border-ink/12 bg-paper/60 p-3">
                  <dt className="mb-1 text-[11px] font-bold uppercase tracking-wide text-pcb">{label}</dt>
                  <dd className="text-sm font-semibold text-ink/75">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </>
      }
    >
      <Stage3D
        camera={{ position: [1.75, 1.15, 1.95], fov: 45 }}
        height="h-[300px] sm:h-[360px] lg:h-[min(46vh,460px)] @min-[68rem]:h-[min(64vh,680px)]"
        fallback={`${item.name}: ${item.tagline}`}
      >
        <ZooScene
          key={item.id}
          id={item.id}
          playing={playing}
          spin={!reduced}
          replayToken={replayToken}
        />
      </Stage3D>
    </WidgetShell>
  );
}
