// Headless checks over the web-dev lesson data.
//
//   node src/data/webdev/module1/sections.test.mjs
//
// What this CANNOT do: grade a task. Task checks are DOM checks — they run
// querySelectorAll and getComputedStyle inside the sandboxed frame — and there
// is no DOM in Node and no HTML parser in this project's dependencies. Proving
// "starter fails, solution passes" needs a browser, and that is what the Task
// self-test panel on /webdev-demo is for.
//
// What it CAN do, and does: the structural rules, and the pure predicates that
// the DOM checks are built out of.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { checkSection } from '../../../lib/webdev/validate.js';
import {
  SAMPLE_IMAGE_NAMES, buildSrcDoc, isSampleImage, resolveSampleName,
} from '../../../lib/webdev/sandbox.js';
import wd1Intro from './wd1-intro.js';
import wd1HtmlBasics from './wd1-html-basics.js';
import wd1TextLinksImages from './wd1-text-links-images.js';

// index.js is read as text rather than imported: its own imports are
// extensionless (Vite resolves those, Node does not), and the registration is
// what needs checking anyway.
const indexSource = readFileSync(fileURLToPath(new URL('./index.js', import.meta.url)), 'utf8');

const written = [wd1Intro, wd1HtmlBasics, wd1TextLinksImages];
const section3 = wd1TextLinksImages;
const byId = (id) => section3.pages.find((p) => p.id === id);

// --- Every written section is well-formed -----------------------------------

test('validateSections finds no problems in any written section', () => {
  const problems = written.flatMap((s) => checkSection(s));
  assert.deepEqual(problems, [], problems.join('\n'));
});

test('no two written sections share an id', () => {
  const ids = written.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('section 3 is registered, so the sidebar drops "(coming soon)"', () => {
  assert.match(indexSource, /import wd1TextLinksImages from '\.\/wd1-text-links-images'/);
  assert.match(
    indexSource,
    /id: 'wd1-text-links-images'[^}]*section: wd1TextLinksImages/,
    'wd1-text-links-images is still registered as null in SECTIONS',
  );
});

// --- Section 3's shape, as commissioned -------------------------------------

test('section 3 is the 8 pages of the outline, in order', () => {
  assert.deepEqual(
    section3.pages.map((p) => `${p.id}:${p.type}`),
    [
      'p1-headings:content',
      'p2-emphasis:content',
      'p3-task-article:task',
      'p4-links:content',
      'p5-task-links:task',
      'p6-images:content',
      'p7-task-image:task',
      'p8-quiz-text-links-images:quiz',
    ],
  );
});

test('never three content pages in a row', () => {
  let run = 0;
  for (const page of section3.pages) {
    run = page.type === 'content' ? run + 1 : 0;
    assert.ok(run < 3, `three content pages in a row, ending at ${page.id}`);
  }
});

test('only pages 7 and 8 gate Complete & Continue', () => {
  const gates = section3.pages.filter((p) => p.required).map((p) => p.id);
  assert.deepEqual(gates, ['p7-task-image', 'p8-quiz-text-links-images']);
});

test('every content page ends with something to try', () => {
  for (const page of section3.pages.filter((p) => p.type === 'content')) {
    const last = page.blocks[page.blocks.length - 1];
    assert.ok(
      /try this|try changing|try deleting/i.test(last.md || ''),
      `${page.id} does not end with something to try`,
    );
  }
});

test('every example carries a caption saying what to look at', () => {
  for (const page of section3.pages.filter((p) => p.type === 'content')) {
    for (const block of page.blocks.filter((b) => b.type === 'example')) {
      assert.ok(block.caption && block.caption.length > 40, `${page.id}: thin caption`);
    }
  }
});

test('the quiz asks the five commissioned questions', () => {
  const quiz = byId('p8-quiz-text-links-images');
  assert.equal(quiz.questions.length, 5);
  for (const q of quiz.questions) {
    assert.equal(q.options.length, 4);
    assert.ok(q.explanation.length > 80, `explanation too short: ${q.q}`);
  }
});

// --- Tasks: everything provable without a DOM -------------------------------

const tasks = () => section3.pages.filter((p) => p.type === 'task');

test('every task has a starter, a hint and a full solution', () => {
  for (const t of tasks()) {
    assert.ok(t.starter?.html, `${t.id} has no starter html`);
    assert.ok(t.solution?.html, `${t.id} has no solution html`);
    assert.ok(t.hint && t.hint.length > 80, `${t.id} has no useful hint`);
    assert.notEqual(t.starter.html, t.solution.html, `${t.id}: starter IS the solution`);
  }
});

test('every check explains what is wrong and nudges toward the fix', () => {
  for (const t of tasks()) {
    for (const c of t.checks) {
      assert.ok(c.message.length > 60, `${t.id}: check message too terse: ${c.message}`);
      assert.match(c.message, /<|"/, `${t.id}: message names no tag or value: ${c.message}`);
    }
  }
});

test('the tasks chain: each starter is built on the last solution', () => {
  // p5 starts from p3's answer (plus the section to link to), p7 from p5's.
  const p3 = byId('p3-task-article');
  const p5 = byId('p5-task-links');
  const p7 = byId('p7-task-image');

  assert.ok(p5.starter.html.includes('<h1>Kitchen Notes</h1>'));
  assert.ok(p5.starter.html.includes('<strong>untoasted</strong>'));
  assert.ok(p3.solution.html.includes('<strong>untoasted</strong>'));

  // p7's starter is p5's solution with a gap cut into it for the image.
  assert.ok(p7.starter.html.includes('<a href="#recipes">'));
  assert.ok(p7.starter.html.includes('<h2 id="recipes">'));
  assert.ok(!p7.starter.html.includes('<img'), 'p7 starter already has the image');
});

// The one thing about a starter that IS decidable here: the markup each task
// asks for must be absent from its starter and present in its solution. That's
// not the DOM check, but a starter that already contains the answer would fail
// this long before a browser saw it.
const REQUIRED_MARKUP = {
  'p3-task-article': ['<h1>', '<h2>', '<p>'],
  'p5-task-links': ['href="https://developer.mozilla.org"', 'href="#recipes"', 'id="recipes"'],
  'p7-task-image': ['<img', 'alt='],
};

test('each task asks for markup its starter does not already contain', () => {
  for (const [id, needles] of Object.entries(REQUIRED_MARKUP)) {
    const page = byId(id);
    for (const needle of needles) {
      assert.ok(page.solution.html.includes(needle), `${id}: solution is missing ${needle}`);
      assert.ok(!page.starter.html.includes(needle), `${id}: starter already contains ${needle}`);
    }
  }
});

test('every value a check needs is stated in the prompt', () => {
  for (const t of tasks()) {
    for (const c of t.checks) {
      const needle = c.attrValue || c.text;
      if (!needle) continue;
      const prompt = t.prompt.toLowerCase();
      assert.ok(
        prompt.includes(String(needle).toLowerCase()),
        `${t.id}: the prompt never mentions "${needle}", but a check requires it`,
      );
    }
  }
});

// --- The alt-text rule, tested directly -------------------------------------
// This is the predicate the p7 check is made of: attrNot (exact generic words)
// plus attrNotPattern (a filename, or something too short to be a sentence).
// The DOM wiring needs a browser; the rule itself does not.

function altAccepted(check, alt) {
  const norm = (s) => String(s ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
  if (check.attrNonEmpty && norm(alt) === '') return false;
  if (check.attrNot?.some((w) => norm(w) === norm(alt))) return false;
  if (check.attrNotPattern && new RegExp(check.attrNotPattern, 'i').test(String(alt).trim())) return false;
  return true;
}

test('the alt-text check rejects the non-answers and accepts real descriptions', () => {
  const check = byId('p7-task-image').checks.find((c) => c.attrNotPattern);

  for (const bad of [
    '', '   ', 'image', 'Image', 'photo', 'PICTURE', 'img', 'a cat',
    'cat.jpg', 'CAT.JPG', 'IMG_4021.jpeg', 'logo.png', 'mountain.webp', 'ca',
  ]) {
    assert.equal(altAccepted(check, bad), false, `should have been rejected: "${bad}"`);
  }

  for (const good of [
    'A ginger cat staring directly at the camera',
    'a ginger cat',
    'Our cat, asleep on the kitchen counter',
    'Snow-capped peak behind a green hillside',
  ]) {
    assert.equal(altAccepted(check, good), true, `should have been accepted: "${good}"`);
  }
});

// --- Sample images ----------------------------------------------------------

test('the sample names the lesson promises are the ones the sandbox serves', () => {
  assert.deepEqual([...SAMPLE_IMAGE_NAMES].sort(), ['cat.jpg', 'logo.png', 'mountain.jpg']);
  const prose = byId('p6-images').blocks.map((b) => b.md || '').join('\n');
  for (const name of SAMPLE_IMAGE_NAMES) {
    assert.ok(prose.includes(name), `page 6 never mentions ${name}`);
  }
});

test('a src is matched by filename, however the student writes the path', () => {
  for (const src of ['cat.jpg', './cat.jpg', 'images/cat.jpg', '/img/CAT.JPG', 'cat.jpg?v=2']) {
    assert.equal(isSampleImage(src), true, `should have resolved: ${src}`);
  }
});

test('unknown names and absolute URLs are left alone, so they break visibly', () => {
  for (const src of ['sunset.jpg', 'cat.png', '', null, 'https://example.com/cat.jpg', 'data:image/png;base64,AAA']) {
    assert.equal(isSampleImage(src), false, `should NOT have resolved: ${src}`);
  }
  assert.equal(resolveSampleName('images/CAT.JPG'), 'cat.jpg');
  assert.equal(resolveSampleName('https://example.com/cat.jpg'), null);
});

// --- The document the sandbox builds ----------------------------------------
// buildSrcDoc is pure string work, so the composed document can be inspected
// here even though nothing can RUN it outside a browser. What that catches:
// a botched placeholder substitution, and a syntax error in the shim — both of
// which would silence the frame completely and take every check down with it.

test('every placeholder in the runtime is substituted', () => {
  const doc = buildSrcDoc({ html: '<img src="cat.jpg" alt="a cat">', runId: 7 });
  for (const marker of ['__RUN_ID__', '__SOURCE__', '__SAMPLES__', '__RESOLVE_SAMPLE__']) {
    assert.ok(!doc.includes(marker), `${marker} was never replaced`);
  }
  assert.ok(doc.includes('webdev-runner'));
  assert.ok(doc.includes('cat.jpg'), 'the sample images are not in the document');
});

test('the injected shim is syntactically valid JavaScript', () => {
  const doc = buildSrcDoc({
    html: '<a href="#x">x</a>',
    js: 'console.log("hi")',
    checks: [{ type: 'dom', selector: 'a', message: 'needs a link' }],
    runId: 1,
  });
  const scripts = [...doc.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  assert.ok(scripts.length >= 3, `expected runtime + student js + checks, got ${scripts.length}`);
  // Compiles the source without running it — a syntax error throws here.
  for (const [i, code] of scripts.entries()) {
    assert.doesNotThrow(() => new Function(code), `script #${i + 1} does not parse`);
  }
});

test('the shim carries the real resolveSampleName, not a stale copy', () => {
  const doc = buildSrcDoc({ html: '', runId: 1 });
  assert.ok(
    doc.includes(resolveSampleName.toString()),
    'the injected sample-name rule is not the exported function',
  );
});

test('the task solution uses a sample image that really exists', () => {
  const src = byId('p7-task-image').solution.html.match(/<img[^>]*src="([^"]*)"/)?.[1];
  assert.ok(isSampleImage(src), `p7 solution points at "${src}", which is not a sample`);
});
