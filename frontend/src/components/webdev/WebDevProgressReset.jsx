// Dev-only control for clearing this course's progress while building it.
// Renders nothing in a production build.

import { useState } from 'react';
import { Trash2, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { resetWebDevProgress, WEBDEV_KEYS } from '../../lib/webdev/reset';

/**
 * @param {{ sectionIds: string[] }} props Section ids from the course data.
 */
export default function WebDevProgressReset({ sectionIds }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  // Belt and braces: the route is temporary, but this button writes to synced
  // progress, so it must not exist in a production bundle even by accident.
  if (!import.meta.env.DEV) return null;

  const run = async () => {
    if (!window.confirm(
      'Clear all web-dev progress?\n\n' +
      'This removes web-dev sections from completedLessons and wipes webdevPages, ' +
      'webdevCursor and saved code drafts — locally and on the server.\n\n' +
      'No other course is affected.',
    )) return;

    setBusy(true);
    setResult(null);
    try {
      setResult(await resetWebDevProgress(sectionIds));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border-2 border-dashed border-wire bg-wire/5 p-5 sm:p-7">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-lab flex items-center gap-2 text-2xl font-extrabold text-ink">
            Reset web-dev progress
            <span className="rounded border-2 border-ink px-1.5 py-0.5 font-mono-lab text-[10px] uppercase tracking-wider text-ink/60">
              dev only
            </span>
          </h2>
          <p className="text-sm text-ink/60">
            Start the course over as a new student would see it.
          </p>
        </div>
        <button
          onClick={run}
          disabled={busy}
          className="lab-btn flex items-center gap-2 rounded-xl border-2 border-ink bg-wire px-5 py-2.5 font-extrabold text-white disabled:opacity-60"
        >
          {busy
            ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            : <Trash2 className="h-4 w-4" aria-hidden="true" />}
          {busy ? 'Clearing…' : 'Clear progress'}
        </button>
      </div>

      <dl className="mb-4 grid gap-1 text-xs text-ink/60 sm:grid-cols-3">
        <div>
          <dt className="font-bold text-ink/75">Cleared + synced</dt>
          <dd className="font-mono-lab">{WEBDEV_KEYS.synced.join(', ')}</dd>
        </div>
        <div>
          <dt className="font-bold text-ink/75">Cleared locally</dt>
          <dd className="font-mono-lab">{WEBDEV_KEYS.localOnly.join(', ')}</dd>
        </div>
        <div>
          <dt className="font-bold text-ink/75">Left alone</dt>
          <dd className="font-mono-lab">{WEBDEV_KEYS.untouched.join(', ')}</dd>
        </div>
      </dl>

      <p className="flex items-start gap-2 rounded-xl border-2 border-signal bg-signal/15 p-3 text-xs font-semibold text-ink">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        This cannot clear the Module Challenge and Mini Project ticks. Those read
        <code className="mx-1 font-mono-lab">completedAssignments</code>/
        <code className="mx-1 font-mono-lab">completedProjects</code>, which store a bare
        <code className="mx-1 font-mono-lab">module1</code> shared with Python, AI and robotics —
        removing it here would mark their module 1 unfinished too.
      </p>

      {result && (
        <div role="status" className="mt-4 rounded-xl border-2 border-pcb bg-pcb/10 p-4 text-sm text-ink">
          <p className="mb-1 flex items-center gap-2 font-bold">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Cleared.
          </p>
          <ul className="space-y-0.5 text-xs">
            <li>
              <strong>{result.lessons.length}</strong> lesson id
              {result.lessons.length === 1 ? '' : 's'} removed
              {result.lessons.length > 0 && <span className="font-mono-lab"> ({result.lessons.join(', ')})</span>}
            </li>
            <li><strong>{result.pages.length}</strong> section(s) of page progress wiped</li>
            <li><strong>{result.drafts}</strong> saved code draft(s) removed</li>
            <li>
              Server: {result.synced
                ? 'full progress document replaced'
                : 'not signed in — local only'}
            </li>
          </ul>
          <p className="mt-2 text-xs font-semibold text-ink/60">
            Reload the lesson route to see the sidebar redraw.
          </p>
        </div>
      )}
    </div>
  );
}
