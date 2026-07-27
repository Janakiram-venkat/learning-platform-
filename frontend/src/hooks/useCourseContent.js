import { useEffect, useState } from 'react';
import { courseService } from '../services/api';

// ---------------------------------------------------------------------------
// useCourseContent — fetch a course plus one piece of its content.
//
// Every content page (lesson, assignment, project, lab, game step) opened with
// its own copy of the same effect: fetch the course, fetch the item, juggle a
// loading flag, swallow the error. Same shape, five slightly different bugs.
// This is that effect, once.
// ---------------------------------------------------------------------------

// Content kind -> the courseService call that fetches it. Mirrors KIND_DIRS on
// the backend; a new content type is one line here.
const FETCHERS = {
  module: courseService.getModule,
  lesson: courseService.getLesson,
  assignment: courseService.getAssignment,
  project: courseService.getProject,
  lab: courseService.getLab,
};

/**
 * @param {string} courseId
 * @param {keyof typeof FETCHERS} kind
 * @param {string} key      lessonId, or a module key like "module1"
 * @param {{ includeCourse?: boolean }} [options]
 *        Pages that render course navigation need the course document; ones
 *        that don't (the game steps) can skip that request entirely.
 * @returns {{ course: object|null, item: object|null, loading: boolean, error: Error|null }}
 *
 * `item` stays null while loading and when the fetch fails, so pages can render
 * a not-found state off `!loading && !item` without a second flag.
 */
export function useCourseContent(courseId, kind, key, { includeCourse = true } = {}) {
  const [course, setCourse] = useState(null);
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetcher = FETCHERS[kind];
    if (!fetcher) throw new Error(`useCourseContent: unknown content kind "${kind}"`);

    // Guards against a slow first response overwriting a newer one when the
    // student navigates between lessons quickly.
    let cancelled = false;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- entering the loading state is the point: the route params changed and we're refetching
    setLoading(true);
    setError(null);

    Promise.all([
      includeCourse ? courseService.getCourse(courseId) : Promise.resolve(null),
      fetcher(courseId, key),
    ])
      .then(([courseRes, itemRes]) => {
        if (cancelled) return;
        if (courseRes) setCourse(courseRes.data.data);
        setItem(itemRes.data.data);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(`Failed to load ${kind} "${key}" in course "${courseId}"`, err);
        setItem(null);
        setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [courseId, kind, key, includeCourse]);

  return { course, item, loading, error };
}
