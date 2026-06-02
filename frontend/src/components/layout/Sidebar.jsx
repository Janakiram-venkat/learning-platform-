import { Link } from 'react-router-dom';
import { ChevronDown, CheckCircle2, Circle, Lock } from 'lucide-react';
import { getCompletedLessons, getUnlockedLessonIds } from '../../utils/progress';

export default function Sidebar({ course, currentLessonId }) {
  if (!course) return <div className="w-64 bg-gray-50 border-r border-gray-200 h-full p-4">Loading...</div>;

  const completedLessons = getCompletedLessons();
  const unlocked = getUnlockedLessonIds(course);

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 h-full flex flex-col overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-bold text-gray-900">{course.title}</h2>
      </div>

      <div className="p-4 flex flex-col space-y-4">
        {course.modules?.map((module, idx) => (
          <div key={module.moduleId || idx} className="mb-2">
            <div className="flex items-center text-sm font-semibold text-gray-900 mb-2">
              <ChevronDown className="w-4 h-4 mr-1 text-gray-500 shrink-0" />
              Module {idx + 1}: {module.title}
            </div>
            <div className="pl-5 flex flex-col space-y-1">
              {module.lessons?.map((lesson) => {
                const isCompleted = completedLessons.includes(lesson.lessonId);
                const isLocked = !unlocked.has(lesson.lessonId);
                const isCurrent = currentLessonId === lesson.lessonId;

                const icon = isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 mr-2 text-green-500 shrink-0" />
                ) : isLocked ? (
                  <Lock className="w-4 h-4 mr-2 text-gray-400 shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 mr-2 text-gray-400 shrink-0" />
                );

                if (isLocked) {
                  return (
                    <div
                      key={lesson.lessonId}
                      title="Complete the previous lessons to unlock"
                      className="flex items-center text-sm p-2 rounded-md text-gray-400 cursor-not-allowed select-none"
                    >
                      {icon}
                      <span className="truncate">{lesson.title}</span>
                    </div>
                  );
                }

                return (
                  <Link
                    key={lesson.lessonId}
                    to={`/course/${course.courseId}/lesson/${lesson.lessonId}`}
                    className={`flex items-center text-sm p-2 rounded-md ${isCurrent ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    {icon}
                    <span className="truncate" title={lesson.title}>{lesson.title}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
