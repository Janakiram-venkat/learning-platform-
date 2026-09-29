import { useState } from 'react';

/**
 * Error Catcher: type what the user would type, and watch the try block either
 * finish or jump out partway through.
 *
 * The idea that is hard to picture is that the try block abandons its remaining
 * lines the instant something goes wrong. Marking each line as ran, raised or
 * skipped makes the jump visible, and the handler toggle shows why naming the
 * error is better than catching everything.
 */
const LINES = [
  'try:',
  '    a = int(input("First number: "))',
  '    b = int(input("Second number: "))',
  '    print("Answer:", a / b)',
];

function evaluate(first, second) {
  if (!/^-?\d+$/.test(first.trim())) {
    return { at: 1, error: 'ValueError', detail: `invalid literal for int() with base 10: '${first}'` };
  }
  if (!/^-?\d+$/.test(second.trim())) {
    return { at: 2, error: 'ValueError', detail: `invalid literal for int() with base 10: '${second}'` };
  }
  if (Number(second) === 0) {
    return { at: 3, error: 'ZeroDivisionError', detail: 'division by zero' };
  }
  const value = Number(first) / Number(second);
  return { at: null, error: null, out: `Answer: ${Number.isInteger(value) ? value.toFixed(1) : String(value)}` };
}

export default function ErrorCatcher() {
  const [first, setFirst] = useState('10');
  const [second, setSecond] = useState('0');
  const [specific, setSpecific] = useState(false);

  const r = evaluate(first, second);
  const caught = !r.error
    ? null
    : !specific
      ? 'except:'
      : `except ${r.error}:`;

  const message = !r.error
    ? r.out
    : !specific
      ? 'Something went wrong.'
      : r.error === 'ValueError'
        ? 'Please type whole numbers.'
        : 'You cannot divide by zero.';

  return (
    <div className="my-8 overflow-hidden rounded-2xl border-2 border-ink bg-white shadow-[4px_4px_0_rgba(27,27,27,0.9)] [container-type:inline-size]">
      <div className="border-b-2 border-ink bg-pcb px-4 py-3">
        <span className="font-lab text-sm font-bold text-white">Error Catcher</span>
      </div>

      <div className="p-5">
        <p className="ref-tag mb-2 text-ink/55">what the user types</p>
        <div className="mb-5 grid grid-cols-1 gap-3 @min-[26rem]:grid-cols-2">
          <Typed label="first number" value={first} onChange={setFirst} />
          <Typed label="second number" value={second} onChange={setSecond} />
        </div>

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-ink bg-paper px-4 py-3">
          <p className="text-sm font-medium text-ink/75">Name the errors you are catching</p>
          <button
            onClick={() => setSpecific(!specific)}
            aria-pressed={specific}
            className={`h-10 rounded-xl border-2 border-ink px-4 font-mono-lab text-xs font-extrabold transition-colors ${
              specific ? 'bg-ink text-white' : 'bg-white text-ink hover:bg-signal/30'
            }`}
          >
            {specific ? 'on' : 'off'}
          </button>
        </div>

        {/* One row per line of the try block, each marked with what became of
            it. Rows keep their place whatever happens, so the cut-off point is
            the only thing that moves. */}
        <div className="mb-3 overflow-hidden rounded-xl border-2 border-ink bg-well">
          {LINES.map((line, n) => {
            const state =
              n === 0 ? 'ran'
                : r.at === null ? 'ran'
                : n < r.at ? 'ran'
                : n === r.at ? 'raised'
                : 'skipped';
            return (
              <div
                key={n}
                className={`flex flex-wrap items-center gap-x-3 border-b-2 border-white/10 px-3 py-1.5 last:border-b-0 ${
                  state === 'raised' ? 'bg-wire/30' : ''
                }`}
              >
                <code
                  className={`min-w-0 flex-1 whitespace-pre font-mono-lab text-sm leading-6 ${
                    state === 'skipped' ? 'text-white/25' : 'text-white/90'
                  }`}
                >
                  {line}
                </code>
                <span
                  className={`shrink-0 rounded-md border-2 px-2 py-0.5 ref-tag ${
                    state === 'ran'
                      ? 'border-mint bg-mint/20 text-mint'
                      : state === 'raised'
                        ? 'border-wire bg-wire text-white'
                        : 'border-white/20 bg-white/5 text-white/35'
                  }`}
                >
                  {state}
                </span>
              </div>
            );
          })}
        </div>

        {r.error && (
          <div className="mb-3 rounded-xl border-2 border-ink bg-wire/15 px-4 py-3">
            <p className="ref-tag mb-1 text-ink/55">the error Python raised</p>
            <code className="break-words font-mono-lab text-sm font-extrabold text-wire">
              {r.error}: {r.detail}
            </code>
          </div>
        )}

        <div className="mb-5 overflow-hidden rounded-xl border-2 border-ink bg-well">
          {(specific ? ['except ValueError:', 'except ZeroDivisionError:'] : ['except:']).map((clause) => {
            const hit = caught === clause;
            return (
              <div
                key={clause}
                className={`flex flex-wrap items-center gap-x-3 border-b-2 border-white/10 px-3 py-1.5 last:border-b-0 ${
                  hit ? 'bg-signal/25' : ''
                }`}
              >
                <code className={`min-w-0 flex-1 font-mono-lab text-sm leading-6 ${hit ? 'text-white' : 'text-white/35'}`}>
                  {clause}
                </code>
                <span
                  className={`shrink-0 rounded-md border-2 px-2 py-0.5 ref-tag ${
                    hit ? 'border-signal bg-signal text-ink' : 'border-white/20 bg-white/5 text-white/35'
                  }`}
                >
                  {hit ? 'catches it' : 'not this one'}
                </span>
              </div>
            );
          })}
        </div>

        <p className="ref-tag mb-1 text-ink/55">what the user sees</p>
        <pre className="overflow-x-auto rounded-xl border-2 border-ink bg-well px-4 py-3 font-mono-lab text-sm font-extrabold text-signal">
{message}
        </pre>

        <p className="mt-4 text-sm font-medium leading-relaxed text-ink/70">
          {r.error
            ? specific
              ? 'Naming the error lets you say something useful about it. A bare except would have caught this too, but it could only offer one vague message for every possible problem.'
              : 'The try block gives up at the failing line, so the lines under it never run. Switch the toggle on to tell the two problems apart.'
            : 'Nothing went wrong, so every line of the try block ran and the except blocks were skipped entirely. They only ever run when something fails.'}
        </p>
      </div>
    </div>
  );
}

function Typed({ label, value, onChange }) {
  return (
    <div>
      <p className="ref-tag mb-1 text-ink/45">{label}</p>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="h-12 w-full rounded-xl border-2 border-ink bg-paper px-3 text-center font-mono-lab text-xl font-extrabold text-ink outline-none focus:bg-white"
      />
    </div>
  );
}
