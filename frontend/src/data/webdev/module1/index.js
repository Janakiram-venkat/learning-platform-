// Module 1 — Web Foundations & HTML.
//
// This file owns the module's own shape and content. Anything that crosses a
// module boundary — the course metadata, "what section comes next", what the
// sidebar draws — belongs to the registry in ../index.js, which is also what
// the backend stubs are generated from.

import wd1Intro from './wd1-intro';
import wd1HtmlBasics from './wd1-html-basics';
import wd1TextLinksImages from './wd1-text-links-images';
import wd1ListsTables from './wd1-lists-tables';
import wd1Forms from './wd1-forms';
import wd1Challenge from './wd1-challenge';
import wd1Project from './wd1-project';

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

/**
 * The Mini Project.
 *
 * Kept out of SECTIONS for exactly the reason the challenge is: a section is a
 * lesson everywhere else in the app, and this is a project. It is reached from
 * the sidebar's own "Mini Project" entry (drawn because MODULE.hasProject is
 * true), which points at the project route for MODULE.moduleId, and finishing
 * it is recorded under `module101` in `completedProjects` — see
 * lib/webdev/project.js.
 *
 * Its five milestones build ONE page, which is parked under a stable key for
 * Module 2 to style with CSS: `finishedPageKey('wd1-project')`, documented in
 * lib/webdev/projectRules.js.
 */
export const PROJECT = wd1Project;

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
  // Shown when the student finishes the module's last SECTION — the one place
  // they would otherwise hit a full stop, since the Module Challenge and Mini
  // Project are reached from the sidebar rather than by paging on. Authored per
  // module because it names what this module's challenge and project actually
  // are, which no generic sentence can.
  outro:
    'That is every section of Module 1. The Module Challenge is next — six tasks in the sidebar ' +
    'that put the whole module together. After it comes the Mini Project: five milestones that ' +
    'build one page about you.',
};

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
        // The challenge and the project are the same shape, so the same
        // validator catches a typo'd check or a duplicate page id in them too.
        CHALLENGE,
        PROJECT,
      ]);
    })
    .catch(() => { /* never block the lesson on its own linter */ });
}
