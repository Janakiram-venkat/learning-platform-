import { useState } from 'react';
import { Loader2, Save, X } from 'lucide-react';

// What a new contest's editor opens with unless the organizer changes it.
const DEFAULT_STARTER = `from stage import Game, Sprite, Text

game = Game(width=480, height=360, background="#101828")

# Your game starts here!


@game.every_frame
def update():
    pass


game.start()
`;

// <input type="datetime-local"> speaks the browser's local time with no
// offset; the API only accepts explicit offsets. Convert at the edges.
function toLocalInput(iso) {
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

const fromLocalInput = (value) => new Date(value).toISOString();

function defaultWindow() {
  const start = new Date();
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + 1);
  const end = new Date(start.getTime() + 90 * 60000);
  return { start_at: start.toISOString(), end_at: end.toISOString() };
}

const TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

// Offered when an organizer picks "Start immediately" — the whole point is
// not to open a date picker, so these are the lengths a contest actually runs.
const DURATIONS = [15, 30, 45, 60, 90, 120, 180];

const fmtDuration = (mins) => (mins < 60
  ? `${mins} min`
  : `${mins / 60} hour${mins === 60 ? '' : 's'}`.replace('.5 hours', '½ hours'));

// How long the window currently is, for the hint under the date pickers.
function windowLength(startLocal, endLocal) {
  const mins = Math.round((new Date(endLocal) - new Date(startLocal)) / 60000);
  return Number.isFinite(mins) && mins > 0 ? fmtDuration(mins) : null;
}

export default function ContestForm({ contest, onSave, onCancel }) {
  const [form, setForm] = useState(() => {
    const base = contest || { title: '', brief: '', rules: '', starter_code: DEFAULT_STARTER, results_published: false, invite_only: false, ...defaultWindow() };
    return { ...base, start_at: toLocalInput(base.start_at), end_at: toLocalInput(base.end_at) };
  });
  // 'schedule' picks a window by hand; 'now' opens the contest the moment it
  // saves and runs it for `minutes`. Editing an existing contest defaults to
  // the schedule it already has — a stray click should not restart a contest
  // that is halfway through.
  const [mode, setMode] = useState('schedule');
  const [minutes, setMinutes] = useState(60);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const immediate = mode === 'now';
    if (!immediate) {
      if (!form.start_at || !form.end_at) { setError('Pick a start and an end time.'); return; }
      if (new Date(form.end_at) <= new Date(form.start_at)) { setError('The contest must end after it starts.'); return; }
    }
    // A few seconds back, so the contest reads as live the instant it saves
    // rather than being "upcoming" for one tick of the clock.
    const from = new Date(Date.now() - 5000);
    setSaving(true);
    setError('');
    try {
      await onSave({
        title: form.title.trim(),
        brief: form.brief,
        rules: form.rules,
        starter_code: form.starter_code,
        start_at: immediate ? from.toISOString() : fromLocalInput(form.start_at),
        end_at: immediate
          ? new Date(from.getTime() + minutes * 60000).toISOString()
          : fromLocalInput(form.end_at),
        results_published: !!form.results_published,
        invite_only: !!form.invite_only,
      });
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Could not save the contest. Check the fields and try again.');
      setSaving(false);
    }
  };

  const label = 'ref-tag mb-1.5 block text-ink/60';
  const input = 'w-full rounded-xl border-2 border-ink/20 bg-white px-3 py-2.5 font-semibold text-ink outline-none focus:border-pcb';

  return (
    <form onSubmit={submit} className="lab-panel space-y-5 p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-lab text-xl font-extrabold text-ink">{contest ? 'Edit contest' : 'New contest'}</h2>
        <button type="button" onClick={onCancel} className="rounded-lg p-2 text-ink/40 hover:bg-ink/5 hover:text-ink" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
      </div>

      <label className="block">
        <span className={label}>Title</span>
        <input required maxLength={200} value={form.title} onChange={set('title')} className={input} placeholder="e.g. Space Jam: build an arcade shooter" />
      </label>

      <fieldset className="rounded-xl border-2 border-ink/10 p-4">
        <legend className={`${label} px-1`}>When it runs</legend>
        <div className="mb-3 flex flex-wrap gap-2">
          {[['schedule', 'Schedule it'], ['now', 'Start immediately']].map(([value, text]) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              aria-pressed={mode === value}
              className={`lab-btn rounded-xl border-2 border-ink px-3 py-2 font-extrabold ${mode === value ? 'bg-signal text-ink' : 'bg-white text-ink/60'}`}
            >
              {text}
            </button>
          ))}
        </div>

        {mode === 'now' ? (
          <>
            <label className="block">
              <span className={label}>Runs for</span>
              <select value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} className={input}>
                {DURATIONS.map((m) => <option key={m} value={m}>{fmtDuration(m)}</option>)}
              </select>
            </label>
            <p className="mt-2 text-xs font-semibold text-ink/45">
              {contest ? 'Saving restarts the clock: ' : 'Saving opens it right away: '}
              students can open the brief as soon as you press save, and the editor locks {fmtDuration(minutes)} later.
              You can still add or take off minutes from the contest list.
            </p>
          </>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={label}>Starts</span>
              <input required type="datetime-local" value={form.start_at} onChange={set('start_at')} className={input} />
            </label>
            <label className="block">
              <span className={label}>Ends</span>
              <input required type="datetime-local" value={form.end_at} onChange={set('end_at')} className={input} />
            </label>
            <p className="-mt-2 text-xs font-semibold text-ink/45 sm:col-span-2">
              Times are in your timezone ({TIMEZONE}). Students see them in theirs.
              {windowLength(form.start_at, form.end_at) && ` Window: ${windowLength(form.start_at, form.end_at)}.`}
            </p>
          </div>
        )}
      </fieldset>

      <label className="block">
        <span className={label}>Brief / theme</span>
        <textarea
          rows={6}
          value={form.brief}
          onChange={set('brief')}
          className={input}
          placeholder="What should students build? Hidden from them until the contest starts."
        />
      </label>

      <label className="block">
        <span className={label}>Rules &amp; judging criteria</span>
        <textarea rows={4} value={form.rules} onChange={set('rules')} className={input} placeholder="Optional. e.g. Scored out of 100: fun 40, creativity 30, code 30." />
      </label>

      <label className="block">
        <span className={label}>Starter code</span>
        <textarea
          rows={10}
          value={form.starter_code}
          onChange={set('starter_code')}
          spellCheck={false}
          className={`${input} font-mono text-sm`}
        />
      </label>

      <label className="flex items-center gap-3 font-bold text-ink">
        <input type="checkbox" checked={!!form.invite_only} onChange={set('invite_only')} className="h-5 w-5 accent-pcb" />
        Invite only <span className="font-semibold text-ink/50">(only the emails on the invite list can see or enter it)</span>
      </label>
      {form.invite_only && !contest && (
        <p className="-mt-3 text-xs font-semibold text-ink/45">
          Save the contest first, then add emails from the Invites button on its row.
        </p>
      )}

      <label className="flex items-center gap-3 font-bold text-ink">
        <input type="checkbox" checked={!!form.results_published} onChange={set('results_published')} className="h-5 w-5 accent-pcb" />
        Results published <span className="font-semibold text-ink/50">(students can see scores and the leaderboard)</span>
      </label>

      {error && <p className="font-bold text-wire">{error}</p>}

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="lab-btn rounded-xl border-2 border-ink bg-white px-4 py-2.5 font-extrabold text-ink">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="lab-btn flex items-center gap-2 rounded-xl border-2 border-ink bg-signal px-4 py-2.5 font-extrabold text-ink disabled:opacity-60">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save contest
        </button>
      </div>
    </form>
  );
}
