// Completion state for the lesson engine.
//
// Two granularities, stored differently on purpose:
//
//   Section  -> the existing `completedLessons` set. A web-dev section IS a
//               lesson as far as the rest of the app is concerned (it appears
//               in module1.json's `lessons[]`), so recording it there makes the
//               sidebar, the course progress bar and the unlock logic work with
//               no changes to any of them.
//   Page     -> `webdevPages`, a new document key registered in
//               lib/progress/keys.js. Finer-grained than anything that existed:
//               which individual tasks and quizzes inside a section are passed.
//
// Both sync to the server through the normal progress pipeline. Draft code does
// not — that lives in lib/webdev/storage.js. See the note there for why.

import { lessons } from '../progress/completion';
import { notifyProgressChange } from '../progress/keys';
import { readJSON, writeJSON } from '../progress/storage';

const PAGES_KEY = 'webdevPages';

/**
 * Ids of the pages in a section whose required work is done.
 * @param {string} sectionId
 * @returns {Set<string>}
 */
export function getDonePages(sectionId) {
  const all = readJSON(PAGES_KEY, {});
  return new Set(all[sectionId] || []);
}

/**
 * @param {string} sectionId
 * @param {string} pageId
 * @returns {boolean}
 */
export function isPageDone(sectionId, pageId) {
  return getDonePages(sectionId).has(pageId);
}

/**
 * Record a passed task or quiz. Idempotent.
 * @param {string} sectionId
 * @param {string} pageId
 * @returns {boolean} true only the first time, so callers can celebrate once.
 */
export function markPageDone(sectionId, pageId) {
  const all = readJSON(PAGES_KEY, {});
  const done = all[sectionId] || [];
  if (done.includes(pageId)) return false;

  all[sectionId] = [...done, pageId];
  writeJSON(PAGES_KEY, all);
  notifyProgressChange();
  return true;
}

/** @param {string} sectionId @returns {boolean} */
export function isSectionComplete(sectionId) {
  return lessons.has(sectionId);
}

/**
 * @param {string} sectionId
 * @returns {boolean} true only the first time the section is finished.
 */
export function markSectionComplete(sectionId) {
  return lessons.mark(sectionId);
}

/**
 * Which pages in a section must be passed before it can be completed.
 * @param {{pages: Array<{id: string, required?: boolean}>}} section
 * @returns {string[]} page ids
 */
export function requiredPageIds(section) {
  return (section?.pages || []).filter((p) => p.required).map((p) => p.id);
}

/**
 * Has every required task and quiz in this section been passed?
 * @param {{id: string, pages: Array<object>}} section
 * @returns {boolean}
 */
export function allRequiredDone(section) {
  const done = getDonePages(section.id);
  return requiredPageIds(section).every((id) => done.has(id));
}
