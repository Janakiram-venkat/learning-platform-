import { Clock } from 'lucide-react';
import { formatRemaining } from '../../lib/contestTime';

// The timer chip in the contest top bar. Turns red for the last five minutes.
export default function Countdown({ contest, phase, now }) {
  if (!contest || !phase) return null;
  if (phase === 'ended') {
    return (
      <span className="flex items-center gap-1.5 rounded-lg border-2 border-ink bg-ink/10 px-3 py-1.5 font-lab text-sm font-extrabold text-ink/70">
        <Clock className="h-4 w-4" /> Ended
      </span>
    );
  }
  const target = Date.parse(phase === 'upcoming' ? contest.start_at : contest.end_at);
  const left = target - now;
  const urgent = phase === 'live' && left < 5 * 60 * 1000;
  return (
    <span
      className={`flex items-center gap-1.5 rounded-lg border-2 border-ink px-3 py-1.5 font-lab text-sm font-extrabold tabular-nums ${
        urgent ? 'animate-pulse bg-wire text-white' : phase === 'live' ? 'bg-signal text-ink' : 'bg-white text-ink'
      }`}
      aria-live="off"
    >
      <Clock className="h-4 w-4" />
      {phase === 'upcoming' ? `Starts in ${formatRemaining(left)}` : `${formatRemaining(left)} left`}
    </span>
  );
}
