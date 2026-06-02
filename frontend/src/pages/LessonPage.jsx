import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseService, compilerService, quizService } from '../services/api';
import Sidebar from '../components/layout/Sidebar';
import CodeEditor from '../components/editor/CodeEditor';
import OutputPanel from '../components/editor/OutputPanel';
import Celebration from '../components/feedback/Celebration';
import { getUnlockedLessonIds } from '../utils/progress';
import { Play, CheckCircle2 } from 'lucide-react';

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

      // Celebrate a perfect score and award a badge for this lesson.
      const { score, total } = res.data;
      if (total > 0 && score === total) {
        const badgeId = `quiz-${lessonId}`;
        const badgeName = `${lesson.title} Master`;
        const badges = JSON.parse(localStorage.getItem('earnedBadges') || '[]');
        if (!badges.some(b => b.id === badgeId)) {
          badges.push({ id: badgeId, name: badgeName, type: 'quiz', earnedAt: new Date().toISOString() });
          localStorage.setItem('earnedBadges', JSON.stringify(badges));
        }
        setCelebration({
          title: 'Congratulations! 🎉',
          message: `Perfect score! You answered all ${total} ${total === 1 ? 'question' : 'questions'} correctly.`,
          badge: badgeName,
        });
      } else if (total > 0) {
        // Not all correct — gently prompt a retry.
        setCelebration({
          variant: 'retry',
          title: 'Almost there!',
          message: `You scored ${score} / ${total}. Review the lesson and give it another try!`,
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

    goToNext();
  };

  const handleCelebrationClose = () => {
    const advance = celebration?.next;
    setCelebration(null);
    if (advance) goToNext();
  };

  if (loading) return <div className="flex-1 flex items-center justify-center">Loading lesson...</div>;
  if (!lesson) return <div className="flex-1 flex items-center justify-center">Lesson not found.</div>;

  return (
    <div className="flex w-full overflow-hidden" style={{ height: 'calc(100vh - 60px)' }}>
      <Celebration
        open={!!celebration}
        title={celebration?.title}
        message={celebration?.message}
        badge={celebration?.badge}
        variant={celebration?.variant}
        onClose={handleCelebrationClose}
      />
      <Sidebar course={course} currentLessonId={lessonId} />
      
      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-8 bg-gray-50 border-r border-gray-200">
        <div className="max-w-3xl mx-auto bg-white p-10 rounded-2xl shadow-sm border border-gray-100">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">{lesson.title}</h1>
          <p className="text-lg text-gray-600 mb-10 pb-6 border-b border-gray-100">{lesson.description}</p>
          
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
              return null;
            })}
          </div>

          {/* Practice Section */}
          {lesson.practice && lesson.practice.length > 0 && (
            <div className="mb-16 border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-blue-50 px-8 py-5 border-b border-blue-100">
                <h3 className="font-bold text-blue-900 text-lg">Practice Exercises</h3>
              </div>
              <div className="p-8 bg-white">
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
              <div className="bg-green-50 px-8 py-5 border-b border-green-100">
                <h3 className="font-bold text-green-900 text-lg">Knowledge Check</h3>
              </div>
              <div className="p-8 bg-white space-y-10">
                {lesson.quiz.map((q, qIdx) => (
                  <div key={qIdx}>
                    <p className="font-bold text-gray-900 text-lg mb-5">{q.question}</p>
                    <div className="space-y-3">
                      {q.options.map((opt, oIdx) => (
                        <label key={oIdx} className={`flex items-center space-x-4 p-4 border rounded-xl cursor-pointer transition-colors ${quizAnswers[qIdx] === oIdx ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                          <input 
                            type="radio" 
                            name={`quiz-${qIdx}`} 
                            className="w-5 h-5 text-green-600"
                            checked={quizAnswers[qIdx] === oIdx}
                            onChange={() => setQuizAnswers(prev => ({ ...prev, [qIdx]: oIdx }))}
                          />
                          <span className="text-gray-800 font-medium">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                
                <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                  <button 
                    onClick={handleQuizSubmit}
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-bold transition-colors shadow-sm"
                  >
                    Submit Quiz
                  </button>
                  {quizResult && (
                    <span className="font-extrabold text-green-600 flex items-center text-xl bg-green-100 px-4 py-2 rounded-lg">
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
      <div className="w-[600px] bg-white flex flex-col h-full border-l border-gray-200 shadow-2xl z-10">
        
        {/* Editor Area */}
        <div className="h-[65%] p-5 flex flex-col border-b border-gray-200 bg-gray-50">
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
        <div className="h-[35%] p-5 flex flex-col bg-gray-50">
          <div className="flex-1 min-h-0 rounded-xl overflow-hidden shadow-inner border border-gray-300">
            <OutputPanel output={output} isRunning={isRunning} error={runError} />
          </div>
        </div>

      </div>
    </div>
  );
}
