import { useState } from 'react';

/**
 * Slice Viewer: a word drawn as numbered letter tiles, with start and stop
 * handles above it.
 *
 * "Up to but not including" is the single hardest sentence in this lesson.
 * Drawing the stop marker in the gap *before* a letter, rather than on it,
 * turns that rule into something you can point at: the letter under the marker
 * is the first one left out.
 */
export default function SliceViewer({ block }) {
  const word = String(block?.word ?? 'Python');
  const [start, setStart] = useState(0);
  const [stop, setStop] = useState(word.length);
  const [useStart, setUseStart] = useState(true);
  const [useStop, setUseStop] = useState(true);

  const from = useStart ? Math.max(0, Math.min(start, word.length)) : 0;
  const to = useStop ? Math.max(0, Math.min(stop, word.length)) : word.length;
  const piece = word.slice(from, to);

  const text = `${useStart ? from : ''}:${useStop ? to : ''}`;

  return (
    <div className="my-8 overflow-hidden rounded-2xl border-2 border-ink bg-white shadow-[4px_4px_0_rgba(27,27,27,0.9)] [container-type:inline-size]">
      <div className="border-b-2 border-ink bg-pcb px-4 py-3">
        <span className="font-lab text-sm font-bold text-white">Slice Viewer</span>
      </div>

      <div className="p-5">
        {/* Tiles carry their own index label, so the numbers cannot drift out of
            line with the letters at any container width. */}
        <p className="ref-tag mb-2 text-ink/55">every letter, and its index</p>
        <div className="mb-5 flex flex-wrap gap-1.5">
          {word.split('').map((ch, n) => {
            const inside = n >= from && n < to;
            return (
              <div
                key={n}
                className={`flex w-12 flex-col items-center rounded-lg border-2 py-1 ${
                  inside ? 'border-ink bg-signal' : 'border-ink/20 bg-paper'
                }`}
              >
                <span className={`ref-tag ${inside ? 'text-ink/60' : 'text-ink/35'}`}>{n}</span>
                <span className={`font-mono-lab text-lg font-extrabold leading-tight ${inside ? 'text-ink' : 'text-ink/35'}`}>
                  {ch === ' ' ? '·' : ch}
                </span>
                <span className={`ref-tag ${inside ? 'text-ink/45' : 'text-ink/25'}`}>{n - word.length}</span>
              </div>
            );
          })}
        </div>

        <div className="mb-5 grid grid-cols-1 gap-4 @min-[30rem]:grid-cols-2">
          <Handle
            label="start"
            value={start}
            on={useStart}
            setOn={setUseStart}
            onChange={setStart}
            max={word.length}
            offNote="leave it out and Python starts at the beginning"
          />
          <Handle
            label="stop"
            value={stop}
            on={useStop}
            setOn={setUseStop}
            onChange={setStop}
            max={word.length}
            offNote="leave it out and Python runs to the end"
          />
        </div>

        <pre className="mb-5 overflow-x-auto rounded-xl border-2 border-ink bg-well px-4 py-4 font-mono-lab text-sm leading-relaxed text-white/90">
{`word = "${word}"
print(word[${text}])`}
        </pre>

        <div className="grid grid-cols-1 gap-3 @min-[30rem]:grid-cols-[3fr_2fr]">
          <div className="flex min-h-20 items-center rounded-xl border-2 border-ink bg-mint/15 px-4 py-3">
            <code className="break-words font-mono-lab text-xl font-extrabold text-mint-deep">
              {piece ? `"${piece}"` : '"" (an empty string)'}
            </code>
          </div>
          <div className="flex min-h-20 flex-col items-center justify-center rounded-xl border-2 border-ink bg-paper px-4 py-3 text-center">
            <p className="ref-tag mb-1 text-ink/55">letters taken</p>
            <p className="font-mono-lab text-3xl font-extrabold leading-none text-ink">{piece.length}</p>
          </div>
        </div>

        <p className="mt-4 text-sm font-medium leading-relaxed text-ink/70">
          {useStop && to < word.length
            ? `The slice stops before index ${to}, so "${word[to]}" is the first letter left out. Count the highlighted tiles and you get ${piece.length}, which is ${to} minus ${from}.`
            : piece.length === 0
              ? 'Start and stop have met, so there is nothing between them and the slice is empty. Python does not complain, it just hands back "".'
              : `Nothing is cut off the end here, so the slice runs from index ${from} all the way to the last letter.`}
        </p>
      </div>
    </div>
  );
}

function Handle({ label, value, on, setOn, onChange, max, offNote }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="ref-tag text-ink/55">{label}</p>
        <button
          onClick={() => setOn(!on)}
          aria-pressed={!on}
          className={`rounded-md border-2 px-2 py-0.5 ref-tag transition-colors ${
            on ? 'border-ink/25 bg-white text-ink/55 hover:border-ink' : 'border-ink bg-ink text-white'
          }`}
        >
          left out
        </button>
      </div>
      <input
        type="number"
        value={on ? value : ''}
        disabled={!on}
        min={0}
        max={max}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        aria-label={label}
        className="h-12 w-full rounded-xl border-2 border-ink bg-paper px-3 text-center font-mono-lab text-xl font-extrabold text-ink outline-none [-moz-appearance:textfield] focus:bg-white disabled:border-ink/20 disabled:bg-ink/5 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      {!on && <p className="mt-1 text-sm font-medium leading-relaxed text-ink/60">{offNote}</p>}
    </div>
  );
}
