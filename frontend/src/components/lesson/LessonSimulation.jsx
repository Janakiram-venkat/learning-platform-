import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, RotateCcw } from 'lucide-react';

/**
 * Animated, kid-friendly "watch the code run" widgets for lessons.
 *
 * Driven by a JSON block in a lesson's `content` array:
 *   { "type": "simulation", "kind": "variable", "name": "score", "value": "100" }
 *   { "type": "simulation", "kind": "loop", "times": 3, "say": "Hello!" }
 *   { "type": "simulation", "kind": "print", "lines": ["Hi!", "Bye!"] }
 *
 * Each one shows the code on top and animates what Python "does" below when
 * the child presses Play. No real interpreter — just a friendly illustration.
 */
export default function LessonSimulation({ sim }) {
  if (!sim) return null;
  if (sim.kind === 'loop') return <LoopSim sim={sim} />;
  if (sim.kind === 'print') return <PrintSim sim={sim} />;
  return <VariableSim sim={sim} />;
}

function Shell({ title, code, onPlay, playing, onReset, children }) {
  return (
    <div className="my-8 overflow-hidden rounded-2xl border-2 border-purple-100 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-purple-100 bg-purple-50 px-4 py-3">
        <span className="font-display text-sm font-bold text-[#6C4Fd0]">🎬 {title}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            className="rounded-lg p-1.5 text-purple-400 transition-colors hover:bg-purple-100 hover:text-purple-600"
            title="Reset"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            onClick={onPlay}
            disabled={playing}
            className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-4 py-1.5 text-sm font-bold text-white shadow-sm transition-transform enabled:hover:scale-105 enabled:active:scale-95 disabled:opacity-50"
          >
            <Play className="h-4 w-4" /> {playing ? 'Running...' : 'Run it!'}
          </button>
        </div>
      </div>
      {code && (
        <pre className="overflow-x-auto bg-gray-900 px-4 py-3 font-mono text-sm text-gray-100">{code}</pre>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

/* ---- Variable: a value drops into a labelled box, then prints ---- */
function VariableSim({ sim }) {
  const name = sim.name || 'score';
  const value = String(sim.value ?? '100');
  const [stage, setStage] = useState(0); // 0 empty, 1 value in box, 2 printed
  const timers = useRef([]);

  const clear = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  useEffect(() => () => clear(), []);

  const play = () => {
    clear();
    setStage(0);
    timers.current.push(setTimeout(() => setStage(1), 400));
    timers.current.push(setTimeout(() => setStage(2), 1400));
  };
  const reset = () => { clear(); setStage(0); };

  const code = `${name} = ${value}\nprint(${name})`;

  return (
    <Shell title="Storing in a variable" code={code} onPlay={play} playing={stage === 1} onReset={reset}>
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
        {/* The labelled box */}
        <div className="flex flex-col items-center">
          <div className={`flex h-24 w-28 items-center justify-center rounded-xl border-4 transition-all duration-500 ${stage >= 1 ? 'border-teal-400 bg-teal-50' : 'border-dashed border-gray-300 bg-gray-50'}`}>
            <span className={`font-mono text-2xl font-extrabold text-teal-600 transition-all duration-500 ${stage >= 1 ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
              {value}
            </span>
          </div>
          <span className="mt-2 rounded-md bg-gray-800 px-3 py-1 font-mono text-sm font-bold text-white">{name}</span>
        </div>

        {/* The screen / print output */}
        <div className="flex flex-col items-center">
          <div className="flex h-24 w-44 items-center justify-center rounded-xl bg-gray-900 px-3 font-mono text-xl text-green-400 shadow-inner">
            {stage >= 2 ? <span className="animate-bounce-in">{value}</span> : <span className="text-gray-600">screen…</span>}
          </div>
          <span className="mt-2 text-xs font-semibold text-gray-400">print output</span>
        </div>
      </div>
      <p className="mt-5 text-center text-sm font-medium text-[#6C63A6]">
        {stage === 0 && 'Press “Run it!” to watch the value go into the box.'}
        {stage === 1 && `We put ${value} into the box labelled ${name} 📦`}
        {stage === 2 && `print(${name}) opens the box and shows ${value} on the screen! ✨`}
      </p>
    </Shell>
  );
}

/* ---- Loop: a counter repeats an action N times ---- */
function LoopSim({ sim }) {
  const times = Math.min(Math.max(parseInt(sim.times, 10) || 3, 1), 8);
  const say = sim.say || 'Hello!';
  const [count, setCount] = useState(0);
  const [outputs, setOutputs] = useState([]);
  const [running, setRunning] = useState(false);
  const timers = useRef([]);

  const clear = useCallback(() => { timers.current.forEach(clearTimeout); timers.current = []; }, []);
  useEffect(() => () => clear(), [clear]);

  const reset = () => { clear(); setCount(0); setOutputs([]); setRunning(false); };

  const play = () => {
    clear();
    setCount(0); setOutputs([]); setRunning(true);
    for (let i = 1; i <= times; i++) {
      timers.current.push(setTimeout(() => {
        setCount(i);
        setOutputs(o => [...o, say]);
        if (i === times) setRunning(false);
      }, i * 700));
    }
  };

  const code = `for i in range(${times}):\n    print("${say}")`;

  return (
    <Shell title="A loop repeating" code={code} onPlay={play} playing={running} onReset={reset}>
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start sm:justify-center sm:gap-10">
        {/* Spinning counter */}
        <div className="flex flex-col items-center">
          <div className={`flex h-24 w-24 items-center justify-center rounded-full border-4 border-orange-300 bg-orange-50 text-3xl font-extrabold text-orange-600 ${running ? 'animate-pop' : ''}`}>
            {count}
          </div>
          <span className="mt-2 text-xs font-semibold text-gray-400">times looped</span>
        </div>
        {/* Output stack */}
        <div className="min-h-[6rem] w-52 rounded-xl bg-gray-900 p-3 font-mono text-sm text-green-400 shadow-inner">
          {outputs.length === 0 ? (
            <span className="text-gray-600">screen…</span>
          ) : (
            outputs.map((line, i) => <div key={i} className="animate-slide-up">{line}</div>)
          )}
        </div>
      </div>
      <p className="mt-5 text-center text-sm font-medium text-[#6C63A6]">
        The loop runs the indented line {times} times — so “{say}” is printed {times} times!
      </p>
    </Shell>
  );
}

/* ---- Print: lines appear one by one like a typewriter ---- */
function PrintSim({ sim }) {
  const lines = Array.isArray(sim.lines) ? sim.lines : ['Hello!'];
  const [shown, setShown] = useState(0);
  const [running, setRunning] = useState(false);
  const timers = useRef([]);

  const clear = useCallback(() => { timers.current.forEach(clearTimeout); timers.current = []; }, []);
  useEffect(() => () => clear(), [clear]);

  const reset = () => { clear(); setShown(0); setRunning(false); };
  const play = () => {
    clear(); setShown(0); setRunning(true);
    lines.forEach((_, i) => {
      timers.current.push(setTimeout(() => {
        setShown(i + 1);
        if (i === lines.length - 1) setRunning(false);
      }, (i + 1) * 600));
    });
  };

  const code = lines.map(l => `print("${l}")`).join('\n');

  return (
    <Shell title="Showing output" code={code} onPlay={play} playing={running} onReset={reset}>
      <div className="min-h-[5rem] rounded-xl bg-gray-900 p-4 font-mono text-base text-green-400 shadow-inner">
        {shown === 0 ? (
          <span className="text-gray-600">screen…</span>
        ) : (
          lines.slice(0, shown).map((line, i) => <div key={i} className="animate-slide-up">{line}</div>)
        )}
      </div>
      <p className="mt-4 text-center text-sm font-medium text-[#6C63A6]">
        Each print line shows up on the screen, one after another.
      </p>
    </Shell>
  );
}
