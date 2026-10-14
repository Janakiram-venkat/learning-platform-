// The web-dev course registry — every module, in order.
//
// This file is the SOURCE OF TRUTH for the course's shape. Each module folder
// owns its own content and metadata (SECTIONS, MODULE, CHALLENGE, PROJECT);
// this file is the only place that knows they form a sequence, so everything
// that crosses a module boundary — "what comes after this section?", "what does
// the sidebar draw?" — is answered here and nowhere else.
//
// The backend stubs under backend/courses/webdev/ are generated from this file
// by frontend/scripts/sync-webdev-course.mjs — edit here, then re-run it.
// Nothing reads the backend copy except the course list on the dashboard.

import * as module1 from './module1';
import * as module2 from './module2';

/**
 * Whether Module 2 is finished enough for students to see.
 *
 * Phase 11 flips this to `true`, and that is the whole release. Until then:
 *
 *   - a PRODUCTION build shows Module 1 only, so `main` can be merged at any
 *     point in Phases 3-10 without a half-written module appearing to anyone;
 *   - the generated backend stubs list Module 1 only, so the dashboard's
 *     course list agrees with the sidebar (the script reads this constant as a
 *     literal — keep it a plain `true`/`false`);
 *   - DEV still shows Module 2, because each phase ends in a browser review
 *     and content you cannot open is content you cannot review.
 *
 * So this is a release flag, not a feature flag: it answers "is this public
 * yet", and dev is never public.
 */
export const MODULE_2_RELEASED = false;

/** Course-level metadata. Not per-module, so it lives here rather than in one. */
export const COURSE = {
  courseId: 'webdev',
  title: 'Web Development',
  description: 'Build pages and apps for the browser with HTML, CSS and JavaScript.',
  level: 'Beginner',
  estimatedHours: 20,
  emoji: '🌐',
  thumbnail: '/images/webdev.png',
};

/**
 * Every module in the course, in teaching order, whether released or not.
 *
 * `released: true` means "visible to students". A module whose content is
 * still being written sets it from {@link MODULE_2_RELEASED} instead.
 */
const ALL_MODULES = [
  {
    ...module1.MODULE,
    sections: module1.SECTIONS,
    challenge: module1.CHALLENGE,
    project: module1.PROJECT,
    released: true,
  },
  {
    ...module2.MODULE,
    sections: module2.SECTIONS,
    challenge: module2.CHALLENGE,
    project: module2.PROJECT,
    // Visible in dev so each phase can be reviewed in the browser; hidden in a
    // production build until Phase 11. `import.meta.env` is optional-chained so
    // this file stays importable from a plain Node test script, where a missing
    // env means "not dev" and the released flag alone decides.
    released: MODULE_2_RELEASED || !!import.meta.env?.DEV,
  },
];

/**
 * The modules a student can actually reach, in order.
 *
 * Everything below is built from this rather than from ALL_MODULES, which is
 * what makes the release flag a single point of control: an unreleased module
 * is absent from the sidebar, absent from course progress, and not a navigation
 * target — rather than present-but-disabled in three places that can disagree.
 */
export function getModules() {
  return ALL_MODULES.filter((m) => m.released);
}

/** Every visible section, flattened across modules, in teaching order. */
function allSections() {
  return getModules().flatMap((m) => m.sections.map((s) => ({ ...s, moduleId: m.moduleId })));
}

/** @param {string|number} moduleId @returns {object|null} The module, if visible. */
export function getModule(moduleId) {
  const want = String(moduleId).replace(/^module/, '');
  return getModules().find((m) => String(m.moduleId) === want) ?? null;
}

/** @param {string} id @returns {object|null} The section data, or null if unwritten. */
export function getSection(id) {
  return allSections().find((s) => s.id === id)?.section ?? null;
}

/** @param {string} id @returns {boolean} Is this a section id we know about at all? */
export function isKnownSection(id) {
  return allSections().some((s) => s.id === id);
}

/** @param {string} id @returns {object|null} The module a section belongs to. */
export function getModuleOfSection(id) {
  return getModules().find((m) => m.sections.some((s) => s.id === id)) ?? null;
}

/**
 * The next section after this one, crossing module boundaries.
 *
 * The whole course is one ordered list of sections, so "next" after the last
 * section of Module 1 is the first section of Module 2. That is only true of
 * modules a student can see, though, which is why this walks {@link getModules}
 * and not ALL_MODULES: while Module 2 is unreleased, Module 1's last section
 * has no next section, exactly as it had when Module 1 was the whole course.
 * The lesson page reads that `null` as "end of module" and sends the student to
 * the Module Challenge — so the release flag changes where students are sent
 * next without the lesson page knowing the flag exists.
 *
 * The returned section carries `moduleId`, and `crossesModule` when the next
 * section is in a different module than the one asked about — which is how the
 * lesson page can congratulate someone on finishing a module and still hand
 * them a link onward.
 *
 * @param {string} id
 * @returns {{id:string,title:string,section:object|null,moduleId:number,crossesModule:boolean}|null}
 */
export function getNextSection(id) {
  const sections = allSections();
  const i = sections.findIndex((s) => s.id === id);
  if (i === -1) return null;

  const next = sections[i + 1];
  if (!next) return null;

  return { ...next, crossesModule: next.moduleId !== sections[i].moduleId };
}

/**
 * The course document the shared Sidebar expects, built from the data above so
 * the lesson page never has to wait on a network request to draw its own
 * navigation. Shape matches backend/courses/<id>/course.json + moduleN.json.
 */
export function buildCourse() {
  return {
    ...COURSE,
    modules: getModules().map((m) => ({
      moduleId: m.moduleId,
      title: m.title,
      emoji: m.emoji,
      tagline: m.tagline,
      // A module whose project is not written yet must not advertise one: the
      // sidebar draws a Mini Project link from this flag alone.
      hasProject: m.hasProject && !!m.project,
      lessons: m.sections.map(({ id, title, duration, section }) => ({
        lessonId: id,
        // Unwritten sections say so in the sidebar rather than looking ready.
        title: section ? title : `${title} (coming soon)`,
        duration,
      })),
    })),
  };
}

/**
 * A module's challenge data, or null when it has not been written yet.
 * @param {string|number} moduleId
 */
export function getChallenge(moduleId) {
  return getModule(moduleId)?.challenge ?? null;
}

/**
 * A module's mini project data, or null when it has not been written yet.
 * @param {string|number} moduleId
 */
export function getProject(moduleId) {
  return getModule(moduleId)?.project ?? null;
}
