import { useState } from 'react';
import { Rocket, CornerDownLeft } from 'lucide-react';

// A menu of starting points for an open-ended step (Module 8). Unlike
// Solution.jsx there's no single right answer here — these are just different
// places to jump off from, one genre each. Picking one replaces the editor's
// current code, same "put this in my editor" action Solution uses elsewhere.
export default function Templates({ templates, onUseCode }) {
  const [picked, setPicked] = useState(null);

  if (!templates?.length) return null;

  return (
    <div className="lab-panel p-4 sm:p-5">
      <h3 className="mb-1 flex items-center gap-2 font-lab font-bold text-ink">
        <Rocket className="h-5 w-5 text-pcb" /> Not sure where to start?
      </h3>
      <p className="mb-4 text-sm text-ink/55">
        Every game you've built this course is a remix of the same handful of ideas. Pick one of these as a
        launchpad, then make it yours — rename things, change the rules, throw half of it away.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {templates.map((t) => (
          <button
            key={t.name}
            onClick={() => setPicked(t)}
            className={`lab-btn rounded-xl border-2 px-3 py-2.5 text-left font-extrabold text-ink ${
              picked?.name === t.name ? 'border-pcb bg-pcb/10' : 'border-ink bg-white'
            }`}
          >
            <span className="block">{t.name}</span>
            <span className="mt-0.5 block text-xs font-medium text-ink/55">{t.blurb}</span>
          </button>
        ))}
      </div>

      {picked && (
        <>
          <pre className="mt-4 max-h-80 overflow-auto rounded-xl border-2 border-ink bg-ink p-4 font-mono text-xs leading-relaxed text-white/90">
            {picked.code}
          </pre>
          <button
            onClick={() => onUseCode(picked.code)}
            className="lab-btn mt-3 flex items-center gap-2 rounded-xl border-2 border-ink bg-signal px-4 py-2.5 font-extrabold text-ink"
          >
            <CornerDownLeft className="h-4 w-4" /> Start from {picked.name}
          </button>
        </>
      )}
    </div>
  );
}
