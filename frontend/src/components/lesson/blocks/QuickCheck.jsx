import { useState } from 'react';
import { HelpCircle, CheckCircle2, XCircle, RotateCcw, Eye } from 'lucide-react';
import RichText from '../RichText';
import { highlight } from './highlight';

/**
 * A one-question pause in the middle of the theory.
 *
 *   { "type": "check", "question": "What does this print?",
 *     "code": "x = 2\nprint(x * 3)", "options": ["6", "x * 3", "23"],
 *     "answer": 0, "explain": "..." }
 *
 * Ungraded, and built to make the student think rather than read the answer:
 * a wrong pick is crossed out and the rest stay open, the explanation only
 * appears once they find the right one, and after two misses they may ask to
 * be shown it. The Knowledge Check tab is the graded quiz.
 */
export default function QuickCheck({ block, language }) {
  const [wrong, setWrong] = useState([]); // indices tried and missed
  const [solved, setSolved] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [lastPick, setLastPick] = useState(null);

  const done = solved || revealed;
  const touched = wrong.length > 0 || done;

  const pick = (i) => {
    setLastPick(i);
    if (i === block.answer) setSolved(true);
    else setWrong((w) => [...w, i]);
  };

  const reset = () => { setWrong([]); setSolved(false); setRevealed(false); setLastPick(null); };

  return (
    <section className="overflow-hidden rounded-2xl border-2 border-led/30 bg-led/[0.04]">
      <div className="flex items-center justify-between gap-3 px-5 pt-4">
        <span className="ref-tag flex items-center gap-1.5 text-led-deep">
          <HelpCircle className="h-4 w-4" /> Quick check
        </span>
        {touched && (
          <button
            onClick={reset}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold text-ink/50 hover:bg-ink/5 hover:text-ink"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Start over
          </button>
        )}
      </div>

      <div className="space-y-4 px-5 pb-5 pt-2">
        <p className="font-lab text-lg font-extrabold text-ink"><RichText value={block.question} /></p>

        {block.code && (
          <pre className="font-mono-lab overflow-x-auto rounded-lg border-2 border-ink bg-well px-4 py-3 text-sm leading-relaxed text-white/90">
            {highlight(block.code, language)}
          </pre>
        )}

        <div className="grid grid-cols-1 gap-2.5 @min-[34rem]:grid-cols-2">
          {(block.options || []).map((opt, i) => {
            const isAnswer = i === block.answer;
            const missed = wrong.includes(i);
            let cls = 'border-ink/15 bg-white hover:border-ink/50';
            if (done && isAnswer) cls = `border-mint-deep bg-mint/15 ${solved ? 'animate-correct' : ''}`;
            else if (missed) cls = `border-wire/60 bg-wire/5 text-ink/50 line-through ${lastPick === i ? 'animate-shake' : ''}`;
            else if (done) cls = 'border-ink/10 bg-white opacity-60';
            return (
              <button
                key={i}
                onClick={() => pick(i)}
                disabled={done || missed}
                className={`flex items-center justify-between gap-3 rounded-xl border-2 px-4 py-3 text-left font-semibold text-ink transition-colors disabled:cursor-default ${cls}`}
              >
                <span className="font-mono-lab text-sm"><RichText value={opt} /></span>
                {done && isAnswer && <CheckCircle2 className="h-5 w-5 shrink-0 text-mint-deep" />}
                {missed && <XCircle className="h-5 w-5 shrink-0 text-wire" />}
              </button>
            );
          })}
        </div>

        {!done && wrong.length > 0 && (
          <div key={wrong.length} className="animate-slide-up flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-signal bg-signal/15 p-4">
            <p className="text-base font-semibold text-ink">Not quite. Have another go!</p>
            {wrong.length >= 2 && (
              <button
                onClick={() => setRevealed(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border-2 border-ink bg-white px-3 py-1.5 text-sm font-bold text-ink hover:bg-paper"
              >
                <Eye className="h-4 w-4" /> Show answer
              </button>
            )}
          </div>
        )}

        {done && (
          <div className={`animate-slide-up rounded-xl border-2 p-4 ${solved ? 'border-mint-deep/40 bg-mint/10' : 'border-ink/20 bg-paper'}`}>
            <p className="text-base leading-relaxed text-ink">
              <span className="font-extrabold">{solved ? (wrong.length ? 'Got it! ' : 'Yes! ') : 'Here it is. '}</span>
              {block.explain && <RichText value={block.explain} />}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
