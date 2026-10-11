// Headless checks over the Module 2 lesson data.
//
//   node --test src/data/webdev/module2/sections.test.mjs
//
// What this CANNOT do: grade a task. Task checks read the DOM and computed
// styles inside the sandboxed frame, and there is no DOM in Node. Proving
// "starter fails, solution passes" needs a browser — see module1/sections.test.mjs
// for the same caveat.
//
// What it CAN do, and does: the structural rules, the registration, and the one
// rule that is easy to break and invisible when broken — using a selector the
// course has not taught yet.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { checkSection } from '../../../lib/webdev/validate.js';
import wd2Intro from './wd2-intro.js';

// index.js is read as text rather than imported: its own imports are
// extensionless (Vite resolves those, Node does not), and the registration is
// what needs checking anyway.
const indexSource = readFileSync(fileURLToPath(new URL('./index.js', import.meta.url)), 'utf8');

const written = [wd2Intro];
const pageOf = (section, id) => section.pages.find((p) => p.id === id);

// --- Structure --------------------------------------------------------------

test('every written section passes the validator', () => {
  written.forEach((section) => {
    assert.deepEqual(checkSection(section), [], `${section.id} has validator problems`);
  });
});

test('wd2-intro is registered, and its title matches the sidebar entry', () => {
  assert.match(indexSource, /import wd2Intro from '\.\/wd2-intro'/);
  assert.match(indexSource, /id: 'wd2-intro', title: 'Intro to CSS', duration: '25 min', section: wd2Intro/);
});

test('wd2-intro covers all four syllabus bullets', () => {
  // CLAUDEwd2.md Section 1: what CSS is, the three ways to add it, rule
  // anatomy, comments. One page each at minimum, so a reshuffle cannot quietly
  // drop one.
  const ids = wd2Intro.pages.map((p) => p.id);
  ['p1-what-css-is', 'p2-rule-anatomy', 'p5-three-places', 'p7-comments']
    .forEach((id) => assert.ok(ids.includes(id), `missing the "${id}" page`));
});

test('every task is required, so none can be skipped past', () => {
  wd2Intro.pages
    .filter((p) => p.type === 'task')
    .forEach((p) => assert.equal(p.required, true, `${p.id} is not required`));
});

test('every task solution actually differs from its starter', () => {
  wd2Intro.pages.filter((p) => p.type === 'task').forEach((p) => {
    const changed = ['html', 'css', 'js'].some(
      (k) => p.solution[k] != null && p.solution[k] !== p.starter[k],
    );
    assert.ok(changed, `${p.id}'s solution is identical to its starter`);
  });
});

test('every task has a hint, because every one of them can be got stuck on', () => {
  wd2Intro.pages
    .filter((p) => p.type === 'task')
    .forEach((p) => assert.ok(p.hint?.trim(), `${p.id} has no hint`));
});

// --- Progressive dependency -------------------------------------------------

test('no class or id selector appears anywhere — Section 2 teaches those', () => {
  // The rule from CLAUDE.md §10: never use a concept before its prerequisite
  // lesson has taught it. This section is element selectors only, and a stray
  // `.card` in a check or an example would teach by accident.
  const selectors = [];
  wd2Intro.pages.forEach((page) => {
    (page.checks || []).forEach((c) => c.selector && selectors.push([page.id, c.selector]));
  });
  assert.ok(selectors.length, 'no checks found at all, which cannot be right');

  selectors.forEach(([pageId, selector]) => {
    assert.doesNotMatch(
      selector, /[.#][A-Za-z_-]/,
      `${pageId} has a class/id selector "${selector}" — Section 1 is element selectors only`,
    );
  });
});

test('no authored CSS uses a class or id selector either', () => {
  // The examples and starters teach by being read, so they are held to the
  // same rule as the checks.
  const sources = [];
  wd2Intro.pages.forEach((page) => {
    if (page.starter?.css) sources.push([`${page.id} starter`, page.starter.css]);
    if (page.solution?.css) sources.push([`${page.id} solution`, page.solution.css]);
    (page.blocks || []).forEach((b, i) => {
      if (b.type === 'example' && b.files?.css) sources.push([`${page.id} example #${i + 1}`, b.files.css]);
    });
  });

  sources.forEach(([where, css]) => {
    // Strip comments first: prose inside one is not a selector.
    const code = css.replace(/\/\*[\s\S]*?\*\//g, '');
    // A selector is whatever sits before a `{`. Only those are checked, so a
    // decimal in a value (`line-height: 1.6`) is not mistaken for a class.
    const preludes = [...code.matchAll(/(^|\})([^{}]*)\{/g)].map((m) => m[2].trim());
    preludes.forEach((prelude) => {
      assert.doesNotMatch(
        prelude, /[.#][A-Za-z_-]/,
        `${where} selects "${prelude}" — Section 1 is element selectors only`,
      );
    });
  });
});

test('the CSS examples never use an HTML comment, which page 7 warns about', () => {
  wd2Intro.pages.forEach((page) => {
    (page.blocks || []).forEach((b) => {
      if (b.type === 'example' && b.files?.css) {
        assert.doesNotMatch(b.files.css, /<!--/, `${page.id} has an HTML comment inside CSS`);
      }
    });
  });
});

// --- The two bug-fix tasks --------------------------------------------------

test('the broken stylesheet really is broken in the two documented ways', () => {
  const css = pageOf(wd2Intro, 'p8-fix-the-stylesheet').starter.css;
  // A missing semicolon, which takes the declaration AFTER it down too...
  assert.match(css, /color:\s*navy\s*\n/, 'the missing semicolon has been "tidied" away');
  // ...and a rule commented out.
  assert.match(css, /\/\*\s*p\s*\{[\s\S]*?\}\s*\*\//, 'the commented-out p rule is gone');
});

test('the inline-styles task starts with style attributes and ends with none', () => {
  const page = pageOf(wd2Intro, 'p6-move-inline-out');
  assert.match(page.starter.html, /style="/, 'the starter has no inline styles to move');
  assert.doesNotMatch(page.solution.html, /style="/, 'the solution still has an inline style');
  // The check that makes the task the task: the two style checks pass on the
  // starter already, because getComputedStyle reports the inline style too.
  assert.ok(
    page.checks.some((c) => c.type === 'dom' && c.count === 0),
    'nothing enforces that the style attributes were actually removed',
  );
});
