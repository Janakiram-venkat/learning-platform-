// Headless checks over the web-dev course registry.
//
//   node --test src/data/webdev/registry.test.mjs
//
// The registry is the only place that knows the modules form a sequence, so
// these are the questions that cannot be answered inside one module folder:
// does "next" cross a module boundary, and does the release flag actually keep
// an unfinished module out of sight?
//
// index.js cannot be imported here — it imports the module folders, which
// import React-flavoured section files with extensionless specifiers that Vite
// resolves and Node does not. So the registry is read as TEXT and the pure
// logic is re-derived from the same data the script-facing literals expose.
// That is exactly what scripts/sync-webdev-course.mjs does, and for the same
// reason; this test also pins the literals that script depends on.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const read = (rel) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8');

const registrySource = read('./index.js');
const module1Source = read('./module1/index.js');
const module2Source = read('./module2/index.js');

/** The same literal-extraction the sync script uses, so both agree or both fail. */
function extract(source, name) {
  const m = source.match(new RegExp(`export const ${name} = ([\\s\\S]*?);\\r?\\n`));
  assert.ok(m, `could not find "export const ${name}"`);
  const body = m[1].replace(/section:\s*[A-Za-z_$][\w$]*/g, 'section: null');
  return new Function(`return (${body});`)();
}

const MODULE_2_RELEASED = extract(registrySource, 'MODULE_2_RELEASED');
const module1 = { MODULE: extract(module1Source, 'MODULE'), SECTIONS: extract(module1Source, 'SECTIONS') };
const module2 = { MODULE: extract(module2Source, 'MODULE'), SECTIONS: extract(module2Source, 'SECTIONS') };

/**
 * getNextSection, re-derived over whichever modules are visible.
 *
 * Mirrors the registry's own implementation: one flat ordered list of the
 * visible modules' sections, each tagged with its module.
 */
function nextSection(id, modules) {
  const flat = modules.flatMap((m) => m.SECTIONS.map((s) => ({ ...s, moduleId: m.MODULE.moduleId })));
  const i = flat.findIndex((s) => s.id === id);
  if (i === -1) return null;
  const next = flat[i + 1];
  if (!next) return null;
  return { ...next, crossesModule: next.moduleId !== flat[i].moduleId };
}

const JUST_MODULE_1 = [module1];
const BOTH = [module1, module2];
const lastOf = (m) => m.SECTIONS[m.SECTIONS.length - 1].id;

// --- The release flag -------------------------------------------------------

test('Module 2 is unreleased, so a production build and the backend stubs omit it', () => {
  // This is the assertion that fails loudly in Phase 11, which is the point:
  // flipping the flag should make someone come and read this file.
  assert.equal(
    MODULE_2_RELEASED, false,
    'MODULE_2_RELEASED is true — if Module 2 is genuinely finished, update this test; '
    + 'otherwise an unfinished module is now visible to students.',
  );
});

test('the flag is a plain boolean literal, because the sync script reads it as text', () => {
  assert.match(
    registrySource,
    /export const MODULE_2_RELEASED = (true|false);/,
    'the sync script extracts this with a regex — an expression here breaks the backend stubs',
  );
});

test('dev still sees Module 2, so each phase can be reviewed in a browser', () => {
  assert.match(
    registrySource,
    /released: MODULE_2_RELEASED \|\| !!import\.meta\.env\?\.DEV/,
    'Module 2 must stay visible in dev, or the phase-by-phase browser review has nothing to open',
  );
});

// --- The module boundary ----------------------------------------------------

test('within a module, next is simply the following section', () => {
  const next = nextSection(module1.SECTIONS[0].id, BOTH);
  assert.equal(next.id, module1.SECTIONS[1].id);
  assert.equal(next.crossesModule, false);
});

test('while Module 2 is hidden, Module 1 has no next section at its last one', () => {
  // The regression that matters: Module 1's last section must behave exactly as
  // it did when Module 1 was the whole course. null is what the lesson page
  // reads as "end of module" and turns into the Module Challenge signpost.
  assert.equal(nextSection(lastOf(module1), JUST_MODULE_1), null);
});

test('once Module 2 is visible, next crosses the boundary into its first section', () => {
  const next = nextSection(lastOf(module1), BOTH);
  assert.equal(next.id, module2.SECTIONS[0].id);
  assert.equal(next.moduleId, module2.MODULE.moduleId);
  assert.equal(
    next.crossesModule, true,
    'crossesModule is what stops the lesson page auto-advancing past the Module Challenge',
  );
});

test('the last section of the last visible module has no next, either way', () => {
  assert.equal(nextSection(lastOf(module2), BOTH), null);
});

test('an unknown section id has no next section rather than the first one', () => {
  assert.equal(nextSection('wd9-nonexistent', BOTH), null);
});

// --- Module identity --------------------------------------------------------

test('module ids stay clear of the other courses sharing the progress keys', () => {
  // completedAssignments/completedProjects are keyed "module<N>" with no course
  // prefix, so a webdev moduleId of 1 or 2 would read Python's progress as its
  // own. See module1/index.js.
  assert.equal(module1.MODULE.moduleId, 101);
  assert.equal(module2.MODULE.moduleId, 102);
});

test('every section id across the course is unique', () => {
  const ids = BOTH.flatMap((m) => m.SECTIONS.map((s) => s.id));
  assert.equal(new Set(ids).size, ids.length, 'two sections share an id, so they share progress');
});

test('section ids are prefixed by their module, which is how they are read at a glance', () => {
  module1.SECTIONS.forEach((s) => assert.match(s.id, /^wd1-/));
  module2.SECTIONS.forEach((s) => assert.match(s.id, /^wd2-/));
});

test('Module 2 announces the six sections the syllabus lists, in order', () => {
  assert.deepEqual(module2.SECTIONS.map((s) => s.id), [
    'wd2-intro',
    'wd2-selectors',
    'wd2-text-colors',
    'wd2-box-model',
    'wd2-flexbox',
    'wd2-responsive',
  ]);
});

test("Module 1's end-of-module copy survived the move into module data", () => {
  // It used to be a string literal inside WebDevLessonPage. Generalising it
  // during the refactor would have silently downgraded Module 1's ending, which
  // names what its challenge and project actually are.
  assert.match(module1.MODULE.outro, /every section of Module 1/);
  assert.match(module1.MODULE.outro, /six tasks/);
  assert.match(module1.MODULE.outro, /five milestones/);
});

test('every module carries the outro the lesson page shows at its last section', () => {
  // Without it the student finishes a module's sections and gets an empty
  // celebration body — the one place the course would otherwise just stop.
  BOTH.forEach(({ MODULE }) => {
    assert.ok(MODULE.outro?.trim(), `module ${MODULE.moduleId} has no outro`);
  });
});

// --- What the registry owns -------------------------------------------------

test('course-level metadata lives in the registry, not in a module', () => {
  assert.equal(extract(registrySource, 'COURSE').courseId, 'webdev');
  assert.doesNotMatch(
    module1Source, /export const COURSE/,
    'COURSE moved to the registry — two copies would drift',
  );
});

test('navigation is not also implemented per-module', () => {
  // The whole point of the registry: one getNextSection. A second one inside a
  // module folder cannot see the next module and would quietly disagree.
  [module1Source, module2Source].forEach((source) => {
    assert.doesNotMatch(source, /export function getNextSection/);
    assert.doesNotMatch(source, /export function buildCourse/);
  });
});
