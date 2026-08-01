import { Link } from 'react-router-dom';
import { Lock, ArrowRight } from 'lucide-react';

/**
 * The "you're not here yet" screen for a course gated behind another one.
 *
 * Deliberately not a dead end: it names exactly what's missing, shows how far
 * along the student already is, and links straight back into the work that
 * opens the door.
 */
export default function CourseLocked({ title, emoji = '🔒', done, required, prerequisite }) {
  const prereqTitle = prerequisite?.courseTitle || 'the earlier course';
  const startPath = prerequisite?.startPath || '/#tracks';
  const pct = required ? (done / required) * 100 : 0;

  return (
    <div className="bench-grid flex-1 px-4 py-16 sm:px-8">
      <div className="lab-panel mx-auto max-w-lg p-8 text-center">
        <div className="relative mx-auto mb-5 w-fit">
          <span className="block text-6xl opacity-40" aria-hidden>{emoji}</span>
          <span className="absolute -bottom-1 -right-2 flex h-10 w-10 items-center justify-center rounded-lg border-2 border-ink bg-signal">
            <Lock className="h-5 w-5 text-ink" />
          </span>
        </div>

        <span className="ref-tag text-ink/45">Locked</span>
        <h1 className="font-lab mt-1 text-2xl font-extrabold text-ink sm:text-3xl">{title}</h1>
        <p className="mx-auto mt-3 max-w-sm font-semibold text-ink/65">
          Finish <strong>{required} modules of {prereqTitle}</strong> to open this course.
          {prerequisite?.note && <> {prerequisite.note}</>}
        </p>

        <div className="mt-7">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="ref-tag text-ink/50">{prereqTitle} modules</span>
            <span className="font-lab font-extrabold text-ink">{done} / {required}</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full border-2 border-ink bg-ink/10">
            <div className="h-full bg-signal transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-xs font-bold text-ink/50">
            {required - done} more {required - done === 1 ? 'module' : 'modules'} to go
          </p>
        </div>

        <Link
          to={startPath}
          className="lab-btn mt-8 inline-flex items-center gap-2 rounded-xl border-2 border-ink bg-signal px-6 py-3 font-extrabold text-ink"
        >
          {done > 0 ? `Keep going in ${prereqTitle}` : `Start ${prereqTitle}`}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
