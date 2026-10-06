// Where a module challenge's state is kept.
//
// Three different stores, on purpose, because the three things have different
// lifetimes:
//
//   Per-task pass   -> `webdevPages`, under the challenge id, exactly like a
//                      section's tasks. Synced, so a student who passed task 4
//                      on their laptop has passed it on their phone.
//   Challenge pass  -> `completedAssignments` + `assignmentStars`, keyed
//                      "module101", through markAssignmentComplete. This is the
//                      SAME mechanism every other course's module challenge
//                      uses, which is what makes the sidebar tick the Module
//                      Challenge with no changes to Sidebar.jsx. Untouched here
//                      on purpose — see the note on moduleId 101 in
//                      data/webdev/module1/index.js for why the key is not
//                      "module1".
//   Attempt counts  -> `webdevChallenge`, local only, like code drafts. It
//                      exists so the result screen can say "tried, did not
//                      pass" instead of "not attempted", which is a nicety, not
//                      progress. Not registered in lib/progress/keys.js.
//
// Nothing here gates anything. `isChallengePassed` is the single call a gate
// would need if one is ever wanted.

import { isAssignmentCompleted, markAssignmentComplete } from '../progress';
import { readJSON, writeJSON } from '../progress/storage';
import { getDonePages } from './progress';
import { challengeStars, scoreChallenge } from './challengeScore';

const ATTEMPTS_KEY = 'webdevChallenge';

/** The assignment key a challenge records itself under. @param {number|string} moduleId */
export function challengeAssignmentKey(moduleId) {
  return `module${moduleId}`;
}

/**
 * Has this module's challenge been passed?
 *
 * The one check a gate would use: `if (!isChallengePassed(101)) …`.
 *
 * @param {number|string} moduleId
 * @returns {boolean}
 */
export function isChallengePassed(moduleId) {
  return isAssignmentCompleted(challengeAssignmentKey(moduleId));
}

/**
 * The student's current score, read fresh from storage.
 *
 * @param {object} challenge
 * @returns {ReturnType<typeof scoreChallenge>}
 */
export function readChallengeScore(challenge) {
  return scoreChallenge(challenge, getDonePages(challenge.id));
}

/**
 * Record a finished challenge if it passed.
 *
 * Idempotent, and never un-records: a student who passed 6/6 and later retakes
 * it for fun keeps their stars, because markAssignmentComplete only ever raises
 * a score. A failing run records nothing at all.
 *
 * @param {object} challenge
 * @param {number|string} moduleId
 * @param {ReturnType<typeof scoreChallenge>} [score] Defaults to the stored one.
 * @returns {boolean} Whether anything was recorded.
 */
export function recordChallengeResult(challenge, moduleId, score = readChallengeScore(challenge)) {
  if (!score.isPass) return false;
  markAssignmentComplete(challengeAssignmentKey(moduleId), challengeStars(score));
  return true;
}

// --- Attempt counts (local only) --------------------------------------------

/**
 * Failed runs per task, for this challenge.
 * @param {string} challengeId
 * @returns {Record<string, number>}
 */
export function getChallengeAttempts(challengeId) {
  const all = readJSON(ATTEMPTS_KEY, {});
  return all[challengeId]?.attempts || {};
}

/**
 * Count one failed run of a task.
 * @param {string} challengeId
 * @param {string} taskId
 * @returns {Record<string, number>} The updated counts.
 */
export function recordChallengeAttempt(challengeId, taskId) {
  const all = readJSON(ATTEMPTS_KEY, {});
  const entry = all[challengeId] || { attempts: {} };
  entry.attempts = { ...entry.attempts, [taskId]: (entry.attempts?.[taskId] || 0) + 1 };
  all[challengeId] = entry;
  writeJSON(ATTEMPTS_KEY, all);
  return entry.attempts;
}
