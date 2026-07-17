import { useEffect, useRef, useState } from 'react';
import { TerminalSquare, CornerDownLeft } from 'lucide-react';

// ---------------------------------------------------------------------------
// Terminal — an interactive output panel. Renders program output line-by-line
// and, whenever the program is waiting on input(), shows a live prompt where
// the learner types a response. Wired to useCodeRunner (see hooks/useCodeRunner).
// ---------------------------------------------------------------------------

const LINE_STYLE = {
  out: 'text-emerald-300',
  in: 'text-sky-300',
  err: 'text-rose-400',
  sys: 'text-white/35 italic',
};

export default function Terminal({ lines, running, waiting, onSubmit, emptyHint }) {
  const [draft, setDraft] = useState('');
  const inputRef = useRef(null);
  const scrollRef = useRef(null);

  // Keep the newest output and the input caret in view.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines, waiting, running]);

  // Auto-focus the prompt the moment the program asks for input.
  useEffect(() => {
    if (waiting) inputRef.current?.focus();
  }, [waiting]);

  const send = () => {
    onSubmit(draft);
    setDraft('');
  };

  const hasContent = lines.length > 0 || running || waiting;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-md bg-[#0B180F] font-mono-lab text-sm">
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-2 text-white/45">
        <span className="flex items-center gap-1.5">
          <TerminalSquare className="h-4 w-4" /> Terminal
        </span>
        {running ? (
          <span className="animate-pulse text-led">Running…</span>
        ) : waiting ? (
          <span className="text-sky-300">Waiting for input</span>
        ) : null}
      </div>

      <div
        ref={scrollRef}
        onClick={() => waiting && inputRef.current?.focus()}
        className="flex-1 overflow-y-auto px-4 py-3"
      >
        {!hasContent && (
          <p className="text-white/40">{emptyHint || 'Run your code to see the output here…'}</p>
        )}

        {lines.map((l) => (
          <div key={l.id} className={`whitespace-pre-wrap break-words ${LINE_STYLE[l.type]}`}>
            {l.type === 'in' ? <span className="text-white/30">❯ </span> : null}
            {l.text}
          </div>
        ))}

        {waiting && (
          <div className="mt-0.5 flex items-center gap-2 text-sky-300">
            <span className="text-white/30">❯</span>
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); send(); } }}
              spellCheck={false}
              autoComplete="off"
              placeholder="type your input, then press Enter"
              className="flex-1 bg-transparent text-sky-200 placeholder:text-white/25 focus:outline-none"
            />
            <button
              onClick={send}
              className="flex items-center gap-1 rounded border border-white/15 px-1.5 py-0.5 text-xs text-white/50 hover:border-sky-300/50 hover:text-sky-300"
              title="Send input (Enter)"
            >
              <CornerDownLeft className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
