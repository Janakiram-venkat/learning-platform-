import { useRef, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { Play, Pause, RotateCcw, StepForward } from 'lucide-react';
import Stage3D from './shared/Stage3D';
import RobotBot from './shared/RobotBot';
import WidgetShell from './shared/WidgetShell';
import useReducedMotion from './shared/useReducedMotion';
import { benchMat, paintedBlock } from './shared/labTextures';

// One scene unit is 50 cm, so the numbers on screen are real distances rather
// than decoration — the readout is measured off the geometry, not scripted.
const CM_PER_UNIT = 50;
const SENSOR_OFFSET = 0.35;   // nose of the robot, where the ultrasonic sits
const TOO_CLOSE_CM = 20;
const STEP_UNITS = 0.5;       // how far one "drive forward" act moves it
const KEEP_CLEAR = 0.3;       // never drive closer than 15 cm in one step
const NOTHING_AHEAD_CM = 200; // what the sensor reports with no wall in front
const MAX_PING_REACH = 2.4;   // keep a long ping inside the frame
const WALL_HALF = 0.09;       // half the slab's thickness — see readSensor

// The ping is sound, so it travels at a fixed speed and a near wall echoes back
// sooner than a far one. Tuned so even the longest shot completes inside the
// sense phase: 2 × 2.4 units at 6.4 u/s is 0.75 s, under DURATION.sense.
const PING_SPEED = 6.4;

// A real ultrasonic module does not sense in every direction — it hears inside a
// cone of roughly 30°. Drawing the pulse as an arc rather than a full circle is
// both truer and useful later, when Module 7 asks why the robot missed a chair
// leg that was plainly there.
const BEAM_HALF = 0.26; // radians, half the cone

// How hard the body pitches under acceleration, in radians per unit of accel.
// Nothing on this robot has suspension, so the tilt is small on purpose: just
// enough that starting and stopping have weight instead of being a slide.
const PITCH_PER_ACCEL = 0.012;

const PHASES = ['sense', 'think', 'act'];
const DURATION = { sense: 0.9, think: 0.6, act: 0.9 };

const START = { x: -1.0, z: 0.8, rot: 0 };

/** Distance from the robot's sensor to the wall, in cm. */
function readSensor(x, z, rot, wallX) {
  // The wall is a long slab centred on x = wallX. It only registers when the
  // robot is actually pointed at it — turn away and the sensor honestly sees
  // nothing.
  const facingWall = Math.cos(rot) > 0.7;
  if (!facingWall) return NOTHING_AHEAD_CM;
  if (Math.abs(z) > 1.4) return NOTHING_AHEAD_CM;
  // Both ends of the measurement are surfaces, not centres: sound leaves the
  // sensor on the nose and bounces off the slab's near face, so the reading is
  // 4.5 cm shorter than the distance between the two objects' origins.
  const sensorX = x + Math.cos(rot) * SENSOR_OFFSET;
  const gap = wallX - WALL_HALF - sensorX;
  return Math.max(0, Math.round(gap * CM_PER_UNIT));
}

function Scene({ wallX, playing, stepRef, onPhase }) {
  const robot = useRef();
  const body = useRef();   // tilts under acceleration; see PITCH_PER_ACCEL
  const ping = useRef();
  const pingMat = useRef();
  const hit = useRef();    // the bright patch where the pulse strikes the wall
  const hitMat = useRef();
  const lastStep = useRef(0);
  const pitch = useRef(0);
  // Handed to RobotBot so the wheels roll at the speed the body is actually
  // moving — measured off the drawn position below, never guessed.
  const speedRef = useRef(0);
  const turnRef = useRef(0);

  const st = useRef({
    phase: 'sense',
    t: 0,
    ...START,
    fromX: START.x, fromZ: START.z, fromRot: START.rot,
    toX: START.x, toZ: START.z, toRot: START.rot,
    distance: 0,
    decision: null,
  });

  const enter = useCallback((phase) => {
    const s = st.current;
    s.phase = phase;
    s.t = 0;

    if (phase === 'sense') {
      s.distance = readSensor(s.x, s.z, s.rot, wallX);
      onPhase('sense', { distance: s.distance });
    }

    if (phase === 'think') {
      s.decision = s.distance < TOO_CLOSE_CM ? 'turn' : 'go';
      onPhase('think', { distance: s.distance, decision: s.decision });
    }

    if (phase === 'act') {
      s.fromX = s.x; s.fromZ = s.z; s.fromRot = s.rot;
      if (s.decision === 'turn') {
        s.toX = s.x; s.toZ = s.z; s.toRot = s.rot - Math.PI / 2;
      } else {
        // Never let one step carry it through the wall: a drive is clamped so
        // it always stops short, and the next reading is the one that turns it.
        const room = s.distance / CM_PER_UNIT - KEEP_CLEAR;
        const step = Math.min(STEP_UNITS, Math.max(0, room));
        s.toX = s.x + Math.cos(s.rot) * step;
        s.toZ = s.z - Math.sin(s.rot) * step;
        s.toRot = s.rot;
      }
      onPhase('act', { distance: s.distance, decision: s.decision });
    }
  }, [wallX, onPhase]);

  useFrame((_, rawDelta) => {
    const s = st.current;
    const delta = Math.min(rawDelta, 0.05); // a backgrounded tab must not jump
    const g = robot.current;

    // First frame: take a reading so the boxes below start with real numbers.
    if (!s.started) { s.started = true; enter('sense'); }

    // A manual step always advances exactly one phase, paused or not.
    const stepped = stepRef.current !== lastStep.current;
    if (stepped) lastStep.current = stepRef.current;

    if (playing || stepped) {
      s.t += stepped ? DURATION[s.phase] : delta;
      if (s.t >= DURATION[s.phase]) {
        // Land exactly on the target before moving on, so drift can't build up.
        if (s.phase === 'act') { s.x = s.toX; s.z = s.toZ; s.rot = s.toRot; }
        // Wandered off the bench? Put it back at the start and keep going.
        if (Math.abs(s.z) > 2.3 || s.x < -2.6 || Math.abs(s.x) > 3.4) {
          s.x = START.x; s.z = START.z; s.rot = START.rot;
        }
        enter(PHASES[(PHASES.indexOf(s.phase) + 1) % PHASES.length]);
      }
    }

    // --- Draw the current phase ------------------------------------------
    const p = Math.min(1, s.t / DURATION[s.phase]);

    if (s.phase === 'act') {
      // Ease in and out, so the robot accelerates from rest and comes to rest
      // instead of jumping to full speed. The derivative of that same ease is
      // the speed the wheels have to turn at.
      const ease = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2;
      const dEase = (p < 0.5 ? 4 * p : 4 * (1 - p)) / DURATION.act;
      if (g) {
        g.position.x = s.fromX + (s.toX - s.fromX) * ease;
        g.position.z = s.fromZ + (s.toZ - s.fromZ) * ease;
        g.rotation.y = s.fromRot + (s.toRot - s.fromRot) * ease;
      }
      const dist = Math.hypot(s.toX - s.fromX, s.toZ - s.fromZ);
      speedRef.current = dist * dEase;
      turnRef.current = (s.toRot - s.fromRot) * dEase;

      // The body's inertia. The ease accelerates for the first half of the move
      // and decelerates for the second, so the nose lifts as it pulls away and
      // dips as it settles — the same thing that happens to a shopping trolley,
      // and the reason a robot that just slides between two points looks wrong
      // even to someone who cannot say why.
      // The drive wheels are behind the caster, so weight shifts backwards and
      // the nose lifts under power — the same way it does on a rear-drive car.
      const accel = dist * ((p < 0.5 ? 4 : -4) / (DURATION.act * DURATION.act));
      pitch.current += (accel * PITCH_PER_ACCEL - pitch.current) * Math.min(1, delta * 9);
    } else {
      if (g) {
        g.position.x = s.x;
        g.position.z = s.z;
        g.rotation.y = s.rot;
      }
      // Standing still while it senses and thinks — so must the wheels.
      speedRef.current = 0;
      turnRef.current = 0;
      // Settle back to level, with a little overshoot left in the spring.
      pitch.current += (0 - pitch.current) * Math.min(1, delta * 7);
    }

    if (body.current) body.current.rotation.z = pitch.current;

    // The ping: a ring of sound leaving the sensor at a fixed speed, then the
    // echo coming back. Because the speed is fixed and the distance is not, a
    // near wall answers almost at once and a far one takes visibly longer —
    // which is exactly how the sensor knows the distance at all.
    if (ping.current && pingMat.current) {
      const reach = Math.min(s.distance / CM_PER_UNIT, MAX_PING_REACH);
      const flown = s.t * PING_SPEED;   // how far the pulse has travelled so far
      const inFlight = s.phase === 'sense' && flown < reach * 2 && reach > 0.02;
      ping.current.visible = inFlight;
      if (inFlight) {
        const outbound = flown < reach;
        const travelled = outbound ? flown : reach * 2 - flown;
        ping.current.scale.setScalar(Math.max(0.01, travelled));
        pingMat.current.color.set(outbound ? '#23B5D3' : '#FFC93C');
        // A returning echo is weaker than the pulse that left.
        pingMat.current.opacity = (outbound ? 0.85 : 0.5) * (1 - 0.4 * (travelled / reach));
      }

      // The moment of reflection: the wall lights up where the pulse lands, and
      // the glow fades as the echo makes its way back. This is the one frame
      // that explains the whole sensor — the number in the readout is the time
      // between the flash leaving and the flash returning.
      if (hit.current && hitMat.current) {
        const bounced = s.phase === 'sense' && flown >= reach && flown < reach * 2 && reach < MAX_PING_REACH;
        hit.current.visible = bounced;
        if (bounced) {
          const age = (flown - reach) / Math.max(reach, 0.001);
          hit.current.position.set(wallX - WALL_HALF - 0.01, 0.3, s.z);
          hit.current.scale.setScalar(0.5 + age * 0.9);
          hitMat.current.opacity = 0.75 * (1 - age);
        }
      }
    }
  });

  const mat = benchMat(14, 14);   // one tile per scene unit — 50 cm of matting
  const block = paintedBlock('#E8503A')(3, 1.4);
  // Same stone, a darker coat of paint. The noise fields behind it are cached,
  // so the second variant is close to free.
  const kick = paintedBlock('#8C3527')(3, 0.4);

  return (
    <>
      {/* Bench floor: rubber matting, the kind every school lab bench has on it. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial {...mat} roughness={0.95} metalness={0.04} />
      </mesh>
      {/* The measuring grid stays, but quieter now that the mat carries texture
          of its own — two competing patterns just read as noise. */}
      <gridHelper args={[14, 28, '#1F7A5C', '#16352A']} position={[0, 0.003, 0]}>
        <lineBasicMaterial attach="material" vertexColors transparent opacity={0.32} />
      </gridHelper>

      {/* The wall it will meet: a painted breeze block with a scuffed kickplate
          along the bottom, where things have been bumping into it for years. */}
      <group position={[wallX, 0, 0]}>
        <RoundedBox
          args={[WALL_HALF * 2, 0.7, 3]}
          radius={0.012}
          smoothness={2}
          position={[0, 0.35, 0]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial {...block} roughness={0.88} metalness={0.02} />
        </RoundedBox>
        <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
          <boxGeometry args={[WALL_HALF * 2.15, 0.1, 3]} />
          <meshStandardMaterial {...kick} roughness={0.94} metalness={0.02} />
        </mesh>
      </group>

      {/* Where the pulse strikes the wall. World space, not on the robot. */}
      <mesh ref={hit} rotation={[0, -Math.PI / 2, 0]} visible={false}>
        <circleGeometry args={[0.22, 24]} />
        <meshBasicMaterial ref={hitMat} color="#FFC93C" transparent opacity={0} depthWrite={false} toneMapped={false} />
      </mesh>

      <group ref={robot} position={[START.x, 0, START.z]}>
        {/* Pivots about the wheel axle, so the body can pitch without the tyres
            lifting off the floor. */}
        <group ref={body} position={[0, 0.13, 0]}>
          <group position={[0, -0.13, 0]}>
            <RobotBot speedRef={speedRef} turnRef={turnRef} led="#23B5D3" />
          </group>
        </group>
        {/* Sonar pulse: an arc, not a circle, because the sensor only hears
            inside a cone. Drawn flat on the floor from the sensor outward. */}
        <mesh ref={ping} position={[SENSOR_OFFSET, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.88, 1, 40, 1, -BEAM_HALF, BEAM_HALF * 2]} />
          <meshBasicMaterial
            ref={pingMat}
            color="#23B5D3"
            transparent
            opacity={0.7}
            depthWrite={false}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>
      </group>
    </>
  );
}

const BOXES = [
  { id: 'sense', label: 'SENSE', emoji: '👁️' },
  { id: 'think', label: 'THINK', emoji: '🧠' },
  { id: 'act', label: 'ACT', emoji: '⚙️' },
];

export default function SenseThinkActLoop() {
  const reduced = useReducedMotion();
  const [playing, setPlaying] = useState(!reduced);
  const [wallX, setWallX] = useState(1.9);
  const [state, setState] = useState({ phase: 'sense', distance: 0, decision: null });
  const stepRef = useRef(0);

  const onPhase = useCallback((phase, info) => {
    setState((prev) => ({ ...prev, phase, ...info }));
  }, []);

  const step = () => { stepRef.current += 1; };

  const lines = {
    sense: `distance = ${state.distance} cm`,
    think: state.decision
      ? `${state.distance} < ${TOO_CLOSE_CM}? ${state.decision === 'turn' ? 'yes' : 'no'}`
      : 'waiting for a number…',
    act: state.decision === 'turn' ? 'stop and turn right' : 'keep driving forward',
  };

  return (
    <WidgetShell
      title="🎬 Watch the loop run"
      hint="The number is measured from the real distance in the scene. Drag the wall and the robot changes its mind."
      controls={
        <div className="flex items-center gap-2">
          <button
            onClick={step}
            title="Advance one box"
            className="inline-flex items-center gap-1.5 rounded-lg border-2 border-ink/20 bg-white px-3 py-1.5 text-sm font-bold text-ink transition-colors hover:border-ink"
          >
            <StepForward className="h-4 w-4" /> Step
          </button>
          <button
            onClick={() => setPlaying((p) => !p)}
            className="lab-btn inline-flex items-center gap-1.5 rounded-lg border-2 border-ink bg-pcb px-4 py-1.5 text-sm font-bold text-white"
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {playing ? 'Pause' : 'Play'}
          </button>
        </div>
      }
      side={
        <div className="grid gap-2 p-3 sm:grid-cols-3 @min-[68rem]:grid-cols-1">
          {BOXES.map((box, i) => {
            const active = state.phase === box.id;
            return (
              <div
                key={box.id}
                className={`relative rounded-xl border-2 p-3 transition-all duration-200 ${
                  active
                    ? 'border-ink bg-signal/25 shadow-[3px_3px_0_rgba(22,36,29,0.9)]'
                    : 'border-ink/15 bg-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-lg transition-transform ${active ? 'scale-110' : 'opacity-50'}`}>
                    {box.emoji}
                  </span>
                  <span className={`font-lab text-sm font-extrabold ${active ? 'text-ink' : 'text-ink/45'}`}>
                    {box.label}
                  </span>
                </div>
                <p className={`mt-1 font-mono-lab text-xs ${active ? 'text-ink' : 'text-ink/40'}`}>
                  {lines[box.id]}
                </p>
                {/* The arrow points whichever way the boxes are flowing. */}
                {i < 2 && (
                  <>
                    <span className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-ink/25 sm:block @min-[68rem]:hidden">▶</span>
                    <span className="absolute -bottom-2.5 left-1/2 hidden -translate-x-1/2 text-ink/25 @min-[68rem]:block">▼</span>
                  </>
                )}
              </div>
            );
          })}
        </div>
      }
      footer={
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <label className="flex flex-1 items-center gap-3 text-sm font-bold text-ink/70">
            Move the wall
            <input
              type="range"
              min="0.9"
              max="3.0"
              step="0.05"
              value={wallX}
              onChange={(e) => setWallX(parseFloat(e.target.value))}
              className="h-2 flex-1 cursor-pointer accent-pcb"
            />
          </label>
          <button
            onClick={() => setWallX(1.9)}
            title="Put the wall back"
            className="inline-flex items-center gap-1.5 rounded-lg border-2 border-ink/20 bg-white px-3 py-1.5 text-xs font-bold text-ink/70 transition-colors hover:border-ink hover:text-ink"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        </div>
      }
    >
      <Stage3D
        camera={{ position: [-1.4, 3.1, 4.2], fov: 42 }}
        fallback="A robot drives at a wall. It measures the gap, decides that 20 cm is too close, and turns. Then it does it all again."
      >
        <Scene wallX={wallX} playing={playing} stepRef={stepRef} onPhase={onPhase} />
      </Stage3D>
    </WidgetShell>
  );
}
