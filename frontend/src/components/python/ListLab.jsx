import { useState } from 'react';

/**
 * List Lab: a list drawn as numbered slots, so indexing stops being arithmetic
 * the student does in their head.
 *
 * Two things are hard to see in plain text and easy to see here: that the last
 * index is always one less than the length, and that a tuple is the same shape
 * with the editing switched off. The tuple toggle is why this widget is shared
 * between the Lists and Tuples lessons instead of being two widgets.
 */
const START = ['Lego', 'Teddy Bear', 'Action Figure'];

export default function ListLab({ block }) {
  // `block.kind` is the widget's own name, so the starting collection type is
  // carried on `mode` instead.
  const [kind, setKind] = useState(block?.mode === 'tuple' ? 'tuple' : 'list');
  const [items, setItems] = useState(START);
  const [draft, setDraft] = useState('Water Gun');
  const [idx, setIdx] = useState(0);
  const [blocked, setBlocked] = useState(null);

  const locked = kind === 'tuple';
  const open = locked ? '(' : '[';
  const close = locked ? ')' : ']';
  const literal = `${open}${items.map((t) => `"${t}"`).join(', ')}${close}`;
  const inRange = idx >= 0 ? idx < items.length : -idx <= items.length;
  const picked = idx >= 0 ? items[idx] : items[items.length + idx];

  // Python's two refusals are different errors, and saying so is the point:
  // a tuple has no .append at all, while assigning into one is unsupported.
  const tryEdit = (fn, refusal) => {
    if (locked) {
      setBlocked(refusal);
      return;
    }
    setBlocked(null);
    fn();
  };

  return (
    <div className="my-8 overflow-hidden rounded-2xl border-2 border-ink bg-white shadow-[4px_4px_0_rgba(27,27,27,0.9)] [container-type:inline-size]">
      <div className="border-b-2 border-ink bg-pcb px-4 py-3">
        <span className="font-lab text-sm font-bold text-white">List Lab</span>
      </div>

      <div className="p-5">
        <p className="ref-tag mb-2 text-ink/55">what kind of collection</p>
        <div className="mb-5 grid grid-cols-2 gap-2">
          {['list', 'tuple'].map((k) => {
            const active = k === kind;
            return (
              <button
                key={k}
                onClick={() => { setKind(k); setBlocked(null); }}
                aria-pressed={active}
                className={`flex h-12 items-center justify-center rounded-xl border-2 transition-colors ${
                  active
                    ? 'border-ink bg-ink text-white'
                    : 'border-ink/25 bg-white text-ink hover:border-ink hover:bg-paper'
                }`}
              >
                <span className="font-mono-lab text-base font-extrabold leading-none">
                  {k === 'list' ? '[ ] list' : '( ) tuple'}
                </span>
              </button>
            );
          })}
        </div>

        <pre className="mb-5 overflow-x-auto rounded-xl border-2 border-ink bg-well px-4 py-4 font-mono-lab text-sm leading-relaxed text-white/90">
{`toys = ${literal}`}
        </pre>

        {/* Each slot carries its own index labels so the numbers sit under the
            value they belong to, rather than in a separate legend. */}
        <p className="ref-tag mb-2 text-ink/55">the slots, and their index numbers</p>
        <div className="mb-5 flex flex-wrap gap-2">
          {items.map((t, i) => {
            const hit = inRange && (i === idx || i === items.length + idx);
            return (
              <div
                key={`${t}-${i}`}
                className={`flex min-w-24 flex-1 flex-col items-center rounded-xl border-2 px-3 py-2 ${
                  hit ? 'border-ink bg-signal' : 'border-ink/25 bg-paper'
                }`}
              >
                <span className="ref-tag text-ink/45">index {i}</span>
                <span className="my-1 break-words text-center font-mono-lab text-sm font-extrabold text-ink">
                  {t}
                </span>
                <span className="ref-tag text-ink/35">or {i - items.length}</span>
              </div>
            );
          })}
          {items.length === 0 && (
            <p className="w-full rounded-xl border-2 border-dashed border-ink/25 px-3 py-4 text-center text-sm font-medium text-ink/45">
              The collection is empty. Every index is out of range.
            </p>
          )}
        </div>

        <div className="mb-5 grid grid-cols-1 gap-4 @min-[32rem]:grid-cols-2">
          <div>
            <p className="ref-tag mb-1 text-ink/55">read one slot</p>
            <div className="flex items-center gap-2">
              <code className="shrink-0 font-mono-lab text-sm font-extrabold text-ink">toys[</code>
              <input
                type="number"
                value={idx}
                onChange={(e) => setIdx(Number(e.target.value) || 0)}
                aria-label="index to read"
                className="h-11 w-full min-w-0 rounded-xl border-2 border-ink bg-paper px-2 text-center font-mono-lab text-lg font-extrabold text-ink outline-none [-moz-appearance:textfield] focus:bg-white [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <code className="shrink-0 font-mono-lab text-sm font-extrabold text-ink">]</code>
            </div>
            <div
              className={`mt-2 flex min-h-12 items-center rounded-xl border-2 border-ink px-3 py-2 ${
                inRange ? 'bg-mint/15' : 'bg-wire/15'
              }`}
            >
              <code className={`break-words font-mono-lab text-sm font-extrabold ${inRange ? 'text-mint-deep' : 'text-wire'}`}>
                {inRange ? `"${picked}"` : `IndexError: ${kind} index out of range`}
              </code>
            </div>
          </div>

          <div>
            <p className="ref-tag mb-1 text-ink/55">change it</p>
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              aria-label="item to append"
              className="h-11 w-full rounded-xl border-2 border-ink bg-paper px-3 font-mono-lab text-sm font-extrabold text-ink outline-none focus:bg-white"
            />
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                onClick={() =>
                  tryEdit(
                    () => draft.trim() && setItems([...items, draft.trim()]),
                    "AttributeError: 'tuple' object has no attribute 'append'",
                  )
                }
                className="h-12 rounded-xl border-2 border-ink bg-white px-2 font-mono-lab text-xs font-extrabold text-ink transition-colors hover:bg-pcb hover:text-white"
              >
                .append()
              </button>
              <button
                onClick={() =>
                  tryEdit(
                    () => setItems(items.slice(0, -1)),
                    "AttributeError: 'tuple' object has no attribute 'pop'",
                  )
                }
                className="h-12 rounded-xl border-2 border-ink bg-white px-2 font-mono-lab text-xs font-extrabold text-ink transition-colors hover:bg-pcb hover:text-white"
              >
                .pop()
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 @min-[28rem]:grid-cols-2">
          <div className="flex min-h-20 flex-col items-center justify-center rounded-xl border-2 border-ink bg-signal px-4 py-3 text-center">
            <p className="ref-tag mb-1 text-ink/60">len(toys)</p>
            <p className="font-mono-lab text-3xl font-extrabold leading-none text-ink">{items.length}</p>
          </div>
          <div className="flex min-h-20 flex-col items-center justify-center rounded-xl border-2 border-ink bg-paper px-4 py-3 text-center">
            <p className="ref-tag mb-1 text-ink/55">last valid index</p>
            <p className="font-mono-lab text-3xl font-extrabold leading-none text-ink">
              {items.length ? items.length - 1 : 'none'}
            </p>
          </div>
        </div>

        <div className="mt-4 min-h-12 rounded-xl border-2 border-ink bg-paper px-4 py-3">
          {blocked ? (
            <code className="break-words font-mono-lab text-sm font-extrabold text-wire">{blocked}</code>
          ) : (
            <p className="text-sm font-medium leading-relaxed text-ink/70">
              {locked
                ? 'A tuple is locked once it is made. Try appending and Python refuses, which is the whole reason to choose a tuple for values that should never change.'
                : 'The last index is always one less than the length, because counting starts at 0. That is the single most common off by one mistake in Python.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
