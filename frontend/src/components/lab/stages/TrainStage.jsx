import { useState } from 'react';
import { ArrowRight, CheckCircle2, Lightbulb } from 'lucide-react';
import ContinueBar from '../shared/ContinueBar';

// Train Your First Model — a feed-the-data mini-game.
// Tap to feed labeled examples into the "brain"; accuracy climbs along a
// learning curve (fast at first, then plateaus). Once trained, the model
// predicts a brand-new example the learner picks alongside it.
export default function TrainStage({ stage, onComplete }) {
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
      <div className="relative flex flex-col items-center rounded-3xl bg-pcb/8 p-6 ring-1 ring-pcb/20">
        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-pcb">{stage.modelName || 'Your Model'}</p>
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
          <div className="mb-1 flex items-center justify-between text-xs font-bold text-ink/55">
            <span>Accuracy</span>
            <span className={trained ? 'text-pcb' : 'text-pcb'}>{accuracy}%</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-white ring-1 ring-pcb/20">
            <div
              className={`h-full rounded-full transition-all duration-500 ${trained ? 'bg-pcb' : 'bg-pcb'}`}
              style={{ width: `${accuracy}%` }}
            />
          </div>
          <p className="mt-2 text-center text-xs font-semibold text-ink/55">
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
                  i < fed ? 'border-pcb/30 bg-pcb/10 text-pcb opacity-60' : 'border-ink/15 bg-white text-ink/75'
                }`}
              >
                <span className="text-base">{ex.emoji}</span> {ex.label}
                {i < fed && <CheckCircle2 className="h-3.5 w-3.5 text-pcb" />}
              </span>
            ))}
          </div>
          <button
            onClick={feed}
            disabled={!!flying}
            className="mt-6 w-full rounded-2xl border-2 border-ink bg-pcb px-6 py-3.5 font-extrabold text-white shadow-md transition-transform enabled:hover:scale-[1.02] active:scale-95 disabled:opacity-60"
          >
            Feed a Labeled Photo 📸
          </button>
        </>
      )}

      {phase === 'ready' && (
        <div className="mt-5 animate-slide-up text-center">
          <p className="rounded-2xl bg-pcb/10 p-4 text-lg font-extrabold text-pcb ring-1 ring-pcb/20">
            🎉 Model trained! It reached {accuracy}% accuracy.
          </p>
          <button
            onClick={() => setPhase('test')}
            className="mt-5 inline-flex items-center gap-2 rounded-2xl border-2 border-ink bg-pcb px-7 py-3.5 font-extrabold text-white shadow-md transition-transform hover:scale-[1.02] active:scale-95"
          >
            Test the Model <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      )}

      {phase === 'test' && test && (
        <div className="mt-5">
          <div className="rounded-2xl border-2 border-ink/15 bg-white p-5 text-center shadow-sm">
            <p className="text-sm font-semibold text-ink/65">{test.prompt}</p>
            <div className="my-3 text-6xl animate-bounce-in">{revealed ? test.emoji : '❓'}</div>
            <div className="flex justify-center gap-3">
              {test.options.map((opt, oi) => {
                const sel = guess === oi;
                let cls = sel ? 'border-pcb bg-pcb/15 text-pcb' : 'border-ink/15 bg-white text-ink/75 hover:border-pcb/40';
                if (revealed) {
                  if (oi === test.answer) cls = 'border-pcb bg-pcb/10 text-pcb';
                  else if (sel) cls = 'border-wire bg-wire/8 text-wire';
                  else cls = 'border-ink/15 bg-white text-ink/40';
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
            <p className="mt-4 flex items-start gap-2 rounded-xl bg-pcb/8 p-3 text-sm font-medium text-ink ring-1 ring-pcb/20 animate-slide-up">
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
              className="mt-6 w-full rounded-2xl bg-ink px-6 py-3.5 font-extrabold text-white shadow-md transition-transform enabled:hover:bg-pcb active:scale-95 disabled:opacity-40"
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
