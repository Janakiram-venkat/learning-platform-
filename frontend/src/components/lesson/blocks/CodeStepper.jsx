import { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause, RotateCcw, Footprints, SquarePen } from 'lucide-react';
import RichText from '../RichText';
import { highlight } from './highlight';

/**
 * Step through code one line at a time and watch what Python does: which line
 * runs, what lands in each variable, what appears in the output.
 *
 *   { "type": "stepper", "title": "Watch it run",
 *     "code": "score = 100\nscore = score + 5\nprint(score)",
 *     "steps": [
 *       { "line": 1, "note": "Make a box called score, put 100 in it.", "vars": { "score": "100" } },
 *       { "line": 2, "note": "Read 100, add 5, store 105.", "vars": { "score": "105" } },
 *       { "line": 3, "note": "Show what's in the box.", "out": ["105"] }
 *     ] }
 *
 * Steps are written as changes, not snapshots: `vars` merges into the memory
 * so far, `out` appends lines. A var set to null is removed. The component
 * replays the steps to build the state at any point, so moving backwards is
 * exact and the author never repeats the whole state at every step.
 *
 * Step 0 is "nothing has run yet", so the student always starts by pressing
 * Next and sees the first line light up.
 */
export default function CodeStepper({ block, language, onTry }) {
  const lines = String(block.code || '').split('\n');
  const steps = useMemo(() => block.steps || [], [block.steps]);
  const [at, setAt] = useState(0); // 0 = before the first step
  const [playing, setPlaying] = useState(false);
  const timer = useRef(null);

  const state = useMemo(() => {
    const vars = {};
    const out = [];
    let changed = new Set();
    for (let i = 0; i < at; i++) {
      const s = steps[i];
      changed = new Set();
      for (const [k, v] of Object.entries(s.vars || {})) {
        if (v === null) delete vars[k];
        else { vars[k] = String(v); changed.add(k); }
      }
      for (const line of [].concat(s.out ?? [])) out.push(String(line));
    }
    return { vars, out, changed };
  }, [at, steps]);

  const step = at > 0 ? steps[at - 1] : null;
  const done = at >= steps.length;

  useEffect(() => {
    if (!playing) return undefined;
    if (done) { setPlaying(false); return undefined; } // eslint-disable-line react-hooks/set-state-in-effect -- stop autoplay at the last step
    timer.current = setTimeout(() => setAt((a) => a + 1), 1400);
    return () => clearTimeout(timer.current);
  }, [playing, at, done]);

  // Functional updates, so two quick clicks move two steps rather than both
  // reading the same stale `at`.
  const move = (fn) => { setPlaying(false); setAt((a) => Math.max(0, Math.min(steps.length, fn(a)))); };
  const go = (n) => move(() => n);
  const varNames = Object.keys(state.vars);

  return (
    <section className="overflow-hidden rounded-2xl border-2 border-ink/20 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-ink/15 bg-paper px-4 py-2.5">
        <span className="font-lab flex items-center gap-2 text-sm font-bold text-pcb">
          <Footprints className="h-4 w-4" /> {block.title || 'Step through the code'}
        </span>
        <span className="flex items-center gap-3">
          <span className="font-mono-lab text-xs font-bold text-ink/50">step {at} / {steps.length}</span>
          {onTry && (
            <button
              onClick={() => onTry(block.code)}
              className="inline-flex items-center gap-1.5 rounded-md border border-ink/20 bg-white px-2.5 py-1 text-xs font-bold text-ink transition-colors hover:border-ink"
              title="Put this code in the editor"
            >
              <SquarePen className="h-3.5 w-3.5" /> Try it
            </button>
          )}
        </span>
      </div>

      <div className="grid grid-cols-1 @min-[40rem]:grid-cols-[3fr_2fr]">
        {/* Code, with the line that just ran lit up. */}
        <div className="min-w-0 overflow-x-auto bg-well py-3">
          {lines.map((ln, i) => {
            const isCurrent = step && step.line === i + 1;
            return (
              <div
                key={i}
                className={`flex items-stretch font-mono-lab text-sm leading-7 transition-colors ${isCurrent ? 'bg-signal/20' : ''}`}
              >
                <span className={`w-6 shrink-0 text-center ${isCurrent ? 'text-signal' : 'text-transparent'}`} aria-hidden>▶</span>
                <span className={`w-6 shrink-0 select-none pr-2 text-right ${isCurrent ? 'text-signal' : 'text-white/30'}`}>{i + 1}</span>
                <code className={`whitespace-pre pr-4 ${isCurrent ? 'text-white' : 'text-white/85'}`}>{highlight(ln, language)}{ln === '' ? ' ' : null}</code>
              </div>
            );
          })}
        </div>

        {/* What Python is holding, and what it has printed. */}
        <div className="flex flex-col gap-4 border-t border-ink/15 bg-paper/60 p-4 @min-[40rem]:border-l @min-[40rem]:border-t-0">
          <div>
            <p className="ref-tag mb-2 text-ink/55">Memory</p>
            {varNames.length === 0 ? (
              <p className="rounded-lg border-2 border-dashed border-ink/20 px-3 py-3 text-center text-sm text-ink/45">empty</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {varNames.map((k) => (
                  <div key={k} className="flex flex-col items-start">
                    <span className="font-mono-lab rounded-t-md border-2 border-b-0 border-ink bg-signal px-2 py-0.5 text-xs font-extrabold text-ink">{k}</span>
                    <span
                      key={`${k}:${state.vars[k]}`}
                      className={`font-mono-lab min-w-16 rounded-b-md rounded-tr-md border-2 border-ink bg-white px-3 py-1.5 text-base font-extrabold text-ink transition-shadow ${state.changed.has(k) ? 'ring-4 ring-signal/50' : ''}`}
                    >
                      {state.vars[k]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex min-h-24 flex-1 flex-col">
            <p className="ref-tag mb-2 text-ink/55">Output</p>
            <pre className="font-mono-lab flex-1 overflow-x-auto rounded-lg border-2 border-ink bg-well px-3 py-2 text-sm leading-relaxed text-mint">
              {state.out.length ? state.out.join('\n') : <span className="text-white/30">(nothing yet)</span>}
            </pre>
          </div>
        </div>
      </div>

      {/* Narration for the current step. */}
      <div className="border-t border-ink/15 bg-white px-5 py-4">
        <p className="min-h-12 text-base leading-relaxed text-ink">
          {step ? <RichText value={step.note} /> : (
            <span className="text-ink/60">{block.intro || 'Press Next to run the first line.'}</span>
          )}
          {done && block.outro && <span className="mt-2 block font-bold text-pcb"><RichText value={block.outro} /></span>}
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1.5" aria-hidden>
            {steps.map((_, i) => (
              <span key={i} className={`h-2 w-6 rounded-full transition-colors ${i < at ? 'bg-pcb' : 'bg-ink/15'}`} />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => go(0)}
              className="rounded-lg border-2 border-ink/20 p-2 text-ink/60 transition-colors hover:border-ink hover:text-ink"
              title="Start over"
              aria-label="Start over"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              onClick={() => move((a) => a - 1)}
              disabled={at === 0}
              className="inline-flex items-center gap-1 rounded-lg border-2 border-ink bg-white px-3 py-1.5 text-sm font-bold text-ink disabled:border-ink/15 disabled:text-ink/30"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
            <button
              onClick={() => (done ? go(0) : setPlaying((p) => !p))}
              className="rounded-lg border-2 border-ink bg-white p-2 text-ink"
              title={playing ? 'Pause' : 'Play all'}
              aria-label={playing ? 'Pause' : 'Play all'}
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <button
              onClick={() => move((a) => a + 1)}
              disabled={done}
              className="inline-flex items-center gap-1 rounded-lg border-2 border-ink bg-signal px-4 py-1.5 text-sm font-extrabold text-ink transition-colors hover:bg-signal/80 disabled:border-ink/15 disabled:bg-ink/10 disabled:text-ink/30"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
