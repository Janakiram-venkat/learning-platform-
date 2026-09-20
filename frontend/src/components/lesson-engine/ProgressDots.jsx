import { Check } from 'lucide-react';

const KIND_TITLE = { content: 'Reading', task: 'Task', quiz: 'Quiz' };

/**
 * The page strip. Visited pages can be jumped back to; pages ahead of the
 * furthest reached stay unreachable, so gating can't be skipped by clicking.
 *
 * @param {object} props
 * @param {Array<{id:string,type:string,title?:string}>} props.pages
 * @param {number} props.index       Current page.
 * @param {number} props.maxVisited  Furthest page reached this session.
 * @param {Set<string>} props.done   Page ids whose required work is passed.
 * @param {(i: number) => void} props.onJump
 */
export default function ProgressDots({ pages, index, maxVisited, done, onJump }) {
  return (
    <nav aria-label="Pages in this section" className="flex flex-wrap items-center gap-1.5">
      {pages.map((page, i) => {
        const isCurrent = i === index;
        const isDone = done.has(page.id);
        const reachable = i <= maxVisited;
        const kind = KIND_TITLE[page.type] || 'Page';
        const label = `Page ${i + 1} of ${pages.length}: ${page.title || kind}${isDone ? ' (done)' : ''}`;

        let cls = 'bg-ink/15';
        if (isDone) cls = 'bg-pcb';
        else if (reachable) cls = 'bg-ink/35';

        return (
          <button
            key={page.id}
            type="button"
            onClick={() => reachable && onJump(i)}
            disabled={!reachable}
            aria-label={label}
            aria-current={isCurrent ? 'step' : undefined}
            title={label}
            className={`group flex h-6 items-center justify-center rounded-full transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pcb ${
              isCurrent ? 'w-8' : 'w-6'
            } ${reachable ? 'cursor-pointer' : 'cursor-not-allowed'}`}
          >
            <span
              className={`flex items-center justify-center rounded-full transition-all ${
                isCurrent ? 'h-3.5 w-8 ring-2 ring-ink ring-offset-2' : 'h-2.5 w-2.5'
              } ${cls}`}
            >
              {isDone && isCurrent && <Check className="h-2.5 w-2.5 text-white" aria-hidden="true" />}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
