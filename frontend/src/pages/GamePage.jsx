import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import CodeEditor from '../components/editor/CodeEditor';
import GameCanvas from '../components/game/GameCanvas';
import SeeIt from '../components/game/SeeIt';
import GetIt from '../components/game/GetIt';
import Explain from '../components/game/Explain';
import PicturePack from '../components/game/PicturePack';
import Solution from '../components/game/Solution';
import Celebration from '../components/feedback/Celebration';
import FeedbackModal from '../components/feedback/FeedbackModal';
import { useGameRunner } from '../hooks/useGameRunner';
import { useCourseContent } from '../hooks/useCourseContent';
import { useCompletionFlow } from '../hooks/useCompletionFlow';
import {
  gameStepKey, isGameStepCompleted, isGameStepUnlocked, awardXPOnce,
} from '../lib/progress';
import {
  Play, Square, CheckCircle2, Circle, XCircle, Loader2, Lightbulb, ArrowRight, ArrowLeft,
  ListChecks, Trophy, LayoutGrid, BookOpen,
} from 'lucide-react';

const STEP_XP = 30;
const MODULE_BONUS_XP = 60;

export default function GamePage() {
  const { courseId, moduleId, stepIndex } = useParams();
  const idx = Number(stepIndex) || 0;
  const navigate = useNavigate();

  // The game course has no lesson sidebar here, so the course document isn't needed.
  const { item: module, loading } = useCourseContent(courseId, 'module', moduleId, {
    includeCourse: false,
  });
  const { celebration, closeCelebration, feedbackOpen, closeFeedback, complete } = useCompletionFlow();

  const [code, setCode] = useState('');
  const [starterCode, setStarterCode] = useState('');
  const [hintsShown, setHintsShown] = useState(0);
  const runner = useGameRunner();
  const resetResults = runner.resetResults;
  const editorPanelRef = useRef(null);

  const step = module?.steps?.[idx];

  // Every step is a clean slate: seed the editor, re-lock hints, and clear the
  // pass/fail ticks left over from the previous step's code.
  useEffect(() => {
    if (!step) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- seed the editor from the step we just fetched
    setCode(step.starterCode || '');
    setStarterCode(step.starterCode || '');
    setHintsShown(0);
    resetResults();
  }, [step, resetResults]);

  // Don't let a URL skip ahead past work that hasn't been done.
  useEffect(() => {
    if (!module) return;
    if (!isGameStepUnlocked(moduleId, idx)) {
      navigate(`/course/${courseId}/module/${moduleId}/step/0`, { replace: true });
    }
  }, [module, moduleId, idx, courseId, navigate]);
  const totalSteps = module?.steps?.length || 0;
  const isLast = idx === totalSteps - 1;

  const handleRun = useCallback(() => { runner.run(code); }, [runner, code]);

  // "Put this in my editor" from the solution panel. Clearing stale pass/fail
  // ticks matters: the old results belonged to the old code.
  const handleUseSolution = useCallback((solution) => {
    setCode(solution);
    resetResults();
  }, [resetResults]);

  const handleCheck = useCallback(async () => {
    if (!step?.check) return;
    const results = await runner.check(code, step.check);
    if (!results || !results.every((r) => r.passed)) return;

    // Finishing the last step ships the whole game: bonus XP and a badge.
    if (isLast) awardXPOnce(`gamemodule-${courseId}-${moduleId}`, MODULE_BONUS_XP);

    complete({
      kind: 'gameSteps',
      id: gameStepKey(moduleId, idx),
      xpKey: `gamestep-${courseId}-${moduleId}-${idx}`,
      xp: STEP_XP,
      badge: isLast
        ? { id: `game-${moduleId}`, name: `${module.title} — Shipped`, type: 'project' }
        : undefined,
      celebration: ({ firstTime, xpGained }) => (isLast
        ? {
          title: 'Game complete! 🎮',
          message: module.successMessage
            || `You built ${module.title} from an empty screen. That's a real game — go show someone.`,
          badge: `${module.title} — Shipped`,
        }
        : {
          title: 'Step complete! ✅',
          message: step.successMessage
            || `Nice — your game does something new.${xpGained && firstTime ? ` +${xpGained} XP` : ''}`,
        }),
    });
  }, [runner, code, step, moduleId, idx, isLast, module, courseId, complete]);

  if (!loading && !step) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
        <span className="text-5xl">🕹️</span>
        <p className="font-lab text-lg font-semibold text-ink/65">This step isn't built yet.</p>
        <Link to={`/course/${courseId}/games`} className="lab-btn rounded-xl border-2 border-ink bg-signal px-5 py-2.5 font-extrabold text-ink">
          Back to the games
        </Link>
      </div>
    );
  }

  const hints = step?.hints || [];
  const rules = step?.check?.rules || [];
  const results = runner.results;
  const allPassed = results && results.length > 0 && results.every((r) => r.passed);

  return (
    <div className="flex w-full flex-col lg:h-[calc(100vh-64px)] lg:flex-row lg:overflow-hidden">
      <Celebration
        open={!!celebration}
        title={celebration?.title}
        message={celebration?.message}
        badge={celebration?.badge}
        onClose={() => closeCelebration(() => {
          if (isLast) navigate(`/course/${courseId}/games`);
          else navigate(`/course/${courseId}/module/${moduleId}/step/${idx + 1}`);
        })}
      />

      <FeedbackModal open={feedbackOpen} courseId={courseId} onClose={closeFeedback} />

      {/* Teaching column. Only THIS side swaps out while a step loads — the
          stage below keeps its canvas, and with it the loaded Python runtime. */}
      <div className="min-w-0 flex-1 overflow-y-auto bg-paper p-4 sm:p-6">
        {!step ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24">
            <div className="animate-float text-5xl">🎮</div>
            <p className="font-lab text-lg font-semibold text-ink/65">Loading your game…</p>
          </div>
        ) : (
        <div className="mx-auto max-w-2xl space-y-4">
          {/* Step map — always visible, so the whole game is in view */}
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-4">
              <Link to={`/course/${courseId}/games`} className="inline-flex items-center gap-1.5 text-sm font-bold text-ink/50 hover:text-pcb">
                <LayoutGrid className="h-4 w-4" /> All games
              </Link>
              <Link to={`/course/${courseId}/reference`} className="inline-flex items-center gap-1.5 text-sm font-bold text-ink/50 hover:text-pcb">
                <BookOpen className="h-4 w-4" /> Library reference
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-4xl">{module.emoji || '🎮'}</span>
              <div className="min-w-0">
                <p className="ref-tag text-pcb">{module.title} · Step {idx + 1} of {totalSteps}</p>
                <h1 className="font-lab text-2xl font-extrabold text-ink sm:text-3xl">{step.title}</h1>
              </div>
            </div>
            <div className="mt-4 flex gap-1.5">
              {module.steps.map((s, i) => (
                <span
                  key={i}
                  title={s.title}
                  className={`h-2 flex-1 rounded-full border border-ink/20 ${
                    isGameStepCompleted(moduleId, i) ? 'bg-pcb' : i === idx ? 'bg-signal' : 'bg-ink/10'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Beat 1 — See it */}
          {(step.seeIt?.before || step.seeIt?.after) && (
            <SeeIt before={step.seeIt.before} after={step.seeIt.after} note={step.seeIt.note} />
          )}

          {/* Beat 2 — Get it */}
          {step.getIt && (
            <GetIt
              widget={step.getIt.widget}
              title={step.getIt.title}
              beats={step.getIt.beats}
              config={step.getIt.config}
            />
          )}

          {/* Beat 3 — Decode it: what each line actually does, and why */}
          {step.explain && (
            <Explain
              title={step.explain.title}
              intro={step.explain.intro}
              lines={step.explain.lines}
            />
          )}

          {/* Beat 4 — Build it */}
          <div className="lab-panel p-4 sm:p-5">
            <h3 className="mb-3 font-lab font-bold text-ink">Your turn</h3>
            <p className="text-lg leading-relaxed text-ink/75">{step.brief}</p>
            {step.todo?.length > 0 && (
              <ol className="mt-4 space-y-2">
                {step.todo.map((t, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 border-ink bg-signal text-xs font-extrabold text-ink">{i + 1}</span>
                    <span className="text-ink/75">{t}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {/* The typeable way to get any picture on the stage */}
          <PicturePack />

          {/* Hints */}
          {hints.length > 0 && (
            <div className="lab-panel p-4 sm:p-5">
              <h3 className="mb-1 flex items-center gap-2 font-lab font-bold text-ink">
                <Lightbulb className="h-5 w-5 fill-signal text-ink" /> Stuck? Take a hint
              </h3>
              <p className="mb-4 text-sm text-ink/55">Try it on your own first — hints are here whenever you want one.</p>
              <ol className="space-y-3">
                {hints.slice(0, hintsShown).map((h, i) => (
                  <li key={i} className="flex items-start gap-3 rounded-xl border-2 border-ink/15 bg-white p-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 border-ink bg-signal text-xs font-extrabold text-ink">{i + 1}</span>
                    <span className="text-ink/80">{h}</span>
                  </li>
                ))}
              </ol>
              {hintsShown < hints.length ? (
                <button
                  onClick={() => setHintsShown((n) => n + 1)}
                  className={`lab-btn flex items-center gap-2 rounded-xl border-2 border-ink bg-white px-4 py-2.5 font-extrabold text-ink ${hintsShown > 0 ? 'mt-3' : ''}`}
                >
                  <Lightbulb className="h-4 w-4" />
                  {hintsShown === 0 ? 'Show a hint' : 'Show another hint'}
                  <span className="text-ink/45">({hints.length - hintsShown} left)</span>
                </button>
              ) : (
                <p className="mt-3 text-sm font-semibold text-ink/50">That's every hint — you've got this! 💪</p>
              )}
            </div>
          )}

          {/* One worked answer, one click away */}
          <Solution code={step.solution} onUseCode={handleUseSolution} />

          {/* Beat 5 — what "done" means */}
          <div className="lab-panel p-4 sm:p-5">
            <h3 className="mb-1 flex items-center gap-2 font-lab font-bold text-ink">
              <ListChecks className="h-5 w-5 text-pcb" /> Your game must…
            </h3>
            <p className="mb-4 text-sm text-ink/55">
              We play your game for a few seconds and watch what happens. However you wrote it, if it does these
              things, it passes.
            </p>
            <ul className="space-y-2">
              {rules.map((r, i) => {
                const passed = results?.[i]?.passed;
                return (
                  <li key={i} className="flex items-center gap-3">
                    {passed === true ? <CheckCircle2 className="h-5 w-5 shrink-0 text-pcb" />
                      : passed === false ? <XCircle className="h-5 w-5 shrink-0 text-wire" />
                      : <Circle className="h-5 w-5 shrink-0 text-ink/20" />}
                    <span className={`font-medium ${passed === true ? 'text-pcb' : passed === false ? 'text-wire' : 'text-ink/65'}`}>
                      {r.label}
                    </span>
                  </li>
                );
              })}
            </ul>

            {results && !allPassed && (
              <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm font-medium text-amber-800 ring-1 ring-amber-100">
                Not there yet — fix the red ones and check again. 💪
              </p>
            )}
            {allPassed && (
              <p className="mt-4 flex items-center gap-2 rounded-xl bg-green-50 p-3 text-sm font-bold text-green-700 ring-1 ring-green-100">
                <Trophy className="h-4 w-4" /> All good — step complete!
              </p>
            )}
          </div>

          {/* Step-to-step navigation */}
          <div className="flex items-center justify-between gap-3 pb-4">
            {idx > 0 ? (
              <Link
                to={`/course/${courseId}/module/${moduleId}/step/${idx - 1}`}
                className="lab-btn flex items-center gap-2 rounded-xl border-2 border-ink bg-white px-4 py-2.5 font-extrabold text-ink"
              >
                <ArrowLeft className="h-4 w-4" /> Previous
              </Link>
            ) : <span />}
            {!isLast && isGameStepCompleted(moduleId, idx) && (
              <Link
                to={`/course/${courseId}/module/${moduleId}/step/${idx + 1}`}
                className="lab-btn flex items-center gap-2 rounded-xl border-2 border-ink bg-signal px-4 py-2.5 font-extrabold text-ink"
              >
                Next step <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
        )}
      </div>

      {/* Stage + editor */}
      <div ref={editorPanelRef} className="z-10 flex w-full flex-col border-t-2 border-ink bg-white lg:h-full lg:w-[560px] lg:border-l-2 lg:border-t-0">
        <div className="shrink-0 border-b-2 border-ink/10 bg-gray-50 p-3">
          <GameCanvas width={step?.stage?.width || 480} height={step?.stage?.height || 360} />
          {runner.booting && (
            <p className="mt-2 text-center text-xs font-semibold text-ink/50">
              Booting the Python runtime (one-time download)…
            </p>
          )}
          {runner.error && (
            <pre className="mt-3 max-h-32 overflow-auto whitespace-pre-wrap rounded-xl border-2 border-wire/40 bg-wire/5 p-3 font-mono text-xs text-wire">
              {runner.error}
            </pre>
          )}
          {runner.output && !runner.error && (
            <pre className="mt-3 max-h-24 overflow-auto whitespace-pre-wrap rounded-xl border-2 border-ink/10 bg-white p-2 font-mono text-xs text-ink/70">
              {runner.output}
            </pre>
          )}
        </div>

        <div className="flex min-h-[45vh] flex-1 flex-col bg-gray-50 px-3 pb-3">
          <div className="mb-2 flex shrink-0 flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center font-lab text-lg font-extrabold text-ink">
              <span className="mr-2 h-3 w-3 rounded-full bg-pcb" /> game.py
            </h3>
            <div className="flex gap-2">
              {runner.running ? (
                <button
                  onClick={runner.stop}
                  className="lab-btn flex items-center rounded-lg border-2 border-ink bg-white px-4 py-2.5 font-extrabold text-ink"
                >
                  <Square className="mr-2 h-4 w-4" /> Stop
                </button>
              ) : (
                <button
                  onClick={handleRun}
                  disabled={runner.checking || !step}
                  title="Run (Ctrl/Cmd + Enter)"
                  className="lab-btn flex items-center rounded-lg border-2 border-ink bg-white px-4 py-2.5 font-extrabold text-ink disabled:opacity-60"
                >
                  <Play className="mr-2 h-5 w-5" /> Play
                </button>
              )}
              <button
                onClick={handleCheck}
                disabled={runner.checking || !step}
                className="lab-btn flex items-center rounded-lg border-2 border-ink bg-signal px-4 py-2.5 font-extrabold text-ink disabled:opacity-60"
              >
                {runner.checking ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
                Check
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1">
            <CodeEditor code={code} onChange={setCode} onRun={handleRun} starterCode={starterCode} filename="game.py" />
          </div>
        </div>
      </div>
    </div>
  );
}
