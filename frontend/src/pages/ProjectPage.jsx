import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { courseService, compilerService } from '../services/api';
import CodeEditor from '../components/editor/CodeEditor';
import Terminal from '../components/editor/Terminal';
import { useCodeRunner } from '../hooks/useCodeRunner';
import Celebration from '../components/feedback/Celebration';
import {
  isAssignmentUnlocked,
  isProjectCompleted,
  markProjectComplete,
  awardXPOnce,
  getNextLessonAfterModule,
  notifyProgressChange,
} from '../utils/progress';
import { Play, CheckCircle2, Circle, ListChecks, Hammer, Loader2, Trophy, ArrowRight, XCircle } from 'lucide-react';

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

  const [project, setProject] = useState(null);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [code, setCode] = useState('');
  const [starterCode, setStarterCode] = useState('');
  const runner = useCodeRunner();

  const [checkResults, setCheckResults] = useState(null); // legacy checks: array of bool | null
  const [testResults, setTestResults] = useState(null);   // test cases: array of bool | null
  const [checking, setChecking] = useState(false);
  const [celebration, setCelebration] = useState(null);

  useEffect(() => {
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset the loading flag when the route params change and we refetch
    setLoading(true);
    Promise.all([
      courseService.getCourse(courseId),
      courseService.getProject(courseId, moduleId),
    ])
      .then(([courseRes, projectRes]) => {
        if (!active) return;
        const course = courseRes.data.data;
        const numericId = moduleId.replace('module', '');
        const mod = course.modules?.find(m => String(m.moduleId ?? m.id) === numericId);
        // Gate the project behind finishing the module's lessons.
        if (!mod || !isAssignmentUnlocked(mod)) {
          navigate('/', { replace: true });
          return;
        }
        setCourse(course);
        const data = projectRes.data.data;
        setProject(data);
        setCode(data.starterCode || '');
        setStarterCode(data.starterCode || '');
      })
      .catch(() => { if (active) setNotFound(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [courseId, moduleId, navigate]);

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
      const firstTime = !isProjectCompleted(projectKey);
      markProjectComplete(projectKey);
      const gained = awardXPOnce(`project-${projectKey}`, PROJECT_XP);

      // Drop a project badge into the profile (once).
      try {
        const badges = JSON.parse(localStorage.getItem('earnedBadges') || '[]');
        const badgeId = `project-${projectKey}`;
        if (!badges.some(b => b.id === badgeId)) {
          badges.push({
            id: badgeId,
            name: `${project.title} Builder`,
            type: 'project',
            earnedAt: new Date().toISOString(),
          });
          localStorage.setItem('earnedBadges', JSON.stringify(badges));
          notifyProgressChange();
        }
      } catch { /* ignore storage errors */ }

      setCelebration({
        title: 'Project Complete! 🛠️',
        message: project.successMessage
          || `Amazing! You built "${project.title}".${gained ? ` +${gained} XP!` : firstTime ? '' : ''}`,
        badge: `${project.title} Builder`,
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

  if (notFound || !project) {
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

  return (
    <div className="flex w-full flex-col lg:h-[calc(100vh-64px)] lg:flex-row lg:overflow-hidden">
      <Celebration
        open={!!celebration}
        title={celebration?.title}
        message={celebration?.message}
        badge={celebration?.badge}
        onClose={() => setCelebration(null)}
      />

      {/* Brief + checklist */}
      <div className="flex-1 overflow-y-auto bg-paper p-4 sm:p-8">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 flex items-center gap-3">
            <span className="text-4xl">{project.emoji || '🛠️'}</span>
            <div>
              <p className="ref-tag text-pcb">Mini Project</p>
              <h1 className="font-lab text-2xl font-extrabold text-ink sm:text-3xl">{project.title}</h1>
            </div>
          </div>

          <p className="mb-8 lab-panel p-5 text-lg leading-relaxed text-ink/75">
            {project.brief}
          </p>

          {/* Steps */}
          {project.steps?.length > 0 && (
            <div className="mb-8 lab-panel p-5 sm:p-6">
              <h3 className="mb-4 flex items-center gap-2 font-lab font-bold text-ink">
                <Hammer className="h-5 w-5 text-wire" /> Your mission, step by step
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

          {/* Goals: test cases (new) or legacy substring checks */}
          <div className="lab-panel p-5 sm:p-6">
            <h3 className="mb-4 flex items-center gap-2 font-lab font-bold text-ink">
              <ListChecks className="h-5 w-5 text-pcb" />
              {hasTests ? 'Test Cases — your bot must pass them all' : 'Goals to pass'}
            </h3>

            {hasTests ? (
              <ul className="space-y-3">
                {project.tests.map((t, i) => {
                  const passed = testResults?.[i];
                  return (
                    <li
                      key={i}
                      className={`rounded-xl border p-3 ${
                        passed === true ? 'border-green-200 bg-green-50'
                          : passed === false ? 'border-rose-200 bg-rose-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {passed === true ? (
                          <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                        ) : passed === false ? (
                          <XCircle className="h-5 w-5 shrink-0 text-rose-400" />
                        ) : (
                          <Circle className="h-5 w-5 shrink-0 text-gray-300" />
                        )}
                        <span className="font-bold text-gray-800">Test {i + 1}: {t.name}</span>
                      </div>
                      <div className="mt-2 space-y-1 pl-7 text-sm">
                        <p className="text-gray-600">
                          <span className="font-semibold">We type:</span>{' '}
                          <code className="rounded bg-white px-1.5 py-0.5 text-pcb ring-1 ring-ink/15">
                            {(t.input || []).join(' → ')}
                          </code>
                        </p>
                        {Array.isArray(t.expect) && (
                          <p className="text-gray-600">
                            <span className="font-semibold">Bot must say:</span>{' '}
                            {t.expect.map((e, j) => (
                              <code key={j} className="mr-1 rounded bg-white px-1.5 py-0.5 text-emerald-700 ring-1 ring-gray-200">{e}</code>
                            ))}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <ul className="space-y-3">
                {(project.checks || []).map((c, i) => {
                  const passed = checkResults?.[i];
                  return (
                    <li key={i} className="flex items-center gap-3">
                      {passed === true ? (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                      ) : passed === false ? (
                        <Circle className="h-5 w-5 shrink-0 text-rose-300" />
                      ) : (
                        <Circle className="h-5 w-5 shrink-0 text-gray-300" />
                      )}
                      <span className={`font-medium ${passed === true ? 'text-green-700' : passed === false ? 'text-rose-600' : 'text-gray-600'}`}>
                        {c.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}

            {goalResults && !allPassed && (
              <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm font-medium text-amber-800 ring-1 ring-amber-100">
                Almost! Some goals aren't met yet — tweak your code and check again. 💪
              </p>
            )}
            {allPassed && (
              <div className="mt-4 space-y-3">
                <p className="flex items-center gap-2 rounded-xl bg-green-50 p-3 text-sm font-bold text-green-700 ring-1 ring-green-100">
                  <Trophy className="h-4 w-4" /> All goals passed — project complete!
                </p>
                {nextLessonId ? (
                  <Link
                    to={`/course/${courseId}/lesson/${nextLessonId}`}
                    className="lab-btn flex w-full items-center justify-center gap-2 rounded-xl border-2 border-ink bg-signal px-6 py-3 font-extrabold text-ink"
                  >
                    Continue Learning <ArrowRight className="h-5 w-5" />
                  </Link>
                ) : (
                  <Link
                    to="/"
                    className="lab-btn flex w-full items-center justify-center gap-2 rounded-xl border-2 border-ink bg-signal px-6 py-3 font-extrabold text-ink"
                  >
                    Back to Quests <ArrowRight className="h-5 w-5" />
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Editor + output */}
      <div className="z-10 flex w-full flex-col border-t border-gray-200 bg-white shadow-2xl lg:h-full lg:w-[600px] lg:border-l lg:border-t-0">
        <div className="flex h-[55vh] flex-col border-b border-gray-200 bg-gray-50 p-4 sm:p-5 lg:h-[60%]">
          <div className="mb-4 flex shrink-0 items-center justify-between">
            <h3 className="flex items-center font-lab text-lg font-extrabold text-ink">
              <span className="mr-2 h-3 w-3 rounded-full bg-pcb"></span>
              Build Here
            </h3>
            <div className="flex gap-2">
              <button
                onClick={runCode}
                disabled={runner.running}
                title="Run (Ctrl/Cmd + Enter)"
                className="lab-btn flex items-center rounded-lg border-2 border-ink bg-white px-4 py-2.5 font-extrabold text-ink disabled:opacity-60"
              >
                <Play className="mr-2 h-5 w-5" /> {runner.running ? 'Running...' : 'Run'}
              </button>
              <button
                onClick={handleCheck}
                disabled={runner.running || checking}
                className="lab-btn flex items-center rounded-lg border-2 border-ink bg-signal px-4 py-2.5 font-extrabold text-ink disabled:opacity-60"
              >
                {checking ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
                Check Project
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1">
            <CodeEditor code={code} onChange={setCode} onRun={runCode} starterCode={starterCode} filename="project.py" />
          </div>
        </div>

        <div className="flex h-[40vh] flex-col gap-3 bg-gray-50 p-4 sm:p-5 lg:h-[40%]">
          <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-gray-300 shadow-inner">
            <Terminal
              lines={runner.lines}
              running={runner.running}
              waiting={runner.waiting}
              onSubmit={runner.submitInput}
              emptyHint={usesInput
                ? 'Run your code — when the bot asks a question, type your answer right here.'
                : 'Run your code to see the output here…'}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
