import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { saveAiIdea } from '../../../lib/progress';
import ContinueBar from '../shared/ContinueBar';

// Design: the student invents their own AI and saves it to their profile.
export default function DesignStage({ stage, onComplete }) {
  const [form, setForm] = useState({});
  const [done, setDone] = useState(false);
  const filled = stage.fields.every((f) => (form[f.key] || '').trim());

  const submit = () => {
    saveAiIdea(form);
    setDone(true);
  };

  if (done) {
    return (
      <div>
        <div className="relative overflow-hidden rounded-3xl border-2 border-ink/15 bg-pcb/8 p-6 shadow-lg animate-bounce-in">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-pcb/20 blur-2xl" />
          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-pcb">AI Concept Card</p>
          <h3 className="mb-4 font-lab text-2xl font-extrabold text-[#16241D]">🤖 {form.name}</h3>
          {stage.fields.filter((f) => f.key !== 'name').map((f) => (
            <div key={f.key} className="mb-3">
              <p className="text-xs font-bold uppercase tracking-wide text-pcb">{f.label}</p>
              <p className="font-semibold text-ink/75">{form[f.key]}</p>
            </div>
          ))}
          <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-pcb/15 px-3 py-1 text-xs font-bold text-pcb">
            <CheckCircle2 className="h-4 w-4" /> Saved to your profile
          </p>
        </div>
        <ContinueBar xp={stage.xp} onClick={() => onComplete(true)} />
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-4">
        {stage.fields.map((f) => (
          <div key={f.key}>
            <label className="mb-1 block text-sm font-bold text-ink/75">{f.label}</label>
            <input
              value={form[f.key] || ''}
              onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
              className="w-full rounded-xl border border-ink/20 bg-white p-3 text-ink shadow-inner focus:border-pcb focus:outline-none focus:ring-2 focus:ring-pcb/30"
            />
          </div>
        ))}
      </div>
      {stage.example && (
        <button
          onClick={() => setForm(stage.example)}
          className="mt-3 text-sm font-bold text-pcb hover:underline"
        >
          Need ideas? Load an example ➔
        </button>
      )}
      <button
        onClick={submit}
        disabled={!filled}
        className="mt-6 w-full rounded-2xl border-2 border-ink bg-pcb px-6 py-3.5 font-extrabold text-white shadow-md transition-transform enabled:hover:scale-[1.02] active:scale-95 disabled:opacity-40"
      >
        Create My Concept Card ✨
      </button>
    </div>
  );
}
