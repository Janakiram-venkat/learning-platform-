// XP, levels, and badges.
//
// A single running "experience points" total drives the student's level. XP is
// earned from quizzes, arcade rounds, labs and mini-projects. Every change fires
// an event so the navbar badge updates live.

import { emitXPChange, notifyProgressChange } from './keys';
import { readInt, readJSON, writeInt, writeJSON } from './storage';

const XP_KEY = 'totalXP';
const CLAIMED_KEY = 'xpClaimed';
const BADGES_KEY = 'earnedBadges';

const PER_LEVEL = 100;

export function getXP() {
  return readInt(XP_KEY, 0);
}

/** Adds XP and notifies listeners. Returns the new total. */
export function addXP(amount) {
  if (!amount || amount <= 0) return getXP();
  const next = getXP() + amount;
  if (writeInt(XP_KEY, next)) {
    emitXPChange(next, amount);
    notifyProgressChange();
  }
  return next;
}

/** 100 XP per level. Returns the level number plus progress within it. */
export function getLevelInfo(xp = getXP()) {
  const level = Math.floor(xp / PER_LEVEL) + 1;
  const intoLevel = xp % PER_LEVEL;
  return { level, intoLevel, perLevel: PER_LEVEL, toNext: PER_LEVEL - intoLevel };
}

/**
 * Award a fixed XP amount only the first time for a given key (e.g. a lesson
 * quiz or project), so re-takes don't farm points. Returns the XP gained.
 */
export function awardXPOnce(key, amount) {
  const claimed = readJSON(CLAIMED_KEY, []);
  if (claimed.includes(key)) return 0;
  claimed.push(key);
  writeJSON(CLAIMED_KEY, claimed);
  addXP(amount);
  return amount;
}

export function getBadges() {
  return readJSON(BADGES_KEY, []);
}

export function hasBadge(id) {
  return getBadges().some((b) => b.id === id);
}

/**
 * Drop a badge into the student's profile, once.
 *
 * @param {{ id: string, name: string, type: 'module'|'arcade'|'project'|'lab' }} badge
 * @returns {boolean} true only if the badge was newly awarded — callers use this
 *          to decide whether to show a celebration.
 */
export function awardBadge({ id, name, type }) {
  if (!id || !name) return false;
  const badges = getBadges();
  if (badges.some((b) => b.id === id)) return false;

  badges.push({ id, name, type, earnedAt: new Date().toISOString() });
  if (!writeJSON(BADGES_KEY, badges)) return false;

  notifyProgressChange();
  return true;
}

/** How many modules the student has finished, counted from their module badges. */
export function getCompletedModuleCount() {
  return getBadges().filter((b) => b.type === 'module').length;
}
