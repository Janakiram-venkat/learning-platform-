import { useCallback, useEffect, useState } from 'react';
import {
  Plus, Pencil, Trash2, Users, ArrowLeft, Eye, Lock, PencilLine, RefreshCw, Mail, Copy,
} from 'lucide-react';
import ContestForm from './ContestForm';
import ContestControls from './ContestControls';
import ContestInvites from './ContestInvites';
import EntryJudge from './EntryJudge';
import { adminContestService } from '../../services/api';
import { fmtDateTime, phaseOf } from '../../lib/contestTime';

const BADGES = {
  upcoming: { label: 'Upcoming', cls: 'bg-signal text-ink' },
  live: { label: 'Live', cls: 'bg-wire text-white' },
  ended: { label: 'Ended', cls: 'bg-ink/10 text-ink/70' },
};

export default function ContestsTab() {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | contest
  const [viewing, setViewing] = useState(null); // contest whose entries are open
  const [inviting, setInviting] = useState(null); // contest whose invite list is open
  const [entries, setEntries] = useState([]);
  const [judgingId, setJudgingId] = useState(null);
  // Drives the live countdowns and flips a row from Upcoming to Live on its
  // own, so an organizer watching the page never has to refresh to see that
  // the contest they scheduled has opened.
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Every control answers with the contest's fresh admin row; patch it in
  // wherever that contest is currently on screen.
  const merge = useCallback((row) => {
    setContests((cur) => cur.map((c) => (c.id === row.id ? row : c)));
    setViewing((cur) => (cur && cur.id === row.id ? row : cur));
    setError('');
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminContestService.list();
      setContests(data);
      setError('');
    } catch (err) {
      setError(err?.response?.data?.detail || 'Could not load contests.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial read of server state
    load();
  }, [load]);

  const loadEntries = useCallback(async (contest) => {
    setViewing(contest);
    setJudgingId(null);
    setEntries([]);
    try {
      const { data } = await adminContestService.entries(contest.id);
      setEntries(data);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Could not load entries.');
    }
  }, []);

  const save = async (payload) => {
    const { data } = editing === 'new'
      ? await adminContestService.create(payload)
      : await adminContestService.update(editing.id, payload);
    setContests((cur) => (editing === 'new' ? [data, ...cur] : cur.map((c) => (c.id === data.id ? data : c))));
    setEditing(null);
  };

  const duplicate = async (c) => {
    try {
      const { data } = await adminContestService.duplicate(c.id);
      setContests((cur) => [data, ...cur]);
      setEditing(data);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Could not copy the contest.');
    }
  };

  const remove = async (c) => {
    if (!window.confirm(`Delete "${c.title}" and all ${c.entry_count} of its entries? This can't be undone.`)) return;
    try {
      await adminContestService.remove(c.id);
      setContests((cur) => cur.filter((x) => x.id !== c.id));
    } catch (err) {
      setError(err?.response?.data?.detail || 'Could not delete the contest.');
    }
  };

  const onScored = (row) => {
    setEntries((cur) => cur.map((e) => (e.id === row.id ? { ...e, score: row.score, judge_comment: row.judge_comment } : e)));
  };

  // ---------------- One contest's invite list ----------------
  if (inviting) {
    return (
      <ContestInvites
        contest={inviting}
        onBack={() => setInviting(null)}
        onCountChange={(n) => setContests((cur) => cur.map((c) => (c.id === inviting.id ? { ...c, invite_count: n } : c)))}
      />
    );
  }

  if (editing) {
    return <ContestForm contest={editing === 'new' ? null : editing} onSave={save} onCancel={() => setEditing(null)} />;
  }

  // ---------------- One contest's entries ----------------
  if (viewing) {
    const scored = entries.filter((e) => e.score != null).length;
    return (
      <section className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => setViewing(null)} className="flex items-center gap-1.5 font-bold text-ink/55 hover:text-pcb">
            <ArrowLeft className="h-4 w-4" /> All contests
          </button>
          <h2 className="mr-auto font-lab text-xl font-extrabold text-ink">{viewing.title}</h2>
          <span className="ref-tag text-ink/50">{scored} / {entries.length} scored</span>
          <button onClick={() => loadEntries(viewing)} className="lab-btn flex items-center gap-2 rounded-xl border-2 border-ink bg-white px-3 py-2 font-extrabold text-ink">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <ContestControls contest={viewing} now={now} onChange={merge} onError={setError} compact />
        </div>

        {error && <p className="lab-panel border-wire p-4 text-center font-bold text-wire">{error}</p>}

        <div className="lab-panel overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="ref-tag border-b-2 border-ink/10 text-ink/50">
                <th className="p-3">Student</th>
                <th className="p-3">Status</th>
                <th className="p-3">Last saved</th>
                <th className="p-3">Score</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr
                  key={e.id}
                  onClick={() => setJudgingId(e.id)}
                  className={`cursor-pointer border-b border-ink/5 last:border-0 ${judgingId === e.id ? 'bg-signal/25' : 'hover:bg-pcb/5'}`}
                >
                  <td className="p-3">
                    <div className="font-extrabold text-ink">{e.name}</div>
                    <div className="text-xs font-semibold text-ink/50">{e.email}</div>
                  </td>
                  <td className="p-3 text-sm font-bold">
                    {e.submitted_at
                      ? <span className="flex items-center gap-1 text-pcb"><Lock className="h-4 w-4" /> Submitted</span>
                      : <span className="flex items-center gap-1 text-ink/55"><PencilLine className="h-4 w-4" /> Draft</span>}
                  </td>
                  <td className="p-3 text-sm font-semibold text-ink/60">{fmtDateTime(e.submitted_at || e.updated_at)}</td>
                  <td className="p-3 font-lab font-extrabold text-ink">{e.score ?? <span className="text-ink/30">—</span>}</td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr><td colSpan={4} className="p-8 text-center font-bold text-ink/45">No entries yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {judgingId && (
          <EntryJudge
            contestId={viewing.id}
            entries={entries}
            entryId={judgingId}
            onSelect={setJudgingId}
            onScored={onScored}
          />
        )}
      </section>
    );
  }

  // ---------------- Contest list ----------------
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink/55">
          Students build a Python game in the browser during the contest window. The brief stays hidden until it starts.
        </p>
        <button onClick={() => setEditing('new')} className="lab-btn flex items-center gap-2 rounded-xl border-2 border-ink bg-signal px-4 py-2.5 font-extrabold text-ink">
          <Plus className="h-4 w-4" /> New contest
        </button>
      </div>

      {error && <p className="lab-panel border-wire p-4 text-center font-bold text-wire">{error}</p>}

      {contests.map((c) => {
        const s = BADGES[phaseOf(c, now)];
        return (
          <article key={c.id} className="lab-panel space-y-4 p-5">
            <div className="flex flex-wrap items-center gap-4">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className={`rounded-md border-2 border-ink px-2 py-0.5 text-xs font-extrabold uppercase ${s.cls}`}>{s.label}</span>
                  {c.invite_only && (
                    <span className="flex items-center gap-1 rounded-md border-2 border-ink bg-ink px-2 py-0.5 text-xs font-extrabold uppercase text-white">
                      <Mail className="h-3 w-3" /> Invite only
                    </span>
                  )}
                  {c.results_published && (
                    <span className="flex items-center gap-1 rounded-md border-2 border-ink bg-led px-2 py-0.5 text-xs font-extrabold uppercase text-white">
                      <Eye className="h-3 w-3" /> Results public
                    </span>
                  )}
                </div>
                <h3 className="truncate font-lab text-lg font-extrabold text-ink">{c.title}</h3>
                <p className="text-sm font-semibold text-ink/55">
                  {fmtDateTime(c.start_at)} → {fmtDateTime(c.end_at)} · {c.entry_count} entries, {c.submitted_count} submitted
                  {c.invite_only && ` · ${c.invite_count} invited`}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => loadEntries(c)} className="lab-btn flex items-center gap-2 rounded-xl border-2 border-ink bg-signal px-3 py-2 font-extrabold text-ink">
                  <Users className="h-4 w-4" /> Entries{c.entry_count ? ` (${c.entry_count})` : ''}
                </button>
                <button onClick={() => setInviting(c)} className="lab-btn flex items-center gap-2 rounded-xl border-2 border-ink bg-white px-3 py-2 font-extrabold text-ink">
                  <Mail className="h-4 w-4" /> Invites{c.invite_count ? ` (${c.invite_count})` : ''}
                </button>
                <button onClick={() => setEditing(c)} className="lab-btn flex items-center gap-2 rounded-xl border-2 border-ink bg-white px-3 py-2 font-extrabold text-ink">
                  <Pencil className="h-4 w-4" /> Edit
                </button>
                <button onClick={() => duplicate(c)} className="rounded-lg p-2 text-ink/35 transition-colors hover:bg-pcb/10 hover:text-pcb" aria-label={`Duplicate ${c.title}`} title="Copy this contest, invite list and all">
                  <Copy className="h-4 w-4" />
                </button>
                <button onClick={() => remove(c)} className="rounded-lg p-2 text-ink/35 transition-colors hover:bg-wire/10 hover:text-wire" aria-label={`Delete ${c.title}`}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="border-t-2 border-dashed border-ink/10 pt-3">
              <ContestControls contest={c} now={now} onChange={merge} onError={setError} />
            </div>
          </article>
        );
      })}
      {!loading && contests.length === 0 && (
        <div className="lab-panel p-10 text-center">
          <p className="text-4xl">🏁</p>
          <p className="mt-3 font-lab text-lg font-bold text-ink/60">No contests yet. Create the first one.</p>
        </div>
      )}
    </section>
  );
}
