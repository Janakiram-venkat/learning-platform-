import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { courseService, compilerService } from '../services/api';
import CodeEditor from '../components/editor/CodeEditor';
import OutputPanel from '../components/editor/OutputPanel';
import Celebration from '../components/feedback/Celebration';
import {
  isAssignmentUnlocked,
  isProjectCompleted,
  markProjectComplete,
  awardXPOnce,
  getNextLessonAfterModule,
  notifyProgressChange,
} from '../utils/progress';
import { Play, CheckCircle2, Circle, ListChecks, Hammer, Loader2, Trophy, ArrowRight, XCircle, Terminal } from 'lucide-react';

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
  const [stdinInput, setStdinInput] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [runError, setRunError] = useState('');

  const [checkResults, setCheckResults] = useState(null); // legacy checks: array of bool | null
  const [testResults, setTestResults] = useState(null);   // test cases: array of bool | null
  const [checking, setChecking] = useState(false);
  const [celebration, setCelebration] = useState(null);

  useEffect(() => {
    let active = true;
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
        setStdinInput(data.inputPlaceholder || '');
      })
      .catch(() => { if (active) setNotFound(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [courseId, moduleId, navigate]);

  const runCode = useCallback(async () => {
    setIsRunning(true);
    setRunError('');
    try {
      const res = await compilerService.runPython(code, stdinInput);
      setOutput(res.data.output);
      return res.data.output;
    } catch {
      setRunError('Failed to run your code. Please try again.');
      return null;
    } finally {
      setIsRunning(false);
    }
  }, [code, stdinInput]);

  const handleCheck = async () => {
    setChecking(true);

    const tests = project.tests || [];
    let allGoalsPassed;

    if (tests.length > 0) {
      // Run the student's code once per test case, feeding each its own input.
      const results = [];
      let lastOutput = '';
      for (const t of tests) {
        let out = null;
        try {
          const res = await compilerService.runPython(code, toStdin(t.input));
          out = res.data.output;
          lastOutput = out;
        } catch {
          setRunError('Failed to run your code. Please try again.');
        }
        results.push(testPasses(t, out));
      }
      setTestResults(results);
      setOutput(lastOutput); // show the output of the final test case
      allGoalsPassed = results.length > 0 && results.every(Boolean);
    } else {
      // Legacy projects: substring checks against a single run.
      const out = await runCode();
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
        <p className="font-display text-lg font-semibold text-[#6C63A6]">Loading your project...</p>
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
        <span className="text-5xl">🚧</span>
        <p className="font-display text-lg font-semibold text-[#6C63A6]">This project isn't ready yet.</p>
        <Link to="/" className="rounded-xl bg-purple-600 px-5 py-2.5 font-bold text-white">Back to Quests</Link>
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
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-8">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 flex items-center gap-3">
            <span className="text-4xl">{project.emoji || '🛠️'}</span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-purple-500">Mini Project</p>
              <h1 className="font-display text-2xl font-extrabold text-[#2D2A4A] sm:text-3xl">{project.title}</h1>
            </div>
          </div>

          <p className="mb-8 rounded-2xl border border-purple-100 bg-white p-5 text-lg leading-relaxed text-gray-700 shadow-sm">
            {project.brief}
          </p>

          {/* Steps */}
          {project.steps?.length > 0 && (
            <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
              <h3 className="mb-4 flex items-center gap-2 font-bold text-gray-900">
                <Hammer className="h-5 w-5 text-orange-500" /> Your mission, step by step
              </h3>
              <ol className="space-y-3">
                {project.steps.map((s, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-extrabold text-purple-700">{i + 1}</span>
                    <span className="text-gray-700">{s}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Goals: test cases (new) or legacy substring checks */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <h3 className="mb-4 flex items-center gap-2 font-bold text-gray-900">
              <ListChecks className="h-5 w-5 text-green-600" />
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
                          <code className="rounded bg-white px-1.5 py-0.5 text-purple-700 ring-1 ring-gray-200">
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
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-600 px-6 py-3 font-extrabold text-white shadow-md transition-transform hover:scale-[1.02] active:scale-95"
                  >
                    Continue Learning <ArrowRight className="h-5 w-5" />
                  </Link>
                ) : (
                  <Link
                    to="/"
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-600 px-6 py-3 font-extrabold text-white shadow-md transition-transform hover:scale-[1.02] active:scale-95"
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
            <h3 className="flex items-center text-lg font-extrabold text-gray-900">
              <span className="mr-2 h-3 w-3 rounded-full bg-purple-500"></span>
              Build Here
            </h3>
            <div className="flex gap-2">
              <button
                onClick={runCode}
                disabled={isRunning}
                className="flex items-center rounded-lg bg-blue-600 px-4 py-2.5 font-bold text-white shadow-md transition-all hover:bg-blue-700 active:scale-95 disabled:bg-blue-300"
              >
                <Play className="mr-2 h-5 w-5" /> {isRunning ? 'Running...' : 'Run'}
              </button>
              <button
                onClick={handleCheck}
                disabled={isRunning || checking}
                className="flex items-center rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-2.5 font-bold text-white shadow-md transition-all hover:scale-105 active:scale-95 disabled:opacity-60"
              >
                {checking ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
                Check Project
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-gray-300 bg-white shadow-sm">
            <CodeEditor code={code} onChange={setCode} />
          </div>
        </div>

        <div className="flex h-[40vh] flex-col gap-3 bg-gray-50 p-4 sm:p-5 lg:h-[40%]">
          {usesInput && (
            <div className="shrink-0">
              <label className="mb-1 flex items-center gap-1.5 text-sm font-bold text-gray-700">
                <Terminal className="h-4 w-4 text-purple-500" /> What you say to the bot
              </label>
              <textarea
                value={stdinInput}
                onChange={(e) => setStdinInput(e.target.value)}
                rows={2}
                spellCheck={false}
                placeholder={project.inputPlaceholder || 'Type one answer per line...'}
                className="w-full resize-none rounded-xl border border-gray-300 bg-white p-2.5 font-mono text-sm text-gray-800 shadow-inner focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
              />
              {project.inputHint && (
                <p className="mt-1 text-xs text-gray-500">{project.inputHint}</p>
              )}
            </div>
          )}
          <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-gray-300 shadow-inner">
            <OutputPanel output={output} isRunning={isRunning} error={runError} />
          </div>
        </div>
      </div>
    </div>
  );
}
