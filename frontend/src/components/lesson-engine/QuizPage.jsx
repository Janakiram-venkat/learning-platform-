import { useState } from 'react';
import { CheckCircle2, XCircle, Lightbulb, HelpCircle } from 'lucide-react';
import Markdown from './blocks/Markdown';

/**
 * A knowledge check. Graded in the browser: unlike the Python course (whose
 * quizzes are graded server-side so the answer key never ships), these live in
 * the frontend content files, so a determined student can read the answers in
 * the bundle. That's an accepted trade — the quiz is a self-check, not an exam,
 * and it buys the course a backend-free content pipeline.
 *
 * Passing means every question correct on the current attempt, matching how the
 * Python lesson page gates its Knowledge Check.
 *
 * @param {object} props
 * @param {object} props.page
 * @param {boolean} props.passed Already passed on a previous visit.
 * @param {() => void} props.onPass
 */
export default function QuizPage({ page, passed, onPass }) {
  const [answers, setAnswers] = useState({});
  const [graded, setGraded] = useState(false);

  const questions = page.questions || [];
  const answeredAll = questions.every((_, i) => answers[i] != null);
  const correctCount = questions.filter((q, i) => answers[i] === q.answerIndex).length;
  const allCorrect = graded && correctCount === questions.length;

  const submit = () => {
    if (!answeredAll) return;
    setGraded(true);
    if (questions.every((q, i) => answers[i] === q.answerIndex)) onPass();
  };

  const choose = (qIdx, oIdx) => {
    setAnswers((prev) => ({ ...prev, [qIdx]: oIdx }));
    // Changing an answer starts a fresh attempt.
    if (graded) setGraded(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex items-center gap-1.5 rounded-full border-2 border-ink bg-signal px-3 py-1 text-xs font-extrabold text-ink">
          <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" /> Knowledge check
        </span>
        {(passed || allCorrect) && (
          <span className="flex items-center gap-1.5 text-sm font-bold text-pcb">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Passed
          </span>
        )}
      </div>

      {page.title && (
        <h2 className="font-lab text-2xl font-extrabold text-ink sm:text-3xl">{page.title}</h2>
      )}

      <div className="overflow-hidden rounded-2xl border-2 border-ink shadow-[4px_4px_0_rgba(22,36,29,0.9)]">
        <div className="border-b-2 border-ink bg-signal px-5 py-4">
          <h3 className="font-lab text-lg font-bold text-ink">
            {questions.length} question{questions.length === 1 ? '' : 's'}
          </h3>
        </div>

        <div className="space-y-8 bg-white p-5 sm:p-7">
          {questions.map((q, qIdx) => {
            const chosen = answers[qIdx];
            const isCorrect = graded && chosen === q.answerIndex;

            return (
              <fieldset key={qIdx} className="border-0 p-0">
                <legend className="mb-4 text-lg font-bold text-ink">
                  <span className="text-ink/40">{qIdx + 1}.</span> {q.q}
                </legend>

                <div className="grid grid-cols-1 items-start gap-3">
                  {q.options.map((opt, oIdx) => {
                    const picked = chosen === oIdx;
                    let cls = picked ? 'border-pcb bg-pcb/8' : 'border-ink/15 hover:bg-ink/5';
                    if (graded) {
                      if (oIdx === q.answerIndex) cls = 'border-pcb bg-pcb/10';
                      else if (picked) cls = 'border-wire bg-wire/8';
                      else cls = 'border-ink/15 opacity-70';
                    }
                    return (
                      <label
                        key={oIdx}
                        className={`flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4 transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-pcb ${cls}`}
                      >
                        <input
                          type="radio"
                          name={`${page.id}-q${qIdx}`}
                          className="h-5 w-5 shrink-0 accent-pcb"
                          checked={picked}
                          onChange={() => choose(qIdx, oIdx)}
                        />
                        <span className="flex-1 font-medium text-ink">{opt}</span>
                        {graded && oIdx === q.answerIndex && (
                          <CheckCircle2 className="h-5 w-5 shrink-0 text-pcb" aria-hidden="true" />
                        )}
                        {graded && picked && oIdx !== q.answerIndex && (
                          <XCircle className="h-5 w-5 shrink-0 text-wire" aria-hidden="true" />
                        )}
                      </label>
                    );
                  })}
                </div>

                {graded && (
                  <div
                    className={`animate-slide-up mt-4 flex items-start gap-3 rounded-xl border-2 p-4 ${
                      isCorrect ? 'border-pcb/30 bg-pcb/8' : 'border-signal bg-signal/15'
                    }`}
                  >
                    <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-ink" aria-hidden="true" />
                    <div className="text-sm text-ink">
                      <span className="font-bold">{isCorrect ? 'Correct. ' : 'Not quite. '}</span>
                      <Markdown md={q.explanation} className="inline [&_p]:mb-0 [&_p]:inline" />
                    </div>
                  </div>
                )}
              </fieldset>
            );
          })}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-ink/10 pt-6">
            <button
              onClick={submit}
              disabled={!answeredAll}
              className="lab-btn rounded-xl border-2 border-ink bg-pcb px-8 py-3 font-extrabold text-white disabled:cursor-not-allowed disabled:border-ink/20 disabled:bg-ink/10 disabled:text-ink/40 disabled:shadow-none"
            >
              {graded ? 'Check again' : 'Check answers'}
            </button>

            {!answeredAll && (
              <span className="text-sm font-semibold text-ink/50">
                Answer every question to check.
              </span>
            )}
            {graded && (
              <span
                role="status"
                aria-live="polite"
                className={`font-lab flex items-center gap-2 rounded-lg border-2 border-ink px-4 py-2 text-lg font-extrabold text-ink ${
                  allCorrect ? 'bg-pcb/20' : 'bg-signal/25'
                }`}
              >
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                {correctCount} / {questions.length}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
