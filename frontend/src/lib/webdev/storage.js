// Per-page autosave for the web-dev code editors.
//
// Deliberately NOT registered in lib/progress/keys.js: a student's half-typed
// draft of every task in the course is a lot of text to push to the server on
// every keystroke, and losing a draft when moving to another device is a much
// smaller cost than bloating the progress sync. Completion state — which pages
// and sections are finished — does sync; see lib/webdev/progress.js.

import { readJSON, writeJSON } from '../progress/storage';

const CODE_KEY = 'webdevCode';

/** @typedef {{ html?: string, css?: string, js?: string }} CodeFiles */

/**
 * The student's saved edits for one editor, or null if they never touched it.
 * @param {string} key Stable id for this editor, e.g. "module1/intro/p4".
 * @returns {CodeFiles|null}
 */
export function loadCode(key) {
  const all = readJSON(CODE_KEY, {});
  return all[key] ?? null;
}

/**
 * @param {string} key
 * @param {CodeFiles} files
 */
export function saveCode(key, files) {
  const all = readJSON(CODE_KEY, {});
  all[key] = files;
  writeJSON(CODE_KEY, all);
}

/** Forget one editor's draft — what the Reset button does. @param {string} key */
export function clearCode(key) {
  const all = readJSON(CODE_KEY, {});
  if (!(key in all)) return;
  delete all[key];
  writeJSON(CODE_KEY, all);
}
