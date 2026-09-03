import { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { awardXPOnce } from '../../lib/progress';
import WidgetShell from './shared/WidgetShell';
import useInView from './shared/useInView';

const W = 340, H = 160;
const trackY = (x) => 80 + 35 * Math.sin(x / 70);
const SPEED = 55; // px/s
const TURN_RATE = 2.4; // rad/s
const HOME = { x: 15, y: trackY(15), heading: 0 };

const ROWS = [
  { key: 'both', label: 'Left: on the line · Right: on the line', correct: 'forward' },
  { key: 'leftOnly', label: 'Left: on the line · Right: off the line', correct: 'left' },
  { key: 'rightOnly', label: 'Left: off the line · Right: on the line', correct: 'right' },
  { key: 'neither', label: 'Left: off the line · Right: off the line', correct: 'stop' },
];
const ACTIONS = [
  { id: 'forward', label: 'Forward' },
  { id: 'left', label: 'Turn left' },
  { id: 'right', label: 'Turn right' },
  { id: 'stop', label: 'Stop' },
];

/**
 * A real (small) closed-loop simulation, not answer-matching: the student's
 * four-row table actually drives a robot along a sine-wave track, sampling
 * two virtual sensors each tick. Bad rules genuinely make it oscillate or
 * drive off — matching the blueprint's "tunable, so it's a real engineering
 * exercise" spec, on a much smaller scale than the full RobotSim engine.
 */
export default function LineFollowTable({ block }) {
  const { title = '〰️ Line Follow Table', hint, xp = 25, xpKey } = block || {};
  const [rules, setRules] = useState({ both: 'forward', leftOnly: 'forward', rightOnly: 'forward', neither: 'forward' });
  const [pose, setPose] = useState(HOME);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [ref, inView] = useInView();
  const rulesRef = useRef(rules);
  useEffect(() => { rulesRef.current = rules; }, [rules]);
  const statsRef = useRef({ onTrack: 0, total: 0 });
  const poseRef = useRef(HOME);

  useEffect(() => {
    if (!running || !inView) return undefined;
    let raf;
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.04, (now - last) / 1000);
      last = now;
      const p = poseRef.current;
      const sx = p.x + 16 * Math.cos(p.heading);
      const syBase = p.y + 16 * Math.sin(p.heading);
      const perpX = -Math.sin(p.heading) * 9, perpY = Math.cos(p.heading) * 9;
      const lx = sx + perpX, ly = syBase + perpY;
      const rx = sx - perpX, ry = syBase - perpY;
      const leftOn = Math.abs(ly - trackY(lx)) < 7;
      const rightOn = Math.abs(ry - trackY(rx)) < 7;
      const key = leftOn && rightOn ? 'both' : leftOn ? 'leftOnly' : rightOn ? 'rightOnly' : 'neither';
      const action = rulesRef.current[key];
      let heading = p.heading;
      if (action === 'left') heading -= TURN_RATE * dt;
      if (action === 'right') heading += TURN_RATE * dt;
      const speed = action === 'stop' ? 0 : SPEED;
      const x = p.x + speed * Math.cos(heading) * dt;
      const y = p.y + speed * Math.sin(heading) * dt;

      const onTrack = Math.abs(y - trackY(x)) < 22;
      statsRef.current.total += 1;
      if (onTrack) statsRef.current.onTrack += 1;

      if (!onTrack || x > W - 15) {
        const pct = statsRef.current.total ? statsRef.current.onTrack / statsRef.current.total : 0;
        const finished = x > W - 15;
        setRunning(false);
        setResult(finished && pct > 0.85 ? 'pass' : 'fail');
        if (finished && pct > 0.85 && xpKey) awardXPOnce(xpKey, xp);
        return;
      }
      poseRef.current = { x, y, heading };
      setPose(poseRef.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, inView, xp, xpKey]);

  const run = () => {
    statsRef.current = { onTrack: 0, total: 0 };
    poseRef.current = HOME;
    setPose(HOME);
    setResult(null);
    setRunning(true);
  };
  const reset = () => {
    setRunning(false);
    poseRef.current = HOME;
    setPose(HOME);
    setResult(null);
  };

  let trackPath = '';
  for (let x = 0; x <= W; x += 8) trackPath += `${x === 0 ? 'M' : 'L'}${x} ${trackY(x).toFixed(1)} `;

  return (
    <WidgetShell
      title={title}
      hint={hint}
      controls={
        <button onClick={reset} className="inline-flex items-center gap-1.5 rounded-lg border-2 border-ink bg-white px-3 py-1.5 text-xs font-bold text-ink">
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </button>
      }
    >
      <div ref={ref} className="p-4">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-xl border-2 border-ink/12 bg-[#0B180F]">
          <path d={trackPath} fill="none" stroke="#FFC93C" strokeWidth="4" opacity="0.7" />
          <g transform={`translate(${pose.x} ${pose.y}) rotate(${(pose.heading * 180) / Math.PI})`}>
            <rect x="-9" y="-7" width="18" height="14" rx="3" fill="#1F7A5C" stroke="#EDF3EE" strokeWidth="1.5" />
          </g>
        </svg>

        {result && (
          <p className={`mt-2 text-center font-mono-lab text-sm font-bold ${result === 'pass' ? 'text-pcb' : 'text-wire'}`}>
            {result === 'pass' ? '✓ completed the track, staying on the line' : '✗ drove off the track — adjust your rules and try again'}
          </p>
        )}

        <div className="mt-4 space-y-2">
          {ROWS.map((row) => (
            <div key={row.key} className="flex flex-col gap-1.5 rounded-xl border-2 border-ink/12 bg-paper/60 p-2.5 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm font-bold text-ink/80">{row.label}</span>
              <div className="flex flex-wrap gap-1.5">
                {ACTIONS.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setRules((r) => ({ ...r, [row.key]: a.id }))}
                    className={`rounded-lg border-2 border-ink px-2.5 py-1 text-xs font-bold ${rules[row.key] === a.id ? 'bg-signal text-ink' : 'bg-white text-ink/60'}`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={run}
          disabled={running}
          className="lab-btn mt-4 w-full rounded-xl border-2 border-ink bg-pcb px-6 py-2.5 font-extrabold text-white disabled:opacity-60"
        >
          {running ? 'Running…' : 'Test on track'}
        </button>
      </div>
    </WidgetShell>
  );
}
