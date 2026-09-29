import { useState } from 'react';
import NumberDial from './NumberDial';

/**
 * Comparison Lab: two number dials and the six comparison operators. Every
 * comparison answers True or False, so the result panel is the point of the
 * widget: students watch the same two numbers flip the answer as the operator
 * changes.
 *
 * Content block shape (all optional):
 *   { "type": "widget", "kind": "comparison-lab", "a": 5, "b": 3, "op": ">" }
 *
 * Widths use container queries because this renders inside the lesson sheet,
 * which sets `container-type: inline-size` and can sit beside a 600px editor.
 */
const OPS = [
  { key: '>',  fn: (a, b) => a > b,  hint: 'Greater than: is the left number bigger than the right one?' },
  { key: '<',  fn: (a, b) => a < b,  hint: 'Less than: is the left number smaller than the right one?' },
  { key: '>=', fn: (a, b) => a >= b, hint: 'Greater than or equal to. True when the left is bigger, and also when they match.' },
  { key: '<=', fn: (a, b) => a <= b, hint: 'Less than or equal to. True when the left is smaller, and also when they match.' },
  { key: '==', fn: (a, b) => a === b, hint: 'Two equals signs ask: are these exactly the same? One equals sign would store a value instead.' },
  { key: '!=', fn: (a, b) => a !== b, hint: 'Not equal. True whenever the two sides are different.' },
];

export default function ComparisonLab({ block }) {
  const [a, setA] = useState(Number(block?.a ?? 5));
  const [b, setB] = useState(Number(block?.b ?? 3));
  const [opKey, setOpKey] = useState(block?.op || '>');

  const op = OPS.find(o => o.key === opKey) || OPS[0];
  const result = op.fn(a, b);

  return (
    <div className="my-8 overflow-hidden rounded-2xl border-2 border-ink bg-white shadow-[4px_4px_0_rgba(27,27,27,0.9)] [container-type:inline-size]">
      <div className="border-b-2 border-ink bg-pcb px-4 py-3">
        <span className="font-lab text-sm font-bold text-white">Comparison Lab</span>
      </div>

      <div className="p-5">
        <div className="mb-5 grid grid-cols-1 gap-4 @min-[28rem]:grid-cols-2">
          <NumberDial label="Left number" value={a} onChange={setA} />
          <NumberDial label="Right number" value={b} onChange={setB} />
        </div>

        {/* Every button holds its symbol alone at one fixed height, so the six
            share a width and sit on a clean baseline. */}
        <p className="ref-tag mb-2 text-ink/55">Comparison operator</p>
        <div className="mb-6 grid grid-cols-3 gap-2 @min-[26rem]:grid-cols-6">
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
${result ? 'True' : 'False'}`}
          </pre>
          <div className={`flex min-h-24 flex-col items-center justify-center rounded-xl border-2 border-ink px-4 py-4 text-center ${result ? 'bg-mint' : 'bg-wire'}`}>
            <p className="ref-tag mb-1 text-white/75">answer</p>
            <p className="font-mono-lab text-3xl font-extrabold leading-none text-white">
              {result ? 'True' : 'False'}
            </p>
          </div>
        </div>

        <p className="mt-4 text-sm font-medium leading-relaxed text-ink/70">{op.hint}</p>
      </div>
    </div>
  );
}
