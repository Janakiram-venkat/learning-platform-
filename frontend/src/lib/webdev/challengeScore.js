// Scoring rules for a module challenge. Pure, and deliberately import-free.
//
// Nothing in here touches localStorage, React or the DOM, so a Node test can
// import it directly and the numbers a student sees on the result screen are
// the numbers that get tested. The stateful half — what is recorded where —
// lives next door in challenge.js.

/**
 * How many tasks a student must pass to pass the challenge.
 *
 * ONE constant. If the bar moves, it moves here and nowhere else: the result
 * screen, the summary line and the tests all read this value.
 */
export const CHALLENGE_PASS_MARK = 4;

/**
 * Ids of every graded task in a challenge, in order.
 * @param {{ pages?: Array<{id: string, type: string}> }} challenge
 * @returns {string[]}
 */
export function challengeTaskIds(challenge) {
  return (challenge?.pages || []).filter((p) => p.type === 'task').map((p) => p.id);
}

/**
 * Score a challenge against the set of task ids already passed.
 *
 * @param {object} challenge
 * @param {Set<string>|string[]} donePageIds Passed page ids (from webdevPages).
 * @param {number} [passMark] Override the pass mark. Tests use it; the app does not.
 * @returns {{ total: number, passed: number, passMark: number, isPass: boolean,
 *             passedIds: string[], failedIds: string[] }}
 */
export function scoreChallenge(challenge, donePageIds, passMark = CHALLENGE_PASS_MARK) {
  const done = donePageIds instanceof Set ? donePageIds : new Set(donePageIds || []);
  const ids = challengeTaskIds(challenge);
  const passedIds = ids.filter((id) => done.has(id));
  const failedIds = ids.filter((id) => !done.has(id));

  return {
    total: ids.length,
    passed: passedIds.length,
    passMark,
    // `>=` and not `>`: passMark is the lowest passing score, so 4 of 6 passes.
    isPass: passedIds.length >= passMark,
    passedIds,
    failedIds,
  };
}

/**
 * Stars (1-3) for a passing score, matching the arcade's 3-star scale so the
 * challenge writes the same shape of record every other course's does.
 * A failing score has no stars.
 *
 * @param {{ passed: number, total: number, isPass: boolean }} score
 * @returns {0|1|2|3}
 */
export function challengeStars(score) {
  if (!score.isPass) return 0;
  if (score.passed >= score.total) return 3;
  if (score.passed >= score.total - 1) return 2;
  return 1;
}

/**
 * The autosave key for one challenge task's editor.
 *
 * Includes the challenge id AND the task id, so a challenge draft can never
 * land on top of a section draft: section keys are "<sectionId>/<pageId>" and
 * the challenge id is not a section id.
 *
 * @param {string} challengeId
 * @param {string} taskId
 * @returns {string}
 */
export function challengeDraftKey(challengeId, taskId) {
  return `${challengeId}/${taskId}`;
}

/**
 * Per-task status for the result screen.
 *
 * @param {object} challenge
 * @param {Set<string>|string[]} donePageIds
 * @param {Record<string, number>} [attempts] taskId -> failed runs, for the
 *        "tried, did not pass" wording. Missing is fine; it just reads as
 *        "not attempted".
 * @returns {Array<{ id: string, index: number, title: string,
 *                   status: 'passed'|'failed'|'skipped', attempts: number }>}
 */
export function challengeBreakdown(challenge, donePageIds, attempts = {}) {
  const done = donePageIds instanceof Set ? donePageIds : new Set(donePageIds || []);
  return (challenge?.pages || [])
    .filter((p) => p.type === 'task')
    .map((page, index) => {
      const tries = attempts[page.id] || 0;
      const passed = done.has(page.id);
      return {
        id: page.id,
        index,
        title: page.title || `Task ${index + 1}`,
        status: passed ? 'passed' : tries > 0 ? 'failed' : 'skipped',
        attempts: tries,
      };
    });
}
