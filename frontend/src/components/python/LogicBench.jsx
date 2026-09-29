import { useState } from 'react';

/**
 * Logic Bench: two switches wired to `and`, `or` and `not`.
 *
 * Flipping a switch updates all three results at once, and the truth table
 * below highlights the row the student is currently standing on. Seeing which
 * of the four rows is live is the part that makes `and` versus `or` click.
 *
 * Content block shape (all optional):
 *   { "type": "widget", "kind": "logic-bench",
 *     "labelA": "sunny", "labelB": "homework_done", "a": true, "b": true }
 *
 * Widths use container queries because this renders inside the lesson sheet,
 * which sets `container-type: inline-size` and can sit beside a 600px editor.
 */
export default function LogicBench({ block }) {
  const labelA = block?.labelA || 'sunny';
  const labelB = block?.labelB || 'homework_done';
  const [a, setA] = useState(block?.a ?? true);
  const [b, setB] = useState(block?.b ?? true);

  const rows = [
    { a: true,  b: true  },
    { a: true,  b: false },
    { a: false, b: true  },
    { a: false, b: false },
  ];

  return (
    <div className="my-8 overflow-hidden rounded-2xl border-2 border-ink bg-white shadow-[4px_4px_0_rgba(27,27,27,0.9)] [container-type:inline-size]">
      <div className="border-b-2 border-ink bg-pcb px-4 py-3">
        <span className="font-lab text-sm font-bold text-white">Logic Bench</span>
      </div>

      <div className="p-5">
        {/* Switches */}
        <div className="mb-5 grid grid-cols-1 gap-4 @min-[28rem]:grid-cols-2">
          <Switch label={labelA} value={a} onChange={setA} />
          <Switch label={labelB} value={b} onChange={setB} />
        </div>

        {/* Live results. Each row is its own panel so the three operators read
            as siblings rather than as a list of sentences. */}
        <p className="ref-tag mb-2 text-ink/55">Results</p>
        <div className="mb-6 grid grid-cols-1 gap-2.5 @min-[30rem]:grid-cols-3">
          <ResultCard expr={`${labelA} and ${labelB}`} value={a && b} />
          <ResultCard expr={`${labelA} or ${labelB}`} value={a || b} />
          <ResultCard expr={`not ${labelA}`} value={!a} />
        </div>

        {/* Truth table with the live row lit. Fixed column widths keep every
            cell centred under its header at any container width. */}
        <p className="ref-tag mb-2 text-ink/55">Every combination</p>
        <div className="overflow-x-auto rounded-xl border-2 border-ink">
          <table className="w-full border-collapse text-center font-mono-lab text-sm">
            <thead>
              <tr className="bg-ink text-white">
                <th className="border-r-2 border-white/20 px-3 py-2 font-extrabold">{labelA}</th>
                <th className="border-r-2 border-white/20 px-3 py-2 font-extrabold">{labelB}</th>
                <th className="border-r-2 border-white/20 px-3 py-2 font-extrabold">and</th>
                <th className="border-r-2 border-white/20 px-3 py-2 font-extrabold">or</th>
                <th className="px-3 py-2 font-extrabold">not {labelA}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const live = r.a === a && r.b === b;
                return (
                  <tr
                    key={i}
                    className={`border-t-2 border-ink/15 transition-colors ${live ? 'bg-signal/30' : 'bg-white'}`}
                  >
                    <Cell value={r.a} muted={!live} />
                    <Cell value={r.b} muted={!live} />
                    <Cell value={r.a && r.b} muted={!live} />
                    <Cell value={r.a || r.b} muted={!live} />
                    <Cell value={!r.a} muted={!live} last />
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-sm font-medium leading-relaxed text-ink/70">
          Flip the switches and watch the highlighted row move. `and` is True only on the
          top row, where both switches are on. `or` stays True until both are off.
        </p>
      </div>
    </div>
  );
}

function Cell({ value, muted, last }) {
  return (
    <td className={`px-3 py-2 font-extrabold ${last ? '' : 'border-r-2 border-ink/15'} ${
      muted
        ? 'text-ink/35'
        : value ? 'text-mint-deep' : 'text-wire'
    }`}>
      {value ? 'True' : 'False'}
    </td>
  );
}

function ResultCard({ expr, value }) {
  return (
    <div className={`flex items-center justify-between gap-3 rounded-xl border-2 border-ink px-4 py-3 ${value ? 'bg-mint/15' : 'bg-wire/10'}`}>
      <span className="min-w-0 truncate font-mono-lab text-sm font-bold text-ink" title={expr}>{expr}</span>
      <span className="flex items-center gap-2 shrink-0">
        <span className="led" style={{ color: value ? '#00C48C' : '#CE3117' }} />
        <span className={`font-mono-lab text-sm font-extrabold ${value ? 'text-mint-deep' : 'text-wire'}`}>
          {value ? 'True' : 'False'}
        </span>
      </span>
    </div>
  );
}

function Switch({ label, value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      role="switch"
      aria-checked={value}
      className="flex w-full items-center justify-between gap-3 rounded-xl border-2 border-ink bg-paper px-3 py-3 text-left transition-colors hover:bg-white"
    >
      <span className="min-w-0 truncate font-mono-lab text-sm font-bold text-ink" title={label}>{label}</span>
      <span className="flex shrink-0 items-center gap-2">
        <span className={`font-mono-lab text-xs font-extrabold ${value ? 'text-mint-deep' : 'text-ink/45'}`}>
          {value ? 'True' : 'False'}
        </span>
        {/* Physical-looking bench toggle: the knob slides, the track fills. */}
        <span className={`relative h-7 w-12 shrink-0 rounded-full border-2 border-ink transition-colors ${value ? 'bg-mint' : 'bg-ink/20'}`}>
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full border-2 border-ink bg-white transition-all ${value ? 'left-[1.4rem]' : 'left-0.5'}`}
          />
        </span>
      </span>
    </button>
  );
}
