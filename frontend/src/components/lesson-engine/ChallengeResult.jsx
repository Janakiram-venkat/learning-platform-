import { CheckCircle2, XCircle, MinusCircle, Trophy, RotateCcw, ArrowLeft } from 'lucide-react';

// ---------------------------------------------------------------------------
// ChallengeResult — the screen after the last task of a module challenge.
//
// Presentational only: it is handed a score and a breakdown and renders them.
// Whether a pass was recorded, and where the buttons go, is the pager's
// business. That keeps this testable by eye at any score without touching
// storage.
// ---------------------------------------------------------------------------

const STATUS_META = {
  passed: {
    icon: CheckCircle2,
    tone: 'text-pcb',
    label: 'Passed',
  },
  failed: {
    icon: XCircle,
    tone: 'text-wire',
    label: 'Not passed yet',
  },
  skipped: {
    icon: MinusCircle,
    tone: 'text-ink/35',
    label: 'Not attempted',
  },
};

/**
 * @param {object} props
 * @param {{ total:number, passed:number, passMark:number, isPass:boolean }} props.score
 * @param {Array<{id:string,index:number,title:string,status:string,attempts:number}>} props.breakdown
 * @param {(taskIndex: number) => void} props.onRetry  Jump back to one task.
 * @param {() => void} props.onReview                  Back to the first task.
 */
export default function ChallengeResult({ score, breakdown, onRetry, onReview }) {
  const { passed, total, passMark, isPass } = score;
  const pct = total ? Math.round((passed / total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* --- The verdict --- */}
      <div
        role="status"
        aria-live="polite"
        className={`animate-slide-up rounded-2xl border-2 p-6 text-center ${
          isPass ? 'border-pcb bg-pcb/8' : 'border-signal bg-signal/12'
        }`}
      >
        {isPass && <Trophy className="mx-auto mb-2 h-10 w-10 text-pcb" aria-hidden="true" />}
        <p className="font-lab text-4xl font-extrabold text-ink">
          {passed} <span className="text-ink/40">/ {total}</span>
        </p>
        <p className="mt-1 text-sm font-bold text-ink/55">tasks passed ({pct}%)</p>

        <p className="font-lab mt-4 text-2xl font-extrabold text-ink">
          {isPass ? 'Challenge passed' : 'Not passed yet'}
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm font-semibold text-ink/65">
          {isPass
            ? `The pass mark is ${passMark} of ${total}. ${
                passed === total
                  ? 'You passed every one of them.'
                  : 'Any task still marked below can be retried as often as you like.'
              }`
            : `You need ${passMark} of ${total} to pass — ${passMark - passed} more. Nothing is lost: open a task below and try it again.`}
        </p>
      </div>

      {/* --- Task by task --- */}
      <div>
        <h3 className="font-lab mb-3 text-lg font-extrabold text-ink">Task by task</h3>
        <ul className="space-y-2">
          {breakdown.map((task) => {
            const meta = STATUS_META[task.status] || STATUS_META.skipped;
            const Icon = meta.icon;
            return (
              <li
                key={task.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-ink/12 bg-white p-3"
              >
                <span className="flex min-w-0 items-start gap-2">
                  <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${meta.tone}`} aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-ink">{task.title}</span>
                    <span className={`block text-xs font-semibold ${meta.tone}`}>
                      {meta.label}
                      {task.status === 'failed' && task.attempts > 0 && (
                        <> · {task.attempts} {task.attempts === 1 ? 'try' : 'tries'} so far</>
                      )}
                    </span>
                  </span>
                </span>

                {task.status !== 'passed' && (
                  <button
                    onClick={() => onRetry(task.index)}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg border-2 border-ink px-4 py-2 text-sm font-bold text-ink transition-colors hover:bg-signal/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pcb"
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    {task.status === 'failed' ? 'Try again' : 'Try it'}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t-2 border-ink/10 pt-5">
        <button
          onClick={onReview}
          className="flex items-center gap-2 rounded-xl border-2 border-ink px-5 py-3 font-bold text-ink transition-colors hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pcb"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to task 1
        </button>
      </div>
    </div>
  );
}
