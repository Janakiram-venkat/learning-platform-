import { useState } from 'react';
import { RotateCcw } from 'lucide-react';

/**
 * Type Explorer: click a value, see what Python calls it.
 *
 * A grid of sample values plus a live readout naming the type, showing the
 * `type()` call, and giving a one-line explanation.
 *
 * Content block shape:
 *   { "type": "widget", "kind": "type-explorer",
 *     "values": [ { "display": "42", "type": "int", "hint": "..." }, ... ] }
 *
 * `values` is optional: a default set ships here so a lesson can drop the
 * widget in with no config.
 *
 * Widths use container queries, not `sm:`/`md:`. This renders inside the
 * lesson sheet, which sets `container-type: inline-size` and can sit beside a
 * 600px editor, so viewport breakpoints fire at the wrong moments.
 */
const DEFAULTS = [
  { display: '42',      type: 'int',   hint: 'A whole number. No dot, no fractions.' },
  { display: '3.14',    type: 'float', hint: 'A number with a decimal point.' },
  { display: '"Hello"', type: 'str',   hint: 'Text. Quotes tell Python this is a string.' },
  { display: "'Pocket'", type: 'str',  hint: 'Single or double quotes both work for text.' },
  { display: 'True',    type: 'bool',  hint: 'A yes or no value. True or False, capital letter.' },
  { display: 'False',   type: 'bool',  hint: 'The other half of a boolean. Also capitalised.' },
  { display: '0',       type: 'int',   hint: 'Still an int. Zero is a perfectly good whole number.' },
  { display: '"7"',     type: 'str',   hint: 'Watch out: the quotes make this text, not the number 7.' },
];

// Static classes only. A template like `text-${accent}` never reaches
// Tailwind's scanner, so the colour silently drops out.
const TYPE_META = {
  int:   { label: 'Whole number',       text: 'text-pcb'    },
  float: { label: 'Decimal number',     text: 'text-led'    },
  str:   { label: 'Text (string)',      text: 'text-mint-deep' },
  bool:  { label: 'Yes or no (boolean)', text: 'text-wire'  },
};

export default function TypeExplorer({ block }) {
  const values = block?.values?.length ? block.values : DEFAULTS;
  const [pickedIdx, setPickedIdx] = useState(0);
  const picked = values[pickedIdx] || values[0];
  const meta = TYPE_META[picked.type] || { label: picked.type, text: 'text-ink' };

  return (
    <div className="my-8 overflow-hidden rounded-2xl border-2 border-ink bg-white shadow-[4px_4px_0_rgba(27,27,27,0.9)] [container-type:inline-size]">
      <div className="flex items-center justify-between gap-3 border-b-2 border-ink bg-pcb px-4 py-3">
        <span className="font-lab text-sm font-bold text-white">Type Explorer</span>
        <button
          onClick={() => setPickedIdx(0)}
          className="rounded-lg border-2 border-white/30 p-1.5 text-white/80 transition-colors hover:border-white hover:bg-white/10"
          title="Reset"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 @min-[34rem]:grid-cols-[3fr_2fr]">
        {/* Value grid. Chips keep their box in the grid when selected: the
            active state is carried by fill and border, never by a transform,
            so nothing nudges out of column alignment. */}
        <div className="border-b-2 border-ink/10 p-5 @min-[34rem]:border-b-0 @min-[34rem]:border-r-2">
          <p className="ref-tag mb-3 text-ink/55">Click a value</p>
          <div className="grid grid-cols-2 gap-2.5 @min-[26rem]:grid-cols-3 @min-[34rem]:grid-cols-2 @min-[46rem]:grid-cols-3">
            {values.map((v, i) => {
              const active = i === pickedIdx;
              return (
                <button
                  key={i}
                  onClick={() => setPickedIdx(i)}
                  aria-pressed={active}
                  className={`flex min-h-12 items-center justify-center rounded-xl border-2 px-3 py-2.5 text-center transition-colors ${
                    active
                      ? 'border-ink bg-ink text-white'
                      : 'border-ink/25 bg-white text-ink hover:border-ink hover:bg-paper'
                  }`}
                >
                  <span className="font-mono-lab text-base font-extrabold leading-none break-all">
                    {v.display}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Readout. Fixed row order so the panel height stays steady as the
            student clicks between values of different name lengths. */}
        <div className="flex flex-col gap-4 bg-paper p-5">
          <div>
            <p className="ref-tag mb-2 text-ink/55">Python calls it</p>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className={`font-mono-lab text-3xl font-extrabold leading-none ${meta.text}`}>
                {picked.type}
              </span>
              <span className="font-lab text-sm font-bold text-ink/60">{meta.label}</span>
            </div>
          </div>

          <pre className="overflow-x-auto rounded-lg border-2 border-ink bg-well px-3 py-2.5 font-mono-lab text-xs leading-relaxed text-white/90">
{`>>> type(${picked.display})
<class '${picked.type}'>`}
          </pre>

          <p className="text-sm font-medium leading-relaxed text-ink/75">{picked.hint}</p>
        </div>
      </div>
    </div>
  );
}
