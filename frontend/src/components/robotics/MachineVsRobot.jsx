import { useRef, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Play, RotateCcw } from 'lucide-react';
import Stage3D from './shared/Stage3D';
import RobotBot from './shared/RobotBot';
import WidgetShell from './shared/WidgetShell';

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

// Contact is geometry, not a fudge factor: the crate is a 0.55 cube and ARIA's
// chassis is 0.62 × 0.46, so the two touch when their centres are this close.
// Anything smaller and the robot visibly parks inside the crate before the hit
// registers; anything larger and it stops in mid-air.
const BOX_HALF = 0.275;
const ROBOT_HALF_LEN = 0.31;
const ROBOT_HALF_W = 0.23;
const NOSE = 0.35;                            // where the ultrasonic sits
const TOUCH_X = BOX_HALF + ROBOT_HALF_LEN;    // 0.585
const TOUCH_Z = BOX_HALF + ROBOT_HALF_W;      // 0.505
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

function Room({ obstacleX, mode, runToken, onFinish }) {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial color="#12271D" roughness={1} />
      </mesh>
      <gridHelper args={[14, 28, '#1F7A5C', '#16352A']} position={[0, 0.001, 0]} />

      {/* The goal */}
      <mesh position={[GOAL_X + 0.15, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.34, 32]} />
        <meshBasicMaterial color="#FFC93C" transparent opacity={0.35} toneMapped={false} />
      </mesh>
      <mesh position={[GOAL_X + 0.15, 0.3, 0]}>
        <coneGeometry args={[0.1, 0.24, 4]} />
        <meshStandardMaterial color="#FFC93C" emissive="#FFC93C" emissiveIntensity={0.5} />
      </mesh>

      {/* The thing in the way */}
      <mesh position={[obstacleX, 0.28, 0]} castShadow receiveShadow>
        <boxGeometry args={[BOX_HALF * 2, 0.56, BOX_HALF * 2]} />
        <meshStandardMaterial color="#8C6239" roughness={0.85} />
      </mesh>

      <Run key={mode} mode={mode} obstacleX={obstacleX} runToken={runToken} onFinish={onFinish} />
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
