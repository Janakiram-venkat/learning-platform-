import { useState } from 'react';
import NumberDial from './NumberDial';

/**
 * Math Playground: two number dials and an operator picker that show Python's
 * arithmetic live. The Python line and its result update as the student
 * changes anything, so the operator quirks beginners trip on (float division,
 * floor division, modulo, power) are one click away.
 *
 * Content block shape (all optional):
 *   { "type": "widget", "kind": "math-playground", "a": 7, "b": 3, "op": "+" }
 *
 * Widths use container queries, not `sm:`/`md:`. This renders inside the
 * lesson sheet, which sets `container-type: inline-size` and can sit beside a
 * 600px editor, so viewport breakpoints fire at the wrong moments.
 */
const OPS = [
  { key: '+',  fn: (a, b) => a + b },
  { key: '-',  fn: (a, b) => a - b },
  { key: '*',  fn: (a, b) => a * b },
  { key: '/',  fn: (a, b) => (b === 0 ? null : a / b) },
  { key: '//', fn: (a, b) => (b === 0 ? null : Math.floor(a / b)) },
  { key: '%',  fn: (a, b) => (b === 0 ? null : ((a % b) + b) % b) },
  { key: '**', fn: (a, b) => a ** b },
];

const HINTS = {
  '+':  'Plus adds numbers together. It also joins strings, so "a" + "b" gives "ab".',
  '-':  'Minus subtracts the second number from the first.',
  '*':  'Star multiplies. Try it with a string: "hi" * 3 gives "hihihi".',
  '/':  'Slash divides. In Python the answer is always a decimal, so even 10 / 2 gives 5.0.',
  '//': 'Double slash is floor division: it divides, then throws away the decimal part.',
  '%':  'Percent is modulo, the remainder after dividing. 7 % 3 leaves 1.',
  '**': 'Double star is power. 2 ** 8 gives 256.',
};

// Python prints `/` results as floats even when they divide exactly, and
// rounds long decimals rather than showing full binary noise.
function formatResult(opKey, value) {
  if (value === null) return 'ZeroDivisionError';
  if (opKey === '/') return Number.isInteger(value) ? value.toFixed(1) : String(+value.toFixed(6));
  return String(value);
}

export default function MathPlayground({ block }) {
  const [a, setA] = useState(Number(block?.a ?? 7));
  const [b, setB] = useState(Number(block?.b ?? 3));
  const [opKey, setOpKey] = useState(block?.op || '+');

  const op = OPS.find(o => o.key === opKey) || OPS[0];
  const raw = op.fn(a, b);
  const shown = formatResult(op.key, raw);
  const errored = raw === null;

  return (
    <div className="my-8 overflow-hidden rounded-2xl border-2 border-ink bg-white shadow-[4px_4px_0_rgba(27,27,27,0.9)] [container-type:inline-size]">
      <div className="border-b-2 border-ink bg-signal px-4 py-3">
        <span className="font-lab text-sm font-bold text-ink">Math Playground</span>
      </div>

      <div className="p-5">
        <div className="mb-5 grid grid-cols-1 gap-4 @min-[28rem]:grid-cols-2">
          <NumberDial label="First number" value={a} onChange={setA} />
          <NumberDial label="Second number" value={b} onChange={setB} />
        </div>

        {/* Operator picker. Every button holds the symbol alone, so all seven
            share one width and sit on a clean baseline. Mixing icons into some
            of them (and not others) made the row ragged. */}
        <p className="ref-tag mb-2 text-ink/55">Operator</p>
        <div className="mb-6 grid grid-cols-4 gap-2 @min-[26rem]:grid-cols-7">
          {OPS.map(o => {
            const active = o.key === opKey;
            return (
              <button
                key={o.key}
                onClick={() => setOpKey(o.key)}
                aria-pressed={active}
                className={`flex h-11 items-center justify-center rounded-lg border-2 transition-colors ${
                  active
                    ? 'border-ink bg-ink text-white'
                    : 'border-ink/25 bg-white text-ink hover:border-ink hover:bg-paper'
                }`}
              >
                <span className="font-mono-lab text-base font-extrabold leading-none">{o.key}</span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-3 @min-[34rem]:grid-cols-[3fr_2fr]">
          <pre className="overflow-x-auto rounded-xl border-2 border-ink bg-well px-4 py-4 font-mono-lab text-sm leading-relaxed text-white/90">
{`>>> ${a} ${opKey} ${b}
${shown}`}
          </pre>
          <div className={`flex min-h-24 flex-col items-center justify-center rounded-xl border-2 border-ink px-4 py-4 text-center ${errored ? 'bg-wire' : 'bg-pcb'}`}>
            <p className="ref-tag mb-1 text-white/70">result</p>
            <p className="font-mono-lab text-3xl font-extrabold leading-none text-white break-all">
              {shown}
            </p>
          </div>
        </div>

        <p className="mt-4 text-sm font-medium leading-relaxed text-ink/70">
          {errored
            ? 'Python cannot divide by zero. Change the second number to anything but 0.'
            : HINTS[opKey]}
        </p>
      </div>
    </div>
  );
}

