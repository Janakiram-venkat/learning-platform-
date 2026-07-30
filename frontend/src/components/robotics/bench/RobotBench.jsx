import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { ARIA_PARTS, SYSTEMS } from './ariaParts';

/**
 * ARIA on the bench: every part from the registry, drawn once, plus every way
 * of looking at her — hover, select, isolate, explode, x-ray, wireframe and
 * the system filter.
 *
 * Two performance rules from the course blueprint are load-bearing here:
 * the explode amount arrives as a *ref* and is applied in `useFrame`, so
 * dragging the slider never re-renders fourteen parts; and materials are
 * never recreated, only re-propped, because rebuilding materials on hover is
 * the classic way to make a scene like this stutter.
 */

const GEOMETRY = {
  box: (size) => <boxGeometry args={size} />,
  sphere: (size) => <sphereGeometry args={[size[0], 24, 24]} />,
  cylinder: (size) => <cylinderGeometry args={[size[0], size[1], size[2], 24]} />,
};

/** Average of a part's pieces — used to scale a hovered part about itself. */
function centroidOf(part) {
  const n = part.pieces.length;
  return part.pieces
    .reduce((acc, pc) => [acc[0] + pc.pos[0] / n, acc[1] + pc.pos[1] / n, acc[2] + pc.pos[2] / n], [0, 0, 0]);
}

function Part({ part, state, onSelect, onHover }) {
  const group = useRef();
  const centroid = useMemo(() => centroidOf(part), [part]);
  const systemColor = SYSTEMS[part.system]?.color || '#ffffff';

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const { explodeRef, hoveredId, selectedId, huntShakeId, clock } = state;
    const amt = explodeRef?.current ?? 0;

    // Hover lifts a part very slightly — enough to feel alive, not enough to
    // read as movement (the blueprint's 1.03 rule).
    const target = part.id === hoveredId || part.id === selectedId ? 1.035 : 1;
    const s = g.scale.x + (target - g.scale.x) * 0.2;
    g.scale.setScalar(s);

    // Scaling a group scales about the robot's origin, so shift it back by the
    // part's own centroid to keep the growth centred on the part itself.
    let x = part.explode[0] * amt * 0.35 + centroid[0] * (1 - s);
    let y = part.explode[1] * amt * 0.35 + centroid[1] * (1 - s);
    let z = part.explode[2] * amt * 0.35 + centroid[2] * (1 - s);

    // A wrong answer in the part hunt shakes the part you actually clicked.
    if (huntShakeId === part.id) x += Math.sin(clock.current * 45) * 0.02;

    g.position.set(x, y, z);
  });

  const { viewMode, highlightSystem, isolatedId, hoveredId, selectedId, dim, showLabel } = state;

  let opacity = 1;
  if (isolatedId && isolatedId !== part.id) opacity = 0.05;
  else if (highlightSystem && highlightSystem !== part.system) opacity = 0.1;
  else if (viewMode === 'xray' && part.system === 'structure') opacity = 0.18;
  if (dim) opacity = Math.min(opacity, 0.35);

  const lit = part.id === hoveredId || part.id === selectedId;

  return (
    <group
      ref={group}
      onPointerOver={(e) => { e.stopPropagation(); onHover?.(part.id); }}
      onPointerOut={(e) => { e.stopPropagation(); onHover?.(null); }}
      onClick={(e) => { e.stopPropagation(); onSelect?.(part.id); }}
    >
      {part.pieces.map((pc, i) => (
        <mesh
          key={i}
          position={pc.pos}
          rotation={pc.rot || [0, 0, 0]}
          castShadow={opacity > 0.5}
          receiveShadow={opacity > 0.5}
        >
          {GEOMETRY[pc.shape](pc.size)}
          {/* three.js needs a material rebuild when `transparent` flips, so the
              key changes with it. That only happens on a mode toggle, never
              per frame, so nothing here is rebuilt during interaction. */}
          <meshStandardMaterial
            key={opacity < 1 ? 'see-through' : 'opaque'}
            color={pc.color}
            roughness={pc.rough ?? 0.55}
            metalness={pc.metal ?? 0.15}
            emissive={lit ? systemColor : (pc.glow ? pc.color : '#000000')}
            emissiveIntensity={lit ? 0.55 : (pc.glow || 0)}
            transparent={opacity < 1}
            opacity={opacity}
            wireframe={viewMode === 'wire'}
            depthWrite={opacity > 0.5}
          />
        </mesh>
      ))}

      {/* The name tag lives inside the part's own group, so it follows the
          part when the robot explodes instead of hovering over the middle. */}
      {showLabel && selectedId === part.id && (
        <Html
          position={[centroid[0], centroid[1] + 0.16, centroid[2]]}
          center
          distanceFactor={1.9}
          zIndexRange={[10, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <span
            className="whitespace-nowrap rounded-md border-2 border-ink px-2 py-0.5 font-mono-lab text-[11px] font-bold text-ink shadow-[2px_2px_0_rgba(22,36,29,0.9)]"
            style={{ background: systemColor }}
          >
            {part.label}
          </span>
        </Html>
      )}
    </group>
  );
}

/** Puts the camera back where it started when `token` changes. */
function ResetView({ token }) {
  const controls = useThree((s) => s.controls);
  const seen = useRef(token);
  useFrame(() => {
    if (seen.current === token) return;
    seen.current = token;
    controls?.reset?.();
  });
  return null;
}

export default function RobotBench({
  explodeRef,
  viewMode = 'solid',
  highlightSystem = null,
  isolatedId = null,
  hoveredId = null,
  selectedId = null,
  huntShakeId = null,
  showLabel = true,
  resetToken = 0,
  onSelect,
  onHover,
}) {
  const clock = useRef(0);
  useFrame((_, delta) => { clock.current += delta; });

  const state = {
    explodeRef, viewMode, highlightSystem, isolatedId,
    hoveredId, selectedId, huntShakeId, clock, showLabel,
  };

  return (
    <>
      {/* Bench top */}
      <mesh position={[0, -0.002, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[0.78, 56]} />
        <meshStandardMaterial color="#14291E" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.71, 0.77, 56]} />
        <meshBasicMaterial color="#1F7A5C" toneMapped={false} />
      </mesh>

      {/* Clicking the bench itself clears the selection */}
      <mesh
        position={[0, -0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={(e) => { e.stopPropagation(); onSelect?.(null); }}
      >
        <circleGeometry args={[2.2, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {ARIA_PARTS.map((part) => (
        <Part key={part.id} part={part} state={state} onSelect={onSelect} onHover={onHover} />
      ))}

      <ResetView token={resetToken} />
    </>
  );
}
