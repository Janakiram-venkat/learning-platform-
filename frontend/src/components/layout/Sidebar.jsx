import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, CheckCircle2, Circle, Lock, Gamepad2, Hammer } from 'lucide-react';
import {
  getCompletedLessons,
  getCompletedAssignments,
  getCompletedProjects,
  getUnlockedLessonIds,
  isAssignmentUnlocked,
  isAssignmentCompleted,
  getAssignmentKey,
  getModuleNumericId,
  isProjectCompleted,
  PROGRESS_EVENT,
} from '../../lib/progress';

export default function Sidebar({ course, currentLessonId, currentProjectKey, onNavigate }) {
  const [, setProgressTick] = useState(0);

  useEffect(() => {
    const refresh = () => setProgressTick((tick) => tick + 1);
    window.addEventListener(PROGRESS_EVENT, refresh);
    return () => window.removeEventListener(PROGRESS_EVENT, refresh);
  }, []);

  if (!course) return <div className="w-full bg-paper border-r-2 border-ink/15 h-full p-4 text-ink/60">Loading…</div>;

  const completedLessons = getCompletedLessons();
  const completedAssignments = getCompletedAssignments();
  const completedProjects = getCompletedProjects();
  const unlocked = getUnlockedLessonIds(course);
  const lessonTotal = course.modules?.reduce((total, module) => total + (module.lessons?.length || 0), 0) || 0;
  const challengeTotal = course.modules?.length || 0;
  const projectTotal = course.modules?.filter((module) => module.hasProject).length || 0;
  const totalItems = lessonTotal + challengeTotal + projectTotal;
  const completedItems = (course.modules || []).reduce((total, module) => {
    const lessonsDone = (module.lessons || []).filter((lesson) => completedLessons.includes(lesson.lessonId)).length;
    const challengeDone = completedAssignments.includes(getAssignmentKey(module)) ? 1 : 0;
    const projectDone = module.hasProject && completedProjects.includes(`module${getModuleNumericId(module)}`) ? 1 : 0;
    return total + lessonsDone + challengeDone + projectDone;
  }, 0);
  const progressPercent = totalItems ? Math.round((completedItems / totalItems) * 100) : 0;

  return (
    <div className="w-full bg-paper border-r-2 border-ink/15 h-full flex flex-col overflow-y-auto text-ink">
      <div className="p-4 border-b-2 border-ink/15">
        <h2 className="font-lab font-bold text-ink">{course.title}</h2>
        <div className="mt-3" aria-label={`${progressPercent}% course progress`}>
          <div className="mb-1.5 flex items-center justify-between text-xs font-bold text-ink/55">
            <span>Course progress</span>
            <span className="text-pcb">{progressPercent}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-ink/10">
            <div
              className="h-full rounded-full bg-pcb transition-[width] duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="mt-1.5 text-[11px] font-semibold text-ink/45">
            {completedItems} of {totalItems} activities complete
          </p>
        </div>
      </div>

      <div className="p-4 flex flex-col space-y-4">
        {course.modules?.map((module, idx) => (
          <div key={module.moduleId || idx} className="mb-2">
            <div className="flex items-center text-sm font-semibold text-ink mb-2">
              <ChevronDown className="w-4 h-4 mr-1 text-ink/45 shrink-0" />
              Module {idx + 1}: {module.title}
            </div>
            <div className="pl-5 flex flex-col space-y-1">
              {module.lessons?.map((lesson) => {
                const isCompleted = completedLessons.includes(lesson.lessonId);
                const isLocked = !unlocked.has(lesson.lessonId);
                const isCurrent = currentLessonId === lesson.lessonId;

                const icon = isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 mr-2 text-pcb shrink-0" />
                ) : isLocked ? (
                  <Lock className="w-4 h-4 mr-2 text-ink/35 shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 mr-2 text-ink/35 shrink-0" />
                );

                if (isLocked) {
                  return (
                    <div
                      key={lesson.lessonId}
                      title="Complete the previous lessons to unlock"
                      className="flex items-center text-sm p-2 rounded-md text-ink/35 cursor-not-allowed select-none"
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
                    className={`flex items-center text-sm p-2 rounded-md transition-colors ${isCurrent ? 'bg-pcb/12 text-pcb font-bold' : 'text-ink/65 hover:bg-ink/5'}`}
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
                    className={`flex items-center text-sm font-semibold p-2 rounded-md transition-colors ${aDone ? 'text-pcb hover:bg-pcb/10' : 'text-ink hover:bg-signal/20'}`}
                  >
                    {aDone
                      ? <CheckCircle2 className="w-4 h-4 mr-2 text-pcb shrink-0" />
                      : <Gamepad2 className="w-4 h-4 mr-2 text-ink shrink-0" />}
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
                    className={`flex items-center text-sm font-semibold p-2 rounded-md transition-colors ${
                      currentProjectKey === pKey
                        ? 'bg-wire/12 text-wire font-bold'
                        : pDone ? 'text-pcb hover:bg-pcb/10' : 'text-wire hover:bg-wire/10'
                    }`}
                  >
                    {pDone
                      ? <CheckCircle2 className="w-4 h-4 mr-2 text-pcb shrink-0" />
                      : <Hammer className="w-4 h-4 mr-2 text-wire shrink-0" />}
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
