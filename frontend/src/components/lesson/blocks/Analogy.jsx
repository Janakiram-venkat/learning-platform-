import RichText from '../RichText';
import { highlight } from './highlight';

/**
 * "This is like that": a real-world picture beside the code it stands for.
 *
 *   { "type": "analogy", "emoji": "📦", "real": "A labeled box",
 *     "concept": "A variable", "code": "score = 100",
 *     "text": "The label is the name, what's inside is the value." }
 *
 * One quiet row: the picture, an arrow, the code. The explanation sits beside
 * it rather than in a panel of its own, so the analogy reads as a sentence
 * with a picture, not as another card.
 */
export default function Analogy({ block, language }) {
  return (
    <section className="flex flex-col gap-5 rounded-2xl bg-signal/10 px-5 py-5 @min-[40rem]:flex-row @min-[40rem]:items-center">
      <div className="flex shrink-0 items-center gap-4">
        <div className="flex w-24 flex-col items-center text-center">
          <span className="text-5xl leading-none" aria-hidden>{block.emoji}</span>
          <span className="mt-2 text-sm font-bold leading-tight text-ink">{block.real}</span>
        </div>
        <span className="font-mono-lab text-xs font-bold text-ink/45" aria-label="is like">is like →</span>
        <div className="flex flex-col items-start gap-1.5">
          {block.code && (
            <pre className="font-mono-lab max-w-[16rem] overflow-x-auto rounded-lg bg-well px-3 py-2 text-sm text-white/90">
              {highlight(block.code, language)}
            </pre>
          )}
          <span className="text-sm font-bold text-pcb">{block.concept}</span>
        </div>
      </div>

      {block.text && (
        <p className="min-w-0 text-base leading-relaxed text-ink/75 @min-[40rem]:border-l-2 @min-[40rem]:border-signal/40 @min-[40rem]:pl-5">
          <RichText value={block.text} />
        </p>
      )}
    </section>
  );
}
