import { useState } from 'react';
import NumberDial from './NumberDial';

/**
 * Branch Tracer: an if / elif / else chain that shows which branch actually
 * runs for the current value.
 *
 * Python checks each condition in order and stops at the first True one. That
 * "stops at the first" rule is the thing beginners miss, so branches below the
 * winner are drawn as skipped rather than simply left alone.
 *
 * Content block shape:
 *   { "type": "widget", "kind": "branch-tracer",
 *     "variable": "score", "value": 7, "min": 0, "max": 20,
 *     "branches": [ { "op": ">=", "n": 10, "say": "Gold Medal!" },
 *                   { "op": ">=", "n": 5,  "say": "Silver Medal!" } ],
 *     "fallback": "Bronze Medal!" }
 *
 * Conditions are described by `op` and `n` rather than a code string, so
 * nothing here has to evaluate text at runtime.
 */
const COMPARATORS = {
  '>':  (v, n) => v > n,
  '<':  (v, n) => v < n,
  '>=': (v, n) => v >= n,
  '<=': (v, n) => v <= n,
  '==': (v, n) => v === n,
  '!=': (v, n) => v !== n,
};

const DEFAULT_BRANCHES = [
  { op: '>=', n: 10, say: 'Gold Medal!' },
  { op: '>=', n: 5,  say: 'Silver Medal!' },
];

export default function BranchTracer({ block }) {
  const variable = block?.variable || 'score';
  const branches = block?.branches?.length ? block.branches : DEFAULT_BRANCHES;
  const fallback = block?.fallback ?? 'Bronze Medal!';
  const min = Number(block?.min ?? 0);
  const max = Number(block?.max ?? 20);
  const [value, setValue] = useState(Number(block?.value ?? 7));

  // Walk the chain the way Python does: first True wins, everything after is
  // never even checked.
  const tests = branches.map(br => {
    const cmp = COMPARATORS[br.op] || COMPARATORS['>='];
    return cmp(value, Number(br.n));
  });
  const winner = tests.findIndex(Boolean);
  const output = winner === -1 ? fallback : branches[winner].say;

  // state per line: 'run' | 'skip' | 'never'
  const stateFor = (i) => {
    if (winner === -1) return 'skip';
    if (i === winner) return 'run';
    if (i < winner) return 'skip';
    return 'never';
  };
  const elseState = winner === -1 ? 'run' : 'never';

  return (
    <div className="my-8 overflow-hidden rounded-2xl border-2 border-ink bg-white shadow-[4px_4px_0_rgba(27,27,27,0.9)] [container-type:inline-size]">
      <div className="border-b-2 border-ink bg-pcb px-4 py-3">
        <span className="font-lab text-sm font-bold text-white">Branch Tracer</span>
      </div>

      <div className="p-5">
        <div className="mb-5 @min-[28rem]:max-w-xs">
          <NumberDial label={variable} value={value} onChange={setValue} min={min} max={max} />
        </div>

        {/* The chain. Each line keeps its place and its indent whatever its
            state, so nothing shifts as the student turns the dial. */}
        <p className="ref-tag mb-2 text-ink/55">What Python does</p>
        <div className="mb-5 overflow-hidden rounded-xl border-2 border-ink">
          {branches.map((br, i) => {
            const st = stateFor(i);
            const keyword = i === 0 ? 'if' : 'elif';
            return (
              <BranchLines
                key={i}
                state={st}
                head={`${keyword} ${variable} ${br.op} ${br.n}:`}
                body={`print("${br.say}")`}
                result={st === 'never' ? 'not checked' : (tests[i] ? 'True' : 'False')}
              />
            );
          })}
          <BranchLines
            state={elseState}
            head="else:"
            body={`print("${fallback}")`}
            result={elseState === 'run' ? 'runs' : 'not checked'}
          />
        </div>

        {/* Output */}
        <div className="grid grid-cols-1 gap-3 @min-[34rem]:grid-cols-[3fr_2fr]">
          <pre className="overflow-x-auto rounded-xl border-2 border-ink bg-well px-4 py-4 font-mono-lab text-sm leading-relaxed text-white/90">
{`>>> ${variable} = ${value}
${output}`}
          </pre>
          <div className="flex min-h-20 flex-col items-center justify-center rounded-xl border-2 border-ink bg-signal px-4 py-4 text-center">
            <p className="ref-tag mb-1 text-ink/60">prints</p>
            <p className="font-mono-lab text-lg font-extrabold leading-tight text-ink break-words">{output}</p>
          </div>
        </div>

        <p className="mt-4 text-sm font-medium leading-relaxed text-ink/70">
          Python checks the conditions from top to bottom and stops at the first True one.
          Everything below the winner is never even looked at.
        </p>
      </div>
    </div>
  );
}

// One condition plus its indented body, drawn as two code rows.
function BranchLines({ state, head, body, result }) {
  const rowBg =
    state === 'run' ? 'bg-mint/15'
      : state === 'never' ? 'bg-ink/[0.04]'
      : 'bg-white';
  const textTone =
    state === 'run' ? 'text-ink'
      : state === 'never' ? 'text-ink/30'
      : 'text-ink/45';
  const chipTone =
    state === 'run' ? 'bg-mint text-white border-ink'
      : state === 'never' ? 'bg-ink/10 text-ink/40 border-ink/20'
      : 'bg-wire/15 text-wire border-wire/40';

  return (
    <div className={`border-b-2 border-ink/10 px-3 py-2 last:border-b-0 ${rowBg}`}>
      <div className="flex items-center justify-between gap-3">
        <code className={`min-w-0 font-mono-lab text-sm font-bold ${textTone}`}>{head}</code>
        <span className={`shrink-0 rounded-md border-2 px-2 py-0.5 ref-tag ${chipTone}`}>{result}</span>
      </div>
      <code className={`mt-1 block pl-6 font-mono-lab text-sm ${textTone}`}>{body}</code>
    </div>
  );
}
