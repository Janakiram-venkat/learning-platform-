// Course-shaped questions: what's unlocked, and what comes next.
//
// These read completion state but are really about course structure, so they
// live apart from the storage primitives. They're pure functions of
// (course, completion state) — the easiest part of this layer to test.

import { assignments, lessons } from './completion';
import { notifyProgressChange } from './keys';
import { readJSON, writeJSON } from './storage';

const STARS_KEY = 'assignmentStars';

// --- Lessons ---------------------------------------------------------------

export function getCompletedLessons() {
  return lessons.all();
}

/**
 * The lessonIds the student is allowed to open. A lesson unlocks only when
 * every lesson before it (in course order) is complete; the first is always open.
 */
export function getUnlockedLessonIds(course) {
  const completed = new Set(lessons.all());
  const allLessons = course?.modules?.flatMap((m) => m.lessons || []) || [];

  const unlocked = new Set();
  let prevAllDone = true;
  for (const lesson of allLessons) {
    if (prevAllDone) unlocked.add(lesson.lessonId);
    prevAllDone = prevAllDone && completed.has(lesson.lessonId);
  }
  return unlocked;
}

/**
 * The lessonId of the next module's first lesson — used to send students back
 * into the learning content after finishing a challenge or project.
 * Returns null if there's nothing next.
 */
export function getNextLessonAfterModule(course, moduleNumericId) {
  const modules = course?.modules || [];
  const idx = modules.findIndex(
    (m) => String(m.moduleId ?? m.id) === String(moduleNumericId),
  );
  if (idx === -1) return null;
  for (let i = idx + 1; i < modules.length; i++) {
    const first = modules[i].lessons?.[0];
    if (first) return first.lessonId;
  }
  return null;
}

// --- Modules & arcade assignments ------------------------------------------

/** A module's numeric id (module.moduleId from the JSON, falling back to .id). */
export function getModuleNumericId(module) {
  return module?.moduleId ?? module?.id;
}

/** Assignments are stored/served as "module<N>" (e.g. "module1"). */
export function getAssignmentKey(module) {
  return `module${getModuleNumericId(module)}`;
}

/**
 * True when every lesson in the module is complete — only then does the
 * module's arcade challenge open up.
 */
export function isAssignmentUnlocked(module) {
  const completed = new Set(lessons.all());
  const moduleLessons = module?.lessons || [];
  return moduleLessons.length > 0 && moduleLessons.every((l) => completed.has(l.lessonId));
}

export function getCompletedAssignments() {
  return assignments.all();
}

export function isAssignmentCompleted(assignmentKey) {
  return assignments.has(assignmentKey);
}

export function getAssignmentStars() {
  return readJSON(STARS_KEY, {});
}

/**
 * Record a finished arcade assignment along with its star score (1-3).
 * Only an improvement on the previous best is stored, so replaying can raise
 * a score but never lower it.
 */
export function markAssignmentComplete(assignmentKey, stars) {
  assignments.mark(assignmentKey);

  const scores = getAssignmentStars();
  if ((scores[assignmentKey] ?? 0) < stars) {
    scores[assignmentKey] = stars;
    writeJSON(STARS_KEY, scores);
    notifyProgressChange();
  }
}
