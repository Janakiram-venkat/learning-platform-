// Public surface of the progress layer.
//
// Prefer importing from here rather than reaching into the individual modules,
// so their internal organisation can change without touching call sites.

export {
  COMPLETION_KEYS,
  PROGRESS_KEYS,
  XP_EVENT,
  PROGRESS_EVENT,
  notifyProgressChange,
} from './keys';

export { completionSet, lessons, assignments, projects, labs, gameSteps } from './completion';

export {
  getXP,
  addXP,
  getLevelInfo,
  awardXPOnce,
  getBadges,
  hasBadge,
  awardBadge,
  getCompletedModuleCount,
} from './xp';

export {
  getCompletedLessons,
  getUnlockedLessonIds,
  getNextLessonAfterModule,
  getModuleNumericId,
  getAssignmentKey,
  isAssignmentUnlocked,
  getCompletedAssignments,
  isAssignmentCompleted,
  getAssignmentStars,
  markAssignmentComplete,
} from './unlock';

export {
  getCompletedGameSteps,
  gameStepKey,
  isGameStepCompleted,
  markGameStepComplete,
  isGameStepUnlocked,
  countGameStepsDone,
  isGameModuleUnlocked,
} from './gameSteps';

export { isModuleComplete, countCompletedModules, evaluatePrerequisite } from './prereq';

export { getCheckedMilestones, setCheckedMilestones } from './gameMilestones';

export { shouldAskFeedback, markFeedbackAsked } from './feedback';
export { getAiIdeas, saveAiIdea } from './ideas';
export { snapshotProgress, applyProgress, clearProgress } from './sync';

// --- Thin per-kind wrappers -------------------------------------------------
// Projects and labs need nothing beyond the completion set, so these are just
// readable names over it.

import { labs as _labs, projects as _projects } from './completion';

export const getCompletedProjects = () => _projects.all();
export const isProjectCompleted = (projectKey) => _projects.has(projectKey);
export const markProjectComplete = (projectKey) => _projects.mark(projectKey);

export const getCompletedLabs = () => _labs.all();
export const isLabCompleted = (labKey) => _labs.has(labKey);
export const markLabComplete = (labKey) => _labs.mark(labKey);
