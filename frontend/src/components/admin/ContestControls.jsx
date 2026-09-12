import { useState } from 'react';
import {
  Play, Square, Plus, Minus, Trophy, EyeOff, Loader2,
} from 'lucide-react';
import { adminContestService } from '../../services/api';
import { formatRemaining, phaseOf } from '../../lib/contestTime';

// Lengths offered next to "Start now". null means "however long it was
// already scheduled for", which is what an organizer usually wants when a
// planned contest simply needs to begin early.
const LENGTHS = [
  { value: '', label: 'scheduled length' },
  { value: '15', label: '15 min' },
  { value: '30', label: '30 min' },
  { value: '45', label: '45 min' },
  { value: '60', label: '1 hour' },
  { value: '90', label: '1½ hours' },
  { value: '120', label: '2 hours' },
];

const BTN = 'lab-btn flex items-center gap-1.5 rounded-xl border-2 border-ink px-3 py-2 font-extrabold disabled:opacity-50';

/**
 * The run-the-contest bar: open the doors, call time, hand out extra minutes,
 * show the leaderboard. Every button is one request that moves one thing, so
 * pressing them mid-contest can never clobber the brief an organizer is
 * halfway through editing in another tab.
 */
export default function ContestControls({ contest, now, onChange, onError, compact = false }) {
  const [busy, setBusy] = useState('');
  const [length, setLength] = useState('');
  const phase = phaseOf(contest, now);

  const run = (key, call, confirmText) => async () => {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(key);
    try {
      const { data } = await call();
      onChange(data);
    } catch (err) {
      onError?.(err?.response?.data?.detail || 'That control did not go through. Try again.');
    } finally {
      setBusy('');
    }
  };

  const icon = (key, fallback) => (busy === key ? <Loader2 className="h-4 w-4 animate-spin" /> : fallback);
  const left = Date.parse(contest.end_at) - now;
  const urgent = phase === 'live' && left < 5 * 60 * 1000;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {phase === 'live' && (
        <span
          className={`flex items-center gap-1.5 rounded-lg border-2 border-ink px-2.5 py-1.5 font-lab text-sm font-extrabold tabular-nums ${
            urgent ? 'animate-pulse bg-wire text-white' : 'bg-signal text-ink'
          }`}
        >
          {formatRemaining(left)} left
        </span>
      )}

      {phase !== 'live' && (
        <>
          <button
            type="button"
            disabled={!!busy}
            onClick={run('start', () => adminContestService.startNow(contest.id, length ? Number(length) : null))}
            className={`${BTN} bg-led text-white`}
            title="Open the contest to students right now"
          >
            {icon('start', <Play className="h-4 w-4" />)} Start now
          </button>
          {!compact && (
            <select
              value={length}
              onChange={(e) => setLength(e.target.value)}
              aria-label="How long the contest runs once started"
              className="rounded-xl border-2 border-ink/20 bg-white px-2 py-2 text-sm font-bold text-ink/70 outline-none focus:border-pcb"
            >
              {LENGTHS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          )}
        </>
      )}

      {phase === 'live' && (
        <>
          <button
            type="button"
            disabled={!!busy}
            onClick={run('plus', () => adminContestService.addTime(contest.id, 5))}
            className={`${BTN} bg-white text-ink`}
            title="Give everyone five more minutes"
          >
            {icon('plus', <Plus className="h-4 w-4" />)} 5 min
          </button>
          <button
            type="button"
            disabled={!!busy}
            onClick={run('minus', () => adminContestService.addTime(contest.id, -5))}
            className={`${BTN} bg-white text-ink`}
            title="Take five minutes off the clock"
          >
            {icon('minus', <Minus className="h-4 w-4" />)} 5 min
          </button>
          <button
            type="button"
            disabled={!!busy}
            onClick={run(
              'end',
              () => adminContestService.endNow(contest.id),
              `End "${contest.title}" now? Students lose the editor immediately; their last autosave is kept.`,
            )}
            className={`${BTN} bg-wire text-white`}
            title="Stop the contest immediately"
          >
            {icon('end', <Square className="h-4 w-4" />)} End now
          </button>
        </>
      )}

      <button
        type="button"
        disabled={!!busy}
        onClick={run('results', () => adminContestService.setResults(contest.id, !contest.results_published))}
        className={`${BTN} ${contest.results_published ? 'bg-white text-ink' : 'bg-signal text-ink'}`}
        title={contest.results_published ? 'Hide the leaderboard from students' : 'Let students see scores and the leaderboard'}
      >
        {icon('results', contest.results_published ? <EyeOff className="h-4 w-4" /> : <Trophy className="h-4 w-4" />)}
        {contest.results_published ? 'Hide results' : 'Publish results'}
      </button>
    </div>
  );
}
