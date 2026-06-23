// Progress helpers shared across the lesson UI.

// --- XP / score system -------------------------------------------------
// A single running "experience points" total drives the student's level.
// XP is earned from quizzes, arcade rounds, and mini-projects. We fire a
// window event on every change so the navbar badge can update live.

const XP_EVENT = 'xp-change';
const PROGRESS_EVENT = 'progress-change';

// Every localStorage key that makes up a student's saved progress. This is the
// single source of truth for what gets synced to the backend per user.
const PROGRESS_KEYS = [
  'totalXP',
  'xpClaimed',
  'earnedBadges',
  'feedbackAsked',
  'completedLessons',
  'completedAssignments',
  'assignmentStars',
  'completedProjects',
  'completedLabs',
  'aiIdeas',
];

// Fire whenever progress changes so the sync layer can push it to the server.
// Call this after any write to a PROGRESS_KEYS entry.
export function notifyProgressChange() {
  try {
    window.dispatchEvent(new CustomEvent(PROGRESS_EVENT));
  } catch {
    // ignore (e.g. non-browser env)
  }
}

// Bundle all progress values into one plain object to send to the backend.
export function snapshotProgress() {
  const out = {};
  for (const key of PROGRESS_KEYS) {
    const raw = localStorage.getItem(key);
    if (raw == null) continue;
    if (key === 'totalXP') {
      out[key] = parseInt(raw, 10) || 0;
    } else {
      try { out[key] = JSON.parse(raw); } catch { /* skip corrupt value */ }
    }
  }
  return out;
}

// Write a server progress document back into localStorage (the local cache the
// synchronous UI reads from). Overwrites any keys present in `blob`.
export function applyProgress(blob) {
  if (!blob || typeof blob !== 'object') return;
  for (const key of PROGRESS_KEYS) {
    if (!(key in blob)) continue;
    const val = blob[key];
    localStorage.setItem(key, key === 'totalXP' ? String(val ?? 0) : JSON.stringify(val));
  }
  // Nudge live widgets (XP badge, etc.) to re-read the freshly loaded values.
  try {
    window.dispatchEvent(new CustomEvent(XP_EVENT, { detail: { total: getXP(), gained: 0 } }));
  } catch {
    // ignore
  }
}

// Wipe the local progress cache — used on sign-out so the next student on this
// browser doesn't inherit the previous user's progress.
export function clearProgress() {
  for (const key of PROGRESS_KEYS) localStorage.removeItem(key);
  try {
    window.dispatchEvent(new CustomEvent(XP_EVENT, { detail: { total: 0, gained: 0 } }));
  } catch {
    // ignore
  }
}

export function getXP() {
  try {
    return parseInt(localStorage.getItem('totalXP') || '0', 10) || 0;
  } catch {
    return 0;
  }
}

// Adds XP and notifies listeners. Returns the new total.
export function addXP(amount) {
  if (!amount || amount <= 0) return getXP();
  const next = getXP() + amount;
  try {
    localStorage.setItem('totalXP', String(next));
    window.dispatchEvent(new CustomEvent(XP_EVENT, { detail: { total: next, gained: amount } }));
    notifyProgressChange();
  } catch {
    // ignore storage errors
  }
  return next;
}

// 100 XP per level. Returns the level number plus progress within it.
export function getLevelInfo(xp = getXP()) {
  const PER_LEVEL = 100;
  const level = Math.floor(xp / PER_LEVEL) + 1;
  const intoLevel = xp % PER_LEVEL;
  return { level, intoLevel, perLevel: PER_LEVEL, toNext: PER_LEVEL - intoLevel };
}

// Awards a fixed XP amount only the first time for a given key (e.g. a
// lesson quiz or project), so re-takes don't farm points. Returns XP gained.
export function awardXPOnce(key, amount) {
  try {
    const claimed = JSON.parse(localStorage.getItem('xpClaimed') || '[]');
    if (claimed.includes(key)) return 0;
    claimed.push(key);
    localStorage.setItem('xpClaimed', JSON.stringify(claimed));
  } catch {
    // if we can't read the claim list, fall through and award anyway
  }
  addXP(amount);
  return amount;
}

// --- Feedback prompts -------------------------------------------------
// We ask students to rate the content + animations after every few
// modules. Completed modules are tracked via the 'module' badges earned.

const FEEDBACK_EVERY_N_MODULES = 2;

export function getCompletedModuleCount() {
  try {
    const badges = JSON.parse(localStorage.getItem('earnedBadges') || '[]');
    return badges.filter(b => b.type === 'module').length;
  } catch {
    return 0;
  }
}

// True (at most once per milestone) when a feedback prompt is due — i.e.
// the student just crossed a multiple of FEEDBACK_EVERY_N_MODULES modules
// and hasn't been asked at that milestone yet.
export function shouldAskFeedback() {
  const count = getCompletedModuleCount();
  if (count === 0 || count % FEEDBACK_EVERY_N_MODULES !== 0) return false;
  try {
    const asked = JSON.parse(localStorage.getItem('feedbackAsked') || '[]');
    return !asked.includes(count);
  } catch {
    return true;
  }
}

// Records that we've prompted at the current module milestone, so the
// modal isn't shown again for the same milestone.
export function markFeedbackAsked() {
  const count = getCompletedModuleCount();
  try {
    const asked = JSON.parse(localStorage.getItem('feedbackAsked') || '[]');
    if (!asked.includes(count)) {
      asked.push(count);
      localStorage.setItem('feedbackAsked', JSON.stringify(asked));
      notifyProgressChange();
    }
  } catch {
    // ignore storage errors
  }
}

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

// Given a course and a module's numeric id, returns the lessonId of the next
// module's first lesson — used to send students back into the learning content
// after finishing a challenge or project. Returns null if there's nothing next.
export function getNextLessonAfterModule(course, moduleNumericId) {
  const modules = course?.modules || [];
  const idx = modules.findIndex(m => String(m.moduleId ?? m.id) === String(moduleNumericId));
  if (idx === -1) return null;
  for (let i = idx + 1; i < modules.length; i++) {
    const first = modules[i].lessons?.[0];
    if (first) return first.lessonId;
  }
  return null;
}

// --- Module assignments (the mini-game arcade challenges) ---

// A module's numeric id (module.moduleId from the JSON, falling back to .id).
export function getModuleNumericId(module) {
  return module?.moduleId ?? module?.id;
}

// Assignments are stored/served as "module<N>" (e.g. "module1").
export function getAssignmentKey(module) {
  return `module${getModuleNumericId(module)}`;
}

// True when every lesson in the module has been completed — only then does
// the module's arcade challenge open up.
export function isAssignmentUnlocked(module) {
  const completed = new Set(getCompletedLessons());
  const lessons = module?.lessons || [];
  return lessons.length > 0 && lessons.every(l => completed.has(l.lessonId));
}

export function getCompletedAssignments() {
  try {
    return JSON.parse(localStorage.getItem('completedAssignments') || '[]');
  } catch {
    return [];
  }
}

export function isAssignmentCompleted(assignmentKey) {
  return getCompletedAssignments().includes(assignmentKey);
}

// --- Module mini-projects ---

export function getCompletedProjects() {
  try {
    return JSON.parse(localStorage.getItem('completedProjects') || '[]');
  } catch {
    return [];
  }
}

export function isProjectCompleted(projectKey) {
  return getCompletedProjects().includes(projectKey);
}

export function markProjectComplete(projectKey) {
  const completed = getCompletedProjects();
  if (!completed.includes(projectKey)) {
    completed.push(projectKey);
    localStorage.setItem('completedProjects', JSON.stringify(completed));
    notifyProgressChange();
  }
}

// --- Module interactive labs ---

export function getCompletedLabs() {
  try {
    return JSON.parse(localStorage.getItem('completedLabs') || '[]');
  } catch {
    return [];
  }
}

export function isLabCompleted(labKey) {
  return getCompletedLabs().includes(labKey);
}

export function markLabComplete(labKey) {
  const completed = getCompletedLabs();
  if (!completed.includes(labKey)) {
    completed.push(labKey);
    localStorage.setItem('completedLabs', JSON.stringify(completed));
    notifyProgressChange();
  }
}

// Saves a student's "Design Your Own AI" concept card to their profile.
export function saveAiIdea(idea) {
  try {
    const ideas = JSON.parse(localStorage.getItem('aiIdeas') || '[]');
    ideas.push({ ...idea, savedAt: new Date().toISOString() });
    localStorage.setItem('aiIdeas', JSON.stringify(ideas));
    notifyProgressChange();
  } catch {
    // ignore storage errors
  }
}

// Records a finished assignment along with its best star score (1-3).
export function markAssignmentComplete(assignmentKey, stars) {
  const completed = getCompletedAssignments();
  if (!completed.includes(assignmentKey)) {
    completed.push(assignmentKey);
    localStorage.setItem('completedAssignments', JSON.stringify(completed));
  }
  try {
    const scores = JSON.parse(localStorage.getItem('assignmentStars') || '{}');
    if ((scores[assignmentKey] ?? 0) < stars) {
      scores[assignmentKey] = stars;
      localStorage.setItem('assignmentStars', JSON.stringify(scores));
    }
  } catch {
    // ignore storage errors
  }
  notifyProgressChange();
}
