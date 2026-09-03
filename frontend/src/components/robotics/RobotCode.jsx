import { useEffect, useRef, useState } from 'react';
import { Play, RotateCcw } from 'lucide-react';
import CodeEditor from '../editor/CodeEditor';
import { compilerService } from '../../services/api';
import { awardXPOnce } from '../../lib/progress';
import WidgetShell from './shared/WidgetShell';
import { buildRobotScript } from './pyrobot/buildScript';
import { WORLDS } from './pyrobot/worlds';

const MARKER = '__ROBOT_TRACE__';
const REPLAY_MS = 3500; // total wall-clock time a replay takes, regardless of trace length

function trackPath(world) {
  if (!world.line) return '';
  let d = '';
  for (let x = 0; x <= world.width; x += 6) {
    const y = world.line.baseY + world.line.amp * Math.sin(x / world.line.freq);
    d += `${x === 0 ? 'M' : 'L'}${x} ${y.toFixed(1)} `;
  }
  return d;
}

/**
 * A real Monaco editor running real Python through the platform's existing
 * Pyodide pipeline (`compilerService.runPython`, unmodified) — see
 * buildScript.js for why an unmodified `while True:` is safe here (Python
 * owns the whole simulation and self-limits via an internal tick budget).
 * The result is a JSON trace, replayed here as an animation over a fixed
 * wall-clock duration regardless of how many ticks the run actually used.
 */
export default function RobotCode({ block }) {
  const {
    title = '🐍 Robot Python',
    hint,
    worldId = 'obstacleRoom',
    starterCode = 'robot.forward(50)\n',
    maxTicks = 900,
    xp = 30,
    xpKey,
  } = block || {};
  const world = WORLDS[worldId] || WORLDS.obstacleRoom;

  const [code, setCode] = useState(starterCode);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [parseError, setParseError] = useState('');
  const [stepIndex, setStepIndex] = useState(0);
  const [earned, setEarned] = useState(0);
  const stepTimer = useRef(null);

  useEffect(() => () => clearTimeout(stepTimer.current), []);

  const run = async () => {
    setRunning(true);
    setResult(null);
    setParseError('');
    setStepIndex(0);
    try {
      const script = buildRobotScript(world, code, maxTicks);
      const res = await compilerService.runPython(script);
      const out = res?.data?.output ?? '';
      const idx = out.indexOf(MARKER);
      if (idx === -1) {
        setParseError(out.trim() || 'No output — check your code for a syntax error.');
        setRunning(false);
        return;
      }
      const data = JSON.parse(out.slice(idx + MARKER.length));
      setResult(data);
      const trace = data.trace || [];
      const stride = Math.max(1, Math.floor(trace.length / (REPLAY_MS / 30)));
      let i = 0;
      const advance = () => {
        i += stride;
        if (i >= trace.length - 1) {
          setStepIndex(trace.length - 1);
          setRunning(false);
          if (data.reachedGoal && xpKey) {
            const got = awardXPOnce(xpKey, xp);
            if (got) setEarned(got);
          }
          return;
        }
        setStepIndex(i);
        stepTimer.current = setTimeout(advance, 30);
      };
      stepTimer.current = setTimeout(advance, 30);
    } catch (err) {
      setParseError(String(err));
      setRunning(false);
    }
  };

  const reset = () => {
    clearTimeout(stepTimer.current);
    setRunning(false);
    setResult(null);
    setParseError('');
    setStepIndex(0);
  };

  const pose = result?.trace?.[Math.min(stepIndex, (result.trace.length || 1) - 1)];
  const W = world.width, H = world.height;

  return (
    <WidgetShell
      title={title}
      hint={hint}
      side={
        <div className="p-4">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-xl border-2 border-ink/12 bg-[#0B180F]">
            <rect x="1" y="1" width={W - 2} height={H - 2} fill="none" stroke="#ffffff15" strokeWidth="2" />
            {(world.obstacles || []).map((o, i) => (
              <rect key={i} x={o.x} y={o.y} width={o.w} height={o.h} fill="#16241D" stroke="#E8503A" strokeWidth="1.5" />
            ))}
            {world.line && <path d={trackPath(world)} fill="none" stroke="#FFC93C" strokeWidth="3" opacity="0.7" />}
            {world.goal && <circle cx={world.goal.x} cy={world.goal.y} r={world.goal.r} fill="none" stroke="#1F7A5C" strokeWidth="2" strokeDasharray="4 3" />}
            {pose && (
              <g transform={`translate(${pose.x} ${pose.y}) rotate(${(pose.h * 180) / Math.PI})`}>
                <polygon points="9,0 -6,6 -6,-6" fill="#23B5D3" stroke="#EDF3EE" strokeWidth="1.2" />
              </g>
            )}
          </svg>

          <div className="mt-2 min-h-[3rem] text-center">
            {parseError && <p className="text-xs font-bold text-wire">{parseError.slice(0, 220)}</p>}
            {result && !running && !parseError && (
              <p className={`font-mono-lab text-xs font-bold ${result.reachedGoal ? 'text-pcb' : 'text-wire'}`}>
                {result.error
                  ? `error: ${result.error}`
                  : result.reachedGoal
                    ? `reached the goal in ${result.ticks} ticks${earned ? ` · +${earned} XP` : ''}`
                    : result.budgetExceeded
                      ? "ran out of ticks — did your loop's exit condition ever become true?"
                      : 'program finished without reaching the goal'}
              </p>
            )}
            {result?.says?.length > 0 && (
              <p className="mt-1 text-xs font-semibold text-ink/50">says: {result.says.join(' · ')}</p>
            )}
          </div>
        </div>
      }
      controls={
        <button onClick={reset} className="inline-flex items-center gap-1.5 rounded-lg border-2 border-ink bg-white px-3 py-1.5 text-xs font-bold text-ink">
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </button>
      }
    >
      <div className="flex h-[360px] flex-col p-4">
        <div className="min-h-0 flex-1">
          <CodeEditor code={code} onChange={setCode} onRun={run} starterCode={starterCode} filename="robot.py" />
        </div>
        <button
          onClick={run}
          disabled={running}
          className="lab-btn mt-3 inline-flex items-center justify-center gap-2 rounded-xl border-2 border-ink bg-signal px-6 py-2.5 font-extrabold text-ink disabled:opacity-60"
        >
          <Play className="h-4 w-4" /> {running ? 'Running…' : 'Run'}
        </button>
      </div>
    </WidgetShell>
  );
}
