import { useState } from 'react';
import { Copy, Check, SquarePen } from 'lucide-react';
import { highlight } from './highlight';
import RichText from '../RichText';

/**
 * A lesson code example: coloured code, an optional "what it prints" strip,
 * and a Try it button that drops the snippet into the lesson's editor.
 *
 *   { "type": "code", "language": "python", "value": "print(1)",
 *     "output": ["1"], "caption": "optional label above the code" }
 *
 * `output` is a list of lines (or one string). It is shown, not run: it tells
 * the student what to expect before they press Try it and see it for real.
 * `onTry` is absent on courses with no editor, and the button hides itself.
 */
export default function CodeBlock({ block, language, onTry }) {
  const [tried, setTried] = useState(false);
  const [copied, setCopied] = useState(false);
  const lang = block.language || language || 'python';
  const output = Array.isArray(block.output)
    ? block.output
    : block.output != null ? String(block.output).split('\n') : null;

  const handleTry = () => {
    onTry(block.value);
    setTried(true);
    setTimeout(() => setTried(false), 1800);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(block.value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard blocked: nothing useful to tell the student */ }
  };

  return (
    <figure className="overflow-hidden rounded-xl bg-well">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-2">
        <span className="flex items-center gap-2">
          <span className="flex gap-1.5" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-wire" />
            <span className="h-2.5 w-2.5 rounded-full bg-signal" />
            <span className="h-2.5 w-2.5 rounded-full bg-mint" />
          </span>
          <span className="font-mono-lab text-xs text-white/60">{block.caption ? <RichText value={block.caption} /> : lang}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            className="rounded-md p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            title="Copy code"
            aria-label="Copy code"
          >
            {copied ? <Check className="h-4 w-4 text-mint" /> : <Copy className="h-4 w-4" />}
          </button>
          {onTry && (
            <button
              onClick={handleTry}
              className="inline-flex items-center gap-1.5 rounded-md border border-signal/60 bg-signal px-2.5 py-1 text-xs font-extrabold text-ink transition-colors hover:bg-white"
              title="Put this code in the editor"
            >
              {tried ? <Check className="h-3.5 w-3.5" /> : <SquarePen className="h-3.5 w-3.5" />}
              {tried ? 'In the editor' : 'Try it'}
            </button>
          )}
        </span>
      </div>

      <pre className="overflow-x-auto px-5 py-4 font-mono-lab text-sm leading-relaxed text-white/90">
        <code>{highlight(block.value, lang)}</code>
      </pre>

      {output && (
        <div className="border-t-2 border-dashed border-white/15 bg-black/30 px-5 py-3">
          <p className="ref-tag mb-1.5 text-white/40">Output</p>
          <pre className="font-mono-lab text-sm leading-relaxed text-mint">{output.join('\n')}</pre>
        </div>
      )}
    </figure>
  );
}
