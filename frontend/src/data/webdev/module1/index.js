// Module 1 — Web Foundations & HTML.
//
// This file is the SOURCE OF TRUTH for the module's shape. The backend stubs
// under backend/courses/webdev/ are generated from it by
// frontend/scripts/sync-webdev-course.mjs — edit here, then re-run that script.
// Nothing reads the backend copy except the course list on the dashboard.

import wd1Intro from './wd1-intro';
import wd1HtmlBasics from './wd1-html-basics';
import wd1TextLinksImages from './wd1-text-links-images';
import wd1ListsTables from './wd1-lists-tables';
import wd1Forms from './wd1-forms';
import wd1Challenge from './wd1-challenge';

/**
 * Every section in the module, written or not.
 *
 * A section with `section: null` is announced but not built yet. It still
 * appears in the sidebar so students can see where the module is going; opening
 * one lands on a "coming soon" panel rather than a broken page.
 *
 * @type {Array<{ id: string, title: string, duration: string, section: object|null }>}
 */
export const SECTIONS = [
  { id: 'wd1-intro', title: 'Introduction to Web Development', duration: '25 min', section: wd1Intro },
  { id: 'wd1-html-basics', title: 'HTML Basics', duration: '30 min', section: wd1HtmlBasics },
  { id: 'wd1-text-links-images', title: 'Text, Links & Images', duration: '30 min', section: wd1TextLinksImages },
  { id: 'wd1-lists-tables', title: 'Lists & Tables', duration: '25 min', section: wd1ListsTables },
  { id: 'wd1-forms', title: 'Forms & Inputs (basics)', duration: '30 min', section: wd1Forms },
];

/**
 * The Module Challenge.
 *
 * Shaped exactly like a section, but deliberately NOT in SECTIONS: a section is
 * a lesson everywhere else in the app (the sidebar lists it, course progress
 * counts it, `completedLessons` records it), and the challenge is an
 * assignment. It is reached from the sidebar's own "Module Challenge" entry,
 * which points at the assignment route for MODULE.moduleId, and its pass is
 * recorded under `module101` in `completedAssignments` — see
 * lib/webdev/challenge.js.
 */
export const CHALLENGE = wd1Challenge;

/** @returns {object} The module's challenge data. */
export function getChallenge() {
  return CHALLENGE;
}

export const MODULE = {
  // Not 1. Challenge and project completion live in flat, course-agnostic
  // localStorage sets (`completedAssignments`/`completedProjects`) keyed only
  // "module<N>" — so a webdev moduleId of 1 reads Python's finished module 1 as
  // this module's, ticking our challenge and project before the student opens
  // them. 101 keeps this course's numbering clear of every other course's
  // (highest in use: robotics 12). The sidebar heading numbers modules by
  // position, so this still displays as "Module 1".
  moduleId: 101,
  title: 'Web Foundations & HTML',
  emoji: '🌐',
  tagline: 'How the web works, and how to build a page for it from scratch.',
  hasProject: true,
};

export const COURSE = {
  courseId: 'webdev',
  title: 'Web Development',
  description: 'Build pages and apps for the browser with HTML, CSS and JavaScript.',
  level: 'Beginner',
  estimatedHours: 20,
  emoji: '🌐',
  thumbnail: '/images/webdev.png',
};

/** @param {string} id @returns {object|null} The section data, or null if unwritten. */
export function getSection(id) {
  return SECTIONS.find((s) => s.id === id)?.section ?? null;
}

/** @param {string} id @returns {boolean} Is this a section id we know about at all? */
export function isKnownSection(id) {
  return SECTIONS.some((s) => s.id === id);
}

/** @param {string} id @returns {{id:string,title:string}|null} The next section after this one. */
export function getNextSection(id) {
  const i = SECTIONS.findIndex((s) => s.id === id);
  return i === -1 ? null : SECTIONS[i + 1] ?? null;
}

/**
 * The course document the shared Sidebar expects, built from the data above so
 * the lesson page never has to wait on a network request to draw its own
 * navigation. Shape matches backend/courses/<id>/course.json + moduleN.json.
 */
export function buildCourse() {
  return {
    ...COURSE,
    modules: [
      {
        ...MODULE,
        lessons: SECTIONS.map(({ id, title, duration, section }) => ({
          lessonId: id,
          // Unwritten sections say so in the sidebar rather than looking ready.
          title: section ? title : `${title} (coming soon)`,
          duration,
        })),
      },
    ],
  };
}

// Author-time safety net: validate every written section once, on import.
//
// The import is dynamic and the guard is optional-chained on purpose. Dynamic
// keeps the validator in its own chunk that a production build never fetches;
// the `?.` keeps this file importable from a plain Node script (where
// `import.meta.env` doesn't exist), which is how the content is tested.
if (import.meta.env?.DEV) {
  import('../../../lib/webdev/validate')
    .then(({ validateSections }) => {
      validateSections([
        ...SECTIONS.filter((s) => s.section).map((s) => s.section),
        // The challenge is the same shape, so the same validator catches a
        // typo'd check or a duplicate page id in it too.
        CHALLENGE,
      ]);
    })
    .catch(() => { /* never block the lesson on its own linter */ });
}
