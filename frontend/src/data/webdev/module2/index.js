// Module 2 — CSS Fundamentals.
//
// The module's shape, written out in full from the syllabus (CLAUDEwd2.md)
// before any of its content exists. A section with `section: null` is announced
// but unwritten: it shows in the sidebar as "(coming soon)" so a student can
// see where the module is going, and opening it lands on a panel that says so
// rather than on a broken page.
//
// This module is NOT visible in a production build yet — see MODULE_2_RELEASED
// in ../index.js, which is the one line Phase 11 flips.

import wd2Intro from './wd2-intro';

/**
 * Every section in the module, written or not.
 *
 * @type {Array<{ id: string, title: string, duration: string, section: object|null }>}
 */
export const SECTIONS = [
  { id: 'wd2-intro', title: 'Intro to CSS', duration: '25 min', section: wd2Intro },
  { id: 'wd2-selectors', title: 'Selectors and the Cascade', duration: '30 min', section: null },
  { id: 'wd2-text-colors', title: 'Text, Colors and Backgrounds', duration: '30 min', section: null },
  { id: 'wd2-box-model', title: 'The Box Model', duration: '30 min', section: null },
  { id: 'wd2-flexbox', title: 'Layout with Flexbox', duration: '30 min', section: null },
  { id: 'wd2-responsive', title: 'Responsive Design and Finishing Touches', duration: '25 min', section: null },
];

/**
 * The Module Challenge — null until it is written (Phase 9).
 *
 * Kept out of SECTIONS for the reason Module 1's is: a section is a lesson
 * everywhere else in the app, and this is an assignment. See
 * ../module1/index.js.
 */
export const CHALLENGE = null;

/** The Mini Project — null until it is written (Phase 10). */
export const PROJECT = null;

export const MODULE = {
  // 102, continuing from Module 1's 101. Not 2: challenge and project
  // completion live in flat, course-agnostic localStorage sets keyed only
  // "module<N>", so a webdev moduleId of 2 would read Python's finished
  // module 2 as this module's. See ../module1/index.js for the full reasoning.
  moduleId: 102,
  title: 'CSS Fundamentals',
  emoji: '🎨',
  tagline: 'Turn a plain HTML page into something you would actually want to look at.',
  hasProject: true,
  // See ../module1/index.js. Rewritten in Phases 9-10, once this module's
  // challenge and project exist and can be described accurately.
  outro:
    'That is every section of Module 2. The Module Challenge is next — auto-checked tasks in the ' +
    'sidebar that put the whole module together. After it comes the Mini Project, which styles the ' +
    'page you built in Module 1.',
};

// Author-time safety net: validate every written section once, on import.
// Dynamic so the validator stays in a chunk a production build never fetches;
// optional-chained so this file is importable from a plain Node test script.
if (import.meta.env?.DEV) {
  import('../../../lib/webdev/validate')
    .then(({ validateSections }) => {
      validateSections([
        ...SECTIONS.filter((s) => s.section).map((s) => s.section),
        CHALLENGE,
        PROJECT,
      ].filter(Boolean));
    })
    .catch(() => { /* never block the lesson on its own linter */ });
}
