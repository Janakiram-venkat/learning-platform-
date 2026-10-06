// "1d 3h", "42:07", "0:59" — coarse when far away, to-the-second when close.
export function formatRemaining(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (d > 0) return `${d}d ${h}h`;
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export const fmtDateTime = (iso) => new Date(iso).toLocaleString(undefined, {
  weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
});

// Which side of the window a contest is on, judged against a clock the caller
// passes in so a ticking page and a countdown never disagree by a frame.
export function phaseOf(contest, now = Date.now()) {
  if (now < Date.parse(contest.start_at)) return 'upcoming';
  if (now < Date.parse(contest.end_at)) return 'live';
  return 'ended';
}
