// Dev-only: wipe this course's progress without disturbing any other course.
//
// Needed because progress is shared storage. `completedLessons` holds ids from
// every course in one array, so "start the web-dev course over" means removing
// exactly this course's ids from it and leaving the other ninety-odd alone.
//
// What this deliberately does NOT touch
// -------------------------------------
// `completedAssignments` and `completedProjects` are keyed `module<N>` with no
// course prefix, so web-dev's "module1" is the SAME key as Python's, AI's and
// robotics' module1. Deleting it to clear the web-dev challenge would silently
// mark Python's module 1 challenge unfinished too. Until those keys are
// namespaced (see the note in the Phase 5 report), this function leaves them
// alone and the module challenge / mini project ticks are out of its reach.
//
// `completedLabs` shows the shape the other two should have had:
// `"<courseId>-module1"`. Nothing to do there — web-dev has no labs.

import { PROGRESS_KEYS, notifyProgressChange } from '../progress/keys';
import { snapshotProgress } from '../progress/sync';
import { readJSON, writeJSON } from '../progress/storage';
import { getAuthToken, progressService } from '../../services/api';

/** Section ids this course has ever used, including retired ones. */
const LEGACY_SECTION_IDS = ['webdev-intro'];

/** Future modules are wd2-…, wd3-… — match the family, not one module. */
const SECTION_ID_PATTERN = /^wd\d+-/;

/**
 * @param {string} id
 * @param {string[]} knownIds Section ids currently defined in the course data.
 * @returns {boolean}
 */
function isWebDevSectionId(id, knownIds) {
  return knownIds.includes(id) || LEGACY_SECTION_IDS.includes(id) || SECTION_ID_PATTERN.test(id);
}

/**
 * Remove every trace of web-dev progress, locally and on the server.
 *
 * @param {string[]} knownIds Section ids from the course data.
 * @returns {Promise<{ lessons: string[], pages: string[], drafts: number, synced: boolean }>}
 *          What was actually removed, so the caller can report it.
 */
export async function resetWebDevProgress(knownIds = []) {
  const removed = { lessons: [], pages: [], drafts: 0, synced: false };

  // 1. completedLessons — drop only this course's ids.
  const lessons = readJSON('completedLessons', []);
  const keptLessons = lessons.filter((id) => {
    const mine = isWebDevSectionId(id, knownIds);
    if (mine) removed.lessons.push(id);
    return !mine;
  });
  writeJSON('completedLessons', keptLessons);

  // 2. webdevPages — this course owns the whole key, but clear it section by
  // section anyway so the report can say what went.
  const pages = readJSON('webdevPages', {});
  Object.keys(pages).forEach((sectionId) => removed.pages.push(sectionId));
  writeJSON('webdevPages', {});

  // 3 & 4. Local-only keys (not in PROGRESS_KEYS, so the server has no copy).
  writeJSON('webdevCursor', {});
  const code = readJSON('webdevCode', {});
  const keptCode = {};
  Object.entries(code).forEach(([key, value]) => {
    // Draft keys are "<sectionId>/<pageId>".
    if (isWebDevSectionId(key.split('/')[0], knownIds)) removed.drafts += 1;
    else keptCode[key] = value;
  });
  writeJSON('webdevCode', keptCode);

  notifyProgressChange();

  // 5. Push the cleared document to the server. This must be the full-replace
  // PUT, not the PATCH merge: the merge takes the union of arrays, so a
  // deletion sent that way would be handed straight back on the next load.
  if (getAuthToken()) {
    try {
      await progressService.save(snapshotProgress());
      removed.synced = true;
    } catch (err) {
      console.error('[webdev] local progress cleared, but the server still has the old copy', err);
    }
  }

  return removed;
}

/** The progress keys this course writes to, for display in the dev UI. */
export const WEBDEV_KEYS = {
  synced: PROGRESS_KEYS.filter((k) => k === 'completedLessons' || k === 'webdevPages'),
  localOnly: ['webdevCursor', 'webdevCode'],
  untouched: ['completedAssignments', 'completedProjects'],
};
