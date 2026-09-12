import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Clock, Lock, PencilLine, ArrowRight, Loader2, Mail, BookOpen } from 'lucide-react';
import { contestService } from '../services/api';
import { fmtDateTime } from '../lib/contestTime';

const STATUS = {
  live: { label: 'Live now', cls: 'bg-wire text-white' },
  upcoming: { label: 'Upcoming', cls: 'bg-signal text-ink' },
  ended: { label: 'Ended', cls: 'bg-ink/10 text-ink/70' },
};

function MyStatus({ value }) {
  if (value === 'submitted') {
    return <span className="flex items-center gap-1 text-sm font-bold text-pcb"><Lock className="h-4 w-4" /> Submitted</span>;
  }
  if (value === 'draft') {
    return <span className="flex items-center gap-1 text-sm font-bold text-ink/55"><PencilLine className="h-4 w-4" /> In progress</span>;
  }
  return null;
}

export default function ContestListPage() {
  const [contests, setContests] = useState(null);
  const [error, setError] = useState('');
  // A poll that drops out should not blank a page that already has contests
  // on it, so only the very first read is allowed to show an error.
  const loaded = useRef(false);

  // Re-read on a timer: a contest an organizer starts from the admin page
  // should turn Live here on its own, for a class already sitting on this
  // page waiting for the word to go.
  useEffect(() => {
    let alive = true;
    const read = () => contestService.list()
      .then(({ data }) => { if (alive) { loaded.current = true; setContests(data.contests); setError(''); } })
      .catch((err) => { if (alive && !loaded.current) setError(err?.response?.data?.detail || 'Could not load contests.'); });
    read();
    const id = setInterval(() => { if (!document.hidden) read(); }, 20000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  // Live first, then upcoming (soonest first), then past ones (latest first).
  const order = { live: 0, upcoming: 1, ended: 2 };
  const sorted = [...(contests || [])].sort((a, b) => (
    order[a.status] - order[b.status]
    || (a.status === 'upcoming' ? Date.parse(a.start_at) - Date.parse(b.start_at) : Date.parse(b.end_at) - Date.parse(a.end_at))
  ));

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <div className="lab-panel-pcb mb-8 flex items-center gap-4 px-7 py-6">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-ink bg-signal">
          <Trophy className="h-6 w-6 text-ink" />
        </span>
        <div>
          <p className="ref-tag text-white/60">Build a game in Python, against the clock</p>
          <h1 className="font-lab text-2xl font-extrabold text-white">Game dev contests</h1>
        </div>
      </div>

      {/* The manual, before the clock starts rather than during it. */}
      <Link
        to="/manual"
        className="lab-panel group mb-6 flex flex-wrap items-center gap-4 p-5 transition-transform hover:-translate-y-0.5"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-ink bg-white">
          <BookOpen className="h-5 w-5 text-pcb" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-lab text-lg font-extrabold text-ink">New to this? Read the game dev manual</span>
          <span className="mt-0.5 block text-sm text-ink/65">
            Every function in the stage library, the patterns games are built from, three finished games,
            and how a contest runs. No account needed, so read it any time.
          </span>
        </span>
        <span className="flex items-center gap-1 font-extrabold text-pcb">
          Open <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>

      {error && <p className="lab-panel p-6 text-center font-bold text-wire">{error}</p>}
      {!contests && !error && (
        <p className="flex items-center justify-center py-16 font-bold text-ink/50">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
        </p>
      )}
      {contests && contests.length === 0 && (
        <div className="lab-panel p-10 text-center">
          <p className="text-4xl">🏁</p>
          <p className="mt-3 font-lab text-lg font-bold text-ink/60">No contests yet: keep an eye on this page.</p>
        </div>
      )}

      <div className="space-y-4">
        {sorted.map((c) => {
          const s = STATUS[c.status];
          return (
            <Link
              key={c.id}
              to={`/contests/${c.id}`}
              className="lab-panel group flex flex-wrap items-center gap-4 p-5 transition-transform hover:-translate-y-0.5"
            >
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className={`rounded-md border-2 border-ink px-2 py-0.5 text-xs font-extrabold uppercase ${s.cls}`}>{s.label}</span>
                  {c.invite_only && (
                    <span className="flex items-center gap-1 rounded-md border-2 border-ink bg-ink px-2 py-0.5 text-xs font-extrabold uppercase text-white">
                      <Mail className="h-3 w-3" /> Invited
                    </span>
                  )}
                  {c.results_published && (
                    <span className="rounded-md border-2 border-ink bg-led px-2 py-0.5 text-xs font-extrabold uppercase text-white">Results out</span>
                  )}
                  <MyStatus value={c.my_status} />
                </div>
                <h2 className="truncate font-lab text-xl font-extrabold text-ink">{c.title}</h2>
                <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-ink/55">
                  <Clock className="h-4 w-4" /> {fmtDateTime(c.start_at)} → {fmtDateTime(c.end_at)}
                </p>
              </div>
              <span className="flex items-center gap-1 font-extrabold text-pcb">
                {c.status === 'live' ? (c.my_status === 'submitted' ? 'View' : 'Enter') : c.status === 'upcoming' ? 'Waiting room' : 'View'}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
