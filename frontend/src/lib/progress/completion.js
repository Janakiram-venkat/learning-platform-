// "Has the student finished X?" — for every kind of X.
//
// Lessons, arcade assignments, mini-projects, labs and game steps all track
// completion identically: a JSON array of ids in localStorage. This used to be
// five hand-written trios of get/is/mark functions; it's now one factory, so a
// sixth content type costs one line in COMPLETION_KEYS.

import { COMPLETION_KEYS, notifyProgressChange } from './keys';
import { readJSON, writeJSON } from './storage';

/**
 * Build the accessor trio for one completion kind.
 *
 * @param {keyof typeof COMPLETION_KEYS} kind
 * @returns {{ all: () => string[], has: (id: string) => boolean, mark: (id: string) => boolean }}
 *          `mark` returns true only the first time an id is recorded, so callers
 *          can distinguish "just finished" from "revisited".
 */
export function completionSet(kind) {
  const key = COMPLETION_KEYS[kind];
  if (!key) {
    throw new Error(
      `Unknown completion kind "${kind}" — add it to COMPLETION_KEYS in lib/progress/keys.js`,
    );
  }

  const all = () => readJSON(key, []);

  return {
    all,
    has: (id) => all().includes(id),
    mark: (id) => {
      const done = all();
      if (done.includes(id)) return false;
      done.push(id);
      writeJSON(key, done);
      notifyProgressChange();
      return true;
    },
  };
}

export const lessons = completionSet('lessons');
export const assignments = completionSet('assignments');
export const projects = completionSet('projects');
export const labs = completionSet('labs');
export const gameSteps = completionSet('gameSteps');
