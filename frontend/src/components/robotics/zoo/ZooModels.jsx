import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  brushedAlu,
  mouldedPlastic,
  paintedBlock,
  paintedShell,
  rubberTread,
  solarCells,
} from '../shared/labTextures';

/**
 * The eight robot families of Module 1, built from primitives.
 *
 * Each model takes a `t` ref holding seconds of *signature-move* time — it only
 * advances while the move is playing, so a paused robot holds its pose instead
 * of snapping back to zero. Every family animates the one thing that explains
 * its job: the arm welds, the rover's rocker articulates, the drone lifts off.
 *
 * Materials come from labTextures rather than being flat colours. These eight
 * are the first robots a student ever meets, and "a real machine" versus "a
 * cartoon of a machine" is decided almost entirely by whether the surfaces have
 * grain and varying roughness — so a welding arm gets brushed aluminium links
 * and chipped safety-yellow paint, and the rover's deck is an actual solar panel
 * with bus bars on it.
 *
 * These are called per render, not memoised per component: the underlying maps
 * are cached in labTextures, so a call is a couple of Map lookups, and a model
 * only re-renders when the student picks a different one.
 */

/** Machined, unpainted metal — links, shafts, brackets. */
const metal = () => ({ ...brushedAlu(), roughness: 0.35, metalness: 0.9, envMapIntensity: 1.2 });
/** Matte dark plastic — housings, bases, anything not meant to be looked at. */
const dark = () => ({ ...mouldedPlastic('#16241D'), roughness: 0.72, metalness: 0.08 });
/** Powder-coated steel in a given colour — the parts a factory painted. */
const painted = (hex) => ({ ...paintedShell(hex), roughness: 0.55, metalness: 0.25 });
/** Glossy moulded shell — medical and consumer robots, wiped-clean white. */
const gloss = (hex) => ({ ...mouldedPlastic(hex), roughness: 0.28, metalness: 0.05, envMapIntensity: 1.1 });
/** Tyres and tracks. */
const rubber = (rx = 6) => ({ ...rubberTread(rx, 1), roughness: 0.95, metalness: 0.02 });

/* ---------------------------------------------------------------- 1. Arm -- */
/**
 * Link lengths, kept here because the animation has to know them: the flare is
 * decided by where the torch tip actually is, not by a hand-picked phase, and
 * the joint ranges are chosen so the tip comes down onto the plate and stops
 * there instead of sweeping through it.
 */
// The links are deliberately short enough that even fully extended the torch
// cannot reach past the edge of the turntable it is bolted to.
const ARM = { pivotY: 0.45, upper: 0.44, fore: 0.36, torchY: -0.1, workTop: 0.02 };

export function IndustrialArm({ t }) {
  const shoulder = useRef();
  const elbow = useRef();
  const spark = useRef();
  const flare = useRef();

  useFrame(() => {
    const s = t.current;
    const swing = Math.sin(s * 1.6);
    // Shoulder and elbow move together, the way a welding arm traces a seam:
    // at swing = +1 the arm is up and clear, at -1 the torch is on the plate.
    // The elbow never quite straightens (a + b stays negative), which is what
    // keeps the torch from swinging out past the edge of the plinth.
    const a = 0.17 + 0.43 * swing;
    const b = -0.45 - 0.1 * swing;
    if (shoulder.current) shoulder.current.rotation.z = a;
    if (elbow.current) elbow.current.rotation.z = b;
    if (spark.current) {
      // Forward kinematics for the torch tip's height, then flare by how close
      // that is to the plate — so the sparks can never fire in mid-air.
      const tipY = ARM.pivotY
        + ARM.upper * Math.sin(a)
        + ARM.fore * Math.sin(a + b)
        + ARM.torchY * Math.cos(a + b);
      const hot = Math.min(1, Math.max(0, (0.17 - tipY) / 0.12));
      spark.current.scale.setScalar(0.015 + hot * 0.045);
      spark.current.material.opacity = hot;

      // A welding arc is the brightest thing in any workshop, and what sells it
      // is not the flare itself but everything around it going bright — the
      // plate, the underside of the arm, the plinth. So the arc is a real light,
      // guttering the way an arc actually does rather than burning steady.
      if (flare.current) {
        const gutter = 0.75 + Math.sin(s * 47) * 0.15 + Math.sin(s * 113) * 0.1;
        flare.current.intensity = hot * hot * 2.6 * gutter;
      }
    }
  });

  return (
    <group>
      <mesh castShadow position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.42, 0.48, 0.12, 28]} />
        <meshStandardMaterial {...dark()} />
      </mesh>
      <mesh castShadow position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.16, 0.2, 0.34, 20]} />
        <meshStandardMaterial {...painted('#FFC93C')} />
      </mesh>
      {/* The workpiece the torch comes down onto: a mill-finish steel plate,
          shiny enough to throw the torch flare back up at the arm. */}
      <mesh receiveShadow position={[0.68, ARM.workTop / 2, 0]}>
        <boxGeometry args={[0.26, ARM.workTop, 0.26]} />
        <meshStandardMaterial {...brushedAlu(2, 2)} roughness={0.3} metalness={0.85} envMapIntensity={1.3} />
      </mesh>
      <group ref={shoulder} position={[0, ARM.pivotY, 0]}>
        <mesh castShadow position={[ARM.upper / 2, 0, 0]}>
          <boxGeometry args={[0.46, 0.14, 0.16]} />
          <meshStandardMaterial {...metal()} />
        </mesh>
        <group ref={elbow} position={[ARM.upper, 0, 0]}>
          <mesh castShadow position={[ARM.fore / 2, 0, 0]}>
            <boxGeometry args={[0.38, 0.1, 0.12]} />
            <meshStandardMaterial {...painted('#FFC93C')} />
          </mesh>
          <mesh castShadow position={[ARM.fore, -0.04, 0]} rotation={[0, 0, Math.PI]}>
            <coneGeometry args={[0.055, 0.13, 14]} />
            <meshStandardMaterial {...dark()} />
          </mesh>
          <mesh ref={spark} position={[ARM.fore, ARM.torchY, 0]}>
            <sphereGeometry args={[1, 12, 12]} />
            <meshBasicMaterial color="#FFC93C" transparent opacity={0} toneMapped={false} />
          </mesh>
          <pointLight
            ref={flare}
            position={[ARM.fore, ARM.torchY, 0]}
            color="#FFE9A8"
            intensity={0}
            distance={1.6}
            decay={2}
          />
        </group>
      </group>
    </group>
  );
}

/* ------------------------------------------------------------ 2. Surgical -- */
export function SurgicalRobot({ t }) {
  const arms = useRef();
  useFrame(() => {
    const s = t.current;
    if (!arms.current) return;
    // Tiny, absolutely steady movements — the whole point of the machine.
    arms.current.position.y = -0.04 + Math.sin(s * 1.2) * 0.04;
    arms.current.rotation.y = Math.sin(s * 0.7) * 0.12;
  });

  return (
    <group>
      <mesh castShadow position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.4, 0.44, 0.1, 24]} />
        <meshStandardMaterial {...dark()} />
      </mesh>
      <mesh castShadow position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.1, 0.12, 0.8, 18]} />
        <meshStandardMaterial {...gloss('#EDF3EE')} />
      </mesh>
      <group ref={arms} position={[0, 0.92, 0]}>
        {[0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((a, i) => (
          <group key={i} rotation={[0, a, 0]}>
            <mesh castShadow position={[0.22, -0.02, 0]} rotation={[0, 0, -0.35]}>
              <boxGeometry args={[0.44, 0.07, 0.07]} />
              <meshStandardMaterial {...gloss('#EDF3EE')} />
            </mesh>
            {/* The instrument itself: surgical stainless, polished to a mirror. */}
            <mesh castShadow position={[0.4, -0.3, 0]} rotation={[0, 0, 0.25]}>
              <cylinderGeometry args={[0.012, 0.012, 0.5, 10]} />
              <meshStandardMaterial color="#c4ccc8" roughness={0.1} metalness={0.98} envMapIntensity={1.6} />
            </mesh>
          </group>
        ))}
      </group>
      <mesh position={[0, 0.06, 0.42]}>
        <sphereGeometry args={[0.035, 12, 12]} />
        <meshStandardMaterial color="#23B5D3" emissive="#23B5D3" emissiveIntensity={1.6} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------ 3. Humanoid -- */
const STAND_Y = 0.04;   // 0.34 shin + 0.03 sole below a hip at 0.33

export function Humanoid({ t }) {
  const body = useRef();
  const armR = useRef();
  const legL = useRef();
  const legR = useRef();

  useFrame(() => {
    const s = t.current;
    // It is standing still and waving, so the feet stay planted: the legs shift
    // weight side to side rather than striding, and the torso only ever rises
    // from its standing height — the old bob dipped below it and pushed the
    // feet through the floor. Twice the weight-shift rate, because the body
    // lifts once per leg on each pass. STAND_Y is where the soles actually
    // touch: the hip sits 0.33 up, the shin drops 0.34 and the sole 0.03 more.
    if (body.current) body.current.position.y = STAND_Y + (1 - Math.cos(s * 4.4)) * 0.012;
    if (armR.current) armR.current.rotation.z = -2.2 + Math.sin(s * 5) * 0.5; // waving
    const shift = Math.sin(s * 2.2) * 0.03;
    if (legL.current) legL.current.rotation.z = shift;
    if (legR.current) legR.current.rotation.z = shift;
  });

  return (
    <group ref={body} position={[0, STAND_Y, 0]}>
      <mesh castShadow position={[0, 0.86, 0]}>
        <sphereGeometry args={[0.17, 24, 24]} />
        <meshStandardMaterial {...gloss('#EDF3EE')} />
      </mesh>
      <mesh position={[0.09, 0.88, 0.13]}>
        <sphereGeometry args={[0.035, 12, 12]} />
        <meshStandardMaterial color="#23B5D3" emissive="#23B5D3" emissiveIntensity={1.4} toneMapped={false} />
      </mesh>
      <mesh position={[-0.09, 0.88, 0.13]}>
        <sphereGeometry args={[0.035, 12, 12]} />
        <meshStandardMaterial color="#23B5D3" emissive="#23B5D3" emissiveIntensity={1.4} toneMapped={false} />
      </mesh>
      <mesh castShadow position={[0, 0.55, 0]}>
        <boxGeometry args={[0.34, 0.42, 0.2]} />
        <meshStandardMaterial {...painted('#1F7A5C')} />
      </mesh>
      <mesh castShadow position={[-0.25, 0.55, 0]} rotation={[0, 0, 0.25]}>
        <boxGeometry args={[0.09, 0.36, 0.09]} />
        <meshStandardMaterial {...metal()} />
      </mesh>
      <group ref={armR} position={[0.2, 0.72, 0]}>
        <mesh castShadow position={[0.16, 0, 0]}>
          <boxGeometry args={[0.34, 0.09, 0.09]} />
          <meshStandardMaterial {...metal()} />
        </mesh>
      </group>
      {[-0.09, 0.09].map((x, i) => (
        <group key={x} ref={i === 0 ? legL : legR} position={[x, 0.33, 0]}>
          <mesh castShadow position={[0, -0.16, 0]}>
            <boxGeometry args={[0.11, 0.34, 0.11]} />
            <meshStandardMaterial {...dark()} />
          </mesh>
          <mesh castShadow position={[0, -0.34, 0.03]}>
            <boxGeometry args={[0.13, 0.06, 0.2]} />
            <meshStandardMaterial {...dark()} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ----------------------------------------------------------- 4. Mars rover -- */
const ROVER = {
  wheelR: 0.13,
  frontX: 0.32,     // front wheel row, before the crawl offset
  wheelbase: 0.64,  // front row to rear row
  track: 0.6,       // left row to right row
  rockX: 0.42,
  rockR: 0.11,
};

export function MarsRover({ t }) {
  const chassis = useRef();
  const body = useRef();
  const mast = useRef();
  const wheels = useRef([]);
  const prevX = useRef(0);

  useFrame(() => {
    const s = t.current;

    // The rover creeps back and forth across the plinth. Everything else is
    // derived from that one number, so nothing ever spins or tilts without the
    // ground having moved underneath it.
    const x = Math.sin(s * 0.7) * 0.16;
    // A Replay teleports it back to the start; that is not ground it drove over,
    // so it must not turn the wheels.
    const jump = x - prevX.current;
    const dx = Math.abs(jump) > 0.05 ? 0 : jump;
    prevX.current = x;
    if (chassis.current) chassis.current.position.x = x;

    // Only one front wheel meets the rock. How far it climbs is a function of
    // the overlap between wheel and rock, nothing more.
    const reach = ROVER.rockR + ROVER.wheelR;
    const off = Math.abs(ROVER.frontX + x - ROVER.rockX);
    const climb = off < reach ? (1 - (off / reach) ** 2) * 0.075 : 0;

    // A rocker-bogie exists precisely so the body tilts *less* than the wheels:
    // pitch and roll come out of the geometry, then get damped by the rocker.
    if (body.current) {
      body.current.rotation.z = 0.5 * (climb / ROVER.wheelbase);
      body.current.rotation.x = -0.4 * (climb / ROVER.track);
      body.current.position.y = 0.28 + climb * 0.35;
    }
    if (wheels.current[5]) wheels.current[5].position.y = ROVER.wheelR + climb;

    if (mast.current) mast.current.rotation.y = Math.sin(s * 0.5) * 0.7;
    // Rolling, not sliding: the wheel turns by exactly the ground it covered,
    // so it stops dead when the rover does and reverses when the rover does.
    const spin = dx / ROVER.wheelR;
    wheels.current.forEach((w) => { if (w) w.rotation.y -= spin; });
  });

  const wheelPositions = [-0.32, 0, 0.32].flatMap((x) => [
    [x, ROVER.wheelR, -0.3],
    [x, ROVER.wheelR, 0.3],
  ]);

  return (
    <group>
      <group ref={chassis}>
        <group ref={body} position={[0, 0.28, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.8, 0.22, 0.5]} />
            <meshStandardMaterial {...painted('#D8C7A8')} roughness={0.7} metalness={0.15} />
          </mesh>
          {/* Solar deck: six cells across, four back, bus bars drawn in. This
              is where the rover's power comes from, so it is worth showing. */}
          <mesh castShadow position={[0, 0.14, 0]}>
            <boxGeometry args={[0.9, 0.03, 0.62]} />
            <meshStandardMaterial {...solarCells(6, 4)} metalness={0.4} envMapIntensity={1.4} />
          </mesh>
          <group ref={mast} position={[0.26, 0.3, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.025, 0.025, 0.34, 12]} />
              <meshStandardMaterial {...metal()} />
            </mesh>
            <mesh castShadow position={[0, 0.22, 0]}>
              <boxGeometry args={[0.16, 0.09, 0.09]} />
              <meshStandardMaterial {...dark()} />
            </mesh>
            <mesh position={[0.085, 0.22, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.03, 0.03, 0.02, 14]} />
              <meshStandardMaterial color="#23B5D3" emissive="#23B5D3" emissiveIntensity={1.2} toneMapped={false} />
            </mesh>
          </group>
        </group>
        {/* Axles run across the rover, not along it — so rotation.y is the roll */}
        {wheelPositions.map((p, i) => (
          <mesh
            key={i}
            ref={(el) => { wheels.current[i] = el; }}
            castShadow
            position={p}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[ROVER.wheelR, ROVER.wheelR, 0.1, 22]} />
            <meshStandardMaterial {...rubber(7)} />
          </mesh>
        ))}
      </group>
      {/* The rock it climbs — outside the chassis group, so it stays put */}
      <mesh castShadow position={[ROVER.rockX, 0.06, 0.3]}>
        <dodecahedronGeometry args={[ROVER.rockR, 0]} />
        {/* The breeze-block surface doubles as weathered stone: same pitting,
            same matte break-up, and it is already in the cache. */}
        <meshStandardMaterial {...paintedBlock('#7A5C4A')(2, 2)} roughness={1} metalness={0} />
      </mesh>
    </group>
  );
}

/* -------------------------------------------------------- 5. Bomb disposal -- */
export function BombDisposal({ t }) {
  const shoulder = useRef();
  const forearm = useRef();
  const jawA = useRef();
  const jawB = useRef();

  useFrame(() => {
    const s = t.current;
    // Ranges chosen so the jaws come down to just above the ground and stop —
    // the previous swing carried the gripper about 10 cm below the tracks.
    if (shoulder.current) shoulder.current.rotation.z = -0.1 + Math.sin(s * 0.9) * 0.42;
    if (forearm.current) forearm.current.rotation.z = 0.55 + Math.sin(s * 0.9 + 0.8) * 0.35;
    const grip = 0.18 + Math.max(0, Math.sin(s * 0.9 + 1.6)) * 0.22;
    if (jawA.current) jawA.current.position.z = grip;
    if (jawB.current) jawB.current.position.z = -grip;
  });

  return (
    <group>
      {[-0.28, 0.28].map((z) => (
        <mesh key={z} castShadow position={[0, 0.11, z]}>
          <boxGeometry args={[0.78, 0.22, 0.16]} />
          <meshStandardMaterial {...rubber(10)} />
        </mesh>
      ))}
      <mesh castShadow position={[0, 0.28, 0]}>
        <boxGeometry args={[0.6, 0.2, 0.44]} />
        <meshStandardMaterial {...painted('#4A5D3A')} roughness={0.72} />
      </mesh>
      <group ref={shoulder} position={[-0.1, 0.4, 0]}>
        <mesh castShadow position={[0.24, 0, 0]}>
          <boxGeometry args={[0.5, 0.08, 0.08]} />
          <meshStandardMaterial {...metal()} />
        </mesh>
        <group ref={forearm} position={[0.48, 0, 0]}>
          <mesh castShadow position={[0.2, 0, 0]}>
            <boxGeometry args={[0.42, 0.06, 0.06]} />
            <meshStandardMaterial {...metal()} />
          </mesh>
          <mesh ref={jawA} castShadow position={[0.42, 0, 0.18]}>
            <boxGeometry args={[0.14, 0.04, 0.04]} />
            <meshStandardMaterial {...painted('#FFC93C')} />
          </mesh>
          <mesh ref={jawB} castShadow position={[0.42, 0, -0.18]}>
            <boxGeometry args={[0.14, 0.04, 0.04]} />
            <meshStandardMaterial {...painted('#FFC93C')} />
          </mesh>
        </group>
      </group>
      {/* Camera, because the operator sees through it */}
      <mesh castShadow position={[0.2, 0.44, 0]}>
        <boxGeometry args={[0.1, 0.08, 0.12]} />
        <meshStandardMaterial {...dark()} />
      </mesh>
    </group>
  );
}

/* ----------------------------------------------------------- 6. Vacuum bot -- */
export function VacuumRobot({ t }) {
  const body = useRef();
  const brush = useRef();

  const prevS = useRef(0);
  const prev = useRef({ x: 0.2, z: 0 });

  useFrame(() => {
    const s = t.current;
    const ds = Math.max(0, s - prevS.current); // zero while paused, never negative
    prevS.current = s;

    if (body.current) {
      // Drives a slow arc around the plinth, and every so often knocks its
      // bumper and gets pushed out onto a wider one.
      const a = s * 0.8;
      const r = 0.2 + Math.max(0, Math.sin(s * 1.4) - 0.94) * 1.2;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      body.current.position.x = x;
      body.current.position.z = z;

      // Two driven wheels and a caster cannot slide sideways, so the nose has
      // to point along the path — not across it, which is what the old fixed
      // heading did. Taking it from the path as actually travelled means it
      // stays true through the bumper knock as well as round the plain arc.
      const dx = x - prev.current.x;
      const dz = z - prev.current.z;
      prev.current = { x, z };
      const moved = Math.hypot(dx, dz);
      if (moved > 1e-6 && moved < 0.05) body.current.rotation.y = Math.atan2(-dz, dx);
    }
    // The side brush is motor-driven, so its speed is its own — but it still
    // stops when the machine is switched off.
    if (brush.current) brush.current.rotation.y += ds * 9;
  });

  return (
    <group ref={body}>
      <mesh castShadow position={[0, 0.09, 0]}>
        <cylinderGeometry args={[0.42, 0.42, 0.14, 40]} />
        <meshStandardMaterial {...gloss('#16241D')} roughness={0.32} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.17, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.03, 28]} />
        <meshStandardMaterial color="#23B5D3" emissive="#23B5D3" emissiveIntensity={0.7} toneMapped={false} />
      </mesh>
      {/* Bumper ring — the thing that senses a chair leg. The Z spin is applied
          first (in the torus's own plane) to centre the arc on the front, then
          the X rotation lays it flat around the body. */}
      <mesh position={[0, 0.09, 0]} rotation={[-Math.PI / 2, 0, -Math.PI * 0.35]}>
        <torusGeometry args={[0.43, 0.025, 10, 40, Math.PI * 0.7]} />
        <meshStandardMaterial {...gloss('#EDF3EE')} roughness={0.45} />
      </mesh>
      <group ref={brush} position={[0.3, 0.03, 0]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation={[0, (i * Math.PI * 2) / 3, 0]} position={[0.06, 0, 0]}>
            <boxGeometry args={[0.14, 0.012, 0.012]} />
            <meshStandardMaterial color="#FFC93C" />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* --------------------------------------------------------- 7. Delivery bot -- */
export function DeliveryBot({ t }) {
  const body = useRef();
  const lid = useRef();
  const flag = useRef();
  const wheels = useRef([]);

  const prevX = useRef(0);

  useFrame(() => {
    const s = t.current;
    const x = Math.sin(s * 0.8) * 0.3;
    // A Replay teleports it back to the start — not ground it actually covered.
    const jump = x - prevX.current;
    const dx = Math.abs(jump) > 0.05 ? 0 : jump;
    prevX.current = x;

    if (body.current) body.current.position.x = x;
    // The lid opens once the trip is done.
    if (lid.current) lid.current.rotation.z = -Math.max(0, Math.sin(s * 0.8 - 1.2)) * 1.1;
    // The flag only whips about when the bot is actually moving.
    if (flag.current) flag.current.rotation.z = Math.sin(s * 4) * 0.15 * Math.min(1, Math.abs(dx) * 60);
    // Rolling from the distance covered, so the wheels reverse when it turns
    // back and stand still when it is parked.
    const spin = dx / 0.1;   // wheel radius, below
    wheels.current.forEach((w) => { if (w) w.rotation.y -= spin; });
  });

  return (
    <group ref={body}>
      <mesh castShadow position={[0, 0.34, 0]}>
        <boxGeometry args={[0.74, 0.36, 0.5]} />
        <meshStandardMaterial {...gloss('#EDF3EE')} roughness={0.35} />
      </mesh>
      <group ref={lid} position={[-0.37, 0.52, 0]}>
        <mesh castShadow position={[0.37, 0, 0]}>
          <boxGeometry args={[0.74, 0.05, 0.5]} />
          <meshStandardMaterial {...painted('#1F7A5C')} />
        </mesh>
      </group>
      {/* Sensor band */}
      <mesh position={[0.38, 0.36, 0]}>
        <boxGeometry args={[0.02, 0.09, 0.4]} />
        <meshStandardMaterial color="#23B5D3" emissive="#23B5D3" emissiveIntensity={1.1} toneMapped={false} />
      </mesh>
      <group ref={flag} position={[-0.3, 0.52, 0.2]}>
        <mesh position={[0, 0.16, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.32, 8]} />
          <meshStandardMaterial {...metal()} />
        </mesh>
        <mesh position={[0.06, 0.28, 0]}>
          <boxGeometry args={[0.12, 0.08, 0.005]} />
          <meshStandardMaterial color="#E8503A" />
        </mesh>
      </group>
      {/* Axles run across the bot, not along it — so rotation.y is the roll */}
      {[-0.26, 0, 0.26].flatMap((x) => [[x, 0.1, -0.26], [x, 0.1, 0.26]]).map((p, i) => (
        <mesh
          key={i}
          ref={(el) => { wheels.current[i] = el; }}
          castShadow
          position={p}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry args={[0.1, 0.1, 0.07, 20]} />
          <meshStandardMaterial {...rubber(6)} />
        </mesh>
      ))}
    </group>
  );
}

/* ----------------------------------------------------------- 8. Quadcopter -- */
// A tilt and the sideways drift it causes are not free to be chosen separately:
// leaning by θ points the thrust off vertical, so the craft accelerates at
// g·tan θ. Swaying ±SWAY at ω needs a peak acceleration of SWAY·ω², which at
// this course's scale of 50 cm per unit (g ≈ 19.6 units/s²) is a lean of TILT.
// Change one of the three and the hover stops being a hover.
// padY is where the skids actually touch down: the legs hang 0.19 below the
// body, so anything less and it starts the shot buried in the plinth.
const HOVER = { sway: 0.085, tilt: 0.025, omega: 2.4, ceiling: 0.55, padY: 0.19 };
const ARMS = [[0.3, 0.3], [0.3, -0.3], [-0.3, 0.3], [-0.3, -0.3]];

export function Quadcopter({ t }) {
  const body = useRef();
  const rotors = useRef([]);
  const discs = useRef([]);
  const prevS = useRef(0);

  useFrame(() => {
    const s = t.current;
    // Never negative: a Replay rewinds the clock, and rotors do not un-spin.
    const ds = Math.max(0, s - prevS.current);
    prevS.current = s;

    if (body.current) {
      // Lifts off, then holds station. Smoothstep rather than a straight ramp,
      // so it accelerates off the pad and settles into the hover instead of
      // snapping from full climb to dead stop.
      const k = Math.min(1, s / 1.8);
      const lift = HOVER.ceiling * k * k * (3 - 2 * k);
      const sway = Math.sin(s * HOVER.omega);
      body.current.position.y = HOVER.padY + lift + Math.sin(s * 3.1) * 0.012 * (lift / HOVER.ceiling);
      body.current.position.x = sway * HOVER.sway * (lift / HOVER.ceiling);
      // Leaning +Z tips the thrust toward -X, which is the direction it has to
      // accelerate in while the sway term is positive — so the two are in phase,
      // and both fade in together while it is still on its skids.
      body.current.rotation.z = sway * HOVER.tilt * (lift / HOVER.ceiling);
      body.current.rotation.y += ds * 0.25 * (lift / HOVER.ceiling);
    }
    // Diagonal pairs spin the same way and adjacent ones oppose, so the four
    // reaction torques cancel. That is why a quadcopter does not spin itself
    // apart, and it is decided by the sign of x·z, not by the array order.
    rotors.current.forEach((r, i) => {
      const [x, z] = ARMS[i];
      if (r) r.rotation.y += ds * 42 * (x * z > 0 ? 1 : -1);
    });

    // A prop turning at 40 rad/s does not read as two blades — at any real
    // frame rate it reads as a translucent disc, and drawing the blades alone
    // makes the drone look like it is turning over slowly. So a faint disc
    // fades in whenever the rotors are actually spinning, and fades out the
    // moment the student pauses, leaving the blades visible to be counted.
    const blur = Math.min(1, ds * 55);
    discs.current.forEach((d) => {
      if (d) d.material.opacity = blur * 0.22;
    });
  });

  return (
    <group ref={body} position={[0, 0.1, 0]}>
      <mesh castShadow>
        <boxGeometry args={[0.3, 0.1, 0.22]} />
        <meshStandardMaterial {...painted('#1F7A5C')} />
      </mesh>
      {/* Gimbal camera underneath */}
      <mesh castShadow position={[0.1, -0.09, 0]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial {...dark()} />
      </mesh>
      {ARMS.map(([x, z], i) => (
        <group key={i}>
          <mesh castShadow position={[x / 2, 0, z / 2]} rotation={[0, Math.atan2(z, x), 0]}>
            <boxGeometry args={[0.42, 0.03, 0.04]} />
            <meshStandardMaterial {...dark()} />
          </mesh>
          <mesh position={[x, 0.04, z]}>
            <cylinderGeometry args={[0.03, 0.035, 0.05, 12]} />
            <meshStandardMaterial {...metal()} />
          </mesh>
          <group ref={(el) => { rotors.current[i] = el; }} position={[x, 0.07, z]}>
            <mesh>
              <boxGeometry args={[0.38, 0.006, 0.035]} />
              <meshStandardMaterial color="#EDF3EE" transparent opacity={0.55} />
            </mesh>
            <mesh rotation={[0, Math.PI / 2, 0]}>
              <boxGeometry args={[0.38, 0.006, 0.035]} />
              <meshStandardMaterial color="#EDF3EE" transparent opacity={0.55} />
            </mesh>
          </group>
          {/* The blur disc. Outside the spinning group — a disc that rotates
              is just a disc, and spinning it would cost a matrix update for
              nothing. */}
          <mesh
            ref={(el) => { discs.current[i] = el; }}
            position={[x, 0.071, z]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <circleGeometry args={[0.19, 24]} />
            <meshBasicMaterial
              color="#EDF3EE"
              transparent
              opacity={0}
              depthWrite={false}
              side={THREE.DoubleSide}
              toneMapped={false}
            />
          </mesh>
          <mesh position={[x, -0.11, z]}>
            <cylinderGeometry args={[0.008, 0.008, 0.16, 8]} />
            <meshStandardMaterial {...metal()} />
          </mesh>
        </group>
      ))}
      <mesh position={[0.16, 0, 0]}>
        <sphereGeometry args={[0.022, 10, 10]} />
        <meshStandardMaterial color="#E8503A" emissive="#E8503A" emissiveIntensity={1.8} toneMapped={false} />
      </mesh>
    </group>
  );
}
