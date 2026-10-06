import { useState } from 'react';
import NumberDial from './NumberDial';

/**
 * Loop Flow: the same loop run with `break` and with `continue`, so the
 * difference is a comparison rather than two separate examples.
 *
 * Every turn of the loop gets a row, marked as ran, skipped, or stopped.
 * `continue` leaves a gap in the middle of the output; `break` cuts the
 * remaining turns off entirely. Seeing both traces at once is what separates
 * "skip one" from "stop everything".
 *
 * Content block shape (all optional):
 *   { "type": "widget", "kind": "loop-flow", "from": 1, "to": 6, "at": 3 }
 */
function trace(from, to, at, mode) {
  const rows = [];
  for (let v = from; v < to; v += 1) {
    if (v === at) {
      rows.push({ v, kind: mode });
      if (mode === 'break') break;
      continue;
    }
    rows.push({ v, kind: 'ran' });
  }
  // Turns the loop never reached, shown greyed so the cut is visible.
  const reached = rows.length ? rows[rows.length - 1].v : from - 1;
  const never = [];
  if (mode === 'break' && rows.some(r => r.kind === 'break')) {
    for (let v = reached + 1; v < to; v += 1) never.push(v);
  }
  return { rows, never };
}

export default function LoopFlow({ block }) {
  const from = Number(block?.from ?? 1);
  const to = Number(block?.to ?? 6);
  const [at, setAt] = useState(Number(block?.at ?? 3));
  const [mode, setMode] = useState(block?.mode === 'continue' ? 'continue' : 'break');

  const { rows, never } = trace(from, to, at, mode);
  const printed = rows.filter(r => r.kind === 'ran').map(r => r.v);

  return (
    <div className="my-8 overflow-hidden rounded-2xl border-2 border-ink bg-white shadow-[4px_4px_0_rgba(27,27,27,0.9)] [container-type:inline-size]">
      <div className="border-b-2 border-ink bg-pcb px-4 py-3">
        <span className="font-lab text-sm font-bold text-white">Loop Flow</span>
      </div>

      <div className="p-5">
        <div className="mb-5 grid grid-cols-1 gap-4 @min-[28rem]:grid-cols-2">
          <NumberDial label="stop at which number" value={at} onChange={setAt} min={from} max={to - 1} />
          <div>
            <p className="ref-tag mb-1 text-ink/55">keyword</p>
            <div className="grid grid-cols-2 gap-2">
              {['break', 'continue'].map(m => {
                const active = m === mode;
                return (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    aria-pressed={active}
                    className={`flex h-[3.25rem] items-center justify-center rounded-xl border-2 transition-colors ${
                      active
                        ? 'border-ink bg-ink text-white'
                        : 'border-ink/25 bg-white text-ink hover:border-ink hover:bg-paper'
                    }`}
                  >
                    <span className="font-mono-lab text-base font-extrabold leading-none">{m}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <pre className="mb-5 overflow-x-auto rounded-xl border-2 border-ink bg-well px-4 py-4 font-mono-lab text-sm leading-relaxed text-white/90">
{`for i in range(${from}, ${to}):
    if i == ${at}:
        ${mode}
    print(i)`}
        </pre>

        {/* One row per turn. Rows keep a fixed height and column order so the
            trace does not reflow as the dial moves. */}
        <p className="ref-tag mb-2 text-ink/55">Every turn of the loop</p>
        <div className="mb-5 overflow-hidden rounded-xl border-2 border-ink">
          {rows.map((r, i) => {
            const tone =
              r.kind === 'ran' ? 'bg-mint/10'
                : r.kind === 'continue' ? 'bg-signal/20'
                : 'bg-wire/10';
            const chip =
              r.kind === 'ran' ? 'border-ink bg-mint text-white'
                : r.kind === 'continue' ? 'border-ink bg-signal text-ink'
                : 'border-wire bg-wire text-white';
            const note =
              r.kind === 'ran' ? `prints ${r.v}`
                : r.kind === 'continue' ? 'skips the print, goes to the next turn'
                : 'leaves the loop right here';
            return (
              <div key={i} className={`flex flex-wrap items-center gap-x-3 gap-y-1 border-b-2 border-ink/10 px-3 py-2 last:border-b-0 ${tone}`}>
                <code className="w-14 shrink-0 font-mono-lab text-sm font-extrabold text-ink">i = {r.v}</code>
                <span className={`shrink-0 rounded-md border-2 px-2 py-0.5 ref-tag ${chip}`}>
                  {r.kind === 'ran' ? 'runs' : r.kind}
                </span>
                <span className="min-w-0 text-sm font-medium text-ink/70">{note}</span>
              </div>
            );
          })}
          {never.map(v => (
            <div key={`n${v}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b-2 border-ink/10 bg-ink/[0.04] px-3 py-2 last:border-b-0">
              <code className="w-14 shrink-0 font-mono-lab text-sm font-extrabold text-ink/30">i = {v}</code>
              <span className="shrink-0 rounded-md border-2 border-ink/20 bg-ink/10 px-2 py-0.5 ref-tag text-ink/40">
                never runs
              </span>
              <span className="min-w-0 text-sm font-medium text-ink/40">the loop already stopped</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 @min-[34rem]:grid-cols-[3fr_2fr]">
          <pre className="overflow-x-auto rounded-xl border-2 border-ink bg-well px-4 py-4 font-mono-lab text-sm leading-relaxed text-white/90">
{printed.length ? printed.join('\n') : '(nothing printed)'}
          </pre>
          <div className="flex min-h-20 flex-col items-center justify-center rounded-xl border-2 border-ink bg-signal px-4 py-4 text-center">
            <p className="ref-tag mb-1 text-ink/60">lines printed</p>
            <p className="font-mono-lab text-3xl font-extrabold leading-none text-ink">{printed.length}</p>
          </div>
        </div>

        <p className="mt-4 text-sm font-medium leading-relaxed text-ink/70">
          {mode === 'break'
            ? `break leaves the loop the moment i reaches ${at}. Every turn after that never happens at all.`
            : `continue skips only the print for i = ${at}. The loop carries on, so there is a gap in the output but nothing is cut short.`}
        </p>
      </div>
    </div>
  );
}
