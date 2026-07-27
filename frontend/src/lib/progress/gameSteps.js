// Game-dev course progress.
//
// The game course isn't lesson-shaped — a module is one game built over several
// steps, so progress is tracked per step rather than per lesson. Keys look like
// "module1:2". That different shape is why this doesn't fold into completion.js.

import { gameSteps } from './completion';

export function getCompletedGameSteps() {
  return gameSteps.all();
}

export function gameStepKey(moduleId, stepIndex) {
  return `${moduleId}:${stepIndex}`;
}

export function isGameStepCompleted(moduleId, stepIndex) {
  return gameSteps.has(gameStepKey(moduleId, stepIndex));
}

export function markGameStepComplete(moduleId, stepIndex) {
  return gameSteps.mark(gameStepKey(moduleId, stepIndex));
}

/** A step opens once the step before it is done; step 0 is always open. */
export function isGameStepUnlocked(moduleId, stepIndex) {
  return stepIndex === 0 || isGameStepCompleted(moduleId, stepIndex - 1);
}

/** How many steps of a module are finished (drives the module map's progress bar). */
export function countGameStepsDone(moduleId, totalSteps) {
  const done = new Set(gameSteps.all());
  let n = 0;
  for (let i = 0; i < totalSteps; i++) if (done.has(gameStepKey(moduleId, i))) n++;
  return n;
}

/** A module opens once every step of the previous module is done. */
export function isGameModuleUnlocked(course, moduleIndex) {
  if (moduleIndex === 0) return true;
  const prev = course?.modules?.[moduleIndex - 1];
  if (!prev) return false;
  const total = prev.stepCount ?? prev.steps?.length ?? 0;
  if (!total) return false;
  return countGameStepsDone(`module${prev.moduleId ?? prev.id}`, total) >= total;
}
