// When to ask a student what they think of the content.
//
// We prompt after every few modules, at most once per milestone. Completed
// modules are counted from the 'module' badges the student has earned.

import { notifyProgressChange } from './keys';
import { readJSON, writeJSON } from './storage';
import { getCompletedModuleCount } from './xp';

const ASKED_KEY = 'feedbackAsked';
const FEEDBACK_EVERY_N_MODULES = 2;

export { getCompletedModuleCount };

/**
 * True when a feedback prompt is due — the student just crossed a multiple of
 * FEEDBACK_EVERY_N_MODULES modules and hasn't been asked at that milestone yet.
 */
export function shouldAskFeedback() {
  const count = getCompletedModuleCount();
  if (count === 0 || count % FEEDBACK_EVERY_N_MODULES !== 0) return false;
  return !readJSON(ASKED_KEY, []).includes(count);
}

/** Record that we've prompted at the current milestone, so it isn't shown twice. */
export function markFeedbackAsked() {
  const count = getCompletedModuleCount();
  const asked = readJSON(ASKED_KEY, []);
  if (asked.includes(count)) return;
  asked.push(count);
  writeJSON(ASKED_KEY, asked);
  notifyProgressChange();
}
