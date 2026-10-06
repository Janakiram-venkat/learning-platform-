// Headless checks over the Module 1 Challenge.
//
//   node src/data/webdev/module1/challenge.test.mjs
//
// Two halves:
//
//  1. Scoring. lib/webdev/challengeScore.js is pure and import-free, so the
//     pass mark, the score, the stars and the per-task breakdown are tested
//     directly — no DOM, no localStorage, no approximation.
//
//  2. Check logic. Task checks are graded by `matchElements` + `domVerdict`,
//     which sandbox.js exports and injects into the frame BY SOURCE, so the
//     functions exercised below are the same ones the browser runs — not a
//     second copy of the rule. What they need that Node has not got is a
//     document, so this file parses the HTML itself (see MiniDOM below) and
//     hands the real matcher a tree to walk.
//
// WHAT THIS CANNOT VERIFY — a browser is still required: open the challenge in
// the app and press Run. (The /webdev-demo self-test panel used to check these
// in bulk; it was deleted with the rest of the harness once the module shipped,
// after a final run in which all four link checks passed.)
//   - `link` checks (task 5's label-for/input-id pairing). That grader lives
//     inside the injected runtime string and has no exported form, so the two
//     link-shaped assertions here are skipped and reported as skipped.
//   - Anything the real HTML parser does that MiniDOM does not: implicit
//     <tbody> insertion, error recovery on mis-nested tags, moving stray
//     content out of <table>. The content is written to avoid relying on any
//     of it (no selector below mentions tbody), but "avoids relying on it" is
//     an authoring claim, not a proven one.
//   - Rendering, autosave, the result screen, and anything about React.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { checkSection } from '../../../lib/webdev/validate.js';
import { buildSrcDoc, domVerdict, matchElements, normalizeText } from '../../../lib/webdev/sandbox.js';
import {
  CHALLENGE_PASS_MARK,
  challengeBreakdown,
  challengeDraftKey,
  challengeStars,
  challengeTaskIds,
  scoreChallenge,
} from '../../../lib/webdev/challengeScore.js';
import challenge from './wd1-challenge.js';
import { ctxFor } from './miniDom.mjs';

const indexSource = readFileSync(fileURLToPath(new URL('./index.js', import.meta.url)), 'utf8');

const taskOf = (id) => challenge.pages.find((p) => p.id === id);

// MiniDOM (the document Node has not got) now lives in ./miniDom.mjs, shared
// with project.test.mjs. Its own sanity tests are still at the bottom of this
// file.

/** Which checks MiniDOM can answer. `link` needs the in-frame grader. */
const isGradable = (check) => check.type === 'dom';

/**
 * Grade one task's checks against some HTML.
 * @returns {{ verdicts: boolean[], skipped: number, allPassed: boolean }}
 */
function grade(task, html) {
  const ctx = ctxFor(html);
  const gradable = task.checks.filter(isGradable);
  const verdicts = gradable.map((check) => domVerdict(check, matchElements(check, ctx)));
  return {
    verdicts,
    skipped: task.checks.length - gradable.length,
    allPassed: verdicts.length > 0 && verdicts.every(Boolean),
  };
}

/** The verdict of one named check, found by a fragment of its message. */
function verdictOf(task, html, messageFragment) {
  const check = task.checks.find((c) => c.message.includes(messageFragment));
  assert.ok(check, `no check on ${task.id} whose message contains "${messageFragment}"`);
  assert.ok(isGradable(check), `the "${messageFragment}" check is not DOM-gradable`);
  return domVerdict(check, matchElements(check, ctxFor(html)));
}

// ---------------------------------------------------------------------------
// Shape
// ---------------------------------------------------------------------------

test('the challenge is well-formed by the same validator sections use', () => {
  const problems = checkSection(challenge);
  assert.deepEqual(problems, [], problems.join('\n'));
});

test('it is six tasks, in the commissioned order, and nothing else', () => {
  assert.deepEqual(
    challenge.pages.map((p) => `${p.id}:${p.type}`),
    [
      'c1-skeleton:task',
      'c2-fix-text:task',
      'c3-fix-lists:task',
      'c4-table:task',
      'c5-form:task',
      'c6-mixed:task',
    ],
  );
  assert.equal(challengeTaskIds(challenge).length, 6);
});

test('every task carries a prompt, a hint and a solution', () => {
  for (const page of challenge.pages) {
    assert.ok(page.prompt.length > 80, `${page.id}: thin prompt`);
    assert.ok(page.hint && page.hint.length > 40, `${page.id}: thin hint`);
    assert.ok(page.solution?.html, `${page.id}: no solution`);
  }
});

test('the challenge is registered but kept out of SECTIONS', () => {
  assert.match(indexSource, /import wd1Challenge from '\.\/wd1-challenge'/);
  assert.match(indexSource, /export const CHALLENGE = wd1Challenge/);
  assert.doesNotMatch(
    indexSource,
    /SECTIONS = \[[\s\S]*wd1Challenge[\s\S]*\];/,
    'the challenge is in SECTIONS — it would be counted as a lesson',
  );
});

test('no challenge task can collide with a section task in storage', () => {
  // Section drafts are keyed "<sectionId>/<pageId>"; these are
  // "wd1-challenge/<taskId>", and no section has that id.
  for (const id of challengeTaskIds(challenge)) {
    assert.equal(challengeDraftKey(challenge.id, id), `wd1-challenge/${id}`);
  }
  assert.doesNotMatch(indexSource, /id: 'wd1-challenge'/);
});

// ---------------------------------------------------------------------------
// Scoring and the pass threshold
// ---------------------------------------------------------------------------

test('the pass mark is a single constant, currently 4 of 6', () => {
  assert.equal(CHALLENGE_PASS_MARK, 4);
  assert.equal(scoreChallenge(challenge, []).passMark, 4);
});

test('the pass mark is the lowest passing score, not one above it', () => {
  const ids = challengeTaskIds(challenge);
  const scoreAfter = (n) => scoreChallenge(challenge, ids.slice(0, n));

  assert.deepEqual(
    [0, 1, 2, 3, 4, 5, 6].map((n) => scoreAfter(n).isPass),
    [false, false, false, false, true, true, true],
  );
  assert.equal(scoreAfter(4).passed, 4);
  assert.equal(scoreAfter(4).total, 6);
});

test('a moved pass mark moves the verdict with it', () => {
  const two = challengeTaskIds(challenge).slice(0, 2);
  assert.equal(scoreChallenge(challenge, two, 2).isPass, true);
  assert.equal(scoreChallenge(challenge, two, 3).isPass, false);
});

test('score ignores ids that are not tasks in this challenge', () => {
  const score = scoreChallenge(challenge, ['p7-task-image', 'c1-skeleton', 'nonsense']);
  assert.equal(score.passed, 1);
  assert.deepEqual(score.passedIds, ['c1-skeleton']);
  assert.equal(score.failedIds.length, 5);
});

test('stars: 3 for a clean sweep, 2 for one short, 1 for a bare pass, 0 for a fail', () => {
  const ids = challengeTaskIds(challenge);
  const starsAfter = (n) => challengeStars(scoreChallenge(challenge, ids.slice(0, n)));
  assert.deepEqual([3, 4, 5, 6].map(starsAfter), [0, 1, 2, 3]);
  assert.equal(starsAfter(0), 0);
});

test('the breakdown separates "tried and failed" from "never opened"', () => {
  const rows = challengeBreakdown(
    challenge,
    ['c1-skeleton'],
    { 'c2-fix-text': 3 },
  );
  assert.deepEqual(rows.map((r) => r.status), [
    'passed', 'failed', 'skipped', 'skipped', 'skipped', 'skipped',
  ]);
  assert.equal(rows[1].attempts, 3);
  assert.deepEqual(rows.map((r) => r.index), [0, 1, 2, 3, 4, 5]);
});

// ---------------------------------------------------------------------------
// Check logic: every starter fails, every solution passes
// ---------------------------------------------------------------------------

test('every task uses only checks the grader supports', () => {
  const supported = new Set(['dom', 'link', 'console', 'style']);
  for (const page of challenge.pages) {
    for (const check of page.checks) {
      assert.ok(supported.has(check.type), `${page.id}: unknown check type "${check.type}"`);
    }
  }
});

test('no starter passes its own task', () => {
  for (const page of challenge.pages) {
    const { allPassed, verdicts } = grade(page, page.starter.html);
    assert.ok(verdicts.length > 0, `${page.id}: nothing gradable in Node`);
    assert.equal(allPassed, false, `${page.id}: the starter already passes — nothing to do`);
  }
});

test('every solution passes every DOM check of its task', () => {
  for (const page of challenge.pages) {
    const ctx = ctxFor(page.solution.html);
    for (const check of page.checks.filter(isGradable)) {
      assert.equal(
        domVerdict(check, matchElements(check, ctx)),
        true,
        `${page.id}: the solution fails "${check.message}"`,
      );
    }
  }
});

test('task 5 is the only one leaning on a check Node cannot grade', () => {
  const ungradable = challenge.pages
    .filter((p) => p.checks.some((c) => !isGradable(c)))
    .map((p) => p.id);
  assert.deepEqual(ungradable, ['c5-form'], 'the skip list above is out of date');
  // Everything else about task 5 is still graded here.
  assert.equal(grade(taskOf('c5-form'), taskOf('c5-form').solution.html).skipped, 1);
});

// ---------------------------------------------------------------------------
// Task 2 — each bug is its own check, and the page cannot be emptied
// ---------------------------------------------------------------------------

const t2 = taskOf('c2-fix-text');

test('task 2: each of the three bugs fails on its own, then passes on its own', () => {
  const bugs = ['Bug 1: "Our Menu"', 'Bug 1: there is no <h3>', 'Bug 2:', 'Bug 3:'];
  for (const bug of bugs) {
    assert.equal(verdictOf(t2, t2.starter.html, bug), false, `${bug} passes on the broken page`);
    assert.equal(verdictOf(t2, t2.solution.html, bug), true, `${bug} fails on the fixed page`);
  }
});

test('task 2: fixing one bug does not accidentally fix another', () => {
  // Only the heading repaired; alt and href still missing.
  const headingOnly = t2.starter.html.replace('<h3>Our Menu</h3>', '<h2>Our Menu</h2>');
  assert.equal(verdictOf(t2, headingOnly, 'Bug 1: "Our Menu"'), true);
  assert.equal(verdictOf(t2, headingOnly, 'Bug 1: there is no <h3>'), true);
  assert.equal(verdictOf(t2, headingOnly, 'Bug 2:'), false);
  assert.equal(verdictOf(t2, headingOnly, 'Bug 3:'), false);
  assert.equal(grade(t2, headingOnly).allPassed, false);
});

test('task 2: deleting the broken parts cannot pass', () => {
  // The laziest possible "fix": remove the offending h3, img and a entirely.
  const gutted = t2.starter.html
    .replace('<h3>Our Menu</h3>', '')
    .replace('<img src="cat.jpg">', '')
    .replace('<a>Book a table</a>', '');

  // The bug checks that only say "this is gone" are satisfied…
  assert.equal(verdictOf(t2, gutted, 'Bug 1: there is no <h3>'), true);
  // …but the content the page must keep is not.
  assert.equal(verdictOf(t2, gutted, 'Bug 1: "Our Menu"'), false);
  assert.equal(verdictOf(t2, gutted, 'still on the page, still loading cat.jpg'), false);
  assert.equal(verdictOf(t2, gutted, 'Bug 3:'), false);
  assert.equal(grade(t2, gutted).allPassed, false);
});

test('task 2: an empty page cannot pass, and every content check fails on it', () => {
  // "There is no <h3> left" is true of a blank page, and always will be: a
  // check that something is GONE cannot distinguish "fixed" from "deleted".
  // That is precisely what the content-preservation checks are for, so the
  // property worth asserting is those, plus the overall verdict.
  assert.equal(grade(t2, '').allPassed, false);
  for (const fragment of [
    'The original <h1>',
    'Both of the original paragraphs',
    'still on the page, still loading cat.jpg',
    'Bug 1: "Our Menu"',
    'Bug 2:',
    'Bug 3:',
  ]) {
    assert.equal(verdictOf(t2, '', fragment), false, `"${fragment}" passes on a blank page`);
  }
});

test('task 2: alt text that is not a description does not count', () => {
  const lazyAlt = (alt) =>
    t2.solution.html.replace(/alt="[^"]*"/, `alt="${alt}"`);

  for (const alt of ['image', 'photo', 'Picture', 'cat.jpg', '']) {
    assert.equal(verdictOf(t2, lazyAlt(alt), 'Bug 2:'), false, `alt="${alt}" was accepted`);
  }
  assert.equal(verdictOf(t2, lazyAlt('A tabby asleep on a coffee sack'), 'Bug 2:'), true);
});

test('task 2: an href that goes nowhere does not count', () => {
  const href = (value) => t2.starter.html.replace('<a>', `<a href="${value}">`);
  assert.equal(verdictOf(t2, href(''), 'Bug 3:'), false);
  assert.equal(verdictOf(t2, href('#'), 'Bug 3:'), false);
  assert.equal(verdictOf(t2, href('https://example.com/booking'), 'Bug 3:'), true);
});

// ---------------------------------------------------------------------------
// Task 3 — same, for the list and the table
// ---------------------------------------------------------------------------

const t3 = taskOf('c3-fix-lists');

test('task 3: both bugs fail on the broken page and pass on the fixed one', () => {
  for (const bug of ['Bug 1:', 'Bug 2:']) {
    assert.equal(verdictOf(t3, t3.starter.html, bug), false, `${bug} passes while broken`);
    assert.equal(verdictOf(t3, t3.solution.html, bug), true, `${bug} fails once fixed`);
  }
});

test('task 3: wrapping the list does not fix the table, and vice versa', () => {
  const listOnly = t3.starter.html
    .replace('<li>Kenya Nyeri</li>', '<ul>\n<li>Kenya Nyeri</li>')
    .replace('<li>Ethiopia Guji</li>', '<li>Ethiopia Guji</li>\n</ul>');
  assert.equal(verdictOf(t3, listOnly, 'Bug 1:'), true);
  assert.equal(verdictOf(t3, listOnly, 'Bug 2:'), false);
  assert.equal(grade(t3, listOnly).allPassed, false);
});

test('task 3: deleting the stray items or a data row cannot pass', () => {
  const noList = t3.starter.html
    .replace('<li>Kenya Nyeri</li>\n', '')
    .replace('<li>Brazil Cerrado</li>\n', '')
    .replace('<li>Ethiopia Guji</li>\n', '');
  assert.equal(verdictOf(noList === t3.starter.html ? t3 : t3, noList, 'Bug 1:'), false);
  assert.equal(verdictOf(t3, noList, 'Kenya Nyeri'), false);

  const droppedRow = t3.solution.html.replace(
    /  <tr>\n    <td>Weekends<\/td>\n    <td>8am to 4pm<\/td>\n  <\/tr>\n/,
    '',
  );
  assert.notEqual(droppedRow, t3.solution.html, 'the row-deletion fixture stopped matching');
  assert.equal(verdictOf(t3, droppedRow, 'Both data rows survived'), false);
});

test('task 3: a header row of <td> inside a <thead> is still not fixed', () => {
  // <thead> alone is not the point — <th> is what marks a cell as a heading.
  const theadOnlyHtml = t3.solution.html.replace(/<th>/g, '<td>').replace(/<\/th>/g, '</td>');
  assert.equal(verdictOf(t3, theadOnlyHtml, 'Bug 2:'), false);
});

// ---------------------------------------------------------------------------
// The build tasks
// ---------------------------------------------------------------------------

test('task 4: a table missing a row, a column or its header fails', () => {
  const t4 = taskOf('c4-table');
  const short = t4.solution.html.replace(
    /  <tr>\n    <td>Filter<\/td>\n    <td>Large<\/td>\n    <td>2\.80<\/td>\n  <\/tr>\n/,
    '',
  );
  assert.notEqual(short, t4.solution.html, 'the missing-row fixture stopped matching');
  assert.equal(grade(t4, short).allPassed, false);

  const noHead = t4.solution.html.replace('<thead>', '').replace('</thead>', '');
  assert.equal(grade(t4, noHead).allPassed, false);
});

test('task 6: each of the four required pieces is separately required', () => {
  const t6 = taskOf('c6-mixed');
  const drops = [
    ['<h2>Weekend workshops</h2>', 'the heading'],
    ['<li>Grinding and brewing</li>', 'one list item'],
    ['<img src="mountain.jpg" alt="The hillside farm our Ethiopia Guji beans come from">', 'the image'],
    ['<a href="https://example.com/workshops">See the full workshop list</a>', 'the link'],
  ];
  for (const [fragment, what] of drops) {
    const without = t6.solution.html.replace(fragment, '');
    assert.notEqual(without, t6.solution.html, `the "${what}" fixture stopped matching`);
    assert.equal(grade(t6, without).allPassed, false, `${what} can be left out and still pass`);
  }
});

test('task 6: the wrong image file does not pass', () => {
  const t6 = taskOf('c6-mixed');
  const wrong = t6.solution.html.replace('mountain.jpg', 'hillside.jpg');
  assert.equal(grade(t6, wrong).allPassed, false);
});

// ---------------------------------------------------------------------------
// MiniDOM's own sanity — a broken parser would make everything above green
// ---------------------------------------------------------------------------

test('the sandbox injects the real matcher, so this file grades what the frame grades', () => {
  const doc = buildSrcDoc({ html: '<p>x</p>', checks: [], runId: 1 });
  // The function's own source, not a lookalike: if someone re-inlines a second
  // copy of the rule into the shim, this fails and the tests above become
  // fiction the moment the two drift.
  assert.ok(doc.includes(matchElements.toString()), 'matchElements is not injected by source');
  assert.ok(doc.includes(domVerdict.toString()), 'domVerdict is not injected by source');
});

test('MiniDOM matches descendants, not just any element with the tag', () => {
  const ctx = ctxFor('<li>loose</li><ul><li>inside</li></ul>');
  assert.equal(ctx.queryAll('li').length, 2);
  assert.equal(ctx.queryAll('ul li').length, 1);
  assert.equal(ctx.queryAll('ul li')[0].textContent, 'inside');
});

test('MiniDOM reads attributes and text the way the checks expect', () => {
  const ctx = ctxFor('<img src="cat.jpg" alt="a nap"><p> spaced   out </p>');
  const [img] = ctx.queryAll('img');
  assert.equal(img.getAttribute('src'), 'cat.jpg');
  assert.equal(img.hasAttribute('title'), false);
  assert.equal(img.getAttribute('title'), null);
  assert.equal(normalizeText(ctx.queryAll('p')[0].textContent), 'spaced out');
});

test('MiniDOM refuses a selector it cannot honestly evaluate', () => {
  assert.throws(() => ctxFor('<p></p>').queryAll('p.intro'), /MiniDOM only understands/);
});
