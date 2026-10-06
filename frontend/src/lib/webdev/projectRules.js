// Rules for a module's mini project. Pure, and deliberately import-free.
//
// Nothing in here touches localStorage, React or the DOM, so a Node test can
// import it directly and the unlock order a student experiences is the order
// that gets tested. The stateful half — what is recorded where — lives next
// door in project.js, exactly as challengeScore.js / challenge.js are split.
//
// A project is shaped like a section (id / title / pages), so `checkSection`
// validates it and the engine's TaskPage renders its pages. The difference is
// what the pages MEAN:
//
//   milestone pages -> `type: 'task'`, graded on their own new requirements
//                      only, and gated: milestone N opens when N-1 passes.
//   the rubric page -> the last page, `role: 'rubric'`. Its checks re-grade
//                      every milestone's requirements over the finished page,
//                      so breaking milestone 2 while building milestone 5 is
//                      caught here with the failing item named.
//
// All of them edit ONE document: every page shares a single draft key, so the
// student carries their page from milestone to milestone instead of starting
// over five times. See {@link projectDraftKey}.

/** Marks the last page as the rubric rather than a sixth milestone. */
const RUBRIC_ROLE = 'rubric';

/**
 * The gated, graded milestones, in order. The rubric is not one of them.
 * @param {{ pages?: Array<object> }} project
 * @returns {Array<object>}
 */
export function projectMilestones(project) {
  return (project?.pages || []).filter((p) => p.type === 'task' && p.role !== RUBRIC_ROLE);
}

/** @param {object} project @returns {string[]} */
export function projectMilestoneIds(project) {
  return projectMilestones(project).map((p) => p.id);
}

/**
 * The final checklist page, or null if this project has none.
 * @param {object} project
 * @returns {object|null}
 */
export function projectRubricPage(project) {
  return (project?.pages || []).find((p) => p.role === RUBRIC_ROLE) ?? null;
}

/**
 * How far the student has earned their way, as an index into `project.pages`.
 *
 * Returns the index of the first page they have NOT passed, which is also the
 * last page they are allowed to open: everything before it is passed, and one
 * unpassed page is always open to work on. With every milestone passed this is
 * the rubric's own index, which is what unlocks the rubric.
 *
 * @param {object} project
 * @param {Set<string>|string[]} donePageIds
 * @returns {number}
 */
export function unlockedThrough(project, donePageIds) {
  const done = donePageIds instanceof Set ? donePageIds : new Set(donePageIds || []);
  const ids = projectMilestoneIds(project);
  let i = 0;
  while (i < ids.length && done.has(ids[i])) i += 1;
  return i;
}

/**
 * Can this page be opened yet?
 *
 * Note what this does NOT do: it never locks a page the student has already
 * passed. Going back to fix milestone 2 after reaching milestone 5 is the
 * whole point of building one document.
 *
 * @param {object} project
 * @param {Set<string>|string[]} donePageIds
 * @param {number} index Index into `project.pages`.
 * @returns {boolean}
 */
export function isPageUnlocked(project, donePageIds, index) {
  return index >= 0 && index <= unlockedThrough(project, donePageIds);
}

/**
 * Where to drop a returning student: the furthest page they have earned,
 * clamped to a saved position if they have one.
 *
 * @param {object} project
 * @param {Set<string>|string[]} donePageIds
 * @param {number|null} saved
 * @returns {number}
 */
export function openingPage(project, donePageIds, saved) {
  const ceiling = unlockedThrough(project, donePageIds);
  if (saved == null) return ceiling;
  return Math.max(0, Math.min(saved, ceiling));
}

/**
 * The student's standing.
 *
 * `isComplete` is the finished-the-whole-project verdict: every milestone AND
 * the rubric. A project with all five milestones passed but a rubric that has
 * never been run is `milestonesDone` but not complete, because the rubric is
 * the only thing that re-checks the earlier work.
 *
 * @param {object} project
 * @param {Set<string>|string[]} donePageIds
 * @returns {{ total: number, passed: number, milestonesDone: boolean,
 *             rubricPassed: boolean, isComplete: boolean, nextIndex: number }}
 */
export function projectProgress(project, donePageIds) {
  const done = donePageIds instanceof Set ? donePageIds : new Set(donePageIds || []);
  const ids = projectMilestoneIds(project);
  const passed = ids.filter((id) => done.has(id)).length;
  const rubric = projectRubricPage(project);
  const rubricPassed = !!rubric && done.has(rubric.id);
  const milestonesDone = ids.length > 0 && passed === ids.length;

  return {
    total: ids.length,
    passed,
    milestonesDone,
    rubricPassed,
    isComplete: milestonesDone && rubricPassed,
    nextIndex: unlockedThrough(project, done),
  };
}

/**
 * The autosave key for the student's page — ONE key for the whole project.
 *
 * This is the mechanism behind "the document carries over": every milestone's
 * editor is handed this same key, so opening milestone 3 shows the page as it
 * was left at the end of milestone 2. Section drafts are keyed
 * "<sectionId>/<pageId>", so a project id that is not a section id can never
 * collide with one.
 *
 * @param {string} projectId
 * @returns {string}
 */
export function projectDraftKey(projectId) {
  return `${projectId}/page`;
}

/**
 * Where a FINISHED project page is parked for a later module to pick up.
 *
 * Stable and documented on purpose: Module 2 teaches CSS over the page the
 * student already built, and this is the key it will read.
 *
 *   loadCode(finishedPageKey('wd1-project'))  ->  { html, css, js } | null
 *
 * Written only when the rubric passes, so what is under this key is always a
 * page that met every rubric item — never a half-finished draft. It is a
 * SNAPSHOT, not a live alias of the draft: a student who later breaks their
 * page does not corrupt Module 2's starting point, and a passing re-run
 * refreshes it. Local-only (it lives in `webdevCode`), like every draft.
 *
 * @param {string} projectId
 * @returns {string}
 */
export function finishedPageKey(projectId) {
  return `${projectId}/finished-page`;
}
