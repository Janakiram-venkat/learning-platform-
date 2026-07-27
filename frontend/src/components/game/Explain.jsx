import { useState } from 'react';
import { BookOpen, ChevronDown } from 'lucide-react';

// The "Decode it" beat: the code a student is about to write, one line at a
// time. Each line gets a plain-English `what`, and behind a toggle a `why` —
// the background logic that explains why it's built that way rather than some
// other way. The why is hidden by default so the panel stays scannable; a
// learner who wants the depth can ask for it line by line.
function Line({ code, what, why, open, onToggle }) {
  return (
    <li className="overflow-hidden rounded-xl border-2 border-ink/15 bg-white">
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-start gap-3 p-3 text-left transition-colors hover:bg-paper"
      >
        <div className="min-w-0 flex-1">
          <pre className="overflow-x-auto whitespace-pre rounded-lg bg-ink px-3 py-2 font-mono text-xs leading-relaxed text-signal">
            {code}
          </pre>
          <p className="mt-2 text-ink/80">{what}</p>
          {!open && why && (
            <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-extrabold uppercase tracking-wide text-pcb">
              Why it works like that
            </span>
          )}
        </div>
        {why && (
          <ChevronDown
            className={`mt-1 h-5 w-5 shrink-0 text-ink/35 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        )}
      </button>
      {open && why && (
        <p className="border-t-2 border-ink/10 bg-paper px-3 py-3 leading-relaxed text-ink/75">
          {why}
        </p>
      )}
    </li>
  );
}

export default function Explain({ title, intro, lines }) {
  const [openIndex, setOpenIndex] = useState(null);
  if (!lines?.length) return null;

  return (
    <div className="lab-panel p-4 sm:p-5">
      <h3 className="mb-1 flex items-center gap-2 font-lab font-bold text-ink">
        <BookOpen className="h-5 w-5 text-pcb" /> {title || 'What the code is doing'}
      </h3>
      {intro && <p className="mb-4 text-sm text-ink/55">{intro}</p>}
      <ul className="space-y-2.5">
        {lines.map((l, i) => (
          <Line
            key={i}
            code={l.code}
            what={l.what}
            why={l.why}
            open={openIndex === i}
            onToggle={() => setOpenIndex((cur) => (cur === i ? null : i))}
          />
        ))}
      </ul>
    </div>
  );
}
