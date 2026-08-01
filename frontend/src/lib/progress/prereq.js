// Course-level gating: a course can require progress in another course first.
//
// The rule is declared in the course's own JSON (`gamedev/course.json` ->
// `prerequisite`), so locking a course behind another one is a content change
// rather than a code change. This module is the pure half — counting finished
// modules and comparing against the rule. Fetching the courses involved is the
// job of `useCoursePrerequisite`.

import { lessons } from './completion';

/** A module is finished once every lesson in it is complete. */
export function isModuleComplete(module, completed) {
  const moduleLessons = module?.lessons || [];
  return moduleLessons.length > 0 && moduleLessons.every((l) => completed.has(l.lessonId));
}

/** How many of a course's modules the student has fully finished. */
export function countCompletedModules(course) {
  const completed = new Set(lessons.all());
  return (course?.modules || []).filter((m) => isModuleComplete(m, completed)).length;
}

/**
 * Evaluate a course's `prerequisite` block against the student's progress.
 *
 * @param {{ modulesRequired?: number, courseTitle?: string }|null} prerequisite
 *        The rule, straight from course.json. A course with no `prerequisite`
 *        is simply always open.
 * @param {object|null} prereqCourse
 *        The full course document the rule points at, needed because module
 *        completion is defined by that course's lesson lists.
 * @returns {{ met: boolean, done: number, required: number }}
 *          `done` is capped at `required` so the UI can render "3 / 5" without
 *          ever showing a number above the target.
 */
export function evaluatePrerequisite(prerequisite, prereqCourse) {
  const required = prerequisite?.modulesRequired ?? 0;
  if (!required) return { met: true, done: 0, required: 0 };

  const done = countCompletedModules(prereqCourse);
  return { met: done >= required, done: Math.min(done, required), required };
}
