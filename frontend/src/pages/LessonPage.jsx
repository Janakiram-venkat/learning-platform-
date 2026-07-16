import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseService, compilerService, quizService } from '../services/api';
import Sidebar from '../components/layout/Sidebar';
import CodeEditor from '../components/editor/CodeEditor';
import OutputPanel from '../components/editor/OutputPanel';
import Celebration from '../components/feedback/Celebration';
import FeedbackModal from '../components/feedback/FeedbackModal';
import { getUnlockedLessonIds, awardXPOnce, shouldAskFeedback, markFeedbackAsked, notifyProgressChange } from '../utils/progress';
import LessonSimulation from '../components/lesson/LessonSimulation';
import LabRunner from '../components/lab/LabRunner';
import SignInModal from '../components/auth/SignInModal';
import { useAuth } from '../context/AuthContext';
import { Play, CheckCircle2, XCircle, Lightbulb, Menu, X, Lock } from 'lucide-react';

export default function LessonPage() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [runError, setRunError] = useState('');
  
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [celebration, setCelebration] = useState(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [pendingAdvance, setPendingAdvance] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lab, setLab] = useState(null); // { data, moduleKey } — embedded in the right panel for no-code courses

  // --- Resizable split between the lesson and the right panel (editor/lab) ---
  // `splitPct` is the lesson column's width as a % of the row; the right panel
  // takes the rest. Persisted so a student's preferred layout sticks. The
  // interactive lab needs more room than the code editor, so each panel type
  // has its own default + saved width. Only active on desktop (side-by-side).
  const SPLIT_MIN = 30;
  const SPLIT_MAX = 80;
  const isLabCourse = course?.hasEditor === false;
  const splitKey = isLabCourse ? 'lessonSplitPct:lab' : 'lessonSplitPct:editor';
  const defaultSplit = isLabCourse ? 55 : 65; // lab gets 45%, editor gets 35%
  const clampSplit = (v) => Math.min(SPLIT_MAX, Math.max(SPLIT_MIN, v));

  const splitContainerRef = useRef(null);
  const draggingRef = useRef(false);
  const [splitPct, setSplitPct] = useState(defaultSplit);
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = (e) => setIsDesktop(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Load the saved (or default) split once we know which panel type this course
  // uses, then persist any change back under that type's key.
  useEffect(() => {
    if (!course) return;
    const saved = parseFloat(localStorage.getItem(splitKey));
    setSplitPct(Number.isFinite(saved) ? clampSplit(saved) : defaultSplit);
  }, [course, splitKey, defaultSplit]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (course) localStorage.setItem(splitKey, String(splitPct));
  }, [splitPct, splitKey, course]);

  const startResize = useCallback((e) => {
    e.preventDefault();
    draggingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const onMove = (e) => {
      if (!draggingRef.current || !splitContainerRef.current) return;
      const rect = splitContainerRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setSplitPct(Math.min(SPLIT_MAX, Math.max(SPLIT_MIN, pct)));
      // (clamp inlined to keep this listener free of render-scope deps)
    };
    const onUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, []);

  useEffect(() => {
    setLoading(true);
    setQuizResult(null);
    setQuizAnswers({});
    setCelebration(null);
    setFeedbackOpen(false);
    setPendingAdvance(false);
    setSignInOpen(false);
    setOutput('');
    setRunError('');

    // Fetch Course & Lesson
    Promise.all([
      courseService.getCourse(courseId),
      courseService.getLesson(courseId, lessonId)
    ]).then(([courseRes, lessonRes]) => {
      const courseData = courseRes.data.data;
      setCourse(courseData);

      // Block direct access to a locked lesson — bounce back to the course list.
      if (!getUnlockedLessonIds(courseData).has(lessonId)) {
        navigate('/', { replace: true });
        return;
      }

      const lessonData = lessonRes.data.data;
      setLesson(lessonData);
      setCode(lessonData.editorCode || '');
    }).catch(err => {
      console.error("Failed to load lesson data", err);
    }).finally(() => {
      setLoading(false);
    });
  }, [courseId, lessonId]);

  // For no-code courses (course.hasEditor === false), the right panel hosts the
  // module's Interactive Lab instead of a Python editor. Fetch it once we know
  // the course + which lesson we're on.
  useEffect(() => {
    if (!course || !lesson) { setLab(null); return; }
    if (course.hasEditor !== false) { setLab(null); return; }
    const parent = course.modules?.find(m => m.lessons?.some(l => l.lessonId === lessonId));
    if (!parent?.hasLab) { setLab(null); return; }
    const moduleKey = `module${parent.moduleId ?? parent.id}`;
    let active = true;
    courseService.getLab(courseId, moduleKey)
      .then(res => { if (active) setLab({ data: res.data.data, moduleKey }); })
      .catch(() => { if (active) setLab(null); });
    return () => { active = false; };
  }, [course, lesson, courseId, lessonId]);

  const handleRunCode = async () => {
    setIsRunning(true);
    setRunError('');
    try {
      const res = await compilerService.runPython(code);
      setOutput(res.data.output);
    } catch (err) {
      setRunError('Failed to execute code. Please try again.');
    } finally {
      setIsRunning(false);
    }
  };

  const handleQuizSubmit = async () => {
    if (!lesson.quiz) return;
    const answers = lesson.quiz.map((_, i) => quizAnswers[i] ?? -1);
    try {
      const res = await quizService.submitQuiz(courseId, lessonId, answers);
      setQuizResult(res.data);

      // Celebrate a perfect score with an animation (badges are earned by
      // completing whole modules, not individual quizzes).
      const { score, total } = res.data;

      // Award XP for correct answers — once per lesson so retakes don't farm.
      const gained = awardXPOnce(`quiz-${lessonId}`, score * 10);

      if (total > 0 && score === total) {
        setCelebration({
          variant: 'lesson',
          title: 'Perfect Score! 🎉',
          message: `You answered all ${total} ${total === 1 ? 'question' : 'questions'} correctly.${gained ? ` +${gained} XP earned!` : ''} Awesome work!`,
        });
      } else if (total > 0) {
        // Not all correct — gently prompt a retry. Explanations appear inline.
        setCelebration({
          variant: 'retry',
          title: 'Almost there!',
          message: `You scored ${score} / ${total}. Check the notes below each question to see why, then try again!`,
        });
      }
    } catch (err) {
      console.error("Quiz submission failed", err);
    }
  };

  const goToNext = () => {
    const allLessons = course?.modules?.flatMap(m => m.lessons || []) || [];
    const currentLessonIndex = allLessons.findIndex(l => l.lessonId === lessonId);
    const nextLesson = allLessons[currentLessonIndex + 1];

    if (nextLesson) {
      navigate(`/course/${courseId}/lesson/${nextLesson.lessonId}`);
    } else {
      navigate('/');
    }
  };

  // Every finished chapter (lesson) requires the student to be signed in before
  // moving on. Signed-in students continue straight away; otherwise we open the
  // sign-in modal and only advance once they've actually authenticated.
  const advanceToNext = () => {
    if (!user) {
      setSignInOpen(true);
      return;
    }
    goToNext();
  };

  const handleSignInClose = () => {
    setSignInOpen(false);
    // The modal closes on both success and dismissal. Only move on if the
    // student actually signed in (the auth context persists the profile).
    if (localStorage.getItem('currentUser')) {
      goToNext();
    }
  };

  // A lesson with a Knowledge Check can only be completed once every question
  // has been answered correctly (a perfect score on the most recent attempt).
  const hasQuiz = !!(lesson?.quiz && lesson.quiz.length > 0);
  const quizPassed = !hasQuiz || (!!quizResult && quizResult.total > 0 && quizResult.score === quizResult.total);

  const handleMarkComplete = () => {
    if (!quizPassed) return;
    const completed = JSON.parse(localStorage.getItem('completedLessons') || '[]');
    if (!completed.includes(lessonId)) {
      completed.push(lessonId);
      localStorage.setItem('completedLessons', JSON.stringify(completed));
      notifyProgressChange();
    }

    // Did finishing this lesson complete its whole module? If so, award a badge.
    const parentModule = course?.modules?.find(m =>
      m.lessons?.some(l => l.lessonId === lessonId)
    );
    if (parentModule) {
      const moduleDone = parentModule.lessons.every(l => completed.includes(l.lessonId));
      const badgeId = `module-${parentModule.moduleId ?? parentModule.id}`;
      const badges = JSON.parse(localStorage.getItem('earnedBadges') || '[]');
      if (moduleDone && !badges.some(b => b.id === badgeId)) {
        badges.push({
          id: badgeId,
          name: `${parentModule.title} Complete`,
          type: 'module',
          earnedAt: new Date().toISOString(),
        });
        localStorage.setItem('earnedBadges', JSON.stringify(badges));
        notifyProgressChange();
        // Show the celebration; navigate to the next lesson once it closes.
        setCelebration({
          title: 'Module Complete! 🏆',
          message: `You finished "${parentModule.title}". A new badge is waiting in your profile.`,
          badge: `${parentModule.title} Complete`,
          next: true,
        });
        return;
      }
    }

    // Regular lesson finished — celebrate with an animation (no badge), then advance.
    setCelebration({
      variant: 'lesson',
      title: 'Lesson Complete! ✅',
      message: 'Nice progress! Keep going to finish the module and earn its badge.',
      next: true,
    });
  };

  const handleCelebrationClose = () => {
    const advance = celebration?.next;
    setCelebration(null);
    // After finishing a module, occasionally ask for feedback before moving
    // on. Hold off navigating until the feedback modal is dismissed.
    if (shouldAskFeedback()) {
      setPendingAdvance(advance);
      setFeedbackOpen(true);
      return;
    }
    if (advance) advanceToNext();
  };

  const handleFeedbackClose = () => {
    markFeedbackAsked();
    setFeedbackOpen(false);
    if (pendingAdvance) {
      setPendingAdvance(false);
      advanceToNext();
    }
  };

  if (loading) return <div className="flex-1 flex items-center justify-center bg-paper font-lab font-bold text-ink/60">Loading lesson…</div>;
  if (!lesson) return <div className="flex-1 flex items-center justify-center bg-paper font-lab font-bold text-ink/60">Lesson not found.</div>;

  // No-code courses (e.g. AI Fundamentals) opt out of the Python editor panel
  // via "hasEditor": false in course.json. Coding courses default to showing it.
  const showEditor = course?.hasEditor !== false;
  const showRightPanel = showEditor || (!showEditor && !!lab);

  // Apply the draggable split only on desktop, and only when a right panel
  // exists. The 3px offsets leave room for the divider so the row stays at 100%.
  // The row reserves a fixed 14px: the 6px drag handle plus two 4px gaps
  // (lg:gap-1) on either side of it. Split that overhead evenly (7px) between
  // the two panels so their percentages still total the full row width.
  const splitActive = isDesktop && showRightPanel;
  const lessonStyle = splitActive ? { flex: `0 0 calc(${splitPct}% - 7px)`, maxWidth: `calc(${splitPct}% - 7px)` } : undefined;
  const panelStyle = splitActive ? { flex: `0 0 calc(${100 - splitPct}% - 7px)`, maxWidth: `calc(${100 - splitPct}% - 7px)` } : undefined;

  return (
    <div className="flex w-full flex-col lg:h-[calc(100vh-64px)] lg:flex-row lg:overflow-hidden">
      <Celebration
        open={!!celebration}
        title={celebration?.title}
        message={celebration?.message}
        badge={celebration?.badge}
        variant={celebration?.variant}
        onClose={handleCelebrationClose}
      />

      <FeedbackModal
        open={feedbackOpen}
        courseId={courseId}
        onClose={handleFeedbackClose}
      />

      {/* Chapter gate: students must be signed in to move on to the next lesson. */}
      <SignInModal open={signInOpen} onClose={handleSignInClose} />

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

      {/* Sidebar: slide-in drawer on mobile, static column on desktop */}
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
        <Sidebar course={course} currentLessonId={lessonId} onNavigate={() => setSidebarOpen(false)} />
      </div>

      {/* Split region (next to the sidebar): lesson | divider | right panel.
          The resize percentages are relative to THIS area, not the whole row,
          so the static sidebar can't push the panels off-screen. */}
      <div
        ref={splitContainerRef}
        className="flex w-full min-w-0 flex-1 flex-col lg:h-full lg:flex-row lg:gap-1 lg:overflow-hidden"
      >

      {/* Main Content Area */}
      <div style={lessonStyle} className="bench-grid min-w-0 flex-1 overflow-y-auto p-4 sm:p-8">
        <div className="mx-auto max-w-3xl rounded-2xl border-2 border-ink bg-white p-5 shadow-[4px_4px_0_rgba(22,36,29,0.9)] sm:p-10">
          <h1 className="font-lab mb-4 text-2xl font-extrabold tracking-tight text-ink sm:text-4xl">{lesson.title}</h1>
          <p className="mb-6 border-b-2 border-ink/10 pb-6 text-base text-ink/65 sm:mb-10 sm:text-lg">{lesson.description}</p>

          <div className="space-y-8 mb-16">
            {lesson.content?.map((block, idx) => {
              if (block.type === 'heading') return <h2 key={idx} className="font-lab text-2xl font-bold text-ink mt-10 mb-4">{block.value}</h2>;
              if (block.type === 'paragraph') return <p key={idx} className="text-ink/75 leading-relaxed text-lg">{block.value}</p>;
              if (block.type === 'tip') return (
                <div key={idx} className="bg-pcb/8 border-l-4 border-pcb p-6 rounded-r-lg text-ink">
                  <strong className="font-lab flex items-center mb-2 text-pcb"><CheckCircle2 className="w-5 h-5 mr-2" />Tip</strong>
                  <span className="text-lg">{block.value}</span>
                </div>
              );
              if (block.type === 'code') return (
                <pre key={idx} className="bg-[#0B180F] text-white/90 p-6 rounded-xl overflow-x-auto text-sm font-mono-lab border-2 border-ink shadow-inner">
                  {block.value}
                </pre>
              );
              if (block.type === 'simulation') return <LessonSimulation key={idx} sim={block} />;
              return null;
            })}
          </div>

          {/* Practice Section — coding exercises, only for courses with the editor */}
          {showEditor && lesson.practice && lesson.practice.length > 0 && (
            <div className="mb-16 border-2 border-ink rounded-2xl overflow-hidden shadow-[4px_4px_0_rgba(22,36,29,0.9)]">
              <div className="bg-pcb px-5 py-4 border-b-2 border-ink sm:px-8 sm:py-5">
                <h3 className="font-lab font-bold text-white text-lg">Practice Exercises</h3>
              </div>
              <div className="p-5 bg-white sm:p-8">
                {lesson.practice.map(p => (
                  <div key={p.id} className="mb-6 last:mb-0">
                    <p className="font-medium text-ink text-lg mb-4">Task: {p.question}</p>
                    <button
                      onClick={() => setCode(p.starterCode)}
                      className="inline-flex items-center justify-center border-2 border-ink text-ink hover:bg-pcb hover:text-white px-4 py-2 rounded-lg font-bold transition-colors"
                    >
                      Load Starter Code ➔
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quiz Section */}
          {lesson.quiz && lesson.quiz.length > 0 && (
            <div className="mb-16 border-2 border-ink rounded-2xl overflow-hidden shadow-[4px_4px_0_rgba(22,36,29,0.9)]">
              <div className="bg-signal px-5 py-4 border-b-2 border-ink sm:px-8 sm:py-5">
                <h3 className="font-lab font-bold text-ink text-lg">Knowledge Check</h3>
              </div>
              <div className="p-5 bg-white space-y-8 sm:p-8 sm:space-y-10">
                {lesson.quiz.map((q, qIdx) => {
                  const result = quizResult?.results?.[qIdx];
                  const graded = !!result;
                  return (
                    <div key={qIdx}>
                      <p className="font-bold text-ink text-lg mb-5">{q.question}</p>
                      <div className="space-y-3">
                        {q.options.map((opt, oIdx) => {
                          const chosen = quizAnswers[qIdx] === oIdx;
                          // After grading, paint the correct option green and a
                          // wrongly-chosen option red; otherwise normal selection.
                          let cls = chosen ? 'border-pcb bg-pcb/8' : 'border-ink/15 hover:bg-ink/5';
                          if (graded) {
                            if (oIdx === result.correctIndex) cls = 'border-pcb bg-pcb/10';
                            else if (chosen) cls = 'border-wire bg-wire/8';
                            else cls = 'border-ink/15 opacity-70';
                          }
                          return (
                            <label key={oIdx} className={`flex items-center space-x-4 p-4 border-2 rounded-xl transition-colors cursor-pointer ${cls}`}>
                              <input
                                type="radio"
                                name={`quiz-${qIdx}`}
                                className="w-5 h-5 accent-pcb"
                                checked={chosen}
                                onChange={() => {
                                  setQuizAnswers(prev => ({ ...prev, [qIdx]: oIdx }));
                                  // Changing an answer starts a fresh attempt — clear
                                  // the previous grading so the student can retry.
                                  if (quizResult) setQuizResult(null);
                                }}
                              />
                              <span className="text-ink font-medium flex-1">{opt}</span>
                              {graded && oIdx === result.correctIndex && <CheckCircle2 className="w-5 h-5 text-pcb shrink-0" />}
                              {graded && chosen && oIdx !== result.correctIndex && <XCircle className="w-5 h-5 text-wire shrink-0" />}
                            </label>
                          );
                        })}
                      </div>

                      {/* Why-it's-wrong / why-it's-right explanation */}
                      {graded && (
                        <div className={`mt-4 flex items-start gap-3 rounded-xl p-4 border-2 animate-slide-up ${result.correct ? 'bg-pcb/8 border-pcb/30 text-ink' : 'bg-signal/15 border-signal text-ink'}`}>
                          <Lightbulb className="mt-0.5 h-5 w-5 shrink-0" />
                          <p className="text-sm font-medium leading-relaxed">
                            <span className="font-bold">{result.correct ? 'Correct! ' : 'Not quite. '}</span>
                            {q.explain || (result.correct
                              ? 'Nice work!'
                              : `The right answer is "${q.options[result.correctIndex]}".`)}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}

                <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-ink/10 pt-6">
                  <button
                    onClick={handleQuizSubmit}
                    className="lab-btn bg-pcb text-white border-2 border-ink px-8 py-3 rounded-xl font-extrabold"
                  >
                    {quizResult ? 'Submit Again' : 'Submit Quiz'}
                  </button>
                  {quizResult && (
                    <span className={`font-lab font-extrabold flex items-center text-xl px-4 py-2 rounded-lg border-2 border-ink ${quizResult.score === quizResult.total ? 'text-ink bg-pcb/20' : 'text-ink bg-signal/25'}`}>
                      <CheckCircle2 className="w-6 h-6 mr-2" />
                      Score: {quizResult.score} / {quizResult.total}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="border-t-2 border-ink/10 pt-10 flex flex-col items-end gap-3">
            {!quizPassed && (
              <p className="flex items-center gap-2 text-sm font-semibold text-wire">
                <Lock className="h-4 w-4 shrink-0" />
                Answer every Knowledge Check question correctly to finish this chapter.
              </p>
            )}
            <button
              onClick={handleMarkComplete}
              disabled={!quizPassed}
              className="lab-btn flex items-center gap-2 border-2 border-ink bg-signal text-ink disabled:cursor-not-allowed disabled:border-ink/20 disabled:bg-ink/10 disabled:text-ink/40 px-8 py-4 rounded-xl font-extrabold text-lg"
            >
              {!quizPassed && <Lock className="h-5 w-5" />}
              Complete &amp; Continue
            </button>
          </div>
        </div>
      </div>

      {/* Draggable divider between the lesson and the right panel (desktop only) */}
      {splitActive && (
        <div
          role="separator"
          aria-orientation="vertical"
          onPointerDown={startResize}
          onDoubleClick={() => setSplitPct(defaultSplit)}
          title="Drag to resize · double-click to reset"
          className="z-20 hidden w-1.5 shrink-0 cursor-col-resize bg-ink/15 transition-colors hover:bg-pcb lg:block"
        />
      )}

      {/* Compiler Panel — hidden for no-code courses (course.hasEditor === false) */}
      {showEditor && (
      <div style={panelStyle} className="z-10 flex w-full min-w-0 flex-col border-t-2 border-ink bg-paper shadow-2xl lg:h-full lg:w-[600px] lg:border-l-2 lg:border-l-ink lg:border-t-0">

        {/* Editor Area */}
        <div className="flex h-[55vh] flex-col border-b-2 border-ink/15 bg-paper p-4 sm:p-5 lg:h-[65%]">
          <div className="flex justify-between items-center mb-4 shrink-0">
            <h3 className="font-lab font-extrabold text-ink text-lg flex items-center">
              <span className="w-3 h-3 bg-pcb rounded-full mr-2 ring-2 ring-ink/20"></span>
              Python Editor
            </h3>
            <button
              onClick={handleRunCode}
              disabled={isRunning}
              className="lab-btn bg-pcb text-white border-2 border-ink px-6 py-2.5 rounded-lg font-extrabold flex items-center disabled:opacity-60"
            >
              <Play className="w-5 h-5 mr-2" />
              {isRunning ? 'Running…' : 'Run Code'}
            </button>
          </div>
          <div className="flex-1 min-h-0 rounded-xl overflow-hidden border-2 border-ink/15 bg-white">
            <CodeEditor code={code} onChange={setCode} />
          </div>
        </div>

        {/* Output Area */}
        <div className="flex h-[40vh] flex-col bg-paper p-4 sm:p-5 lg:h-[35%]">
          <div className="flex-1 min-h-0 rounded-xl overflow-hidden border-2 border-ink">
            <OutputPanel output={output} isRunning={isRunning} error={runError} />
          </div>
        </div>

      </div>
      )}

      {/* Interactive Lab Panel — for no-code courses whose module ships a lab */}
      {!showEditor && lab && (
        <div style={panelStyle} className="z-10 flex w-full min-w-0 flex-col border-t-2 border-ink bg-paper shadow-2xl lg:h-full lg:w-[600px] lg:overflow-y-auto lg:border-l-2 lg:border-l-ink lg:border-t-0">
          <div className="p-4 sm:p-6">
            <LabRunner lab={lab.data} course={course} courseId={courseId} moduleId={lab.moduleKey} />
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
