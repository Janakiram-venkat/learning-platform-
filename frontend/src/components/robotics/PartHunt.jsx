import { useRef, useState, useEffect } from 'react';
import { Play, RotateCcw, Timer, Target, CheckCircle2 } from 'lucide-react';
import { awardXPOnce } from '../../lib/progress';
import Stage3D from './shared/Stage3D';
import WidgetShell from './shared/WidgetShell';
import RobotBench from './bench/RobotBench';
import { ARIA_PARTS, SYSTEMS, PART_BY_ID } from './bench/ariaParts';

/**
 * Part Hunt — the module's assessment, played rather than answered.
 *
 * Two rules make it teach instead of just testing. A wrong answer shakes the
 * part you actually clicked and tells you *its* name, so guessing wrong still
 * puts a name to a shape; and after two misses on the same target the system
 * colour is revealed, which narrows fourteen parts to two or three without
 * ever handing over the answer.
 */

const ROUNDS = 6;
const XP_PER_FIND = 8;

function pickTargets() {
  const pool = [...ARIA_PARTS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, ROUNDS).map((p) => p.id);
}

export default function PartHunt({ block }) {
  const explodeRef = useRef(0);
  const [phase, setPhase] = useState('idle'); // idle | playing | done
  const [targets, setTargets] = useState([]);
  const [round, setRound] = useState(0);
  const [misses, setMisses] = useState(0);        // misses on the current target
  const [totalMisses, setTotalMisses] = useState(0);
  const [found, setFound] = useState([]);
  const [feedback, setFeedback] = useState(null); // { kind, text }
  const [shakeId, setShakeId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const [earned, setEarned] = useState(0);

  // The clock only runs while a hunt is in progress.
  useEffect(() => {
    if (phase !== 'playing') return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  const start = () => {
    setTargets(pickTargets());
    setRound(0);
    setMisses(0);
    setTotalMisses(0);
    setFound([]);
    setFeedback(null);
    setShakeId(null);
    setSeconds(0);
    setEarned(0);
    setPhase('playing');
  };

  const targetId = targets[round];
  const target = targetId ? PART_BY_ID[targetId] : null;

  const handleSelect = (id) => {
    if (phase !== 'playing' || !id || !target) return;

    if (id === target.id) {
      const nextFound = [...found, id];
      setFound(nextFound);
      setFeedback({ kind: 'hit', text: `Found it: ${target.label}!` });
      setShakeId(null);
      setMisses(0);

      if (round + 1 >= targets.length) {
        setPhase('done');
        const key = block?.xpKey;
        // Every find is worth XP; a clean run is worth a bonus on top.
        const clean = totalMisses === 0;
        if (key) setEarned(awardXPOnce(key, ROUNDS * XP_PER_FIND + (clean ? 20 : 0)));
      } else {
        setRound((r) => r + 1);
      }
    } else {
      const clicked = PART_BY_ID[id];
      setMisses((m) => m + 1);
      setTotalMisses((m) => m + 1);
      setShakeId(id);
      setFeedback({ kind: 'miss', text: `That's the ${clicked.label}. Keep looking.` });
      setTimeout(() => setShakeId(null), 600);
    }
  };

  const hintSystem = misses >= 2 && target ? SYSTEMS[target.system] : null;
  const accuracy = found.length + totalMisses > 0
    ? Math.round((found.length / (found.length + totalMisses)) * 100)
    : 100;

  return (
    <WidgetShell
      title="🎯 Part Hunt"
      hint={
        phase === 'playing'
          ? 'Spin her round to find it. A wrong click still tells you what you hit.'
          : 'Six parts, against the clock. Spin and zoom as much as you like.'
      }
      controls={
        <div className="flex items-center gap-2">
          {phase === 'playing' && (
            <>
              <span className="inline-flex items-center gap-1.5 rounded-lg border-2 border-ink/20 bg-white px-3 py-1.5 font-mono-lab text-sm font-bold text-ink">
                <Timer className="h-4 w-4" /> {seconds}s
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border-2 border-ink/20 bg-white px-3 py-1.5 font-mono-lab text-sm font-bold text-ink">
                <Target className="h-4 w-4" /> {found.length}/{targets.length}
              </span>
            </>
          )}
          <button
            onClick={start}
            className="lab-btn inline-flex items-center gap-1.5 rounded-lg border-2 border-ink bg-pcb px-4 py-1.5 text-sm font-bold text-white"
          >
            {phase === 'idle' ? <Play className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
            {phase === 'idle' ? 'Start the hunt' : 'New hunt'}
          </button>
        </div>
      }
      side={
        <div className="flex flex-wrap gap-2 p-3 @min-[68rem]:flex-col @min-[68rem]:items-stretch">
          {targets.length === 0 && (
            <p className="text-sm font-semibold text-ink/45">
              Six parts will appear here as you find them.
            </p>
          )}
          {targets.map((id, i) => {
            const p = PART_BY_ID[id];
            const isFound = found.includes(id);
            const isCurrent = i === round && phase === 'playing';
            return (
              <span
                key={id}
                className={`inline-flex items-center gap-1.5 rounded-lg border-2 px-2.5 py-1 text-xs font-bold transition-all ${
                  isFound
                    ? 'border-pcb bg-pcb/10 text-pcb'
                    : isCurrent
                      ? 'border-ink bg-signal/30 text-ink'
                      : 'border-ink/15 bg-white text-ink/30'
                }`}
              >
                {isFound && <CheckCircle2 className="h-3.5 w-3.5" />}
                {isFound || isCurrent ? p.label : `Part ${i + 1}`}
              </span>
            );
          })}
        </div>
      }
    >
      {/* The instruction bar — the whole game, in one line */}
      <div
        className={`flex flex-wrap items-center gap-2 border-b-2 border-ink/10 px-4 py-3 transition-colors ${
          feedback?.kind === 'hit' ? 'bg-pcb/10' : feedback?.kind === 'miss' ? 'bg-wire/8' : ''
        }`}
      >
        {phase === 'idle' && (
          <p className="font-semibold text-ink/65">
            Press <b>Start the hunt</b> and a part will be named. Click it on the robot.
          </p>
        )}
        {phase === 'playing' && target && (
          <>
            <span className="font-lab text-lg font-extrabold text-ink">Find the {target.label}</span>
            {hintSystem && (
              <span
                className="inline-flex items-center gap-1 rounded-md border-2 border-ink px-2 py-0.5 text-[11px] font-bold text-ink"
                style={{ background: hintSystem.color }}
              >
                {hintSystem.emoji} it's part of {hintSystem.label}
              </span>
            )}
          </>
        )}
        {phase === 'done' && (
          <span className="font-lab text-lg font-extrabold text-ink">
            All six found in {seconds}s · {accuracy}% accuracy{earned ? ` · +${earned} XP` : ''}
          </span>
        )}
        {feedback && phase !== 'done' && (
          <span className={`ml-auto text-sm font-bold ${feedback.kind === 'hit' ? 'text-pcb' : 'text-wire'}`}>
            {feedback.text}
          </span>
        )}
      </div>

      <Stage3D
        camera={{ position: [0.72, 0.5, 0.82], fov: 42 }}
        height="h-[340px] sm:h-[420px] @min-[68rem]:h-[min(64vh,680px)]"
        fallback="The part hunt needs 3D. Every part it asks about is described in the lessons above."
      >
        <RobotBench
          explodeRef={explodeRef}
          hoveredId={hoveredId}
          huntShakeId={shakeId}
          showLabel={false}
          onSelect={handleSelect}
          onHover={setHoveredId}
        />
      </Stage3D>
    </WidgetShell>
  );
}
