import { RULES } from '../data/chemistryRules.js';

/**
 * The lab-bench rule matcher.
 *
 * Pure: same inputs, same output, no DOM, no React, no randomness. That is on
 * purpose so every reaction in the course can be checked in Node with
 * `node scripts/check-chem-rules.mjs`.
 */

/** Every `fx` name the lab-bench engine knows how to draw. */
export const EFFECT_VOCABULARY = Object.freeze([
  'solution-colour',
  'bubbles',
  'flame',
  'glow',
  'smoke',
  'precipitate',
  'coat-solid',
  'dissolve-solid',
  'litmus',
  'gas-test',
  'heat-shimmer',
  'no-change',
]);

const NOTHING_HAPPENS = 'Nothing happens. Not every mix reacts, and that is a result too.';

/** The result for any combination no rule covers, so exploring never breaks. */
function noChange() {
  return {
    id: 'no-change',
    matched: false,
    effects: [{ fx: 'no-change', message: NOTHING_HAPPENS }],
    observation: NOTHING_HAPPENS,
  };
}

/**
 * Find the rule for what is in the tube right now.
 *
 * @param {string[]} contents    item ids in the tube (order does not matter)
 * @param {object}   conditions  e.g. { heated: true }
 * @param {object[]} rules       defaults to the course rule table
 * @returns the winning rule plus `matched: true`, or a friendly no-change
 *
 * A rule matches when every item it asks for is present (extra items are
 * fine) and every condition it asks for is equal. If several match, the one
 * asking for the most wins; ties go to the rule listed first.
 */
export function matchRule(contents = [], conditions = {}, rules = RULES) {
  const have = new Set(contents);
  let best = null;
  let bestScore = -1;

  for (const rule of rules) {
    const need = rule.when?.contains ?? [];
    const cond = rule.when?.conditions ?? {};
    if (!need.every((item) => have.has(item))) continue;
    if (!Object.entries(cond).every(([key, value]) => conditions[key] === value)) continue;

    const score = need.length + Object.keys(cond).length;
    if (score > bestScore) {
      best = rule;
      bestScore = score;
    }
  }

  return best ? { ...best, matched: true } : noChange();
}

/**
 * Catch typos in the rule table before a student does.
 * Returns a list of problems; an empty list means the table is sound.
 */
export function validateRules(rules = RULES) {
  const problems = [];
  const ids = new Set();
  const signatures = new Map();

  for (const rule of rules) {
    const name = rule.id || '(rule with no id)';
    if (!rule.id) problems.push(`${name}: missing id`);
    else if (ids.has(rule.id)) problems.push(`${name}: duplicate id`);
    ids.add(rule.id);

    const need = rule.when?.contains;
    if (!Array.isArray(need) || need.length === 0) {
      problems.push(`${name}: when.contains must be a non-empty list`);
    }
    if (!rule.observation) problems.push(`${name}: missing observation`);
    if (!Array.isArray(rule.effects) || rule.effects.length === 0) {
      problems.push(`${name}: needs at least one effect`);
    }
    for (const e of rule.effects || []) {
      if (!EFFECT_VOCABULARY.includes(e.fx)) problems.push(`${name}: unknown fx "${e.fx}"`);
    }
    if (rule.safety && rule.safety !== 'watch-only') {
      problems.push(`${name}: unknown safety value "${rule.safety}"`);
    }

    // Two rules asking for exactly the same thing can never both win.
    const sig = JSON.stringify([[...(need || [])].sort(), rule.when?.conditions || {}]);
    if (signatures.has(sig)) problems.push(`${name}: same inputs as "${signatures.get(sig)}"`);
    else signatures.set(sig, name);
  }

  return problems;
}
