import { useState } from 'react';
import { Eye, EyeOff, Copy, Check, FileCode2, CornerDownLeft } from 'lucide-react';

// One way this step can be written, revealed on request.
//
// Deliberately one click away rather than locked behind "use all your hints
// first": a learner who is genuinely stuck and can't get unstuck learns
// nothing, and hiding the answer harder just sends them to a friend's screen.
// Reading a worked solution and then running it is a real way to learn — so
// the nudge is a sentence, not a gate.
export default function Solution({ code, onUseCode }) {
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!code) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch { /* clipboard blocked */ }
  };

  return (
    <div className="lab-panel p-4 sm:p-5">
      <h3 className="mb-1 flex items-center gap-2 font-lab font-bold text-ink">
        <FileCode2 className="h-5 w-5 text-pcb" /> One way to write it
      </h3>
      <p className="mb-4 text-sm text-ink/55">
        There's never only one right answer — the check watches what your game <em>does</em>, not how you
        typed it. Have a go yourself first, but if you're stuck, reading this and then running it counts
        as learning too.
      </p>

      {!shown ? (
        <button
          onClick={() => setShown(true)}
          className="lab-btn flex items-center gap-2 rounded-xl border-2 border-ink bg-white px-4 py-2.5 font-extrabold text-ink"
        >
          <Eye className="h-4 w-4" /> Show me the solution
        </button>
      ) : (
        <>
          <pre className="max-h-80 overflow-auto rounded-xl border-2 border-ink bg-ink p-4 font-mono text-xs leading-relaxed text-white/90">
            {code}
          </pre>
          <div className="mt-3 flex flex-wrap gap-2">
            {onUseCode && (
              <button
                onClick={() => onUseCode(code)}
                className="lab-btn flex items-center gap-2 rounded-xl border-2 border-ink bg-signal px-4 py-2.5 font-extrabold text-ink"
              >
                <CornerDownLeft className="h-4 w-4" /> Put this in my editor
              </button>
            )}
            <button
              onClick={copy}
              className="lab-btn flex items-center gap-2 rounded-xl border-2 border-ink bg-white px-4 py-2.5 font-extrabold text-ink"
            >
              {copied ? <Check className="h-4 w-4 text-pcb" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              onClick={() => setShown(false)}
              className="lab-btn flex items-center gap-2 rounded-xl border-2 border-ink bg-white px-4 py-2.5 font-extrabold text-ink"
            >
              <EyeOff className="h-4 w-4" /> Hide it again
            </button>
          </div>
          <p className="mt-3 text-sm text-ink/55">
            Try changing a number in it and pressing Play — poking at working code is one of the fastest
            ways to work out what each part was holding up.
          </p>
        </>
      )}
    </div>
  );
}
