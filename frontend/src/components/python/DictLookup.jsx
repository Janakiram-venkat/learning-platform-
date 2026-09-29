import { useState } from 'react';

/**
 * Dict Lookup: key and value drawn as two columns, with a lookup box that
 * either lands on a row or raises a KeyError.
 *
 * A dictionary reads perfectly well in text, so the widget earns its place on
 * the failure cases: a missing key is an error rather than a blank, assigning
 * to an existing key overwrites in place while a new key appends a row, and
 * .get() is the version that does not explode. Those are the three things
 * students hit first.
 */
const START = [
  { k: 'name', v: '"Peter Parker"' },
  { k: 'power', v: '"Spider webs"' },
  { k: 'city', v: '"New York"' },
];

export default function DictLookup() {
  const [pairs, setPairs] = useState(START);
  const [lookup, setLookup] = useState('power');
  const [keyDraft, setKeyDraft] = useState('age');
  const [valDraft, setValDraft] = useState('17');

  const found = pairs.find((p) => p.k === lookup);
  const exists = !!keyDraft && pairs.some((p) => p.k === keyDraft);

  const assign = () => {
    const key = keyDraft.trim();
    if (!key) return;
    const value = valDraft.trim() || 'None';
    setPairs(
      exists
        ? pairs.map((p) => (p.k === key ? { k: key, v: value } : p))
        : [...pairs, { k: key, v: value }],
    );
  };

  return (
    <div className="my-8 overflow-hidden rounded-2xl border-2 border-ink bg-white shadow-[4px_4px_0_rgba(27,27,27,0.9)] [container-type:inline-size]">
      <div className="border-b-2 border-ink bg-pcb px-4 py-3">
        <span className="font-lab text-sm font-bold text-white">Dictionary Lookup</span>
      </div>

      <div className="p-5">
        <pre className="mb-5 overflow-x-auto rounded-xl border-2 border-ink bg-well px-4 py-4 font-mono-lab text-sm leading-relaxed text-white/90">
{`hero = {\n${pairs.map((p) => `    "${p.k}": ${p.v},`).join('\n')}\n}`}
        </pre>

        {/* Two fixed columns rather than a free-form table: the point being made
            is that every row is exactly one key pointing at one value. */}
        <p className="ref-tag mb-2 text-ink/55">keys on the left, values on the right</p>
        <div className="mb-5 overflow-hidden rounded-xl border-2 border-ink">
          {pairs.map((p) => {
            const hit = p.k === lookup;
            return (
              <div
                key={p.k}
                className={`grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1.4fr)] items-center gap-2 border-b-2 border-ink/10 px-3 py-2 last:border-b-0 ${
                  hit ? 'bg-signal/30' : 'bg-paper'
                }`}
              >
                <code className="truncate font-mono-lab text-sm font-extrabold text-pcb">"{p.k}"</code>
                <span className="select-none font-mono-lab text-sm text-ink/40">to</span>
                <code className="truncate font-mono-lab text-sm font-extrabold text-ink">{p.v}</code>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-5 @min-[34rem]:grid-cols-2">
          <div>
            <p className="ref-tag mb-1 text-ink/55">look a key up</p>
            <div className="flex items-center gap-1">
              <code className="shrink-0 font-mono-lab text-sm font-extrabold text-ink">hero["</code>
              <input
                type="text"
                value={lookup}
                onChange={(e) => setLookup(e.target.value)}
                aria-label="key to look up"
                className="h-11 w-full min-w-0 rounded-xl border-2 border-ink bg-paper px-2 text-center font-mono-lab text-base font-extrabold text-ink outline-none focus:bg-white"
              />
              <code className="shrink-0 font-mono-lab text-sm font-extrabold text-ink">"]</code>
            </div>
            <div
              className={`mt-2 flex min-h-14 items-center rounded-xl border-2 border-ink px-3 py-2 ${
                found ? 'bg-mint/15' : 'bg-wire/15'
              }`}
            >
              <code className={`break-words font-mono-lab text-sm font-extrabold ${found ? 'text-mint-deep' : 'text-wire'}`}>
                {found ? found.v : `KeyError: '${lookup}'`}
              </code>
            </div>
            {!found && (
              <p className="mt-2 text-sm font-medium leading-relaxed text-ink/70">
                A missing key is an error, not an empty answer. Use
                {' '}<code className="font-mono-lab font-extrabold text-ink">hero.get("{lookup}")</code>{' '}
                when you would rather get None back than a crash.
              </p>
            )}
          </div>

          <div>
            <p className="ref-tag mb-1 text-ink/55">add or update a pair</p>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={keyDraft}
                onChange={(e) => setKeyDraft(e.target.value)}
                aria-label="key to set"
                placeholder="key"
                className="h-11 w-full min-w-0 rounded-xl border-2 border-ink bg-paper px-2 text-center font-mono-lab text-base font-extrabold text-pcb outline-none focus:bg-white"
              />
              <input
                type="text"
                value={valDraft}
                onChange={(e) => setValDraft(e.target.value)}
                aria-label="value to set"
                placeholder="value"
                className="h-11 w-full min-w-0 rounded-xl border-2 border-ink bg-paper px-2 text-center font-mono-lab text-base font-extrabold text-ink outline-none focus:bg-white"
              />
            </div>
            <button
              onClick={assign}
              className="mt-2 h-12 w-full rounded-xl border-2 border-ink bg-white px-3 font-mono-lab text-xs font-extrabold text-ink transition-colors hover:bg-pcb hover:text-white"
            >
              hero["{keyDraft || 'key'}"] = {valDraft || 'value'}
            </button>
            <p className="mt-2 text-sm font-medium leading-relaxed text-ink/70">
              {exists
                ? `"${keyDraft}" is already in there, so this overwrites its value. A key can only appear once.`
                : `"${keyDraft || 'That key'}" is not in there yet, so this adds a new pair on the end.`}
            </p>
          </div>
        </div>

        <p className="mt-5 text-sm font-medium leading-relaxed text-ink/70">
          One square bracket does both jobs. With a key that exists you read or
          replace a value, and with a key that does not, reading fails but writing
          creates it.
        </p>
      </div>
    </div>
  );
}
