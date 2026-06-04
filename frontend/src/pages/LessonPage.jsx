import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseService, compilerService, quizService } from '../services/api';
import Sidebar from '../components/layout/Sidebar';
import CodeEditor from '../components/editor/CodeEditor';
import OutputPanel from '../components/editor/OutputPanel';
import Celebration from '../components/feedback/Celebration';
import { getUnlockedLessonIds, awardXPOnce } from '../utils/progress';
import LessonSimulation from '../components/lesson/LessonSimulation';
import { Play, CheckCircle2, XCircle, Lightbulb, Menu, X } from 'lucide-react';

export default function LessonPage() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    setQuizResult(null);
    setQuizAnswers({});
    setCelebration(null);
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
        navigate('/courses', { replace: true });
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
      navigate('/courses');
    }
  };

  const handleMarkComplete = () => {
    const completed = JSON.parse(localStorage.getItem('completedLessons') || '[]');
    if (!completed.includes(lessonId)) {
      completed.push(lessonId);
      localStorage.setItem('completedLessons', JSON.stringify(completed));
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
    if (advance) goToNext();
  };

  if (loading) return <div className="flex-1 flex items-center justify-center">Loading lesson...</div>;
  if (!lesson) return <div className="flex-1 flex items-center justify-center">Lesson not found.</div>;

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

      {/* Mobile-only top bar to open the lesson list */}
      <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-bold text-gray-700 active:scale-95"
        >
          <Menu className="h-4 w-4" /> Lessons
        </button>
        <span className="truncate text-sm font-semibold text-gray-500">{course?.title}</span>
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
        className={`fixed inset-y-0 left-0 z-40 w-72 transform bg-gray-50 shadow-xl transition-transform duration-300 lg:static lg:z-0 lg:w-64 lg:translate-x-0 lg:shadow-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute right-2 top-2 z-10 rounded-md p-1.5 text-gray-500 hover:bg-gray-200 lg:hidden"
          aria-label="Close lessons"
        >
          <X className="h-5 w-5" />
        </button>
        <Sidebar course={course} currentLessonId={lessonId} onNavigate={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-8 lg:border-r lg:border-gray-200">
        <div className="mx-auto max-w-3xl rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-10">
          <h1 className="mb-4 text-2xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">{lesson.title}</h1>
          <p className="mb-6 border-b border-gray-100 pb-6 text-base text-gray-600 sm:mb-10 sm:text-lg">{lesson.description}</p>
          
          <div className="space-y-8 mb-16">
            {lesson.content?.map((block, idx) => {
              if (block.type === 'heading') return <h2 key={idx} className="text-2xl font-bold text-gray-900 mt-10 mb-4">{block.value}</h2>;
              if (block.type === 'paragraph') return <p key={idx} className="text-gray-700 leading-relaxed text-lg">{block.value}</p>;
              if (block.type === 'tip') return (
                <div key={idx} className="bg-indigo-50 border-l-4 border-indigo-500 p-6 rounded-r-lg text-indigo-900 shadow-sm">
                  <strong className="font-bold flex items-center mb-2"><CheckCircle2 className="w-5 h-5 mr-2" />Tip</strong>
                  <span className="text-lg">{block.value}</span>
                </div>
              );
              if (block.type === 'code') return (
                <pre key={idx} className="bg-gray-900 text-gray-100 p-6 rounded-xl overflow-x-auto text-sm font-mono shadow-inner">
                  {block.value}
                </pre>
              );
              if (block.type === 'simulation') return <LessonSimulation key={idx} sim={block} />;
              return null;
            })}
          </div>

          {/* Practice Section */}
          {lesson.practice && lesson.practice.length > 0 && (
            <div className="mb-16 border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-blue-50 px-5 py-4 border-b border-blue-100 sm:px-8 sm:py-5">
                <h3 className="font-bold text-blue-900 text-lg">Practice Exercises</h3>
              </div>
              <div className="p-5 bg-white sm:p-8">
                {lesson.practice.map(p => (
                  <div key={p.id} className="mb-6 last:mb-0">
                    <p className="font-medium text-gray-800 text-lg mb-4">Task: {p.question}</p>
                    <button 
                      onClick={() => setCode(p.starterCode)}
                      className="inline-flex items-center justify-center bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg font-bold transition-colors"
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
            <div className="mb-16 border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-green-50 px-5 py-4 border-b border-green-100 sm:px-8 sm:py-5">
                <h3 className="font-bold text-green-900 text-lg">Knowledge Check</h3>
              </div>
              <div className="p-5 bg-white space-y-8 sm:p-8 sm:space-y-10">
                {lesson.quiz.map((q, qIdx) => {
                  const result = quizResult?.results?.[qIdx];
                  const graded = !!result;
                  return (
                    <div key={qIdx}>
                      <p className="font-bold text-gray-900 text-lg mb-5">{q.question}</p>
                      <div className="space-y-3">
                        {q.options.map((opt, oIdx) => {
                          const chosen = quizAnswers[qIdx] === oIdx;
                          // After grading, paint the correct option green and a
                          // wrongly-chosen option red; otherwise normal selection.
                          let cls = chosen ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:bg-gray-50';
                          if (graded) {
                            if (oIdx === result.correctIndex) cls = 'border-green-500 bg-green-50';
                            else if (chosen) cls = 'border-rose-400 bg-rose-50';
                            else cls = 'border-gray-200 opacity-70';
                          }
                          return (
                            <label key={oIdx} className={`flex items-center space-x-4 p-4 border rounded-xl transition-colors ${graded ? 'cursor-default' : 'cursor-pointer'} ${cls}`}>
                              <input
                                type="radio"
                                name={`quiz-${qIdx}`}
                                className="w-5 h-5 text-green-600"
                                checked={chosen}
                                disabled={graded}
                                onChange={() => setQuizAnswers(prev => ({ ...prev, [qIdx]: oIdx }))}
                              />
                              <span className="text-gray-800 font-medium flex-1">{opt}</span>
                              {graded && oIdx === result.correctIndex && <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />}
                              {graded && chosen && oIdx !== result.correctIndex && <XCircle className="w-5 h-5 text-rose-500 shrink-0" />}
                            </label>
                          );
                        })}
                      </div>

                      {/* Why-it's-wrong / why-it's-right explanation */}
                      {graded && (
                        <div className={`mt-4 flex items-start gap-3 rounded-xl p-4 ring-1 animate-slide-up ${result.correct ? 'bg-green-50 ring-green-100 text-green-900' : 'bg-amber-50 ring-amber-100 text-amber-900'}`}>
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

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-6">
                  <button
                    onClick={handleQuizSubmit}
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-bold transition-colors shadow-sm"
                  >
                    {quizResult ? 'Submit Again' : 'Submit Quiz'}
                  </button>
                  {quizResult && (
                    <span className={`font-extrabold flex items-center text-xl px-4 py-2 rounded-lg ${quizResult.score === quizResult.total ? 'text-green-600 bg-green-100' : 'text-amber-600 bg-amber-100'}`}>
                      <CheckCircle2 className="w-6 h-6 mr-2" />
                      Score: {quizResult.score} / {quizResult.total}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="border-t border-gray-200 pt-10 flex justify-end">
            <button 
              onClick={handleMarkComplete}
              className="bg-gray-900 hover:bg-black text-white px-8 py-4 rounded-xl font-bold text-lg transition-colors shadow-md"
            >
              Complete & Continue
            </button>
          </div>
        </div>
      </div>

      {/* Compiler Panel */}
      <div className="z-10 flex w-full flex-col border-t border-gray-200 bg-white shadow-2xl lg:h-full lg:w-[600px] lg:border-l lg:border-t-0">

        {/* Editor Area */}
        <div className="flex h-[55vh] flex-col border-b border-gray-200 bg-gray-50 p-4 sm:p-5 lg:h-[65%]">
          <div className="flex justify-between items-center mb-4 shrink-0">
            <h3 className="font-extrabold text-gray-900 text-lg flex items-center">
              <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
              Python Editor
            </h3>
            <button 
              onClick={handleRunCode}
              disabled={isRunning}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-6 py-2.5 rounded-lg font-bold flex items-center shadow-md transition-all active:scale-95"
            >
              <Play className="w-5 h-5 mr-2" />
              {isRunning ? 'Running...' : 'Run Code'}
            </button>
          </div>
          <div className="flex-1 min-h-0 rounded-xl overflow-hidden border border-gray-300 shadow-sm bg-white">
            <CodeEditor code={code} onChange={setCode} />
          </div>
        </div>
        
        {/* Output Area */}
        <div className="flex h-[40vh] flex-col bg-gray-50 p-4 sm:p-5 lg:h-[35%]">
          <div className="flex-1 min-h-0 rounded-xl overflow-hidden shadow-inner border border-gray-300">
            <OutputPanel output={output} isRunning={isRunning} error={runError} />
          </div>
        </div>

      </div>
    </div>
  );
}
