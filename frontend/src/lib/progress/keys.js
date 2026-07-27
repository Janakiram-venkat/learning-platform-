// The single source of truth for what a student's saved progress is made of.
//
// Everything listed here is synced to the backend by ProgressSync. Adding a
// progress key anywhere else without registering it here means that value works
// locally but silently vanishes when the student signs in on another device —
// which is why the sync list is derived from these maps rather than maintained
// by hand alongside them.

// Kind -> localStorage key. Each is a JSON array of completed ids.
export const COMPLETION_KEYS = {
  lessons: 'completedLessons',
  assignments: 'completedAssignments',
  projects: 'completedProjects',
  labs: 'completedLabs',
  gameSteps: 'completedGameSteps',
};

// A single running total, stored as a plain number rather than JSON.
export const NUMERIC_KEYS = ['totalXP'];

// Everything else — stored as JSON documents.
export const DOCUMENT_KEYS = [
  'xpClaimed',       // ids that have already paid out XP, so re-takes can't farm
  'earnedBadges',    // [{ id, name, type, earnedAt }]
  'feedbackAsked',   // module milestones we've already prompted at
  'assignmentStars', // { assignmentKey: bestStars }
  'aiIdeas',         // saved "Design Your Own AI" concept cards
];

// Every key that gets snapshotted, pushed to the server, and wiped on sign-out.
export const PROGRESS_KEYS = [
  ...NUMERIC_KEYS,
  ...DOCUMENT_KEYS,
  ...Object.values(COMPLETION_KEYS),
];

// Window events. The UI is synchronous over localStorage, so live widgets (the
// XP badge) and the sync layer listen for these instead of polling.
export const XP_EVENT = 'xp-change';
export const PROGRESS_EVENT = 'progress-change';

// Fire whenever progress changes so the sync layer can push it to the server.
// Call this after any write to a PROGRESS_KEYS entry.
export function notifyProgressChange() {
  try {
    window.dispatchEvent(new CustomEvent(PROGRESS_EVENT));
  } catch {
    // ignore (e.g. non-browser env)
  }
}

export function emitXPChange(total, gained = 0) {
  try {
    window.dispatchEvent(new CustomEvent(XP_EVENT, { detail: { total, gained } }));
  } catch {
    // ignore
  }
}
