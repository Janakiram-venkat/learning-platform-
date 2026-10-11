// What a finished section says, and in particular what Module 1's LAST section
// says once Module 2 exists.
//
//   node --test src/lib/webdev/outro.test.mjs
//
// The regression this file exists for: before the registry, Module 1's last
// section had no next section, so it congratulated the student on the module
// and pointed at the Module Challenge. Adding Module 2 gives it a next section
// for the first time, and the naive reading of that is "advance to it" — which
// would walk the student straight past the Module Challenge and the Mini
// Project. These tests pin the behaviour on both sides of the release flag.

import test from 'node:test';
import assert from 'node:assert/strict';

import { sectionOutro } from './outro.js';

const MODULE_1 = {
  outro:
    'That is every section of Module 1. The Module Challenge is next — six tasks in the sidebar '
    + 'that put the whole module together. After it comes the Mini Project: five milestones that '
    + 'build one page about you.',
};

/** A written section, as the registry hands one over. */
const written = (id, title, crossesModule = false) => ({
  id, title, section: { id }, crossesModule,
});

// --- Mid-module -------------------------------------------------------------

test('a written next section in the same module advances to it', () => {
  const out = sectionOutro({
    module: MODULE_1,
    moduleNumber: 1,
    next: written('wd1-html-basics', 'HTML Basics'),
  });
  assert.equal(out.title, 'Section complete! ✅');
  assert.equal(out.message, 'Nice work. Up next: HTML Basics.');
  assert.equal(out.next, 'wd1-html-basics');
});

test('an unwritten next section in the same module says so and stays put', () => {
  const out = sectionOutro({
    module: MODULE_1,
    moduleNumber: 1,
    next: { id: 'wd1-later', title: 'Later (coming soon)', section: null, crossesModule: false },
  });
  assert.equal(out.title, 'Section complete! ✅');
  assert.match(out.message, /More of Module 1 is on the way/);
  assert.equal(out.next, null, 'an unwritten section must never be navigated to');
});

// --- Module 1's last section, with Module 2 HIDDEN (production today) -------

test('with Module 2 hidden, the last section behaves exactly as it always did', () => {
  const out = sectionOutro({ module: MODULE_1, moduleNumber: 1, next: null });
  assert.equal(out.title, 'Module 1 complete! 🏆');
  assert.equal(out.message, MODULE_1.outro, 'the authored Module 1 outro, unchanged');
  assert.equal(out.next, null);
});

// --- Module 1's last section, with Module 2 VISIBLE (dev, and Phase 11) -----

test('with Module 2 visible, the last section still does NOT auto-advance', () => {
  // The whole point. The Module Challenge and Mini Project sit between the two
  // modules, so crossing the boundary is the sidebar's job.
  const out = sectionOutro({
    module: MODULE_1,
    moduleNumber: 1,
    next: written('wd2-intro', 'Intro to CSS (coming soon)', true),
  });
  assert.equal(out.next, null, 'a module boundary must not navigate the student onward');
  assert.equal(out.title, 'Module 1 complete! 🏆', 'still a module completion, not a section one');
});

test('releasing Module 2 changes the message by exactly one appended sentence', () => {
  const hidden = sectionOutro({ module: MODULE_1, moduleNumber: 1, next: null });
  const visible = sectionOutro({
    module: MODULE_1,
    moduleNumber: 1,
    next: written('wd2-intro', 'Intro to CSS (coming soon)', true),
  });

  assert.equal(visible.title, hidden.title);
  assert.ok(
    visible.message.startsWith(hidden.message),
    'the authored outro must still come first and be untouched',
  );
  assert.equal(
    visible.message.slice(hidden.message.length),
    ' After that, Module 2 begins: Intro to CSS.',
  );
});

test('the "(coming soon)" suffix is stripped out of the signpost sentence', () => {
  const out = sectionOutro({
    module: MODULE_1,
    moduleNumber: 1,
    next: written('wd2-intro', 'Intro to CSS (coming soon)', true),
  });
  assert.doesNotMatch(
    out.message, /coming soon/,
    'reads as part of the module name in a sentence',
  );
});

// --- The last module -------------------------------------------------------

test('the last module of the course ends on its own outro, with no signpost', () => {
  const module2 = { outro: 'That is every section of Module 2.' };
  const out = sectionOutro({ module: module2, moduleNumber: 2, next: null });
  assert.equal(out.title, 'Module 2 complete! 🏆');
  assert.equal(out.message, module2.outro);
  assert.equal(out.next, null);
});

// --- Degenerate input ------------------------------------------------------

test('a module with no outro produces an empty message, never "undefined"', () => {
  const out = sectionOutro({ module: null, moduleNumber: 1, next: null });
  assert.equal(out.message, '');
  assert.doesNotMatch(out.message, /undefined|null/);
});
