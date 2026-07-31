import { useRef, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { Play, RotateCcw } from 'lucide-react';
import Stage3D from './shared/Stage3D';
import RobotBot from './shared/RobotBot';
import WidgetShell from './shared/WidgetShell';
import { benchMat, brushedAlu, sawnTimber } from './shared/labTextures';

/**
 * The same machine, twice — once running a fixed program, once actually
 * looking. Move the box and run it again: the fixed program crashes somewhere
 * new every time, the robot gets there every time. That contrast IS the
 * definition, so it's better felt than read.
 */

const START = { x: -2.1, z: 0 };
const GOAL_X = 2.2;
const SPEED = 1.05;          // units per second, always along the nose
const TURN_RATE = 2.6;       // radians per second the nose can actually swing
const STEER = 0.95;          // the heading it holds while going round the crate
const SEE_RANGE = 1.15;      // how far ahead the sensor notices something
const CM_PER_UNIT = 50;

// Contact is geometry, not a fudge factor: the crate is a 0.55 cube and the two
// touch when their centres are this close. Anything smaller and the robot
// visibly parks inside the crate before the hit registers; anything larger and
// it stops in mid-air.
//
// These are ARIA's *widest* points, not her chassis plate. The plate is
// 0.62 × 0.46, but the ultrasonic transducers stand out to x = 0.35 and the
// wheels out to |z| = 0.289, so measuring the plate let the sensor head push
// 4 cm into the crate before anything registered. Both numbers are asserted
// against the model's own constants — see the note on RobotBot's DECK_TOP.
const BOX_HALF = 0.275;
const ROBOT_HALF_LEN = 0.35;   // transducer face, the foremost point
const ROBOT_HALF_W = 0.29;     // outer tyre wall, the widest point
const NOSE = 0.35;                            // where the ultrasonic sits
const TOUCH_X = BOX_HALF + ROBOT_HALF_LEN;    // 0.625
const TOUCH_Z = BOX_HALF + ROBOT_HALF_W;      // 0.565
const CLEAR_Z = TOUCH_Z + 0.08;               // an offset that really does pass it

const TRACE_POINTS = 96;     // enough to cover the whole crossing
const TRACE_EVERY = 0.05;    // seconds between dropped breadcrumbs

function Run({ mode, obstacleX, runToken, onFinish }) {
  const robot = useRef();
  const trace = useRef([]);
  const seenToken = useRef(-1);

  const speedRef = useRef(0);
  const turnRef = useRef(0);

  const st = useRef({
    x: START.x, z: START.z, rot: 0, aim: 0,
    running: false, done: false, crashed: false, sawIt: false,
    crashT: 0, traceT: 0, used: 0, dist: 0,
  });

  const reset = useCallback(() => {
    const s = st.current;
    s.x = START.x; s.z = START.z; s.rot = 0; s.aim = 0;
    s.running = true; s.done = false; s.crashed = false; s.sawIt = false;
    s.crashT = 0; s.traceT = 0; s.used = 0; s.dist = 0;
    speedRef.current = 0; turnRef.current = 0;
    trace.current.forEach((m) => { if (m) m.visible = false; });
    if (robot.current) {
      robot.current.position.set(START.x, 0, START.z);
      robot.current.rotation.set(0, 0, 0);
    }
  }, []);

  useFrame((_, rawDelta) => {
    const s = st.current;
    const delta = Math.min(rawDelta, 0.05);

    if (seenToken.current !== runToken) {
      seenToken.current = runToken;
      reset();
    }

    if (!s.running) {
      // A crash is abrupt, but it isn't instant: the chassis pitches nose-up
      // over a fraction of a second as it rocks into the crate.
      if (s.crashed && s.crashT < 0.3) {
        s.crashT += delta;
        const k = Math.min(1, s.crashT / 0.22);
        if (robot.current) {
          robot.current.rotation.z = 0.12 * k;
          robot.current.position.y = 0.02 * k;
        }
      }
      speedRef.current = 0;
      turnRef.current = 0;
      return;
    }

    // --- The only difference between the two machines lives here ----------
    if (mode === 'robot') {
      // SENSE: gap from the nose to the crate's near face, and am I lined up
      // with it? Both are surfaces, so both subtract a half-width.
      const gap = (obstacleX - BOX_HALF) - (s.x + NOSE);
      const inLane = Math.abs(s.z) < CLEAR_Z;
      const past = s.x - obstacleX > TOUCH_X;
      if (!past && gap < SEE_RANGE && inLane) {
        s.sawIt = true;
        s.aim = -STEER;        // THINK + ACT: point the nose aside
      } else if (past && s.z > 0.04) {
        s.aim = STEER * 0.55;  // past it — come back onto the line
      } else {
        s.aim = 0;
      }
    }
    // A fixed program has no branch at all: it just drives.

    // Two wheels and a caster cannot slide sideways and cannot snap the nose
    // round instantly. So the heading swings at a bounded rate, and the body
    // only ever travels in the direction the nose is already pointing.
    const swing = Math.max(-TURN_RATE * delta, Math.min(TURN_RATE * delta, s.aim - s.rot));
    s.rot += swing;
    s.x += Math.cos(s.rot) * SPEED * delta;
    s.z -= Math.sin(s.rot) * SPEED * delta;
    // Distance is what the wheels actually covered, so going round the crate
    // really does read as the longer trip.
    s.dist += SPEED * delta;
    speedRef.current = SPEED;
    turnRef.current = swing / delta;

    // Contact — only the machine ever reaches this.
    if (Math.abs(s.x - obstacleX) < TOUCH_X && Math.abs(s.z) < TOUCH_Z) {
      s.running = false;
      s.done = true;
      s.crashed = true;
      onFinish({ crashed: true, sawIt: s.sawIt, at: Math.round(s.dist * CM_PER_UNIT) });
    } else if (s.x >= GOAL_X) {
      s.running = false;
      s.done = true;
      onFinish({ crashed: false, sawIt: s.sawIt, at: Math.round(s.dist * CM_PER_UNIT) });
    }

    // Breadcrumbs, so the two paths can be compared after the fact. Keeping the
    // remainder means they stay evenly spaced instead of drifting with framerate.
    s.traceT += delta;
    if (s.traceT >= TRACE_EVERY && s.used < TRACE_POINTS) {
      s.traceT -= TRACE_EVERY;
      const dot = trace.current[s.used];
      if (dot) {
        dot.position.set(s.x, 0.02, s.z);
        dot.visible = true;
      }
      s.used += 1;
    }

    if (robot.current) {
      robot.current.position.set(s.x, 0, s.z);
      robot.current.rotation.y = s.rot;
    }
  });

  return (
    <>
      <group ref={robot} position={[START.x, 0, START.z]}>
        <RobotBot
          speedRef={speedRef}
          turnRef={turnRef}
          led={mode === 'robot' ? '#23B5D3' : '#E8503A'}
        />
      </group>
      {Array.from({ length: TRACE_POINTS }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => { trace.current[i] = el; }}
          visible={false}
          position={[0, 0.02, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <circleGeometry args={[0.045, 10]} />
          <meshBasicMaterial
            color={mode === 'robot' ? '#23B5D3' : '#E8503A'}
            transparent
            opacity={0.55}
            toneMapped={false}
          />
        </mesh>
      ))}
    </>
  );
}

/**
 * The packing crate, and its reaction to being hit.
 *
 * The recoil is the payoff of the whole widget: a machine that runs into
 * something and leaves it perfectly still has not really run into it, and the
 * student is being asked to notice exactly that collision. It rocks back and
 * settles as a damped oscillation rather than snapping, so the weight of the
 * thing is legible.
 */
function Crate({ x, impactRef }) {
  const group = useRef();
  const boards = sawnTimber('#8C6239')(1, 3);   // three vertical boards a side
  const batten = sawnTimber('#6E4A2A')(1, 1);
  const shock = useRef(0);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    if (impactRef.current) {
      shock.current = 1;
      impactRef.current = 0;
    }
    shock.current = Math.max(0, shock.current - delta * 1.6);
    const g = group.current;
    if (!g) return;
    // Ring down at about 9 rad/s under an envelope that fades in under a second.
    const k = shock.current * shock.current;
    const ring = Math.sin(shock.current * 9) * k;
    g.position.x = x + ring * 0.035;
    g.rotation.z = -ring * 0.05;
  });

  return (
    <group ref={group} position={[x, 0, 0]}>
      <RoundedBox
        args={[BOX_HALF * 2, 0.56, BOX_HALF * 2]}
        radius={0.012}
        smoothness={2}
        position={[0, 0.28, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial {...boards} roughness={0.9} metalness={0.02} />
      </RoundedBox>

      {/* Corner battens: the frame the boards are nailed to. */}
      {[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([sx, sz]) => (
        <mesh
          key={`${sx}${sz}`}
          position={[sx * BOX_HALF, 0.28, sz * BOX_HALF]}
          castShadow
        >
          <boxGeometry args={[0.05, 0.57, 0.05]} />
          <meshStandardMaterial {...batten} roughness={0.92} metalness={0.02} />
        </mesh>
      ))}

      {/* Top and bottom rails, so the crate reads as built rather than carved. */}
      {[0.015, 0.545].map((y) => (
        <mesh key={y} position={[0, y, 0]} castShadow>
          <boxGeometry args={[BOX_HALF * 2.08, 0.045, BOX_HALF * 2.08]} />
          <meshStandardMaterial {...batten} roughness={0.92} metalness={0.02} />
        </mesh>
      ))}
    </group>
  );
}

/** The target pad, breathing so the eye knows where the run is headed. */
function Goal() {
  const ring = useRef();
  const chevron = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ring.current) ring.current.material.opacity = 0.28 + Math.sin(t * 2) * 0.12;
    if (chevron.current) chevron.current.position.y = 0.3 + Math.sin(t * 2) * 0.035;
  });

  return (
    <group position={[GOAL_X + 0.15, 0, 0]}>
      <mesh ref={ring} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.22, 0.34, 40]} />
        <meshBasicMaterial color="#FFC93C" transparent opacity={0.35} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={chevron} position={[0, 0.3, 0]}>
        <coneGeometry args={[0.1, 0.24, 4]} />
        <meshStandardMaterial color="#FFC93C" emissive="#FFC93C" emissiveIntensity={0.6} />
      </mesh>
    </group>
  );
}

function Room({ obstacleX, mode, runToken, onFinish }) {
  const mat = benchMat(14, 14);
  const rail = brushedAlu(6, 1);
  // Set by Run at the instant of contact, consumed by Crate on the next frame.
  const impactRef = useRef(0);

  const finish = useCallback((r) => {
    if (r.crashed) impactRef.current = 1;
    onFinish(r);
  }, [onFinish]);

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial {...mat} roughness={0.95} metalness={0.04} />
      </mesh>
      <gridHelper args={[14, 28, '#1F7A5C', '#16352A']} position={[0, 0.002, 0]}>
        <lineBasicMaterial attach="material" vertexColors transparent opacity={0.32} />
      </gridHelper>

      {/* A machined rail marking the lane the fixed program blindly follows. */}
      {[-0.62, 0.62].map((z) => (
        <mesh key={z} position={[0.05, 0.008, z]} receiveShadow>
          <boxGeometry args={[5.2, 0.016, 0.03]} />
          <meshStandardMaterial {...rail} metalness={0.85} roughness={0.4} envMapIntensity={1.1} />
        </mesh>
      ))}

      <Goal />
      <Crate x={obstacleX} impactRef={impactRef} />

      <Run key={mode} mode={mode} obstacleX={obstacleX} runToken={runToken} onFinish={finish} />
    </>
  );
}

const MODES = [
  { id: 'machine', label: 'Fixed program', emoji: '⚙️', blurb: 'Drive forward. That is the entire program.' },
  { id: 'robot', label: 'Robot', emoji: '🤖', blurb: 'Drive forward, unless something is in the way.' },
];

export default function MachineVsRobot() {
  const [mode, setMode] = useState('machine');
  const [obstacleX, setObstacleX] = useState(0.2);
  const [runToken, setRunToken] = useState(0);
  const [result, setResult] = useState(null);

  const run = () => { setResult(null); setRunToken((t) => t + 1); };
  const onFinish = useCallback((r) => setResult(r), []);

  const current = MODES.find((m) => m.id === mode);

  return (
    <WidgetShell
      title="🧪 Same room, two machines"
      hint="Move the box, then run it again. The fixed program crashes somewhere new every time. The robot gets there every time."
      controls={
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-lg border-2 border-ink">
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => { setMode(m.id); setResult(null); }}
                className={`px-3 py-1.5 text-sm font-bold transition-colors ${
                  mode === m.id ? 'bg-ink text-white' : 'bg-white text-ink/65 hover:bg-ink/5'
                }`}
              >
                {m.emoji} {m.label}
              </button>
            ))}
          </div>
          <button
            onClick={run}
            className="lab-btn inline-flex items-center gap-1.5 rounded-lg border-2 border-ink bg-pcb px-4 py-1.5 text-sm font-bold text-white"
          >
            <Play className="h-4 w-4" /> Run
          </button>
        </div>
      }
      side={
        <div className="p-3">
          <p className="mb-2 font-mono-lab text-xs text-ink/55">
            {current.emoji} {current.blurb}
          </p>
          <div
            className={`rounded-xl border-2 p-3 text-sm font-semibold transition-colors ${
              result
                ? result.crashed
                  ? 'border-wire bg-wire/10 text-ink'
                  : 'border-pcb bg-pcb/10 text-ink'
                : 'border-ink/15 bg-white text-ink/45'
            }`}
          >
            {!result && 'Press Run to send it across the room.'}
            {result?.crashed && `💥 Hit the box after ${result.at} cm. It never looked. All it ever knew was "drive forward". Move the box and it will crash somewhere else instead.`}
            {result && !result.crashed && (result.sawIt
              ? `✅ Saw the box, steered around it, arrived after ${result.at} cm. Same program, different path, because the room was different.`
              : `✅ Reached the goal without needing to steer.`)}
          </div>
        </div>
      }
      footer={
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <label className="flex flex-1 items-center gap-3 text-sm font-bold text-ink/70">
            Move the box
            <input
              type="range"
              min="-0.8"
              max="1.5"
              step="0.05"
              value={obstacleX}
              onChange={(e) => { setObstacleX(parseFloat(e.target.value)); setResult(null); }}
              className="h-2 flex-1 cursor-pointer accent-pcb"
            />
          </label>
          <button
            onClick={() => { setObstacleX(0.2); setResult(null); }}
            className="inline-flex items-center gap-1.5 rounded-lg border-2 border-ink/20 bg-white px-3 py-1.5 text-xs font-bold text-ink/70 transition-colors hover:border-ink hover:text-ink"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        </div>
      }
    >
      <Stage3D
        camera={{ position: [-0.6, 3.4, 4.4], fov: 42 }}
        fallback="A fixed program drives straight and hits the box. A robot sees the box and steers around it."
      >
        <Room obstacleX={obstacleX} mode={mode} runToken={runToken} onFinish={onFinish} />
      </Stage3D>
    </WidgetShell>
  );
}
