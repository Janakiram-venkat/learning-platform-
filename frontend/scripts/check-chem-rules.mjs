// Headless check of the chemistry reaction table.
// Run from the frontend folder:  node scripts/check-chem-rules.mjs
// Exits with a non-zero code if anything is wrong, so it can sit in CI later.
import assert from 'node:assert/strict';
import { matchRule, validateRules } from '../src/lib/matchRule.js';
import { RULES } from '../src/data/chemistryRules.js';

let passed = 0;
function check(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`  ok   ${name}`);
  } catch (err) {
    console.error(`  FAIL ${name}\n       ${err.message}`);
    process.exitCode = 1;
  }
}
const idOf = (contents, cond) => matchRule(contents, cond).id;

console.log('Chemistry rule table');

check('the table has no typos or duplicate rules', () => {
  assert.deepEqual(validateRules(RULES), []);
});

check('iron nail in copper sulphate displaces copper', () => {
  assert.equal(idOf(['iron-nail', 'copper-sulphate-soln']), 'iron-copper-sulphate');
});

check('order of items does not matter', () => {
  assert.equal(idOf(['copper-sulphate-soln', 'iron-nail']), 'iron-copper-sulphate');
});

check('extra items in the tube do not stop a rule matching', () => {
  assert.equal(idOf(['iron-nail', 'copper-sulphate-soln', 'red-litmus']), 'iron-copper-sulphate');
});

check('the more specific rule wins (hydrogen pop test)', () => {
  assert.equal(idOf(['zinc-strip', 'dilute-hcl']), 'zinc-dilute-hcl');
  assert.equal(idOf(['zinc-strip', 'dilute-hcl', 'burning-matchstick']), 'zinc-dilute-hcl-pop');
});

check('conditions are required: magnesium only burns when heated', () => {
  assert.equal(matchRule(['magnesium-ribbon'], {}).matched, false);
  assert.equal(matchRule(['magnesium-ribbon'], { heated: false }).matched, false);
  assert.equal(idOf(['magnesium-ribbon'], { heated: true }), 'magnesium-burning');
});

check('unmatched mixes give a friendly no-change, never a crash', () => {
  const r = matchRule(['water', 'sulphur']);
  assert.equal(r.matched, false);
  assert.equal(r.effects[0].fx, 'no-change');
  assert.ok(r.observation.length > 0);
  assert.equal(matchRule().matched, false);
});

check('dangerous-in-real-life reactions are marked watch-only', () => {
  assert.equal(matchRule(['sodium', 'water']).safety, 'watch-only');
  assert.equal(matchRule(['magnesium-ribbon'], { heated: true }).safety, 'watch-only');
  assert.equal(matchRule(['zinc-strip', 'dilute-hcl']).safety, undefined);
});

check('litmus: basic oxide turns red litmus blue, acidic oxide turns blue litmus red', () => {
  assert.equal(matchRule(['magnesium-oxide-soln', 'red-litmus']).effects[0].result, 'to-blue');
  assert.equal(matchRule(['sulphur-dioxide-soln', 'blue-litmus']).effects[0].result, 'to-red');
  assert.equal(matchRule(['magnesium-oxide-soln', 'blue-litmus']).effects[0].result, 'no-change');
});

check('acids: reactive metals bubble, copper and sulphur do not', () => {
  for (const metal of ['zinc-strip', 'magnesium-ribbon', 'iron-nail']) {
    const fx = matchRule([metal, 'dilute-hcl']).effects.map((e) => e.fx);
    assert.ok(fx.includes('bubbles'), `${metal} should bubble`);
  }
  for (const other of ['copper-strip', 'sulphur']) {
    assert.equal(matchRule([other, 'dilute-hcl']).effects[0].fx, 'no-change', `${other} should not react`);
  }
});

check('the 3x3 displacement grid builds the ladder zinc > iron > copper', () => {
  const metals = ['zinc-strip', 'iron-nail', 'copper-strip'];
  const solns = ['zinc-sulphate-soln', 'iron-sulphate-soln', 'copper-sulphate-soln'];
  const reacts = new Set();
  for (const m of metals) {
    for (const s of solns) {
      const r = matchRule([m, s]);
      assert.ok(r.observation, `${m} in ${s} must say something`);
      if (r.effects.some((e) => e.fx === 'coat-solid')) reacts.add(`${m}|${s}`);
    }
  }
  assert.deepEqual(
    [...reacts].sort(),
    ['iron-nail|copper-sulphate-soln', 'zinc-strip|copper-sulphate-soln', 'zinc-strip|iron-sulphate-soln'],
  );
});

check('sodium always reacts, whatever liquid it meets (never a misleading "nothing happens")', () => {
  for (const liquid of ['water', 'dilute-hcl', 'sodium-hydroxide-soln']) {
    const r = matchRule(['sodium', liquid]);
    assert.equal(r.matched, true, `sodium in ${liquid}`);
    assert.equal(r.safety, 'watch-only', `sodium in ${liquid} must be watch-only`);
    assert.ok(r.effects.some((e) => e.fx === 'bubbles'), `sodium in ${liquid} should fizz`);
  }
});

check('zinc in sodium hydroxide bubbles; copper and sulphur stay quiet in it', () => {
  assert.ok(matchRule(['zinc-strip', 'sodium-hydroxide-soln']).effects.some((e) => e.fx === 'bubbles'));
  assert.equal(matchRule(['copper-strip', 'sodium-hydroxide-soln']).matched, false);
});

check('a copper strip with a burning matchstick still gets "no reaction", not a pop', () => {
  const r = matchRule(['copper-strip', 'dilute-hcl', 'burning-matchstick']);
  assert.equal(r.id, 'copper-dilute-hcl');
  assert.equal(r.effects.some((e) => e.fx === 'gas-test'), false);
});

check('burning needs the burner: magnesium and sulphur burn only when heated, as watch-only', () => {
  for (const solid of ['magnesium-ribbon', 'sulphur']) {
    assert.equal(matchRule([solid]).matched, false, `${solid} unheated`);
    const r = matchRule([solid], { heated: true });
    assert.equal(r.safety, 'watch-only', `${solid} heated`);
    assert.ok(r.effects.some((e) => e.fx === 'flame'), `${solid} should flame`);
  }
  assert.equal(matchRule(['magnesium-ribbon'], { heated: true }).residue, '#f1f1f1');
});

check('litmus grid: basic turns red litmus blue, acidic turns blue litmus red, water changes neither', () => {
  const result = (paper, soln) => matchRule([paper, soln]).effects[0].result;
  assert.equal(result('red-litmus', 'magnesium-oxide-soln'), 'to-blue');
  assert.equal(result('blue-litmus', 'magnesium-oxide-soln'), 'no-change');
  assert.equal(result('blue-litmus', 'sulphur-dioxide-soln'), 'to-red');
  assert.equal(result('red-litmus', 'sulphur-dioxide-soln'), 'no-change');
  assert.equal(result('red-litmus', 'water'), 'no-change');
  assert.equal(result('blue-litmus', 'water'), 'no-change');
});

check('validateRules catches a bad table', () => {
  const bad = [
    { id: 'a', when: { contains: ['x'] }, effects: [{ fx: 'sparkles' }], observation: 'o' },
    { id: 'a', when: { contains: ['x'] }, effects: [{ fx: 'bubbles' }] },
  ];
  const problems = validateRules(bad);
  assert.ok(problems.some((p) => p.includes('unknown fx')));
  assert.ok(problems.some((p) => p.includes('duplicate id')));
  assert.ok(problems.some((p) => p.includes('missing observation')));
});

console.log(`\n${passed} checks passed${process.exitCode ? ', some FAILED' : ''}`);
