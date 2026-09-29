import { useState } from 'react';

/**
 * Import Explorer: what a module gives you, and what happens when you forget
 * to import it.
 *
 * The forget-the-import toggle is the teaching half. `NameError: name 'random'
 * is not defined` is the error students will actually meet, and it is far less
 * mysterious once they have made it happen on purpose.
 */
const MODULES = {
  random: {
    blurb: 'Anything unpredictable: dice, shuffles, picking one of several options.',
    tools: [
      { call: 'random.randint(1, 6)', run: () => String(1 + Math.floor(Math.random() * 6)), note: 'A whole number from 1 to 6, both ends included.' },
      { call: 'random.choice(["red", "green", "blue"])', run: () => `'${['red', 'green', 'blue'][Math.floor(Math.random() * 3)]}'`, note: 'One item picked out of a list.' },
    ],
  },
  math: {
    blurb: 'Maths beyond the everyday operators: square roots, rounding, pi.',
    tools: [
      { call: 'math.sqrt(25)', run: () => '5.0', note: 'The square root. It always hands back a float, so 5.0 rather than 5.' },
      { call: 'math.pi', run: () => '3.141592653589793', note: 'A stored value, not a function, so it takes no parentheses.' },
      { call: 'math.floor(4.8)', run: () => '4', note: 'Rounds down to the whole number below.' },
    ],
  },
  time: {
    blurb: 'Clocks and waiting. Useful for pacing output so it does not all appear at once.',
    tools: [
      { call: 'time.sleep(1)', run: () => '(nothing, but the program waits one second)', note: 'Pauses before the next line runs. It hands nothing back.' },
    ],
  },
};

const ORDER = ['random', 'math', 'time'];

export default function ImportExplorer() {
  const [name, setName] = useState('random');
  const [imported, setImported] = useState(true);
  const [runs, setRuns] = useState(0);
  const mod = MODULES[name];

  return (
    <div className="my-8 overflow-hidden rounded-2xl border-2 border-ink bg-white shadow-[4px_4px_0_rgba(27,27,27,0.9)] [container-type:inline-size]">
      <div className="border-b-2 border-ink bg-pcb px-4 py-3">
        <span className="font-lab text-sm font-bold text-white">Import Explorer</span>
      </div>

      <div className="p-5">
        <p className="ref-tag mb-2 text-ink/55">pick a module</p>
        <div className="mb-5 grid grid-cols-3 gap-2">
          {ORDER.map((key) => {
            const active = key === name;
            return (
              <button
                key={key}
                onClick={() => setName(key)}
                aria-pressed={active}
                className={`flex h-11 items-center justify-center rounded-xl border-2 px-2 transition-colors ${
                  active
                    ? 'border-ink bg-ink text-white'
                    : 'border-ink/25 bg-white text-ink hover:border-ink hover:bg-paper'
                }`}
              >
                <span className="truncate font-mono-lab text-sm font-extrabold leading-none">{key}</span>
              </button>
            );
          })}
        </div>

        <p className="mb-5 text-sm font-medium leading-relaxed text-ink/70">{mod.blurb}</p>

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-ink bg-paper px-4 py-3">
          <p className="text-sm font-medium text-ink/75">Write the import line</p>
          <button
            onClick={() => setImported(!imported)}
            aria-pressed={imported}
            className={`h-10 rounded-xl border-2 border-ink px-4 font-mono-lab text-xs font-extrabold transition-colors ${
              imported ? 'bg-ink text-white' : 'bg-wire text-white'
            }`}
          >
            {imported ? 'on' : 'forgotten'}
          </button>
        </div>

        <pre className="mb-5 overflow-x-auto rounded-xl border-2 border-ink bg-well px-4 py-4 font-mono-lab text-sm leading-relaxed text-white/90">
{imported ? `import ${name}` : `# import ${name}   <- missing`}
        </pre>

        {/* Each tool keeps its own row whether the import is there or not, so
            the NameError lands in the same place the answer would have. */}
        <div className="overflow-hidden rounded-xl border-2 border-ink">
          {mod.tools.map((t) => (
            <div key={t.call} className="border-b-2 border-ink/10 bg-paper px-3 py-3 last:border-b-0">
              <code className="break-words font-mono-lab text-sm font-extrabold text-ink">{t.call}</code>
              <p
                className={`mt-1 break-words font-mono-lab text-sm font-extrabold ${
                  imported ? 'text-mint-deep' : 'text-wire'
                }`}
              >
                {imported ? t.run(runs) : `NameError: name '${name}' is not defined`}
              </p>
              <p className="mt-1 text-sm font-medium leading-relaxed text-ink/60">{t.note}</p>
            </div>
          ))}
        </div>

        <button
          onClick={() => setRuns(runs + 1)}
          disabled={!imported}
          className="mt-4 h-12 w-full rounded-xl border-2 border-ink bg-ink px-4 font-lab text-sm font-bold text-white transition-colors hover:bg-pcb disabled:cursor-not-allowed disabled:border-ink/20 disabled:bg-ink/10 disabled:text-ink/30"
        >
          Run it again
        </button>

        <p className="mt-4 text-sm font-medium leading-relaxed text-ink/70">
          {imported
            ? name === 'random'
              ? 'Press Run a few times. The random results change every run, which is the entire point of the module.'
              : 'These answers are the same every run. Only random is unpredictable.'
            : 'Without the import line the name simply does not exist yet, so Python stops at the first use with a NameError. Import lines go at the very top of the file.'}
        </p>
      </div>
    </div>
  );
}
