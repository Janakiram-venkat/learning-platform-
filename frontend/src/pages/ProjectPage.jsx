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
} from '../utils/progress';
import { Play, CheckCircle2, Circle, ListChecks, Hammer, Loader2, Trophy, ArrowRight } from 'lucide-react';

const PROJECT_XP = 80;

// Evaluate one check against the student's code + program output.
function checkPasses(check, code, output) {
  const out = (output || '').toLowerCase();
  const src = (code || '').toLowerCase();
  if (check.outputContains && !out.includes(String(check.outputContains).toLowerCase())) return false;
  if (check.codeContains && !src.includes(String(check.codeContains).toLowerCase())) return false;
  return true;
}

export default function ProjectPage() {
  const { courseId, moduleId } = useParams(); // moduleId e.g. "module1"
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [runError, setRunError] = useState('');

  const [checkResults, setCheckResults] = useState(null); // array of bool | null
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
          navigate('/courses', { replace: true });
          return;
        }
        setCourse(course);
        const data = projectRes.data.data;
        setProject(data);
        setCode(data.starterCode || '');
      })
      .catch(() => { if (active) setNotFound(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [courseId, moduleId, navigate]);

  const runCode = useCallback(async () => {
    setIsRunning(true);
    setRunError('');
    try {
      const res = await compilerService.runPython(code);
      setOutput(res.data.output);
      return res.data.output;
    } catch {
      setRunError('Failed to run your code. Please try again.');
      return null;
    } finally {
      setIsRunning(false);
    }
  }, [code]);

  const handleCheck = async () => {
    setChecking(true);
    const out = await runCode();
    const checks = project.checks || [];
    const results = checks.map(c => checkPasses(c, code, out ?? ''));
    setCheckResults(results);
    setChecking(false);

    if (results.length > 0 && results.every(Boolean)) {
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
        <Link to="/courses" className="rounded-xl bg-purple-600 px-5 py-2.5 font-bold text-white">Back to Quests</Link>
      </div>
    );
  }

  const allPassed = checkResults && checkResults.length > 0 && checkResults.every(Boolean);
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

          {/* Checklist of goals */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <h3 className="mb-4 flex items-center gap-2 font-bold text-gray-900">
              <ListChecks className="h-5 w-5 text-green-600" /> Goals to pass
            </h3>
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
            {checkResults && !allPassed && (
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
                    to="/courses"
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

        <div className="flex h-[40vh] flex-col bg-gray-50 p-4 sm:p-5 lg:h-[40%]">
          <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-gray-300 shadow-inner">
            <OutputPanel output={output} isRunning={isRunning} error={runError} />
          </div>
        </div>
      </div>
    </div>
  );
}
