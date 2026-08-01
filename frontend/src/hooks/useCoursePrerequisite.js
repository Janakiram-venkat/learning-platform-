import { useEffect, useReducer, useState } from 'react';
import { courseService } from '../services/api';
import { PROGRESS_EVENT, XP_EVENT, evaluatePrerequisite } from '../lib/progress';

// ---------------------------------------------------------------------------
// Is this course open to the student yet?
//
// A course declares its own gate in course.json (`prerequisite`), so the answer
// needs the *other* course's module list to count what's finished. Two hooks:
//
//   usePrerequisite  — you already hold the course document (course pages).
//   useCourseLock    — you only have a courseId (the home page track cards).
//
// The verdict is computed during render rather than stored: it's a synchronous
// read of localStorage, so state would only be a stale copy of it. The only
// thing held in state is the fetched course; progress events just force a
// re-render. That's also what keeps a mid-page sign-in — which pulls saved
// progress down from the server — unlocking without a reload.
// ---------------------------------------------------------------------------

/** Re-render on any progress change, so the verdict below is recomputed. */
function useProgressTick() {
  const [, bump] = useReducer((n) => n + 1, 0);
  useEffect(() => {
    window.addEventListener(PROGRESS_EVENT, bump);
    window.addEventListener(XP_EVENT, bump);
    return () => {
      window.removeEventListener(PROGRESS_EVENT, bump);
      window.removeEventListener(XP_EVENT, bump);
    };
  }, []);
}

/**
 * @param {object|null} prerequisite  the `prerequisite` block from course.json
 * @returns {{ checking: boolean, locked: boolean, met: boolean, done: number,
 *             required: number, prerequisite: object|null }}
 *
 * `checking` is true until the prerequisite course has loaded. Callers must
 * treat that as "don't decide yet" rather than "locked", or a student who has
 * done the work sees the lock screen flash before the fetch lands.
 */
export function usePrerequisite(prerequisite) {
  // { courseId, course } — written only from the fetch, so the id doubles as a
  // marker for "this result belongs to the course we're currently asking about".
  const [fetched, setFetched] = useState(null);
  useProgressTick();

  const prereqCourseId = prerequisite?.courseId || null;

  useEffect(() => {
    if (!prereqCourseId) return undefined;

    let cancelled = false;
    courseService.getCourse(prereqCourseId)
      .then((res) => {
        if (!cancelled) setFetched({ courseId: prereqCourseId, course: res.data.data });
      })
      // A failed fetch must not wall the student off: we can't prove they
      // haven't done the work, so a network blip resolves to "open".
      .catch(() => {
        if (!cancelled) setFetched({ courseId: prereqCourseId, course: null });
      });

    return () => { cancelled = true; };
  }, [prereqCourseId]);

  const resolved = !prereqCourseId || fetched?.courseId === prereqCourseId;
  const prereqCourse = resolved ? fetched?.course || null : null;

  // Unresolved, or resolved to nothing (the failure above) — either way there's
  // no course to count modules in, so we don't claim the gate is unmet.
  const state = prereqCourseId && !prereqCourse
    ? { met: true, done: 0, required: prerequisite?.modulesRequired ?? 0 }
    : evaluatePrerequisite(prerequisite, prereqCourse);

  const checking = !resolved;
  return { ...state, checking, locked: !checking && !state.met, prerequisite: prerequisite || null };
}

/**
 * Same answer, starting from a courseId — fetches the course to read its rule.
 * A course with no `prerequisite` resolves to unlocked after one request, and a
 * null courseId costs no request at all, so a list of cards can call this for
 * every entry whether or not that entry is gated.
 */
export function useCourseLock(courseId) {
  const [fetched, setFetched] = useState(null);

  useEffect(() => {
    if (!courseId) return undefined;

    let cancelled = false;
    const settle = (prerequisite) => { if (!cancelled) setFetched({ courseId, prerequisite }); };

    courseService.getCourse(courseId)
      .then((res) => settle(res.data.data?.prerequisite || null))
      .catch(() => settle(null));

    return () => { cancelled = true; };
  }, [courseId]);

  const resolved = !courseId || fetched?.courseId === courseId;
  const result = usePrerequisite(resolved ? fetched?.prerequisite || null : null);

  const checking = !resolved || result.checking;
  return { ...result, checking, locked: !checking && !result.met };
}
