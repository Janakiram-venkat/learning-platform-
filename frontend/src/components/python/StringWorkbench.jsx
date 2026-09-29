import { useState } from 'react';

/**
 * String Workbench: run a method on some text and see both the result and the
 * original, side by side.
 *
 * Showing the original afterwards is the whole reason this exists. String
 * methods hand back a new string and leave the old one alone, so students who
 * write `message.upper()` on its own line and expect `message` to change get to
 * watch that not happen instead of being told.
 */
const METHODS = [
  { call: '.upper()', run: (s) => s.toUpperCase(), note: 'Every letter becomes a capital.' },
  { call: '.lower()', run: (s) => s.toLowerCase(), note: 'Every letter becomes small.' },
  {
    call: '.title()',
    run: (s) => s.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase()),
    note: 'The first letter of each word becomes a capital.',
  },
  { call: '.strip()', run: (s) => s.trim(), note: 'Spaces at the very start and end are removed. Spaces in the middle stay.' },
  {
    call: '.replace("a", "o")',
    run: (s) => s.split('a').join('o'),
    note: 'Every "a" is swapped for an "o". Swapping something that is not there simply changes nothing.',
  },
];

export default function StringWorkbench({ block }) {
  const [text, setText] = useState(block?.text ?? 'python is fun');
  const [i, setI] = useState(0);
  const method = METHODS[i];
  const result = method.run(text);

  return (
    <div className="my-8 overflow-hidden rounded-2xl border-2 border-ink bg-white shadow-[4px_4px_0_rgba(27,27,27,0.9)] [container-type:inline-size]">
      <div className="border-b-2 border-ink bg-pcb px-4 py-3">
        <span className="font-lab text-sm font-bold text-white">String Workbench</span>
      </div>

      <div className="p-5">
        <p className="ref-tag mb-1 text-ink/55">your text</p>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label="your text"
          className="mb-5 h-12 w-full rounded-xl border-2 border-ink bg-paper px-3 font-mono-lab text-base font-extrabold text-ink outline-none focus:bg-white"
        />

        <p className="ref-tag mb-2 text-ink/55">pick a method</p>
        <div className="mb-5 grid grid-cols-2 gap-2 @min-[32rem]:grid-cols-3">
          {METHODS.map((m, n) => {
            const active = n === i;
            return (
              <button
                key={m.call}
                onClick={() => setI(n)}
                aria-pressed={active}
                className={`flex h-11 items-center justify-center rounded-xl border-2 px-2 transition-colors ${
                  active
                    ? 'border-ink bg-ink text-white'
                    : 'border-ink/25 bg-white text-ink hover:border-ink hover:bg-paper'
                }`}
              >
                <span className="truncate font-mono-lab text-xs font-extrabold leading-none">{m.call}</span>
              </button>
            );
          })}
        </div>

        <pre className="mb-5 overflow-x-auto rounded-xl border-2 border-ink bg-well px-4 py-4 font-mono-lab text-sm leading-relaxed text-white/90">
{`message = "${text}"
print(message${method.call})`}
        </pre>

        {/* Result and original share a row so the unchanged original is
            impossible to miss. */}
        <div className="grid grid-cols-1 gap-3 @min-[30rem]:grid-cols-2">
          <div>
            <p className="ref-tag mb-1 text-ink/55">what you get back</p>
            <div className="flex min-h-16 items-center rounded-xl border-2 border-ink bg-mint/15 px-3 py-2">
              <code className="break-words font-mono-lab text-sm font-extrabold text-mint-deep">"{result}"</code>
            </div>
          </div>
          <div>
            <p className="ref-tag mb-1 text-ink/55">message, afterwards</p>
            <div className="flex min-h-16 items-center rounded-xl border-2 border-ink bg-paper px-3 py-2">
              <code className="break-words font-mono-lab text-sm font-extrabold text-ink/70">"{text}"</code>
            </div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 @min-[30rem]:grid-cols-2">
          <div className="flex min-h-20 flex-col items-center justify-center rounded-xl border-2 border-ink bg-signal px-4 py-3 text-center">
            <p className="ref-tag mb-1 text-ink/60">len(message)</p>
            <p className="font-mono-lab text-3xl font-extrabold leading-none text-ink">{text.length}</p>
          </div>
          <div className="flex min-h-20 items-center rounded-xl border-2 border-ink bg-paper px-4 py-3">
            <p className="text-sm font-medium leading-relaxed text-ink/70">{method.note}</p>
          </div>
        </div>

        <p className="mt-4 text-sm font-medium leading-relaxed text-ink/70">
          Look at the right hand box: message never changes. A string method hands
          back a new string, so unless you store it with something like{' '}
          <code className="font-mono-lab font-extrabold text-ink">message = message{method.call}</code>,
          the result is thrown away.
        </p>
      </div>
    </div>
  );
}
