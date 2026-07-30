import { useState } from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { awardXPOnce, saveAiIdea } from '../../lib/progress';
import WidgetShell from './shared/WidgetShell';

/**
 * The module's mini project: invent a robot for a real problem.
 *
 * Not auto-graded — it's the emotional hook, and the point is that the student
 * owns a robot idea before they've learned any electronics. The three loop
 * fields are the whole assessment: if you can fill in sense, think and act for
 * your own idea, you've understood Module 1.
 */
export default function DesignCard({ block }) {
  const {
    title = '🛠️ Design your own robot',
    prompt,
    fields = [],
    example,
    cardLabel = 'Robot Concept Card',
    cardEmoji = '🦾',
    xp = 25,
    xpKey,
  } = block || {};

  const [form, setForm] = useState({});
  const [done, setDone] = useState(false);
  const [earned, setEarned] = useState(0);

  if (!fields.length) return null;
  const filled = fields.every((f) => (form[f.key] || '').trim());

  const submit = () => {
    saveAiIdea(form);
    setDone(true);
    if (xpKey) setEarned(awardXPOnce(xpKey, xp));
  };

  if (done) {
    return (
      <WidgetShell title={title} hint="Saved to your profile. You can change your mind at any time, and real engineers redesign constantly.">
        <div className="p-4">
          <div className="relative animate-bounce-in overflow-hidden rounded-2xl border-2 border-ink/12 bg-pcb/8 p-5">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-pcb/20 blur-2xl" />
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-pcb">{cardLabel}</p>
            <h3 className="mb-4 font-lab text-2xl font-extrabold text-ink">{cardEmoji} {form.name}</h3>
            {fields.filter((f) => f.key !== 'name').map((f) => (
              <div key={f.key} className="mb-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-pcb">{f.label}</p>
                <p className="font-semibold text-ink/75">{form[f.key]}</p>
              </div>
            ))}
            <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-pcb/15 px-3 py-1 text-xs font-bold text-pcb">
              <CheckCircle2 className="h-4 w-4" /> Saved{earned ? ` · +${earned} XP` : ''}
            </p>
          </div>
          <button
            onClick={() => setDone(false)}
            className="mt-3 text-sm font-bold text-pcb hover:underline"
          >
            ← Edit my robot
          </button>
        </div>
      </WidgetShell>
    );
  }

  return (
    <WidgetShell title={title} hint={prompt}>
      <div className="space-y-4 p-4">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="mb-1 block text-sm font-bold text-ink/75">{f.label}</label>
            <input
              value={form[f.key] || ''}
              onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
              className="w-full rounded-xl border-2 border-ink/15 bg-white p-3 font-semibold text-ink shadow-inner focus:border-pcb focus:outline-none focus:ring-2 focus:ring-pcb/25"
            />
          </div>
        ))}

        {example && (
          <button
            onClick={() => setForm(example)}
            className="text-sm font-bold text-pcb hover:underline"
          >
            Need ideas? Load an example ➔
          </button>
        )}

        <button
          onClick={submit}
          disabled={!filled}
          className="lab-btn flex w-full items-center justify-center gap-2 rounded-xl border-2 border-ink bg-signal px-6 py-3 font-extrabold text-ink disabled:cursor-not-allowed disabled:border-ink/20 disabled:bg-ink/10 disabled:text-ink/40"
        >
          <Sparkles className="h-5 w-5" /> Create my concept card
        </button>
      </div>
    </WidgetShell>
  );
}
