import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { compilerService } from '../services/api';
import CodeEditor from '../components/editor/CodeEditor';
import Terminal from '../components/editor/Terminal';
import { useCodeRunner } from '../hooks/useCodeRunner';
import { useCourseContent } from '../hooks/useCourseContent';
import { useCompletionFlow } from '../hooks/useCompletionFlow';
import Celebration from '../components/feedback/Celebration';
import FeedbackModal from '../components/feedback/FeedbackModal';
import Sidebar from '../components/layout/Sidebar';
import {
  isAssignmentUnlocked,
  getNextLessonAfterModule,
} from '../lib/progress';
import { Play, CheckCircle2, Circle, ListChecks, Hammer, Loader2, Trophy, ArrowRight, XCircle, Target, Lightbulb, Menu, X } from 'lucide-react';

const PROJECT_XP = 80;

function normalize(s) {
  return String(s || '').replace(/\r/g, '').trim().toLowerCase();
}

// Evaluate one legacy check against the student's code + program output.
function checkPasses(check, code, output) {
  const out = (output || '').toLowerCase();
  const src = (code || '').toLowerCase();
  if (check.outputContains && !out.includes(String(check.outputContains).toLowerCase())) return false;
  if (check.codeContains && !src.includes(String(check.codeContains).toLowerCase())) return false;
  return true;
}

// Evaluate one test case against the output produced for that test's input.
function testPasses(test, output) {
  if (output == null) return false;
  if (Array.isArray(test.expect)) {
    const out = normalize(output);
    return test.expect.every(e => out.includes(normalize(e)));
  }
  if (test.expectedOutput != null) {
    return normalize(output) === normalize(test.expectedOutput);
  }
  return true;
}

// Join a test's input lines into a stdin string (one answer per line).
function toStdin(input) {
  if (!input || input.length === 0) return '';
  return input.join('\n') + '\n';
}

export default function ProjectPage() {
  const { courseId, moduleId } = useParams(); // moduleId e.g. "module1"
  const navigate = useNavigate();

  const { course, item: project, loading } = useCourseContent(courseId, 'project', moduleId);
  const { celebration, closeCelebration, feedbackOpen, closeFeedback, complete } = useCompletionFlow();

  const [code, setCode] = useState('');
  const [starterCode, setStarterCode] = useState('');
  const runner = useCodeRunner();

  const [checkResults, setCheckResults] = useState(null); // legacy checks: array of bool | null
  const [testResults, setTestResults] = useState(null);   // test cases: array of bool | null
  const [checking, setChecking] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hintsShown, setHintsShown] = useState(0); // how many hints the learner has unlocked

  // Load the starter code once the project arrives, and re-lock the hints
  // whenever we move to a different project.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- seed the editor from the project we just fetched
    setCode(project?.starterCode || '');
    setStarterCode(project?.starterCode || '');
    setHintsShown(0);
  }, [project]);

  // Gate the project behind finishing the module's lessons — a student who
  // deep-links to a locked project goes back to the course list.
  useEffect(() => {
    if (!course) return;
    const numericId = moduleId.replace('module', '');
    const mod = course.modules?.find(m => String(m.moduleId ?? m.id) === numericId);
    if (!mod || !isAssignmentUnlocked(mod)) navigate('/', { replace: true });
  }, [course, moduleId, navigate]);

  // The green "Run" button drives the interactive terminal (input() prompts
  // pause and ask the learner for a line).
  const runCode = useCallback(() => runner.run(code), [runner, code]);

  // Run once, non-interactively, feeding a fixed stdin — used by "Check Project"
  // to grade each test case against its own input.
  const runOnce = useCallback(async (stdin) => {
    try {
      const res = await compilerService.runPython(code, stdin);
      return res.data.output;
    } catch {
      return null;
    }
  }, [code]);

  const handleCheck = async () => {
    setChecking(true);

    const tests = project.tests || [];
    let allGoalsPassed;

    if (tests.length > 0) {
      // Run the student's code once per test case, feeding each its own input.
      const results = [];
      for (const t of tests) {
        const out = await runOnce(toStdin(t.input));
        results.push(testPasses(t, out));
      }
      setTestResults(results);
      allGoalsPassed = results.length > 0 && results.every(Boolean);
    } else {
      // Legacy projects: substring checks against a single run.
      const out = await runOnce('');
      const checks = project.checks || [];
      const results = checks.map(c => checkPasses(c, code, out ?? ''));
      setCheckResults(results);
      allGoalsPassed = results.length > 0 && results.every(Boolean);
    }

    setChecking(false);

    if (allGoalsPassed) {
      const projectKey = moduleId; // e.g. "module1"
      complete({
        kind: 'projects',
        id: projectKey,
        xpKey: `project-${projectKey}`,
        xp: PROJECT_XP,
        badge: {
          id: `project-${projectKey}`,
          name: `${project.title} Builder`,
          type: 'project',
        },
        celebration: ({ xpGained }) => ({
          title: 'Project Complete! 🛠️',
          message: project.successMessage
            || `Amazing! You built "${project.title}".${xpGained ? ` +${xpGained} XP!` : ''}`,
          badge: `${project.title} Builder`,
        }),
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24">
        <div className="animate-float text-5xl">🛠️</div>
        <p className="font-lab text-lg font-semibold text-ink/65">Loading your project...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
        <span className="text-5xl">🚧</span>
        <p className="font-lab text-lg font-semibold text-ink/65">This project isn't ready yet.</p>
        <Link to="/" className="lab-btn rounded-xl border-2 border-ink bg-signal px-5 py-2.5 font-extrabold text-ink">Back to Quests</Link>
      </div>
    );
  }

  const hasTests = (project.tests?.length || 0) > 0;
  const usesInput = hasTests || project.inputPlaceholder != null || (project.starterCode || '').includes('input(');
  const goalResults = hasTests ? testResults : checkResults;
  const allPassed = goalResults && goalResults.length > 0 && goalResults.every(Boolean);
  const nextLessonId = getNextLessonAfterModule(course, moduleId.replace('module', ''));
  const hints = project.hints || [];
  const problem = project.problem;

  return (
    <div className="flex w-full flex-col lg:h-[calc(100vh-64px)] lg:flex-row lg:overflow-hidden">
      <Celebration
        open={!!celebration}
        title={celebration?.title}
        message={celebration?.message}
        badge={celebration?.badge}
        onClose={() => closeCelebration()}
      />

      <FeedbackModal open={feedbackOpen} courseId={courseId} onClose={closeFeedback} />

      {/* Mobile-only top bar to open the lesson list */}
      <div className="flex items-center gap-3 border-b-2 border-ink/15 bg-paper px-4 py-3 lg:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex items-center gap-2 rounded-lg border-2 border-ink px-3 py-2 text-sm font-bold text-ink active:scale-95"
        >
          <Menu className="h-4 w-4" /> Lessons
        </button>
        <span className="truncate text-sm font-semibold text-ink/55">{course?.title}</span>
      </div>

      {/* Backdrop for the mobile drawer */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar: slide-in drawer on mobile, static column on desktop — the
          course navigation stays put while the project is open. */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-72 transform bg-paper shadow-xl transition-transform duration-300 lg:static lg:z-0 lg:w-64 lg:translate-x-0 lg:shadow-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute right-2 top-2 z-10 rounded-md p-1.5 text-ink/55 hover:bg-ink/10 lg:hidden"
          aria-label="Close lessons"
        >
          <X className="h-5 w-5" />
        </button>
        <Sidebar course={course} currentProjectKey={moduleId} onNavigate={() => setSidebarOpen(false)} />
      </div>

      {/* Brief + checklist.
          Layout: on wide screens, the pane splits into a two-column grid so
          the problem spec sits beside steps+hints, and the goals panel spans
          the full width below. The whole pane uses `container-type: inline-size`
          so it measures its own width, not the viewport's (there's a 600px
          editor beside it that would otherwise skew a viewport-based query). */}
      <div className="bench-grid min-w-0 flex-1 overflow-y-auto p-4 sm:p-8 [container-type:inline-size]">
        <div className="mx-auto w-full max-w-[86rem]">
          {/* Header: chip + title + brief blurb sit inline so wide screens don't
              waste vertical space with a stacked heading block. */}
          <div className="mb-6 flex flex-wrap items-center gap-4 border-b-2 border-ink/10 pb-6">
            <span className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-ink bg-white text-3xl shadow-[3px_3px_0_rgba(27,27,27,0.9)]">
              {project.emoji || '🛠️'}
            </span>
            <div className="min-w-0 flex-1">
              <p className="ref-tag text-pcb">Mini Project · {moduleId.toUpperCase()}</p>
              <h1 className="font-lab text-2xl font-extrabold text-ink sm:text-3xl">{project.title}</h1>
            </div>
            <p className="w-full text-ink/75 leading-relaxed @min-[42rem]:w-auto @min-[42rem]:max-w-md @min-[42rem]:text-base">
              {project.brief}
            </p>
          </div>

          {/* Two-column area for problem vs steps+hints. With a problem spec,
              it takes 3/5 (denser reading) and steps+hints take 2/5. Projects
              that ship no problem block let steps+hints use the whole row
              rather than leaving 3/5 of it empty. Below the breakpoint
              everything stacks. */}
          <div className="mb-6 grid grid-cols-1 gap-6 @min-[64rem]:grid-cols-5">
            {/* Left: The problem spec (dense reading, so it gets the room) */}
            {problem && (
              <div className="lab-panel p-5 sm:p-6 @min-[64rem]:col-span-3">
                <h3 className="mb-3 flex items-center gap-2 font-lab font-bold text-ink">
                  <Target className="h-5 w-5 text-pcb" /> The problem
                </h3>
                <p className="text-lg leading-relaxed text-ink/80">{problem.goal}</p>

                {problem.example && (
                  <div className="mt-4 rounded-xl border-2 border-ink/15 bg-white p-4">
                    <p className="ref-tag mb-3 text-ink/45">Example</p>
                    <div className="grid grid-cols-1 gap-4 @min-[36rem]:grid-cols-2">
                      <div>
                        <p className="ref-tag mb-2 text-ink/55">Person types</p>
                        <div className="flex flex-wrap gap-1.5">
                          {(problem.example.typed || []).map((t, i) => (
                            <code key={i} className="rounded-md bg-paper px-2 py-1 font-mono-lab text-sm text-pcb ring-2 ring-ink/15">{t}</code>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="ref-tag mb-2 text-ink/55">Bot prints</p>
                        <div className="space-y-1">
                          {(problem.example.output || []).map((o, i) => (
                            <div key={i} className="rounded-md bg-well px-2 py-1 font-mono-lab text-sm text-white/90">{o}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {problem.rules?.length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {problem.rules.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-ink/75">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-pcb" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Right: Steps + Hints. Compact beside a problem spec, but they
                spread into two side-by-side panels when they own the row. */}
            {/* Full class strings, never interpolated: Tailwind only sees
                classes it can find literally in the source. */}
            <div className={
              problem
                ? 'flex flex-col gap-6 @min-[64rem]:col-span-2'
                : 'grid grid-cols-1 gap-6 @min-[48rem]:grid-cols-2 @min-[64rem]:col-span-5'
            }>
              {project.steps?.length > 0 && (
                <div className="lab-panel p-5 sm:p-6">
                  <h3 className="mb-4 flex items-center gap-2 font-lab font-bold text-ink">
                    <Hammer className="h-5 w-5 text-pcb" /> Your mission
                  </h3>
                  <ol className="space-y-3">
                    {project.steps.map((s, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 border-ink bg-signal text-xs font-extrabold text-ink">{i + 1}</span>
                        <span className="text-ink/75">{s}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {hints.length > 0 && (
                <div className="lab-panel p-5 sm:p-6">
                  <h3 className="mb-1 flex items-center gap-2 font-lab font-bold text-ink">
                    <Lightbulb className="h-5 w-5 fill-signal text-ink" /> Stuck? Take a hint
                  </h3>
                  <p className="mb-4 text-sm text-ink/55">
                    Try it on your own first. Hints are here whenever you want one.
                  </p>

                  <ol className="space-y-3">
                    {hints.slice(0, hintsShown).map((h, i) => (
                      <li key={i} className="flex items-start gap-3 rounded-xl border-2 border-ink/15 bg-white p-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 border-ink bg-signal text-xs font-extrabold text-ink">
                          {i + 1}
                        </span>
                        <span className="text-ink/80">{h}</span>
                      </li>
                    ))}
                  </ol>

                  {hintsShown < hints.length ? (
                    <button
                      onClick={() => setHintsShown(n => n + 1)}
                      className={`lab-btn flex items-center gap-2 rounded-xl border-2 border-ink bg-white px-4 py-2.5 font-extrabold text-ink ${hintsShown > 0 ? 'mt-3' : ''}`}
                    >
                      <Lightbulb className="h-4 w-4" />
                      {hintsShown === 0 ? 'Show a hint' : 'Show another hint'}
                      <span className="text-ink/45">({hints.length - hintsShown} left)</span>
                    </button>
                  ) : (
                    <p className="mt-3 text-sm font-semibold text-ink/50">That's every hint: you've got this!</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Goals / test cases — full width. This is the panel a student
              lives in while iterating, so it gets the horizontal room to lay
              its cases out side by side once there is space. */}
          <div className="lab-panel p-5 sm:p-6">
            <h3 className="mb-4 flex items-center gap-2 font-lab font-bold text-ink">
              <ListChecks className="h-5 w-5 text-pcb" />
              {hasTests ? 'Test cases · your bot must pass them all' : 'Goals to pass'}
            </h3>

            {hasTests ? (
              <ul className="grid grid-cols-1 gap-3 @min-[48rem]:grid-cols-2 @min-[80rem]:grid-cols-3">
                {project.tests.map((t, i) => {
                  const passed = testResults?.[i];
                  const paint = passed === true
                    ? 'border-pcb bg-pcb/8'
                    : passed === false
                      ? 'border-wire bg-wire/8'
                      : 'border-ink/15 bg-white';
                  return (
                    <li key={i} className={`rounded-xl border-2 p-4 ${paint}`}>
                      <div className="flex items-center gap-2">
                        {passed === true ? (
                          <CheckCircle2 className="h-5 w-5 shrink-0 text-pcb" />
                        ) : passed === false ? (
                          <XCircle className="h-5 w-5 shrink-0 text-wire" />
                        ) : (
                          <Circle className="h-5 w-5 shrink-0 text-ink/30" />
                        )}
                        <span className="font-lab font-extrabold text-ink">Test {i + 1}: {t.name}</span>
                      </div>
                      <div className="mt-3 space-y-2 text-sm">
                        <div>
                          <p className="ref-tag mb-1 text-ink/55">We type</p>
                          <div className="flex flex-wrap gap-1.5">
                            {(t.input || []).map((val, j) => (
                              <code key={j} className="rounded-md bg-paper px-2 py-0.5 font-mono-lab text-pcb ring-2 ring-ink/15">{val}</code>
                            ))}
                          </div>
                        </div>
                        {Array.isArray(t.expect) && (
                          <div>
                            <p className="ref-tag mb-1 text-ink/55">Bot must say</p>
                            <div className="space-y-1">
                              {t.expect.map((e, j) => (
                                <div key={j} className="rounded-md bg-well px-2 py-1 font-mono-lab text-xs text-white/90">{e}</div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <ul className="grid grid-cols-1 gap-3 @min-[48rem]:grid-cols-2">
                {(project.checks || []).map((c, i) => {
                  const passed = checkResults?.[i];
                  return (
                    <li key={i} className={`flex items-center gap-3 rounded-xl border-2 p-3 ${
                      passed === true ? 'border-pcb bg-pcb/8'
                        : passed === false ? 'border-wire bg-wire/8'
                        : 'border-ink/15 bg-white'
                    }`}>
                      {passed === true ? (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-pcb" />
                      ) : passed === false ? (
                        <XCircle className="h-5 w-5 shrink-0 text-wire" />
                      ) : (
                        <Circle className="h-5 w-5 shrink-0 text-ink/30" />
                      )}
                      <span className="font-medium text-ink">{c.label}</span>
                    </li>
                  );
                })}
              </ul>
            )}

            {goalResults && !allPassed && (
              <p className="mt-4 rounded-xl border-2 border-signal bg-signal/15 p-3 text-sm font-semibold text-ink">
                Almost! Some goals aren't met yet. Tweak your code and check again.
              </p>
            )}
            {allPassed && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="flex items-center gap-2 rounded-xl border-2 border-pcb bg-pcb/10 px-3 py-2 text-sm font-bold text-ink">
                  <Trophy className="h-4 w-4 text-pcb" /> All goals passed. Project complete!
                </p>
                {nextLessonId ? (
                  <Link
                    to={`/course/${courseId}/lesson/${nextLessonId}`}
                    className="lab-btn flex items-center justify-center gap-2 rounded-xl border-2 border-ink bg-signal px-6 py-3 font-extrabold text-ink"
                  >
                    Continue learning <ArrowRight className="h-5 w-5" />
                  </Link>
                ) : (
                  <Link
                    to="/"
                    className="lab-btn flex items-center justify-center gap-2 rounded-xl border-2 border-ink bg-signal px-6 py-3 font-extrabold text-ink"
                  >
                    Back to quests <ArrowRight className="h-5 w-5" />
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Editor + output */}
      <div className="z-10 flex w-full flex-col border-t-2 border-ink bg-paper shadow-2xl lg:h-full lg:w-[600px] lg:border-l-2 lg:border-l-ink lg:border-t-0">
        <div className="flex h-[55vh] flex-col border-b-2 border-ink/15 bg-paper p-4 sm:p-5 lg:h-[60%]">
          <div className="mb-4 flex shrink-0 items-center justify-between">
            <h3 className="flex items-center font-lab text-lg font-extrabold text-ink">
              <span className="mr-2 h-3 w-3 rounded-full bg-pcb ring-2 ring-ink/20"></span>
              Build here
            </h3>
            <div className="flex gap-2">
              <button
                onClick={runCode}
                disabled={runner.running}
                title="Run (Ctrl/Cmd + Enter)"
                className="lab-btn flex items-center rounded-lg border-2 border-ink bg-white px-4 py-2.5 font-extrabold text-ink disabled:opacity-60"
              >
                <Play className="mr-2 h-5 w-5" /> {runner.running ? 'Running…' : 'Run'}
              </button>
              <button
                onClick={handleCheck}
                disabled={runner.running || checking}
                className="lab-btn flex items-center rounded-lg border-2 border-ink bg-signal px-4 py-2.5 font-extrabold text-ink disabled:opacity-60"
              >
                {checking ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
                Check project
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1">
            <CodeEditor code={code} onChange={setCode} onRun={runCode} starterCode={starterCode} filename="project.py" />
          </div>
        </div>

        <div className="flex h-[40vh] flex-col gap-3 bg-paper p-4 sm:p-5 lg:h-[40%]">
          <div className="min-h-0 flex-1 overflow-hidden rounded-xl border-2 border-ink">
            <Terminal
              lines={runner.lines}
              running={runner.running}
              waiting={runner.waiting}
              onSubmit={runner.submitInput}
              emptyHint={usesInput
                ? 'Run your code. When the bot asks a question, type your answer right here.'
                : 'Run your code to see the output here…'}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
