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

/** All steps are open. */
export function isGameStepUnlocked() {
  return true;
}

/** How many steps of a module are finished (drives the module map's progress bar). */
export function countGameStepsDone(moduleId, totalSteps) {
  const done = new Set(gameSteps.all());
  let n = 0;
  for (let i = 0; i < totalSteps; i++) if (done.has(gameStepKey(moduleId, i))) n++;
  return n;
}

/** All modules are open. */
export function isGameModuleUnlocked() {
  return true;
}
