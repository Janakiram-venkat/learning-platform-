import { useState } from 'react';

/**
 * Return vs Print: the same calculation written two ways, so the difference
 * shows up where it actually bites, in what the variable ends up holding.
 *
 * Both versions look identical when you run them once. The print version only
 * falls apart when you try to reuse the answer, which is why the widget always
 * shows the follow-up line `print(answer * 10)` underneath.
 */
const VERSIONS = {
  return: {
    label: 'return',
    def: 'def double(n):\n    return n * 2',
    screenFromFn: null,
    holds: (n) => `${n * 2}`,
    reuse: (n) => `${n * 20}`,
    note: 'return hands the number back, so answer really is a number. You can do more maths with it, store it, or pass it to another function.',
  },
  print: {
    label: 'print',
    def: 'def double(n):\n    print(n * 2)',
    screenFromFn: (n) => `${n * 2}`,
    holds: () => 'None',
    reuse: null,
    note: 'print only puts the number on the screen. The function gives nothing back, so answer holds None, and None * 10 is a TypeError.',
  },
};

export default function ReturnVsPrint() {
  const [mode, setMode] = useState('return');
  const [n, setN] = useState(5);
  const v = VERSIONS[mode];

  const screenLines = [];
  if (v.screenFromFn) screenLines.push(v.screenFromFn(n));
  screenLines.push(v.holds(n));

  return (
    <div className="my-8 overflow-hidden rounded-2xl border-2 border-ink bg-white shadow-[4px_4px_0_rgba(27,27,27,0.9)] [container-type:inline-size]">
      <div className="border-b-2 border-ink bg-pcb px-4 py-3">
        <span className="font-lab text-sm font-bold text-white">Return or Print</span>
      </div>

      <div className="p-5">
        <div className="mb-5 grid grid-cols-1 gap-4 @min-[28rem]:grid-cols-2">
          <div>
            <p className="ref-tag mb-1 text-ink/55">the function uses</p>
            <div className="grid grid-cols-2 gap-2">
              {['return', 'print'].map((m) => {
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
          <div>
            <p className="ref-tag mb-1 text-ink/55">the number you send in</p>
            <input
              type="number"
              value={n}
              onChange={(e) => setN(Number(e.target.value) || 0)}
              aria-label="the number you send in"
              className="h-[3.25rem] w-full rounded-xl border-2 border-ink bg-paper px-3 text-center font-mono-lab text-xl font-extrabold text-ink outline-none [-moz-appearance:textfield] focus:bg-white [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>
        </div>

        <pre className="mb-5 overflow-x-auto rounded-xl border-2 border-ink bg-well px-4 py-4 font-mono-lab text-sm leading-relaxed text-white/90">
{`${v.def}

answer = double(${n})
print(answer)`}
        </pre>

        <div className="grid grid-cols-1 gap-4 @min-[30rem]:grid-cols-2">
          <div>
            <p className="ref-tag mb-1 text-ink/55">on the screen</p>
            <pre className="min-h-24 overflow-x-auto rounded-xl border-2 border-ink bg-well px-4 py-3 font-mono-lab text-sm leading-relaxed text-signal">
{screenLines.join('\n')}
            </pre>
          </div>
          <div>
            <p className="ref-tag mb-1 text-ink/55">what answer holds</p>
            <div
              className={`flex min-h-24 flex-col items-center justify-center rounded-xl border-2 border-ink px-4 py-3 text-center ${
                mode === 'return' ? 'bg-mint/20' : 'bg-wire/15'
              }`}
            >
              <p className="font-mono-lab text-3xl font-extrabold leading-none text-ink">{v.holds(n)}</p>
              <p className="ref-tag mt-2 text-ink/55">
                {mode === 'return' ? 'a real number you can reuse' : 'nothing came back'}
              </p>
            </div>
          </div>
        </div>

        {/* The follow-up line is where the two versions stop looking the same. */}
        <div className="mt-4 rounded-xl border-2 border-ink bg-paper px-4 py-3">
          <p className="ref-tag mb-2 text-ink/55">now try to use the answer again</p>
          <code className="font-mono-lab text-sm font-extrabold text-ink">print(answer * 10)</code>
          <p
            className={`mt-2 font-mono-lab text-sm font-extrabold ${
              v.reuse ? 'text-mint-deep' : 'text-wire'
            }`}
          >
            {v.reuse ? v.reuse(n) : "TypeError: unsupported operand type(s) for *: 'NoneType' and 'int'"}
          </p>
        </div>

        <p className="mt-4 text-sm font-medium leading-relaxed text-ink/70">{v.note}</p>
      </div>
    </div>
  );
}
