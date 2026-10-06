import { useState } from 'react';

/**
 * Function Machine: an argument goes in, the parameter takes its value, the
 * body runs with that value substituted, and a result comes back out.
 *
 * The whole point is the substitution step. Beginners read `def double(number)`
 * and cannot see where `number` gets its value from, so the trace spells out
 * "number takes the value 5" as its own row before showing the body.
 *
 * Content block shape:
 *   { "type": "widget", "kind": "function-machine", "preset": "double" }
 */
const PRESETS = {
  double: {
    name: 'double',
    params: [{ key: 'number', kind: 'number', start: 5 }],
    body: (a) => `return ${a.number} * 2`,
    source: 'return number * 2',
    run: (a) => `${a.number * 2}`,
  },
  greet: {
    name: 'greet',
    params: [{ key: 'name', kind: 'text', start: 'Alex' }],
    body: (a) => `return "Hello, " + "${a.name}" + "!"`,
    source: 'return "Hello, " + name + "!"',
    run: (a) => `"Hello, ${a.name}!"`,
  },
  rectangle_area: {
    name: 'rectangle_area',
    params: [
      { key: 'width', kind: 'number', start: 4 },
      { key: 'height', kind: 'number', start: 3 },
    ],
    body: (a) => `return ${a.width} * ${a.height}`,
    source: 'return width * height',
    run: (a) => `${a.width * a.height}`,
  },
};

const ORDER = ['double', 'greet', 'rectangle_area'];

function startValues(preset) {
  const out = {};
  preset.params.forEach((p) => { out[p.key] = p.start; });
  return out;
}

function show(v) {
  return typeof v === 'string' ? `"${v}"` : String(v);
}

export default function FunctionMachine({ block }) {
  const first = PRESETS[block?.preset] ? block.preset : 'double';
  const [choice, setChoice] = useState(first);
  const preset = PRESETS[choice];
  const [args, setArgs] = useState(() => startValues(PRESETS[first]));

  const pick = (key) => {
    setChoice(key);
    setArgs(startValues(PRESETS[key]));
  };

  const callText = `${preset.name}(${preset.params.map((p) => show(args[p.key])).join(', ')})`;
  const result = preset.run(args);

  return (
    <div className="my-8 overflow-hidden rounded-2xl border-2 border-ink bg-white shadow-[4px_4px_0_rgba(27,27,27,0.9)] [container-type:inline-size]">
      <div className="border-b-2 border-ink bg-pcb px-4 py-3">
        <span className="font-lab text-sm font-bold text-white">Function Machine</span>
      </div>

      <div className="p-5">
        <p className="ref-tag mb-2 text-ink/55">pick a function</p>
        <div className="mb-5 grid grid-cols-1 gap-2 @min-[30rem]:grid-cols-3">
          {ORDER.map((key) => {
            const active = key === choice;
            return (
              <button
                key={key}
                onClick={() => pick(key)}
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

        <pre className="mb-5 overflow-x-auto rounded-xl border-2 border-ink bg-well px-4 py-4 font-mono-lab text-sm leading-relaxed text-white/90">
{`def ${preset.name}(${preset.params.map((p) => p.key).join(', ')}):
    ${preset.source}`}
        </pre>

        <p className="ref-tag mb-2 text-ink/55">what you pass in</p>
        <div className={`mb-5 grid grid-cols-1 gap-3 ${preset.params.length > 1 ? '@min-[26rem]:grid-cols-2' : ''}`}>
          {preset.params.map((p) => (
            <div key={p.key}>
              <p className="ref-tag mb-1 text-ink/45">{p.key}</p>
              <input
                type={p.kind === 'number' ? 'number' : 'text'}
                value={args[p.key]}
                onChange={(e) =>
                  setArgs({
                    ...args,
                    [p.key]: p.kind === 'number' ? Number(e.target.value) || 0 : e.target.value,
                  })
                }
                aria-label={p.key}
                className="h-12 w-full rounded-xl border-2 border-ink bg-paper px-3 text-center font-mono-lab text-xl font-extrabold text-ink outline-none [-moz-appearance:textfield] focus:bg-white [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </div>
          ))}
        </div>

        {/* The trace. Four fixed rows so the layout does not jump when a value
            changes length or a second parameter appears. */}
        <p className="ref-tag mb-2 text-ink/55">what Python does</p>
        <div className="overflow-hidden rounded-xl border-2 border-ink">
          <Row step="1" label="you call it" tone="bg-paper">
            <code className="font-mono-lab text-sm font-extrabold text-ink">{callText}</code>
          </Row>
          <Row step="2" label="the parameters take those values" tone="bg-led/10">
            <div className="flex flex-wrap gap-2">
              {preset.params.map((p) => (
                <code key={p.key} className="rounded-md border-2 border-ink bg-white px-2 py-0.5 font-mono-lab text-sm font-extrabold text-ink">
                  {p.key} = {show(args[p.key])}
                </code>
              ))}
            </div>
          </Row>
          <Row step="3" label="the body runs with those values" tone="bg-paper">
            <code className="font-mono-lab text-sm font-extrabold text-ink">{preset.body(args)}</code>
          </Row>
          <Row step="4" label="it hands the result back" tone="bg-mint/15">
            <code className="font-mono-lab text-sm font-extrabold text-mint-deep">{result}</code>
          </Row>
        </div>

        <div className="mt-5 rounded-xl border-2 border-ink bg-well px-4 py-4">
          <p className="ref-tag mb-2 text-white/45">so in your program</p>
          <pre className="overflow-x-auto font-mono-lab text-sm leading-relaxed text-white/90">
{`answer = ${callText}
print(answer)`}
          </pre>
          <p className="mt-3 border-t-2 border-white/15 pt-3 font-mono-lab text-sm font-extrabold text-signal">
            {result.startsWith('"') ? result.slice(1, -1) : result}
          </p>
        </div>

        <p className="mt-4 text-sm font-medium leading-relaxed text-ink/70">
          Change a value above and nothing about the function changes. You wrote the
          steps once, and they work for every value you send in. That is the whole
          reason functions exist.
        </p>
      </div>
    </div>
  );
}

function Row({ step, label, tone, children }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 border-b-2 border-ink/10 px-3 py-2.5 last:border-b-0 ${tone}`}>
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 border-ink bg-white font-mono-lab text-xs font-extrabold text-ink">
        {step}
      </span>
      <span className="w-full shrink-0 text-sm font-medium text-ink/60 @min-[30rem]:w-56">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
