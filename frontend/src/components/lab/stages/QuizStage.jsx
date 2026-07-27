import { useState, useRef } from 'react';
import { CheckCircle2, XCircle, RotateCcw, Trophy, Lightbulb } from 'lucide-react';
import ContinueBar from '../shared/ContinueBar';

// Quiz: the lab's final assessment, graded in the browser.
export default function QuizStage({ stage, onComplete }) {
  const [answers, setAnswers] = useState({});
  const [graded, setGraded] = useState(false);
  const quizTopRef = useRef(null);
  const allAnswered = stage.questions.every((_, i) => answers[i] != null);
  const score = stage.questions.filter((q, i) => answers[i] === q.answer).length;
  const ratio = score / stage.questions.length;
  const passed = ratio >= (stage.pass ?? 0.8);
  const allCorrect = score === stage.questions.length;
  const retry = () => {
    setGraded(false);
    setAnswers({});
    // Scroll back to the first question so a fresh attempt is obvious.
    quizTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div ref={quizTopRef} className="scroll-mt-24">
      <ul className="space-y-6">
        {stage.questions.map((q, qi) => (
          <li key={qi} className="rounded-2xl border border-ink/15 bg-white p-4 shadow-sm">
            <p className="mb-3 font-bold text-ink">{qi + 1}. {q.q}</p>
            <div className="space-y-2">
              {q.options.map((opt, oi) => {
                const chosen = answers[qi] === oi;
                let cls = chosen ? 'border-pcb bg-pcb/8' : 'border-ink/15 hover:bg-paper';
                if (graded) {
                  if (oi === q.answer) cls = 'border-pcb bg-pcb/10';
                  else if (chosen) cls = 'border-wire bg-wire/8';
                  else cls = 'border-ink/15 opacity-70';
                }
                return (
                  <label key={oi} className={`flex items-center gap-3 rounded-xl border-2 p-3 transition-colors ${graded ? 'cursor-default' : 'cursor-pointer'} ${cls}`}>
                    <input
                      type="radio"
                      name={`q${qi}`}
                      className="h-4 w-4 text-pcb"
                      checked={chosen}
                      disabled={graded}
                      onChange={() => setAnswers((p) => ({ ...p, [qi]: oi }))}
                    />
                    <span className="flex-1 font-medium text-ink">{opt}</span>
                    {graded && oi === q.answer && <CheckCircle2 className="h-5 w-5 shrink-0 text-pcb" />}
                    {graded && chosen && oi !== q.answer && <XCircle className="h-5 w-5 shrink-0 text-wire" />}
                  </label>
                );
              })}
            </div>
            {graded && q.explain && (
              <p className="mt-3 flex items-start gap-2 rounded-xl bg-pcb/8 p-3 text-sm font-medium text-ink ring-1 ring-pcb/20">
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
          className="mt-6 w-full rounded-2xl bg-ink px-6 py-3.5 font-extrabold text-white shadow-md transition-transform enabled:hover:bg-pcb active:scale-95 disabled:opacity-40"
        >
          {allAnswered ? 'Submit Assessment' : 'Answer every question to submit'}
        </button>
      ) : passed ? (
        <>
          <p className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-pcb/10 p-3 text-lg font-extrabold text-pcb ring-1 ring-pcb/20">
            <Trophy className="h-5 w-5" /> Score: {score}/{stage.questions.length} — you passed!
          </p>
          {!allCorrect && (
            <button
              onClick={retry}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-wire/10 px-6 py-3 font-bold text-ink transition-colors hover:bg-wire/15"
            >
              <RotateCcw className="h-5 w-5" /> Try Again for a Perfect Score
            </button>
          )}
          <ContinueBar xp={stage.xp} onClick={() => onComplete(true)} last />
        </>
      ) : (
        <div className="mt-6 animate-slide-up">
          <p className="mb-3 rounded-xl bg-signal/15 p-3 text-center text-sm font-bold text-ink ring-1 ring-ink/15">
            You scored {score}/{stage.questions.length}. You need {Math.ceil((stage.pass ?? 0.8) * stage.questions.length)} to pass — read the notes and retry!
          </p>
          <button
            onClick={retry}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-wire px-6 py-3 font-bold text-white transition-colors hover:bg-wire/85"
          >
            <RotateCcw className="h-5 w-5" /> Try Again
          </button>
        </div>
      )}
    </div>
  );
}
