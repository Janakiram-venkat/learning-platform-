// Self-checked milestones for open-ended game steps (Module 8: "Your Own
// Game"). There's no reference solution to grade against here, so instead of
// a pass/fail `check`, a step can list `milestones` — plain strings the
// student ticks off themselves. Stored as { "module8:0": [0, 2, 3] } so a
// revisit remembers which boxes were checked.

import { readJSON, writeJSON } from './storage';
import { notifyProgressChange } from './keys';

const KEY = 'gameMilestones';

function keyFor(moduleId, stepIndex) {
  return `${moduleId}:${stepIndex}`;
}

export function getCheckedMilestones(moduleId, stepIndex) {
  const all = readJSON(KEY, {});
  return new Set(all[keyFor(moduleId, stepIndex)] || []);
}

export function setCheckedMilestones(moduleId, stepIndex, checkedIndexes) {
  const all = readJSON(KEY, {});
  all[keyFor(moduleId, stepIndex)] = [...checkedIndexes];
  writeJSON(KEY, all);
  notifyProgressChange();
}
