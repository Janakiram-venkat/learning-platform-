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
import wd2Selectors from './wd2-selectors.js';

// index.js is read as text rather than imported: its own imports are
// extensionless (Vite resolves those, Node does not), and the registration is
// what needs checking anyway.
const indexSource = readFileSync(fileURLToPath(new URL('./index.js', import.meta.url)), 'utf8');

const written = [wd2Intro, wd2Selectors];
const pageOf = (section, id) => section.pages.find((p) => p.id === id);
const tasksOf = (section) => section.pages.filter((p) => p.type === 'task');

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

test('every task in every section is required, so none can be skipped past', () => {
  written.forEach((section) => tasksOf(section)
    .forEach((p) => assert.equal(p.required, true, `${section.id} / ${p.id} is not required`)));
});

test('every task solution actually differs from its starter', () => {
  written.flatMap(tasksOf).forEach((p) => {
    const changed = ['html', 'css', 'js'].some(
      (k) => p.solution[k] != null && p.solution[k] !== p.starter[k],
    );
    assert.ok(changed, `${p.id}'s solution is identical to its starter`);
  });
});

test('every task has a hint, because every one of them can be got stuck on', () => {
  written.flatMap(tasksOf).forEach((p) => assert.ok(p.hint?.trim(), `${p.id} has no hint`));
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

test('wd2-selectors uses no box-model or layout property', () => {
  // Those are genuinely later CONCEPTS — the box model is Section 4, flexbox is
  // Section 5 — and this section's lesson is selectors, so a property the
  // student cannot read yet is noise. Colour and font properties are fair game
  // as vehicles: Module 1 already used them unexplained, and a selector has to
  // change something visible to be demonstrated at all.
  //
  // Scoped to wd2-selectors on purpose: wd2-intro's "look what CSS can do"
  // example uses one decorative `padding` on the body, which predates this rule
  // and is not worth churning a shipped section over.
  const banned = /\b(padding|margin|border|display|flex|flex-direction|position|width|height)\s*:/;
  const sources = [];
  wd2Selectors.pages.forEach((page) => {
    if (page.starter?.css) sources.push([`${page.id} starter`, page.starter.css]);
    if (page.solution?.css) sources.push([`${page.id} solution`, page.solution.css]);
    (page.blocks || []).forEach((b, i) => {
      if (b.type === 'example' && b.files?.css) sources.push([`${page.id} example #${i + 1}`, b.files.css]);
    });
  });
  sources.forEach(([where, css]) => {
    assert.doesNotMatch(css, banned, `${where} uses a property taught in a later section`);
  });
});

test('wd2-selectors is registered, and its title matches the sidebar entry', () => {
  assert.match(indexSource, /import wd2Selectors from '\.\/wd2-selectors'/);
  assert.match(
    indexSource,
    /id: 'wd2-selectors', title: 'Selectors and the Cascade', duration: '30 min', section: wd2Selectors/,
  );
});

test('wd2-selectors covers all four syllabus bullets', () => {
  // CLAUDEwd2.md Section 2: element/class/id selectors, grouping and
  // descendant/child, pseudo-classes, specificity and the cascade.
  const ids = wd2Selectors.pages.map((p) => p.id);
  ['p2-class-and-id', 'p5-combining', 'p7-pseudo-classes', 'p9-specificity']
    .forEach((id) => assert.ok(ids.includes(id), `missing the "${id}" page`));
});

test('wd2-selectors is where the class attribute is introduced', () => {
  // Module 1 never used `class` once — it taught `id` (form labels, link
  // anchors) and nothing else. So this section has to teach the attribute as
  // well as the selector, and page 2 is where that happens.
  const page = pageOf(wd2Selectors, 'p2-class-and-id');
  const prose = page.blocks.filter((b) => b.md).map((b) => b.md).join('\n');
  assert.match(prose, /class="special"/, 'the class attribute is never shown in HTML form');
  assert.match(prose, /\.special/, 'the class selector is never shown in CSS form');
});

// --- The specificity task ---------------------------------------------------

test('the losing rule really does lose: a class against an id', () => {
  const css = pageOf(wd2Selectors, 'p10-specificity-bug').starter.css;
  // An id rule setting the colour...
  assert.match(css, /#todays-special\s*\{[^}]*color:\s*black/, 'the id rule no longer sets a colour');
  // ...and the student's class rule, which cannot beat it.
  assert.match(css, /\.highlight\s*\{[^}]*color:\s*crimson/, 'the losing class rule is gone');
  // The class rule must come LAST, or the task does not demonstrate that
  // source order loses to specificity.
  assert.ok(
    css.indexOf('.highlight') > css.indexOf('#todays-special'),
    'the class rule must be last in the file, or "it is last and still loses" is not shown',
  );
});

test('the specificity task leads with its `not` check, which is what explains the bug', () => {
  // `not` fails with "found color: rgb(0, 0, 0), which is the value this is
  // meant to change" — the sentence that tells a student their rule is losing
  // rather than merely wrong. A `value` check first would bury it.
  const checks = pageOf(wd2Selectors, 'p10-specificity-bug').checks;
  assert.equal(checks[0].type, 'style');
  assert.equal(checks[0].not, 'black', 'the first check is no longer the `not` diagnostic');
  assert.equal(checks[1].value, 'crimson', 'the second check should pin the target colour');
});

test('the specificity task cannot be passed by deleting the rule that beats you', () => {
  // The #todays-special rule also sets font-size, and a check pins it. Without
  // that, "delete the competition" passes the task without meeting the idea.
  const page = pageOf(wd2Selectors, 'p10-specificity-bug');
  assert.match(page.starter.css, /font-size:\s*30px/);
  assert.ok(
    page.checks.some((c) => c.prop === 'font-size' && c.approx === 30),
    'nothing stops the student deleting the id rule instead of out-specifying it',
  );
});

test('hover is checked with cssRule, because nothing computed can see a hover state', () => {
  const checks = pageOf(wd2Selectors, 'p8-pseudo-task').checks;
  const hover = checks.find((c) => c.selector?.includes(':hover'));
  assert.ok(hover, 'the pseudo-class task never checks the :hover rule');
  assert.equal(
    hover.type, 'cssRule',
    'a style check for :hover would grade a state the page is not in, and always fail',
  );
});

test('each pseudo-class and descendant task guards against the over-broad selector', () => {
  // The failure mode these tasks exist to teach is `li` instead of
  // `li:first-child`, and `a` instead of `#menu a`. Both pass the positive
  // check by accident, so each task needs a `not` check on an element the
  // narrow selector must NOT reach.
  ['p6-combining-task', 'p8-pseudo-task'].forEach((id) => {
    const checks = pageOf(wd2Selectors, id).checks;
    assert.ok(
      checks.some((c) => c.not != null),
      `${id} has no "not" check, so an over-broad selector would pass it`,
    );
  });
});

test('no example caption uses markdown, because captions are not rendered as markdown', () => {
  // RunnableExample drops `caption` straight into a <figcaption> as text — only
  // `md` blocks go through react-markdown. So a backtick or a ** in a caption
  // shows up literally on the page. All 22 of Module 1's captions are plain
  // prose; this keeps Module 2 honest about the same convention.
  written.forEach((section) => {
    section.pages.forEach((page) => {
      (page.blocks || []).forEach((b) => {
        if (b.type !== 'example' || !b.caption) return;
        assert.doesNotMatch(
          b.caption, /`|\*\*/,
          `${section.id} / ${page.id} has markdown in a caption, which renders literally`,
        );
      });
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
