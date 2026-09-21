// Where a module's mini project keeps its state.
//
// Three stores, for the same reasons the challenge has three (see
// challenge.js):
//
//   Per-milestone pass -> `webdevPages`, under the project id, exactly like a
//                         section's tasks. Synced, so unlock order survives a
//                         change of device. The rubric page is recorded here
//                         too, which is what makes the finished state stick.
//   Project pass       -> `completedProjects`, keyed "module101", through
//                         markProjectComplete. This is the SAME mechanism every
//                         other course's mini project uses, which is what ticks
//                         the sidebar's Mini Project entry with no change to
//                         Sidebar.jsx. See the note on moduleId 101 in
//                         data/webdev/module1/index.js for why the key is not
//                         "module1".
//   The page itself    -> `webdevCode`, under ONE draft key for the whole
//                         project, plus a snapshot of the finished page under
//                         `finishedPageKey` for Module 2 to load later.
//
// Nothing here gates anything. `isProjectPassed` is the single call a gate
// would need if Module 2 is ever to be locked behind this.

import { isProjectCompleted, markProjectComplete } from '../progress';
import { getDonePages } from './progress';
import { loadCode, saveCode } from './storage';
import { finishedPageKey, projectDraftKey, projectProgress } from './projectRules';

/** The completion key a mini project records itself under. @param {number|string} moduleId */
export function projectCompletionKey(moduleId) {
  return `module${moduleId}`;
}

/**
 * Has this module's mini project been finished?
 *
 * The one check a gate would use: `if (!isProjectPassed(101)) …`. Deliberately
 * unused today — Module 2 is NOT gated behind this.
 *
 * @param {number|string} moduleId
 * @returns {boolean}
 */
export function isProjectPassed(moduleId) {
  return isProjectCompleted(projectCompletionKey(moduleId));
}

/**
 * The student's current standing, read fresh from storage.
 * @param {object} project
 * @returns {ReturnType<typeof projectProgress>}
 */
export function readProjectProgress(project) {
  return projectProgress(project, getDonePages(project.id));
}

/**
 * The page the student has built so far.
 * @param {object} project
 * @returns {{html?: string, css?: string, js?: string}|null}
 */
export function loadProjectDraft(project) {
  return loadCode(projectDraftKey(project.id));
}

/**
 * The finished page, for a later module to start from. Null until the rubric
 * has passed at least once.
 *
 * @param {object} project
 * @returns {{html?: string, css?: string, js?: string}|null}
 */
export function loadFinishedPage(project) {
  return loadCode(finishedPageKey(project.id));
}

/**
 * Record a finished project, and park the page it produced.
 *
 * Idempotent: markProjectComplete only ever adds an id, and re-running a
 * passing rubric simply refreshes the snapshot with the student's latest
 * (still passing) page. A project whose rubric has not passed records nothing
 * at all — including no snapshot, so what Module 2 finds is never a page that
 * failed the rubric.
 *
 * @param {object} project
 * @param {number|string} moduleId
 * @param {ReturnType<typeof projectProgress>} [progress] Defaults to the stored one.
 * @returns {boolean} Whether anything was recorded.
 */
export function recordProjectResult(project, moduleId, progress = readProjectProgress(project)) {
  if (!progress.isComplete) return false;

  const page = loadProjectDraft(project);
  // No draft means no autosave has landed (a brand-new device replaying synced
  // progress, say). Tick the project, but never write an empty page over a
  // good snapshot.
  if (page) saveCode(finishedPageKey(project.id), page);

  markProjectComplete(projectCompletionKey(moduleId));
  return true;
}
