// Moving progress between localStorage (what the UI reads) and the server
// (what follows the student across devices). Used by ProgressSync.
//
// The set of keys involved is derived from the registry in keys.js, so a new
// progress key can't be forgotten here.

import { NUMERIC_KEYS, PROGRESS_KEYS, emitXPChange } from './keys';
import { getXP } from './xp';

const isNumeric = (key) => NUMERIC_KEYS.includes(key);

/** Bundle all progress values into one plain object to send to the backend. */
export function snapshotProgress() {
  const out = {};
  for (const key of PROGRESS_KEYS) {
    const raw = localStorage.getItem(key);
    if (raw == null) continue;
    if (isNumeric(key)) {
      out[key] = parseInt(raw, 10) || 0;
    } else {
      try { out[key] = JSON.parse(raw); } catch { /* skip corrupt value */ }
    }
  }
  return out;
}

/**
 * Write a server progress document back into the local cache the synchronous
 * UI reads from. Overwrites any keys present in `blob`.
 */
export function applyProgress(blob) {
  if (!blob || typeof blob !== 'object') return;
  for (const key of PROGRESS_KEYS) {
    if (!(key in blob)) continue;
    const val = blob[key];
    try {
      localStorage.setItem(key, isNumeric(key) ? String(val ?? 0) : JSON.stringify(val));
    } catch { /* quota / private mode — keep going with the rest */ }
  }
  // Nudge live widgets (XP badge, etc.) to re-read the freshly loaded values.
  emitXPChange(getXP(), 0);
}

/**
 * Wipe the local progress cache — used on sign-out so the next student on this
 * browser doesn't inherit the previous user's progress.
 */
export function clearProgress() {
  for (const key of PROGRESS_KEYS) {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  }
  emitXPChange(0, 0);
}
