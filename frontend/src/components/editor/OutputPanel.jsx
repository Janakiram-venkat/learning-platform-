export default function OutputPanel({ output, isRunning, error }) {
  return (
    <div className="flex h-full flex-col overflow-y-auto rounded-md bg-[#0B180F] p-4 font-mono-lab text-sm text-white">
      <div className="mb-2 flex justify-between border-b border-white/10 pb-2 text-white/45">
        <span>▸ Output</span>
        {isRunning && <span className="animate-pulse text-led">Running…</span>}
      </div>
      <div className="flex-1 whitespace-pre-wrap">
        {error ? (
          <span className="text-wire">{error}</span>
        ) : (
          <span className={output ? 'text-emerald-400' : 'text-white/40'}>{output || 'Output will appear here…'}</span>
        )}
      </div>
    </div>
  );
}
