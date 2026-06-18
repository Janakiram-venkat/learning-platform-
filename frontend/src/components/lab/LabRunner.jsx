import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  awardXPOnce,
  markLabComplete,
  saveAiIdea,
  getNextLessonAfterModule,
} from '../../utils/progress';
import {
  Sparkles, ArrowRight, CheckCircle2, XCircle, RotateCcw, Trophy,
  Lightbulb, Award, ChevronRight,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// LabRunner — the embeddable engine for a data-driven, multi-stage lab.
// Content lives in courses/<course>/labs/module<N>.json; each stage's `type`
// maps to one of the small stage components below. Rendered both as a full
// page (LabPage) and inside the AI course lesson's right panel. No code editor.
// ---------------------------------------------------------------------------

const CONFETTI_COLORS = ['#34d399', '#60a5fa', '#fbbf24', '#f472b6', '#a78bfa', '#f87171'];

function ConfettiBurst() {
  const pieces = Array.from({ length: 48 }, (_, i) => i);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((i) => (
        <span
          key={i}
          className="absolute top-0 block h-3 w-2 rounded-sm animate-[confettiFall_linear_forwards]"
          style={{
            left: `${(i / pieces.length) * 100}%`,
            backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            animationDuration: `${2 + (i % 5) * 0.4}s`,
            animationDelay: `${(i % 7) * 0.12}s`,
          }}
        />
      ))}
    </div>
  );
}

// Shared "Continue" footer button shown once a stage is solved.
function ContinueBar({ onClick, xp, last }) {
  return (
    <div className="mt-8 flex items-center justify-between gap-3 border-t border-gray-100 pt-5 animate-slide-up">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-extrabold text-amber-700 ring-1 ring-amber-200">
        <Sparkles className="h-4 w-4" /> +{xp} XP
      </span>
      <button
        onClick={onClick}
        className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-600 px-6 py-3 font-extrabold text-white shadow-md transition-transform hover:scale-[1.02] active:scale-95"
      >
        {last ? 'Finish Lab' : 'Continue'} <ArrowRight className="h-5 w-5" />
      </button>
    </div>
  );
}

// --- Stage 1: Welcome ------------------------------------------------------
function WelcomeStage({ stage, onComplete }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (shown >= stage.steps.length) return;
    const t = setTimeout(() => setShown((s) => s + 1), 900);
    return () => clearTimeout(t);
  }, [shown, stage.steps.length]);
  const ready = shown >= stage.steps.length;

  return (
    <div>
      <ul className="space-y-3">
        {stage.steps.slice(0, shown).map((s, i) => (
          <li
            key={i}
            className="flex items-center gap-4 rounded-2xl border border-purple-100 bg-white p-4 shadow-sm animate-bounce-in"
          >
            <span className="text-3xl">{s.emoji}</span>
            <span className="text-lg font-semibold text-gray-700">{s.text}</span>
          </li>
        ))}
      </ul>
      {ready && (
        <div className="mt-6 animate-slide-up">
          <p className="rounded-2xl bg-indigo-50 p-5 text-center text-lg font-bold text-indigo-900 ring-1 ring-indigo-100">
            “{stage.narration}”
          </p>
          <button
            onClick={() => onComplete(true)}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-600 px-6 py-4 text-lg font-extrabold text-white shadow-md transition-transform hover:scale-[1.02] active:scale-95"
          >
            {stage.cta || 'Start Exploring'} <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}

// --- Stage 2: Pick (multi-select) -----------------------------------------
function PickStage({ stage, onComplete }) {
  const [selected, setSelected] = useState({});
  const [checked, setChecked] = useState(false);

  const toggle = (id) => {
    if (checked) return;
    setSelected((p) => ({ ...p, [id]: !p[id] }));
  };

  const allCorrect = stage.items.every((it) => !!selected[it.id] === it.isAI);

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {stage.items.map((it) => {
          const isSel = !!selected[it.id];
          let ring = isSel ? 'border-purple-400 bg-purple-50 ring-2 ring-purple-200' : 'border-gray-200 bg-white hover:border-purple-200';
          if (checked) {
            const right = isSel === it.isAI;
            ring = right
              ? 'border-green-300 bg-green-50'
              : 'border-rose-300 bg-rose-50';
          }
          return (
            <button
              key={it.id}
              onClick={() => toggle(it.id)}
              className={`relative flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition-all active:scale-95 ${ring}`}
            >
              <span className="text-4xl">{it.emoji}</span>
              <span className="text-sm font-bold text-gray-700">{it.label}</span>
              {checked && (
                <span className="absolute right-1.5 top-1.5">
                  {isSel === it.isAI
                    ? <CheckCircle2 className="h-5 w-5 text-green-500" />
                    : <XCircle className="h-5 w-5 text-rose-400" />}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {checked && (
        <ul className="mt-5 space-y-2 animate-slide-up">
          {stage.items.filter((it) => it.isAI !== !!selected[it.id]).length === 0 ? (
            <li className="rounded-xl bg-green-50 p-3 text-sm font-bold text-green-700 ring-1 ring-green-100">
              Perfect! You spotted every AI-powered device. 🎉
            </li>
          ) : (
            stage.items.map((it) => {
              const right = !!selected[it.id] === it.isAI;
              if (right) return null;
              return (
                <li key={it.id} className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-100">
                  <b>{it.emoji} {it.label}:</b> {it.isAI ? stage.feedback.correct : stage.feedback.incorrect}
                </li>
              );
            })
          )}
        </ul>
      )}

      {!checked ? (
        <button
          onClick={() => setChecked(true)}
          className="mt-6 w-full rounded-2xl bg-gray-900 px-6 py-3.5 font-extrabold text-white shadow-md transition-transform hover:bg-black active:scale-95"
        >
          Check My Picks
        </button>
      ) : allCorrect ? (
        <ContinueBar xp={stage.xp} onClick={() => onComplete(true)} />
      ) : (
        <button
          onClick={() => { setChecked(false); setSelected({}); }}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-6 py-3 font-bold text-white transition-colors hover:bg-orange-600"
        >
          <RotateCcw className="h-5 w-5" /> Try Again
        </button>
      )}
    </div>
  );
}

// --- Stages 3 & 5: Sort into buckets (tap card, tap column) ----------------
function SortStage({ stage, onComplete }) {
  const [placements, setPlacements] = useState({}); // cardId -> columnId
  const [picked, setPicked] = useState(null);       // cardId currently selected
  const [checked, setChecked] = useState(false);

  const unplaced = stage.cards.filter((c) => !placements[c.id]);

  const place = (columnId) => {
    if (!picked || checked) return;
    setPlacements((p) => ({ ...p, [picked]: columnId }));
    setPicked(null);
  };
  const unplace = (cardId) => {
    if (checked) return;
    setPlacements((p) => { const n = { ...p }; delete n[cardId]; return n; });
  };

  const correctCount = stage.cards.filter((c) => placements[c.id] === c.column).length;
  const accuracy = correctCount / stage.cards.length;
  const passed = accuracy >= (stage.pass ?? 1);

  return (
    <div>
      {/* Card tray */}
      <div className="mb-4 min-h-[64px] rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-3">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Tap a card, then tap a bucket</p>
        <div className="flex flex-wrap gap-2">
          {unplaced.length === 0 && <span className="text-sm text-gray-400">All cards placed!</span>}
          {unplaced.map((c) => (
            <button
              key={c.id}
              onClick={() => setPicked(picked === c.id ? null : c.id)}
              className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-sm font-bold transition-all active:scale-95 ${
                picked === c.id ? 'border-purple-500 bg-purple-100 text-purple-800 ring-2 ring-purple-200' : 'border-gray-200 bg-white text-gray-700 hover:border-purple-300'
              }`}
            >
              <span className="text-lg">{c.emoji}</span> {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Buckets */}
      <div className="grid grid-cols-2 gap-3">
        {stage.columns.map((col) => (
          <button
            key={col.id}
            onClick={() => place(col.id)}
            disabled={checked || !picked}
            className={`flex min-h-[140px] flex-col rounded-2xl border-2 p-3 text-left transition-colors ${
              picked && !checked ? 'border-purple-400 bg-purple-50/60' : 'border-gray-200 bg-white'
            }`}
          >
            <span className="mb-2 flex items-center gap-1.5 font-extrabold text-gray-800">
              <span className="text-xl">{col.emoji}</span> {col.label}
            </span>
            <div className="flex flex-1 flex-col gap-1.5">
              {stage.cards.filter((c) => placements[c.id] === col.id).map((c) => {
                const right = c.column === col.id;
                let cls = 'border-gray-200 bg-gray-50 text-gray-700';
                if (checked) cls = right ? 'border-green-300 bg-green-50 text-green-800' : 'border-rose-300 bg-rose-50 text-rose-700';
                return (
                  <span
                    key={c.id}
                    onClick={(e) => { e.stopPropagation(); unplace(c.id); }}
                    className={`flex items-center justify-between gap-1 rounded-lg border px-2 py-1.5 text-xs font-bold ${cls}`}
                  >
                    <span>{c.emoji} {c.label}</span>
                    {checked && (right ? <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" /> : <XCircle className="h-4 w-4 shrink-0 text-rose-400" />)}
                  </span>
                );
              })}
            </div>
          </button>
        ))}
      </div>

      {stage.note && checked && passed && (
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-indigo-50 p-3 text-sm font-medium text-indigo-900 ring-1 ring-indigo-100 animate-slide-up">
          <Lightbulb className="mt-0.5 h-5 w-5 shrink-0" /> {stage.note}
        </p>
      )}

      {!checked ? (
        <button
          onClick={() => setChecked(true)}
          disabled={unplaced.length > 0}
          className="mt-6 w-full rounded-2xl bg-gray-900 px-6 py-3.5 font-extrabold text-white shadow-md transition-transform enabled:hover:bg-black active:scale-95 disabled:opacity-40"
        >
          {unplaced.length > 0 ? `Place all cards (${unplaced.length} left)` : 'Check My Sorting'}
        </button>
      ) : passed ? (
        <ContinueBar xp={stage.xp} onClick={() => onComplete(true)} />
      ) : (
        <div className="mt-6 animate-slide-up">
          <p className="mb-3 rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-800 ring-1 ring-amber-100">
            You got {correctCount}/{stage.cards.length}. Fix the red ones and try again! 💪
          </p>
          <button
            onClick={() => setChecked(false)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-6 py-3 font-bold text-white transition-colors hover:bg-orange-600"
          >
            <RotateCcw className="h-5 w-5" /> Try Again
          </button>
        </div>
      )}
    </div>
  );
}

// --- Stage 4: Choose (Human / AI / Both per task) --------------------------
function ChooseStage({ stage, onComplete }) {
  const [answers, setAnswers] = useState({}); // taskId -> optionId
  const [checked, setChecked] = useState(false);
  const allAnswered = stage.tasks.every((t) => answers[t.id]);
  const correctCount = stage.tasks.filter((t) => answers[t.id] === t.answer).length;

  return (
    <div>
      <ul className="space-y-4">
        {stage.tasks.map((t) => {
          const chosen = answers[t.id];
          const right = chosen === t.answer;
          return (
            <li key={t.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-3">
                <span className="text-2xl">{t.emoji}</span>
                <span className="font-bold text-gray-800">{t.label}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {stage.options.map((o) => {
                  const sel = chosen === o.id;
                  let cls = sel ? 'border-purple-500 bg-purple-100 text-purple-800' : 'border-gray-200 bg-white text-gray-600 hover:border-purple-300';
                  if (checked) {
                    if (o.id === t.answer) cls = 'border-green-400 bg-green-50 text-green-800';
                    else if (sel) cls = 'border-rose-400 bg-rose-50 text-rose-700';
                    else cls = 'border-gray-200 bg-white text-gray-400';
                  }
                  return (
                    <button
                      key={o.id}
                      disabled={checked}
                      onClick={() => setAnswers((p) => ({ ...p, [t.id]: o.id }))}
                      className={`flex items-center gap-1.5 rounded-xl border-2 px-4 py-2 text-sm font-bold transition-all active:scale-95 ${cls}`}
                    >
                      <span>{o.emoji}</span> {o.label}
                    </button>
                  );
                })}
              </div>
              {checked && (
                <p className={`mt-3 flex items-start gap-2 rounded-xl p-3 text-sm font-medium animate-slide-up ${right ? 'bg-green-50 text-green-900 ring-1 ring-green-100' : 'bg-amber-50 text-amber-900 ring-1 ring-amber-100'}`}>
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" />
                  <span><b>{right ? 'Nice! ' : 'Good thinking. '}</b>{t.explain}</span>
                </p>
              )}
            </li>
          );
        })}
      </ul>

      {!checked ? (
        <button
          onClick={() => setChecked(true)}
          disabled={!allAnswered}
          className="mt-6 w-full rounded-2xl bg-gray-900 px-6 py-3.5 font-extrabold text-white shadow-md transition-transform enabled:hover:bg-black active:scale-95 disabled:opacity-40"
        >
          {allAnswered ? 'Reveal Answers' : 'Answer every task to continue'}
        </button>
      ) : (
        <>
          <p className="mt-6 rounded-xl bg-purple-50 p-3 text-center text-sm font-bold text-purple-800 ring-1 ring-purple-100">
            You matched {correctCount}/{stage.tasks.length}. Every answer teaches you something! 🧠
          </p>
          <ContinueBar xp={stage.xp} onClick={() => onComplete(true)} />
        </>
      )}
    </div>
  );
}

// --- Stage 6: Explore (visit every location) -------------------------------
function ExploreStage({ stage, onComplete }) {
  const [open, setOpen] = useState(null);
  const [visited, setVisited] = useState({});
  const allVisited = stage.locations.every((l) => visited[l.id]);
  const current = stage.locations.find((l) => l.id === open);

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {stage.locations.map((l) => (
          <button
            key={l.id}
            onClick={() => { setOpen(l.id); setVisited((p) => ({ ...p, [l.id]: true })); }}
            className={`relative flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all active:scale-95 ${
              open === l.id ? 'border-purple-400 bg-purple-50' : visited[l.id] ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white hover:border-purple-200'
            }`}
          >
            <span className="text-4xl">{l.emoji}</span>
            <span className="text-sm font-bold text-gray-700">{l.label}</span>
            {visited[l.id] && <CheckCircle2 className="absolute right-1.5 top-1.5 h-4 w-4 text-green-500" />}
          </button>
        ))}
      </div>

      {current && (
        <div className="mt-5 flex items-start gap-3 rounded-2xl bg-indigo-50 p-5 text-indigo-900 ring-1 ring-indigo-100 animate-slide-up">
          <span className="text-3xl">{current.emoji}</span>
          <div>
            <p className="font-extrabold">{current.label}</p>
            <p className="text-sm font-medium">{current.info}</p>
          </div>
        </div>
      )}

      {allVisited ? (
        <ContinueBar xp={stage.xp} onClick={() => onComplete(true)} />
      ) : (
        <p className="mt-6 text-center text-sm font-semibold text-gray-500">
          Visited {Object.keys(visited).length}/{stage.locations.length} places — tap them all to continue.
        </p>
      )}
    </div>
  );
}

// --- Stage 7: Design Your Own AI -------------------------------------------
function DesignStage({ stage, onComplete }) {
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
        <div className="relative overflow-hidden rounded-3xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white p-6 shadow-lg animate-bounce-in">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-purple-200/50 blur-2xl" />
          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-purple-500">AI Concept Card</p>
          <h3 className="mb-4 font-display text-2xl font-extrabold text-[#2D2A4A]">🤖 {form.name}</h3>
          {stage.fields.filter((f) => f.key !== 'name').map((f) => (
            <div key={f.key} className="mb-3">
              <p className="text-xs font-bold uppercase tracking-wide text-purple-400">{f.label}</p>
              <p className="font-semibold text-gray-700">{form[f.key]}</p>
            </div>
          ))}
          <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
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
            <label className="mb-1 block text-sm font-bold text-gray-700">{f.label}</label>
            <input
              value={form[f.key] || ''}
              onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
              className="w-full rounded-xl border border-gray-300 bg-white p-3 text-gray-800 shadow-inner focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
            />
          </div>
        ))}
      </div>
      {stage.example && (
        <button
          onClick={() => setForm(stage.example)}
          className="mt-3 text-sm font-bold text-purple-600 hover:underline"
        >
          Need ideas? Load an example ➔
        </button>
      )}
      <button
        onClick={submit}
        disabled={!filled}
        className="mt-6 w-full rounded-2xl bg-gradient-to-r from-purple-600 to-violet-600 px-6 py-3.5 font-extrabold text-white shadow-md transition-transform enabled:hover:scale-[1.02] active:scale-95 disabled:opacity-40"
      >
        Create My Concept Card ✨
      </button>
    </div>
  );
}

// --- ML Stage: Train Your First Model (feed-data mini-game) -----------------
// Tap to feed labeled examples into the "brain"; accuracy climbs along a
// learning curve (fast at first, then plateaus). Once trained, the model
// predicts a brand-new example the learner picks alongside it.
function TrainStage({ stage, onComplete }) {
  const needed = stage.needed || stage.examples.length;
  const [fed, setFed] = useState(0);
  const [flying, setFlying] = useState(null); // the example currently animating in
  const [phase, setPhase] = useState('train'); // train | ready | test
  const [guess, setGuess] = useState(null);
  const [revealed, setRevealed] = useState(false);

  // Learning curve: 50% at zero examples up to 98% when fully trained.
  const accuracy = Math.round(50 + 48 * (1 - Math.pow(1 - fed / needed, 1.8)));
  const trained = fed >= needed;

  const feed = () => {
    if (flying || trained) return;
    setFlying(stage.examples[fed % stage.examples.length]);
    setTimeout(() => {
      setFed((n) => {
        const next = n + 1;
        if (next >= needed) setPhase('ready');
        return next;
      });
      setFlying(null);
    }, 650);
  };

  const test = stage.test;
  const correct = guess === test?.answer;

  return (
    <div>
      {/* The model brain + live accuracy gauge */}
      <div className="relative flex flex-col items-center rounded-3xl bg-gradient-to-b from-indigo-50 to-purple-50 p-6 ring-1 ring-purple-100">
        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-purple-500">{stage.modelName || 'Your Model'}</p>
        <div className="relative">
          <div className={`flex h-24 w-24 items-center justify-center rounded-full bg-white text-5xl shadow-md ${flying ? 'animate-pop' : trained ? 'animate-glow' : 'animate-float-slow'}`}>
            🧠
          </div>
          {flying && (
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 animate-feed-fly text-3xl">
              {flying.emoji}
            </span>
          )}
        </div>

        <div className="mt-5 w-full max-w-xs">
          <div className="mb-1 flex items-center justify-between text-xs font-bold text-gray-500">
            <span>Accuracy</span>
            <span className={trained ? 'text-green-600' : 'text-purple-600'}>{accuracy}%</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-white ring-1 ring-purple-100">
            <div
              className={`h-full rounded-full transition-all duration-500 ${trained ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-purple-500 to-violet-500'}`}
              style={{ width: `${accuracy}%` }}
            />
          </div>
          <p className="mt-2 text-center text-xs font-semibold text-gray-500">
            {fed}/{needed} examples learned
          </p>
        </div>
      </div>

      {phase === 'train' && (
        <>
          {/* Preview of the labeled examples waiting to be fed */}
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {stage.examples.map((ex, i) => (
              <span
                key={i}
                className={`flex items-center gap-1 rounded-xl border-2 px-2.5 py-1.5 text-xs font-bold transition-all ${
                  i < fed ? 'border-green-200 bg-green-50 text-green-700 opacity-60' : 'border-gray-200 bg-white text-gray-700'
                }`}
              >
                <span className="text-base">{ex.emoji}</span> {ex.label}
                {i < fed && <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
              </span>
            ))}
          </div>
          <button
            onClick={feed}
            disabled={!!flying}
            className="mt-6 w-full rounded-2xl bg-gradient-to-r from-purple-600 to-violet-600 px-6 py-3.5 font-extrabold text-white shadow-md transition-transform enabled:hover:scale-[1.02] active:scale-95 disabled:opacity-60"
          >
            Feed a Labeled Photo 📸
          </button>
        </>
      )}

      {phase === 'ready' && (
        <div className="mt-5 animate-slide-up text-center">
          <p className="rounded-2xl bg-green-50 p-4 text-lg font-extrabold text-green-700 ring-1 ring-green-100">
            🎉 Model trained! It reached {accuracy}% accuracy.
          </p>
          <button
            onClick={() => setPhase('test')}
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-600 px-7 py-3.5 font-extrabold text-white shadow-md transition-transform hover:scale-[1.02] active:scale-95"
          >
            Test the Model <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      )}

      {phase === 'test' && test && (
        <div className="mt-5">
          <div className="rounded-2xl border-2 border-purple-100 bg-white p-5 text-center shadow-sm">
            <p className="text-sm font-semibold text-gray-600">{test.prompt}</p>
            <div className="my-3 text-6xl animate-bounce-in">{revealed ? test.emoji : '❓'}</div>
            <div className="flex justify-center gap-3">
              {test.options.map((opt, oi) => {
                const sel = guess === oi;
                let cls = sel ? 'border-purple-500 bg-purple-100 text-purple-800' : 'border-gray-200 bg-white text-gray-700 hover:border-purple-300';
                if (revealed) {
                  if (oi === test.answer) cls = 'border-green-400 bg-green-50 text-green-800';
                  else if (sel) cls = 'border-rose-400 bg-rose-50 text-rose-700';
                  else cls = 'border-gray-200 bg-white text-gray-400';
                }
                return (
                  <button
                    key={oi}
                    disabled={revealed}
                    onClick={() => setGuess(oi)}
                    className={`rounded-xl border-2 px-5 py-2.5 text-sm font-bold transition-all active:scale-95 ${cls}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {revealed && (
            <p className="mt-4 flex items-start gap-2 rounded-xl bg-indigo-50 p-3 text-sm font-medium text-indigo-900 ring-1 ring-indigo-100 animate-slide-up">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                <b>{correct ? 'Spot on! ' : 'Good try! '}</b>
                Your model predicts <b>{test.options[test.answer]}</b>. {stage.explain}
              </span>
            </p>
          )}

          {!revealed ? (
            <button
              onClick={() => setRevealed(true)}
              disabled={guess == null}
              className="mt-6 w-full rounded-2xl bg-gray-900 px-6 py-3.5 font-extrabold text-white shadow-md transition-transform enabled:hover:bg-black active:scale-95 disabled:opacity-40"
            >
              {guess == null ? 'Pick a prediction first' : 'Run the Model'}
            </button>
          ) : (
            <ContinueBar xp={stage.xp} onClick={() => onComplete(true)} />
          )}
        </div>
      )}
    </div>
  );
}

// --- ML Stage: Garbage In, Garbage Out (clean the dataset) ------------------
// Learners toss mislabeled cards. A live accuracy meter rewards removing bad
// data and penalizes removing good data; 100% (all bad gone, all good kept)
// passes the stage.
function DataQualityStage({ stage, onComplete }) {
  const [removed, setRemoved] = useState({}); // cardId -> true
  const totalGood = stage.cards.filter((c) => !c.bad).length;

  const goodKept = stage.cards.filter((c) => !c.bad && !removed[c.id]).length;
  const badKept = stage.cards.filter((c) => c.bad && !removed[c.id]).length;
  // Each remaining mislabeled card drags accuracy down; removing a good card
  // costs you a correct example too.
  const accuracy = Math.max(0, Math.round(((goodKept - badKept) / totalGood) * 100));
  const passed = accuracy >= 100;

  const toggle = (id) => setRemoved((p) => ({ ...p, [id]: !p[id] }));

  return (
    <div>
      {/* Live accuracy meter */}
      <div className="mb-5 rounded-2xl bg-gradient-to-b from-indigo-50 to-purple-50 p-4 ring-1 ring-purple-100">
        <div className="mb-1 flex items-center justify-between text-xs font-bold text-gray-500">
          <span>{stage.meterLabel || 'Model Accuracy'}</span>
          <span className={passed ? 'text-green-600' : 'text-purple-600'}>{accuracy}%</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-white ring-1 ring-purple-100">
          <div
            className={`h-full rounded-full transition-all duration-500 ${passed ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-amber-400 to-orange-500'}`}
            style={{ width: `${accuracy}%` }}
          />
        </div>
      </div>

      {/* Dataset cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stage.cards.map((c) => {
          const gone = removed[c.id];
          return (
            <button
              key={c.id}
              onClick={() => toggle(c.id)}
              className={`relative flex flex-col items-center gap-1 rounded-2xl border-2 p-3 text-center transition-all active:scale-95 ${
                gone ? 'border-gray-200 bg-gray-50 opacity-40' : 'border-gray-200 bg-white hover:border-rose-300'
              }`}
            >
              <span className={`text-4xl ${gone ? 'grayscale' : ''}`}>{c.emoji}</span>
              <span className="text-xs font-bold text-gray-600">labeled “{c.label}”</span>
              <span className={`mt-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${gone ? 'bg-gray-200 text-gray-500' : 'bg-rose-50 text-rose-500'}`}>
                {gone ? 'removed · tap to undo' : 'tap to remove'}
              </span>
            </button>
          );
        })}
      </div>

      {stage.note && passed && (
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-indigo-50 p-3 text-sm font-medium text-indigo-900 ring-1 ring-indigo-100 animate-slide-up">
          <Lightbulb className="mt-0.5 h-5 w-5 shrink-0" /> {stage.note}
        </p>
      )}

      {passed ? (
        <ContinueBar xp={stage.xp} onClick={() => onComplete(true)} />
      ) : (
        <p className="mt-6 text-center text-sm font-semibold text-gray-500">
          Get the accuracy to 100% by removing every wrong label and keeping the good ones.
        </p>
      )}
    </div>
  );
}

// --- Stage 8: Quiz / Final Assessment --------------------------------------
function QuizStage({ stage, onComplete }) {
  const [answers, setAnswers] = useState({});
  const [graded, setGraded] = useState(false);
  const allAnswered = stage.questions.every((_, i) => answers[i] != null);
  const score = stage.questions.filter((q, i) => answers[i] === q.answer).length;
  const ratio = score / stage.questions.length;
  const passed = ratio >= (stage.pass ?? 0.8);

  return (
    <div>
      <ul className="space-y-6">
        {stage.questions.map((q, qi) => (
          <li key={qi} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="mb-3 font-bold text-gray-900">{qi + 1}. {q.q}</p>
            <div className="space-y-2">
              {q.options.map((opt, oi) => {
                const chosen = answers[qi] === oi;
                let cls = chosen ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:bg-gray-50';
                if (graded) {
                  if (oi === q.answer) cls = 'border-green-500 bg-green-50';
                  else if (chosen) cls = 'border-rose-400 bg-rose-50';
                  else cls = 'border-gray-200 opacity-70';
                }
                return (
                  <label key={oi} className={`flex items-center gap-3 rounded-xl border-2 p-3 transition-colors ${graded ? 'cursor-default' : 'cursor-pointer'} ${cls}`}>
                    <input
                      type="radio"
                      name={`q${qi}`}
                      className="h-4 w-4 text-purple-600"
                      checked={chosen}
                      disabled={graded}
                      onChange={() => setAnswers((p) => ({ ...p, [qi]: oi }))}
                    />
                    <span className="flex-1 font-medium text-gray-800">{opt}</span>
                    {graded && oi === q.answer && <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />}
                    {graded && chosen && oi !== q.answer && <XCircle className="h-5 w-5 shrink-0 text-rose-500" />}
                  </label>
                );
              })}
            </div>
            {graded && q.explain && (
              <p className="mt-3 flex items-start gap-2 rounded-xl bg-indigo-50 p-3 text-sm font-medium text-indigo-900 ring-1 ring-indigo-100">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" /> {q.explain}
              </p>
            )}
          </li>
        ))}
      </ul>

      {!graded ? (
        <button
          onClick={() => setGraded(true)}
          disabled={!allAnswered}
          className="mt-6 w-full rounded-2xl bg-gray-900 px-6 py-3.5 font-extrabold text-white shadow-md transition-transform enabled:hover:bg-black active:scale-95 disabled:opacity-40"
        >
          {allAnswered ? 'Submit Assessment' : 'Answer every question to submit'}
        </button>
      ) : passed ? (
        <>
          <p className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-green-50 p-3 text-lg font-extrabold text-green-700 ring-1 ring-green-100">
            <Trophy className="h-5 w-5" /> Score: {score}/{stage.questions.length} — you passed!
          </p>
          <ContinueBar xp={stage.xp} onClick={() => onComplete(true)} last />
        </>
      ) : (
        <div className="mt-6 animate-slide-up">
          <p className="mb-3 rounded-xl bg-amber-50 p-3 text-center text-sm font-bold text-amber-800 ring-1 ring-amber-100">
            You scored {score}/{stage.questions.length}. You need {Math.ceil((stage.pass ?? 0.8) * stage.questions.length)} to pass — read the notes and retry!
          </p>
          <button
            onClick={() => { setGraded(false); setAnswers({}); }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-6 py-3 font-bold text-white transition-colors hover:bg-orange-600"
          >
            <RotateCcw className="h-5 w-5" /> Try Again
          </button>
        </div>
      )}
    </div>
  );
}

// --- Stage 9: Rewards ------------------------------------------------------
function RewardsStage({ stage, courseId, moduleId, course }) {
  const nextLessonId = getNextLessonAfterModule(course, moduleId.replace('module', ''));
  return (
    <div className="relative text-center">
      <ConfettiBurst />
      <div className="relative">
        <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 shadow-lg animate-[badgePop_0.6s_cubic-bezier(0.34,1.56,0.64,1)_0.1s_both]">
          <Award className="h-14 w-14 text-white drop-shadow" strokeWidth={2.5} />
        </div>
        <h2 className="font-display text-3xl font-extrabold text-[#2D2A4A]">{stage.title}</h2>
        <div className="mx-auto mt-5 max-w-sm space-y-2">
          {stage.messages.map((m, i) => (
            <p key={i} className="rounded-xl bg-white p-3 font-bold text-gray-700 shadow-sm ring-1 ring-gray-100 animate-slide-up" style={{ animationDelay: `${i * 0.12}s` }}>
              {m}
            </p>
          ))}
        </div>
        {nextLessonId ? (
          <Link
            to={`/course/${courseId}/lesson/${nextLessonId}`}
            className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-600 px-7 py-3.5 font-extrabold text-white shadow-md transition-transform hover:scale-[1.02] active:scale-95"
          >
            Continue Learning <ArrowRight className="h-5 w-5" />
          </Link>
        ) : (
          <Link
            to="/courses"
            className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-600 px-7 py-3.5 font-extrabold text-white shadow-md transition-transform hover:scale-[1.02] active:scale-95"
          >
            Back to Quests <ArrowRight className="h-5 w-5" />
          </Link>
        )}
      </div>
    </div>
  );
}

// --- The runner: header + progress + current stage -------------------------
export default function LabRunner({ lab, course, courseId, moduleId }) {
  const [stageIdx, setStageIdx] = useState(0);
  const topRef = useRef(null);

  // Scroll the runner to the top whenever we move to a new stage.
  useEffect(() => { topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [stageIdx]);

  const handleStageComplete = (stage, idx) => {
    awardXPOnce(`lab-${courseId}-${moduleId}-s${idx}`, stage.xp || 0);
    const isLastInteractive = idx >= lab.stages.length - 2; // last is the rewards screen
    if (isLastInteractive) {
      markLabComplete(`${courseId}-${moduleId}`);
      try {
        const badges = JSON.parse(localStorage.getItem('earnedBadges') || '[]');
        const badgeId = `lab-${courseId}-${moduleId}`;
        if (lab.badge && !badges.some((b) => b.id === badgeId)) {
          badges.push({ id: badgeId, name: `${lab.badge}`, type: 'lab', earnedAt: new Date().toISOString() });
          localStorage.setItem('earnedBadges', JSON.stringify(badges));
        }
      } catch { /* ignore storage errors */ }
    }
    setStageIdx((i) => Math.min(i + 1, lab.stages.length - 1));
  };

  const stage = lab.stages[stageIdx];
  const total = lab.stages.length;
  const pct = Math.round((stageIdx / (total - 1)) * 100);

  const renderStage = () => {
    const onComplete = () => handleStageComplete(stage, stageIdx);
    switch (stage.type) {
      case 'welcome': return <WelcomeStage stage={stage} onComplete={onComplete} />;
      case 'pick': return <PickStage stage={stage} onComplete={onComplete} />;
      case 'sort': return <SortStage stage={stage} onComplete={onComplete} />;
      case 'choose': return <ChooseStage stage={stage} onComplete={onComplete} />;
      case 'explore': return <ExploreStage stage={stage} onComplete={onComplete} />;
      case 'train': return <TrainStage stage={stage} onComplete={onComplete} />;
      case 'dataquality': return <DataQualityStage stage={stage} onComplete={onComplete} />;
      case 'design': return <DesignStage stage={stage} onComplete={onComplete} />;
      case 'quiz': return <QuizStage stage={stage} onComplete={onComplete} />;
      case 'rewards': return <RewardsStage stage={stage} courseId={courseId} moduleId={moduleId} course={course} />;
      default: return <p className="text-gray-500">Unknown stage.</p>;
    }
  };

  return (
    <div ref={topRef}>
      {/* Header */}
      <div className="mb-2 flex items-center gap-3">
        <span className="text-4xl">{lab.emoji || '🧪'}</span>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-purple-500">Interactive Lab · {lab.difficulty} · {lab.duration}</p>
          <h1 className="font-display text-2xl font-extrabold text-[#2D2A4A] sm:text-3xl">{lab.title}</h1>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6 mt-4">
        <div className="mb-1 flex items-center justify-between text-xs font-bold text-gray-500">
          <span>Stage {stageIdx + 1} of {total}</span>
          <span className="inline-flex items-center gap-1"><ChevronRight className="h-3 w-3" /> {stage.title}</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
          <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-violet-500 transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Stage card */}
      <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7" key={stageIdx}>
        {stage.type !== 'rewards' && (
          <>
            <h2 className="font-display text-xl font-extrabold text-[#2D2A4A] sm:text-2xl">{stage.title}</h2>
            {stage.prompt && <p className="mb-5 mt-1 text-gray-600">{stage.prompt}</p>}
          </>
        )}
        {renderStage()}
      </div>
    </div>
  );
}
