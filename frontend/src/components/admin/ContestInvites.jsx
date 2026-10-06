import { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft, CheckCircle2, Loader2, Mail, PencilLine, Trash2, UserPlus, UserX,
} from 'lucide-react';
import { adminContestService } from '../../services/api';

// How far an invite has got. An invited address that nobody has signed up
// with yet is the common case at the start of a class, so it gets a plain
// label rather than a warning colour.
function stageOf(row) {
  if (row.has_entry) return { label: 'Working on it', cls: 'bg-pcb text-white', Icon: PencilLine };
  if (row.has_account) return { label: 'Signed up', cls: 'bg-led text-white', Icon: CheckCircle2 };
  return { label: 'Not signed up yet', cls: 'bg-ink/10 text-ink/60', Icon: Mail };
}

export default function ContestInvites({ contest, onBack, onCountChange }) {
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');
  const [adding, setAdding] = useState(false);
  const [result, setResult] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminContestService.invites(contest.id);
      setInvites(data);
      setError('');
    } catch (err) {
      setError(err?.response?.data?.detail || 'Could not load the invite list.');
    } finally {
      setLoading(false);
    }
  }, [contest.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial read of server state
    load();
  }, [load]);

  const add = async (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setAdding(true);
    setError('');
    try {
      const { data } = await adminContestService.addInvites(contest.id, draft);
      setInvites(data.invites);
      onCountChange?.(data.invites.length);
      setResult(data);
      // Keep anything the server could not read so it can be fixed in place;
      // clear the rest so a second paste does not re-send the whole list.
      setDraft(data.invalid.join('\n'));
    } catch (err) {
      setError(err?.response?.data?.detail || 'Could not add those invites.');
    } finally {
      setAdding(false);
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Remove ${row.email} from this contest? Any entry they have already started is kept.`)) return;
    try {
      await adminContestService.removeInvite(contest.id, row.id);
      setInvites((cur) => {
        const next = cur.filter((r) => r.id !== row.id);
        onCountChange?.(next.length);
        return next;
      });
    } catch (err) {
      setError(err?.response?.data?.detail || 'Could not remove that invite.');
    }
  };

  const input = 'w-full rounded-xl border-2 border-ink/20 bg-white px-3 py-2.5 font-semibold text-ink outline-none focus:border-pcb';
  const signedUp = invites.filter((r) => r.has_account).length;

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-1.5 font-bold text-ink/55 hover:text-pcb">
          <ArrowLeft className="h-4 w-4" /> All contests
        </button>
        <h2 className="mr-auto font-lab text-xl font-extrabold text-ink">{contest.title}: invites</h2>
        <span className="ref-tag text-ink/50">{signedUp} / {invites.length} signed up</span>
      </div>

      {!contest.invite_only && (
        <p className="lab-panel border-signal bg-signal/20 p-4 font-bold text-ink">
          This contest is open to every student, so the list below is not enforced yet. Turn on
          "Invite only" in Edit to limit it to these people.
        </p>
      )}

      <form onSubmit={add} className="lab-panel space-y-3 p-5">
        <label className="block">
          <span className="ref-tag mb-1.5 block text-ink/60">Invite by email</span>
          <textarea
            rows={4}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            spellCheck={false}
            className={`${input} font-mono text-sm`}
            placeholder={'ada@example.com, grace@example.com\nalan@example.com'}
          />
        </label>
        <p className="text-xs font-semibold text-ink/45">
          Paste as many as you like, separated by commas, spaces or new lines. People who have not
          signed up yet can still be invited: their invite starts working the moment they create an
          account with that address.
        </p>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={adding || !draft.trim()}
            className="lab-btn flex items-center gap-2 rounded-xl border-2 border-ink bg-signal px-4 py-2.5 font-extrabold text-ink disabled:opacity-60"
          >
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} Add to list
          </button>
        </div>
      </form>

      {result && (
        <div className="lab-panel space-y-1 p-4 text-sm font-bold">
          {result.added.length > 0 && <p className="text-pcb">Invited {result.added.length} new {result.added.length === 1 ? 'person' : 'people'}.</p>}
          {result.duplicates.length > 0 && <p className="text-ink/55">{result.duplicates.length} were already on the list.</p>}
          {result.invalid.length > 0 && <p className="text-wire">Could not read as an email: {result.invalid.join(', ')}</p>}
          {result.added.length === 0 && result.duplicates.length === 0 && result.invalid.length === 0 && (
            <p className="text-ink/55">Nothing to add.</p>
          )}
        </div>
      )}

      {error && <p className="lab-panel border-wire p-4 text-center font-bold text-wire">{error}</p>}

      <div className="lab-panel overflow-x-auto">
        <table className="w-full min-w-[560px] text-left">
          <thead>
            <tr className="ref-tag border-b-2 border-ink/10 text-ink/50">
              <th className="p-3">Email</th>
              <th className="p-3">Status</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {invites.map((row) => {
              const s = stageOf(row);
              return (
                <tr key={row.id} className="border-b border-ink/5 last:border-0 hover:bg-pcb/5">
                  <td className="p-3">
                    <div className="font-extrabold text-ink">{row.email}</div>
                    {row.name && <div className="text-xs font-semibold text-ink/50">{row.name}</div>}
                  </td>
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-1 rounded-md border-2 border-ink px-2 py-0.5 text-xs font-extrabold uppercase ${s.cls}`}>
                      <s.Icon className="h-3 w-3" /> {s.label}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => remove(row)}
                      className="rounded-lg p-2 text-ink/35 transition-colors hover:bg-wire/10 hover:text-wire"
                      aria-label={`Remove ${row.email}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
            {!loading && invites.length === 0 && (
              <tr>
                <td colSpan={3} className="p-8 text-center font-bold text-ink/45">
                  <UserX className="mx-auto mb-2 h-6 w-6 text-ink/25" />
                  Nobody invited yet. Paste some emails above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
