import { useState } from 'react';
import { Play, RotateCcw, ChevronRight, AlertTriangle } from 'lucide-react';

/**
 * While Tracer: walk a while loop one pass at a time.
 *
 * The point is the rhythm a while loop actually follows, which is check, run,
 * update, check again. Students who only read the code tend to picture the
 * condition being tested once. Stepping through it pass by pass, with the
 * check drawn separately from the body, makes the cycle visible.
 *
 * The `update` switch is the other half: turn it off and the counter stops
 * moving, the condition never goes False, and the trace runs into the safety
 * cap. That is an infinite loop, shown rather than described.
 *
 * Content block shape (all optional):
 *   { "type": "widget", "kind": "while-tracer",
 *     "variable": "energy", "start": 3, "op": ">", "limit": 0,
 *     "say": "Jumping jack!", "stepBy": -1, "after": "Out of energy!" }
 */
const COMPARATORS = {
  '>':  (v, n) => v > n,
  '<':  (v, n) => v < n,
  '>=': (v, n) => v >= n,
  '<=': (v, n) => v <= n,
  '!=': (v, n) => v !== n,
};

const SAFETY_CAP = 12;

export default function WhileTracer({ block }) {
  const variable = block?.variable || 'energy';
  const start = Number(block?.start ?? 3);
  const op = block?.op || '>';
  const limit = Number(block?.limit ?? 0);
  const say = block?.say || 'Jumping jack!';
  const stepBy = Number(block?.stepBy ?? -1);
  const after = block?.after || 'Out of energy, time to rest!';

  const [withUpdate, setWithUpdate] = useState(true);
  const [shown, setShown] = useState(0);

  const cmp = COMPARATORS[op] || COMPARATORS['>'];

  // Build the whole trace up front, then reveal it a pass at a time. Capped so
  // the no-update case terminates instead of hanging the page.
  const passes = [];
  let value = start;
  let capped = false;
  for (let n = 1; ; n += 1) {
    const holds = cmp(value, limit);
    if (!holds) {
      passes.push({ n, value, holds: false });
      break;
    }
    if (n > SAFETY_CAP) { capped = true; break; }
    const next = withUpdate ? value + stepBy : value;
    passes.push({ n, value, holds: true, printed: say, next });
    value = next;
  }

  const total = passes.length;
  const visible = passes.slice(0, shown);
  const done = shown >= total;
  const finishedCleanly = done && !capped;

  const updateLine = `    ${variable} = ${variable} ${stepBy < 0 ? '-' : '+'} ${Math.abs(stepBy)}`;

  return (
    <div className="my-8 overflow-hidden rounded-2xl border-2 border-ink bg-white shadow-[4px_4px_0_rgba(27,27,27,0.9)] [container-type:inline-size]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink bg-pcb px-4 py-3">
        <span className="font-lab text-sm font-bold text-white">While Tracer</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShown(0)}
            className="rounded-lg border-2 border-white/30 p-1.5 text-white/80 transition-colors hover:border-white hover:bg-white/10"
            title="Reset"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShown(s => Math.min(total, s + 1))}
            disabled={done}
            className="inline-flex items-center gap-1.5 rounded-lg border-2 border-ink bg-white px-3 py-1.5 text-sm font-bold text-ink transition-colors hover:bg-paper disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" /> Step
          </button>
          <button
            onClick={() => setShown(total)}
            disabled={done}
            className="inline-flex items-center gap-1.5 rounded-lg border-2 border-ink bg-signal px-3 py-1.5 text-sm font-bold text-ink transition-colors disabled:opacity-50"
          >
            <Play className="h-4 w-4" /> Run all
          </button>
        </div>
      </div>

      <div className="p-5">
        {/* The code, with the update line dimmed when it is switched off. */}
        <pre className="mb-4 overflow-x-auto rounded-xl border-2 border-ink bg-well px-4 py-4 font-mono-lab text-sm leading-relaxed text-white/90">
          <span>{`${variable} = ${start}\nwhile ${variable} ${op} ${limit}:\n    print("${say}")\n`}</span>
          <span className={withUpdate ? '' : 'text-white/25 line-through'}>{updateLine}</span>
          <span>{`\nprint("${after}")`}</span>
        </pre>

        <button
          onClick={() => { setWithUpdate(v => !v); setShown(0); }}
          role="switch"
          aria-checked={withUpdate}
          className="mb-5 flex w-full items-center justify-between gap-3 rounded-xl border-2 border-ink bg-paper px-3 py-3 text-left transition-colors hover:bg-white"
        >
          <span className="min-w-0 text-sm font-bold text-ink">
            Keep the line that changes {variable}
          </span>
          <span className="flex shrink-0 items-center gap-2">
            <span className={`font-mono-lab text-xs font-extrabold ${withUpdate ? 'text-mint-deep' : 'text-wire'}`}>
              {withUpdate ? 'on' : 'off'}
            </span>
            <span className={`relative h-7 w-12 shrink-0 rounded-full border-2 border-ink transition-colors ${withUpdate ? 'bg-mint' : 'bg-ink/20'}`}>
              <span className={`absolute top-0.5 h-5 w-5 rounded-full border-2 border-ink bg-white transition-all ${withUpdate ? 'left-[1.4rem]' : 'left-0.5'}`} />
            </span>
          </span>
        </button>

        {/* Pass-by-pass trace. Columns are fixed so the check, the value and
            the result stay in line as rows appear. */}
        <p className="ref-tag mb-2 text-ink/55">Pass by pass</p>
        <div className="mb-4 min-h-24 overflow-hidden rounded-xl border-2 border-ink">
          {visible.length === 0 ? (
            <p className="px-4 py-5 text-sm font-semibold text-ink/50">
              Press Step to check the condition for the first time.
            </p>
          ) : (
            visible.map((p) => (
              <div
                key={p.n}
                className={`flex flex-wrap items-center gap-x-3 gap-y-1 border-b-2 border-ink/10 px-3 py-2 last:border-b-0 ${p.holds ? 'bg-mint/10' : 'bg-wire/10'}`}
              >
                <span className="ref-tag w-14 shrink-0 text-ink/45">pass {p.n}</span>
                <code className="font-mono-lab text-sm font-bold text-ink">
                  {p.value} {op} {limit}
                </code>
                <span className={`rounded-md border-2 px-2 py-0.5 ref-tag ${p.holds ? 'border-ink bg-mint text-white' : 'border-wire bg-wire/15 text-wire'}`}>
                  {p.holds ? 'True' : 'False'}
                </span>
                {p.holds ? (
                  <span className="min-w-0 text-sm font-medium text-ink/70">
                    prints {p.printed}
                    {withUpdate
                      ? `, then ${variable} becomes ${p.next}`
                      : `, ${variable} stays ${p.value}`}
                  </span>
                ) : (
                  <span className="text-sm font-medium text-ink/70">loop ends</span>
                )}
              </div>
            ))
          )}
        </div>

        {done && capped && (
          <div className="flex items-start gap-3 rounded-xl border-2 border-wire bg-wire/10 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-wire" />
            <p className="text-sm font-medium leading-relaxed text-ink">
              <strong className="font-bold">Infinite loop.</strong> {variable} never changes,
              so the condition stays True and the loop never ends. This trace stopped after{' '}
              {SAFETY_CAP} passes, but real Python would keep going until you force it to quit.
              Switch the update line back on to fix it.
            </p>
          </div>
        )}

        {finishedCleanly && (
          <p className="text-sm font-medium leading-relaxed text-ink/70">
            The condition finally turned False, so the loop stopped and Python moved on to
            print {after}
          </p>
        )}
      </div>
    </div>
  );
}
