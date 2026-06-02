// Progress helpers shared across the lesson UI.

export function getCompletedLessons() {
  try {
    return JSON.parse(localStorage.getItem('completedLessons') || '[]');
  } catch {
    return [];
  }
}

// Returns a Set of lessonIds the user is allowed to open.
// A lesson is unlocked only when every lesson before it (in course order)
// has been completed. The very first lesson is always unlocked.
export function getUnlockedLessonIds(course) {
  const completed = new Set(getCompletedLessons());
  const allLessons = course?.modules?.flatMap(m => m.lessons || []) || [];

  const unlocked = new Set();
  let prevAllDone = true;
  for (const lesson of allLessons) {
    if (prevAllDone) unlocked.add(lesson.lessonId);
    prevAllDone = prevAllDone && completed.has(lesson.lessonId);
  }
  return unlocked;
}
