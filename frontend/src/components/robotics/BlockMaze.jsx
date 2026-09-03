import { useEffect, useState } from 'react';
import { Play, RotateCcw, Star } from 'lucide-react';
import { awardXPOnce } from '../../lib/progress';
import WidgetShell from './shared/WidgetShell';
import BlockStack from './blocks/BlockStack';
import { MAZES } from './blocks/mazes';
import { runProgram, starsFor } from './blocks/interpreter';

const CELL = 34;
const STEP_MS = 180;

/**
 * A real nested-block interpreter (sequence, repeat, if/else) driving a
 * robot through a grid maze. Star rating rewards using a loop or a
 * conditional over a long hardcoded sequence — matching the blueprint's
 * "3 stars for the elegant loop-based solution, 1 star for hardcoded" spec.
 */
export default function BlockMaze({ block }) {
  const { title = '🧩 Maze Runner', hint, mazeId = 'basic', xp = 30, xpKey } = block || {};
  const maze = MAZES[mazeId] || MAZES.basic;
  const [program, setProgram] = useState([]);
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [earned, setEarned] = useState(0);

  useEffect(() => {
    if (!running || !result) return undefined;
    let cancelled = false;
    let idx = 0;
    const advance = () => {
      if (cancelled) return;
      if (idx >= result.trace.length - 1) {
        setRunning(false);
        if (result.solved) {
          const stars = starsFor(result);
          if (stars >= 2 && xpKey) {
            const got = awardXPOnce(xpKey, xp);
            if (got) setEarned(got);
          }
        }
        return;
      }
      idx += 1;
      setStepIndex(idx);
      timeoutId = setTimeout(advance, STEP_MS);
    };
    let timeoutId = setTimeout(advance, STEP_MS);
    return () => { cancelled = true; clearTimeout(timeoutId); };
  }, [running, result, xp, xpKey]);

  const run = () => {
    const res = runProgram(program, maze);
    setResult(res);
    setStepIndex(0);
    setRunning(true);
  };
  const reset = () => { setResult(null); setRunning(false); setStepIndex(0); };

  const pose = result ? result.trace[Math.min(stepIndex, result.trace.length - 1)] : { row: maze.start.row, col: maze.start.col, facing: maze.facing };
  const stars = result && !running ? starsFor(result) : 0;
  const W = maze.grid[0].length * CELL, H = maze.grid.length * CELL;

  return (
    <WidgetShell
      title={title}
      hint={hint}
      controls={
        <button onClick={reset} className="inline-flex items-center gap-1.5 rounded-lg border-2 border-ink bg-white px-3 py-1.5 text-xs font-bold text-ink">
          <RotateCcw className="h-3.5 w-3.5" /> Clear
        </button>
      }
    >
      <div className="grid grid-cols-1 gap-4 p-4 @min-[68rem]:grid-cols-[auto_1fr]">
        <div>
          <svg width={W} height={H} className="rounded-xl border-2 border-ink/12 bg-[#0B180F]">
            {maze.grid.map((row, r) => row.map((cell, c) => (
              <rect key={`${r}-${c}`} x={c * CELL} y={r * CELL} width={CELL} height={CELL}
                fill={cell ? '#16241D' : '#0F2417'} stroke="#ffffff10" />
            )))}
            <text x={maze.goal.col * CELL + CELL / 2} y={maze.goal.row * CELL + CELL / 2 + 6} textAnchor="middle" fontSize="18">🏁</text>
            <g transform={`translate(${pose.col * CELL + CELL / 2} ${pose.row * CELL + CELL / 2}) rotate(${pose.facing * 90})`}>
              <polygon points="0,-11 9,9 -9,9" fill="#FFC93C" stroke="#16241D" strokeWidth="1.5" />
            </g>
          </svg>

          {!running && result && (
            <div className="mt-2 text-center">
              {result.solved ? (
                <>
                  <div className="flex justify-center gap-0.5">
                    {[1, 2, 3].map((i) => (
                      <Star key={i} className={`h-5 w-5 ${i <= stars ? 'fill-signal text-ink' : 'text-ink/20'}`} />
                    ))}
                  </div>
                  <p className="font-mono-lab text-xs font-bold text-pcb">
                    solved!{earned ? ` · +${earned} XP` : ''} {stars < 3 && '(use a loop or if-block for 3 stars)'}
                  </p>
                </>
              ) : (
                <p className="font-mono-lab text-xs font-bold text-wire">
                  {result.budgetExceeded ? "ran out of turns — check for an endless loop" : "didn't reach the flag yet"}
                </p>
              )}
            </div>
          )}
        </div>

        <div>
          <BlockStack blocks={program} onChange={setProgram} disabled={running} />
          <button
            onClick={run}
            disabled={running || program.length === 0}
            className="lab-btn mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-ink bg-signal px-6 py-2.5 font-extrabold text-ink disabled:opacity-50"
          >
            <Play className="h-4 w-4" /> {running ? 'Running…' : 'Run program'}
          </button>
        </div>
      </div>
    </WidgetShell>
  );
}
