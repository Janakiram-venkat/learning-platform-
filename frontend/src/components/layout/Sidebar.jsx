import { Link } from 'react-router-dom';
import { ChevronDown, CheckCircle2, Circle, Lock, Gamepad2, Hammer } from 'lucide-react';
import {
  getCompletedLessons,
  getUnlockedLessonIds,
  isAssignmentUnlocked,
  isAssignmentCompleted,
  getAssignmentKey,
  getModuleNumericId,
  isProjectCompleted,
} from '../../utils/progress';

export default function Sidebar({ course, currentLessonId, onNavigate }) {
  if (!course) return <div className="w-full bg-gray-50 border-r border-gray-200 h-full p-4">Loading...</div>;

  const completedLessons = getCompletedLessons();
  const unlocked = getUnlockedLessonIds(course);

  return (
    <div className="w-full bg-gray-50 border-r border-gray-200 h-full flex flex-col overflow-y-auto">
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
                    onClick={onNavigate}
                    className={`flex items-center text-sm p-2 rounded-md ${isCurrent ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    {icon}
                    <span className="truncate" title={lesson.title}>{lesson.title}</span>
                  </Link>
                );
              })}

              {/* Module arcade challenge — unlocks once every lesson is done */}
              {(() => {
                const aUnlocked = isAssignmentUnlocked(module);
                const aKey = getAssignmentKey(module);
                const aDone = isAssignmentCompleted(aKey);

                if (!aUnlocked) {
                  return (
                    <div
                      title="Finish all lessons in this module to unlock the challenge"
                      className="flex items-center text-sm p-2 rounded-md text-gray-400 cursor-not-allowed select-none"
                    >
                      <Lock className="w-4 h-4 mr-2 shrink-0" />
                      <span className="truncate">🎮 Module Challenge</span>
                    </div>
                  );
                }
                return (
                  <Link
                    to={`/course/${course.courseId}/module/module${getModuleNumericId(module)}/assignment`}
                    onClick={onNavigate}
                    className={`flex items-center text-sm font-semibold p-2 rounded-md ${aDone ? 'text-green-600 hover:bg-green-50' : 'text-purple-600 hover:bg-purple-50'}`}
                  >
                    {aDone
                      ? <CheckCircle2 className="w-4 h-4 mr-2 text-green-500 shrink-0" />
                      : <Gamepad2 className="w-4 h-4 mr-2 text-purple-500 shrink-0" />}
                    <span className="truncate">Module Challenge 🎮</span>
                  </Link>
                );
              })()}

              {/* Mini project — only for modules that have one, unlocks with the arcade */}
              {module.hasProject && (() => {
                const pUnlocked = isAssignmentUnlocked(module);
                const pKey = `module${getModuleNumericId(module)}`;
                const pDone = isProjectCompleted(pKey);

                if (!pUnlocked) {
                  return (
                    <div
                      title="Finish all lessons in this module to unlock the project"
                      className="flex items-center text-sm p-2 rounded-md text-gray-400 cursor-not-allowed select-none"
                    >
                      <Lock className="w-4 h-4 mr-2 shrink-0" />
                      <span className="truncate">🛠️ Mini Project</span>
                    </div>
                  );
                }
                return (
                  <Link
                    to={`/course/${course.courseId}/module/${pKey}/project`}
                    onClick={onNavigate}
                    className={`flex items-center text-sm font-semibold p-2 rounded-md ${pDone ? 'text-green-600 hover:bg-green-50' : 'text-orange-600 hover:bg-orange-50'}`}
                  >
                    {pDone
                      ? <CheckCircle2 className="w-4 h-4 mr-2 text-green-500 shrink-0" />
                      : <Hammer className="w-4 h-4 mr-2 text-orange-500 shrink-0" />}
                    <span className="truncate">Mini Project 🛠️</span>
                  </Link>
                );
              })()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
