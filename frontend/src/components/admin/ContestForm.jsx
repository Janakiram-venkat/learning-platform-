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

export default function ContestForm({ contest, onSave, onCancel }) {
  const [form, setForm] = useState(() => {
    const base = contest || { title: '', brief: '', rules: '', starter_code: DEFAULT_STARTER, results_published: false, ...defaultWindow() };
    return { ...base, start_at: toLocalInput(base.start_at), end_at: toLocalInput(base.end_at) };
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.start_at || !form.end_at) { setError('Pick a start and an end time.'); return; }
    if (new Date(form.end_at) <= new Date(form.start_at)) { setError('The contest must end after it starts.'); return; }
    setSaving(true);
    setError('');
    try {
      await onSave({
        title: form.title.trim(),
        brief: form.brief,
        rules: form.rules,
        starter_code: form.starter_code,
        start_at: fromLocalInput(form.start_at),
        end_at: fromLocalInput(form.end_at),
        results_published: !!form.results_published,
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
        <input required maxLength={200} value={form.title} onChange={set('title')} className={input} placeholder="e.g. Space Jam — build an arcade shooter" />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={label}>Starts</span>
          <input required type="datetime-local" value={form.start_at} onChange={set('start_at')} className={input} />
        </label>
        <label className="block">
          <span className={label}>Ends</span>
          <input required type="datetime-local" value={form.end_at} onChange={set('end_at')} className={input} />
        </label>
        <p className="-mt-2 text-xs font-semibold text-ink/45 sm:col-span-2">Times are in your timezone ({TIMEZONE}). Students see them in theirs.</p>
      </div>

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
        <input type="checkbox" checked={!!form.results_published} onChange={set('results_published')} className="h-5 w-5 accent-pcb" />
        Results published <span className="font-semibold text-ink/50">— students can see scores and the leaderboard</span>
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
