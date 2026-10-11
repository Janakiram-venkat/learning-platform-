// Headless checks over the CSS checkers.
//
//   node src/lib/webdev/checkers.test.mjs
//
// Module 2 grades CSS, and most of grading CSS needs a browser: there is no
// getComputedStyle in Node and no layout engine to ask how wide anything ended
// up. So the checkers are deliberately split — the browser-only half is a
// two-line read (`getComputedStyle(el).getPropertyValue(prop)`,
// `el.getBoundingClientRect()`), and every DECISION made with those readings is
// a pure function that takes the reading as an argument. Those pure functions
// are what this file tests, with the same values a browser would hand them.
//
// What this still CANNOT prove: that the reading itself is right — that a
// 375px-wide frame really does trigger a max-width: 600px media query, that an
// off-screen frame has measurable layout at all. Those need a real browser:
// see pages/WebDevCheckerSelfTest.jsx, which runs the same fixtures in real
// iframes, and is temporary scaffolding to be deleted before the module ships.

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_GRADING_WIDTH,
  WIDTH_SENSITIVE_CHECKS,
  buildSrcDoc,
  compareStyleValue,
  findCssRule,
  gradingWidth,
  normalizeText as norm,
  partitionChecks,
  relationVerdict,
} from './sandbox.js';
import { checkSection } from './validate.js';
import { ctxFor } from '../../data/webdev/module1/miniDom.mjs';

/** Did the verdict pass? Both shapes (`true` and `{passed:false,…}`) in one. */
const ok = (verdict) => verdict === true || !!(verdict && verdict.passed);
/** The explanation a failing verdict carries. */
const why = (verdict) => (verdict && verdict.detail) || '';

// --- compareStyleValue ------------------------------------------------------
// `got` is always already-normalised, as the frame hands it over. `want` is the
// authored value already resolved through a probe element, which is why these
// tests compare "rgb(0, 100, 0)" and not "darkgreen".

test('value mode passes on an exact match and fails otherwise', () => {
  const check = { prop: 'color', value: 'darkgreen' };
  assert.equal(compareStyleValue(check, 'rgb(0, 100, 0)', 'rgb(0, 100, 0)'), true);
  const miss = compareStyleValue(check, 'rgb(0, 0, 0)', 'rgb(0, 100, 0)');
  assert.equal(ok(miss), false);
  assert.match(why(miss), /found color: rgb\(0, 0, 0\)/);
});

test('a property that is not set at all says so rather than naming nothing', () => {
  const miss = compareStyleValue({ prop: 'color', value: 'red' }, '', 'rgb(255, 0, 0)');
  assert.equal(ok(miss), false);
  assert.match(why(miss), /found color: nothing/);
});

test('not mode is the "did your rule actually win" question', () => {
  // The specificity lesson: the student's rule has to beat the one above it,
  // and the only honest way to ask that without pinning a colour is "not the
  // value it had before".
  const check = { prop: 'color', not: 'black' };
  assert.equal(compareStyleValue(check, 'rgb(255, 0, 0)', 'rgb(0, 0, 0)'), true);
  const stuck = compareStyleValue(check, 'rgb(0, 0, 0)', 'rgb(0, 0, 0)');
  assert.equal(ok(stuck), false);
  assert.match(why(stuck), /meant to change/);
});

test('approx forgives the fractional pixels layout really reports', () => {
  const check = { prop: 'padding-top', approx: 20 };
  // What a browser actually answers for `padding: 20px` after a reflow.
  assert.equal(compareStyleValue(check, '19.9969px', undefined), true);
  assert.equal(compareStyleValue(check, '20px', undefined), true);
  assert.equal(compareStyleValue(check, '21px', undefined), true);
  const off = compareStyleValue(check, '24px', undefined);
  assert.equal(ok(off), false);
  assert.match(why(off), /wants about 20/);
});

test('tolerance widens approx', () => {
  assert.equal(compareStyleValue({ prop: 'width', approx: 300, tolerance: 10 }, '308px'), true);
  assert.equal(ok(compareStyleValue({ prop: 'width', approx: 300, tolerance: 10 }, '320px')), false);
});

test('min and max bound a value, together as a range', () => {
  assert.equal(compareStyleValue({ prop: 'font-size', min: 16 }, '18px'), true);
  assert.equal(ok(compareStyleValue({ prop: 'font-size', min: 16 }, '12px')), false);
  assert.match(why(compareStyleValue({ prop: 'font-size', min: 16 }, '12px')), /at least 16/);

  assert.equal(compareStyleValue({ prop: 'width', max: 960 }, '900px'), true);
  assert.match(why(compareStyleValue({ prop: 'width', max: 960 }, '1200px')), /at most 960/);

  const range = { prop: 'line-height', min: 20, max: 40 };
  assert.equal(compareStyleValue(range, '32px'), true);
  assert.equal(ok(compareStyleValue(range, '12px')), false);
  assert.equal(ok(compareStyleValue(range, '60px')), false);
});

test('a numeric mode over a non-numeric value fails with a readable reason', () => {
  const miss = compareStyleValue({ prop: 'width', min: 100 }, 'auto');
  assert.equal(ok(miss), false);
  assert.match(why(miss), /not a measurement/);
});

test('a box check labels itself by its box, since it has no prop', () => {
  const miss = compareStyleValue({ box: 'width', approx: 300 }, '320px');
  assert.match(why(miss), /found width: 320px/);
});

// --- relationVerdict --------------------------------------------------------
// Boxes as getBoundingClientRect reports them. Two elements share a row when
// they overlap vertically; stacked ones cannot.

const row = [{ top: 100, height: 50 }, { top: 100, height: 50 }, { top: 105, height: 40 }];
const column = [{ top: 100, height: 50 }, { top: 160, height: 50 }, { top: 220, height: 50 }];

test('sameRow passes on a row and fails on a column', () => {
  assert.equal(relationVerdict({ rel: 'sameRow', selector: '.card' }, row), true);
  const miss = relationVerdict({ rel: 'sameRow', selector: '.card' }, column);
  assert.equal(ok(miss), false);
  assert.match(why(miss), /stacked one above another/);
});

test('stacked passes on a column and fails on a row', () => {
  assert.equal(relationVerdict({ rel: 'stacked', selector: '.card' }, column), true);
  const miss = relationVerdict({ rel: 'stacked', selector: '.card' }, row);
  assert.equal(ok(miss), false);
  assert.match(why(miss), /side by side/);
});

test('a partly-wrapped row is not a row', () => {
  // Two across and one wrapped underneath. "Some of them are side by side" is
  // not the flexbox lesson passing.
  const wrapped = [{ top: 0, height: 50 }, { top: 0, height: 50 }, { top: 60, height: 50 }];
  assert.equal(ok(relationVerdict({ rel: 'sameRow', selector: '.card' }, wrapped)), false);
});

test('a relation needs two elements to relate', () => {
  for (const boxes of [[], [{ top: 0, height: 10 }], null]) {
    const miss = relationVerdict({ rel: 'sameRow', selector: '.card' }, boxes);
    assert.equal(ok(miss), false);
    assert.match(why(miss), /two or more/);
  }
});

test('an unknown rel fails loudly instead of passing', () => {
  assert.equal(ok(relationVerdict({ rel: 'diagonal', selector: 'p' }, row)), false);
});

// --- findCssRule ------------------------------------------------------------

const find = (css, check) => findCssRule(css, check, norm);

const HOVER_CSS = `
/* a comment */
.btn {
  background-color: steelblue;
  transition: background-color 0.3s ease;
}

.btn:hover {
  background-color: midnightblue;
}
`;

test('finds a rule by selector and property', () => {
  assert.equal(find(HOVER_CSS, { selector: '.btn:hover', prop: 'background-color' }), true);
  assert.equal(find(HOVER_CSS, { selector: '.btn', prop: 'transition' }), true);
});

test('matches a value as a substring, so shorthand still counts', () => {
  // `transition: background-color 0.3s ease` should satisfy "you transitioned
  // background-color", without the author having to spell the whole shorthand.
  assert.equal(find(HOVER_CSS, { selector: '.btn', prop: 'transition', value: 'background-color' }), true);
  assert.equal(find(HOVER_CSS, { selector: '.btn:hover', prop: 'background-color', value: 'midnightblue' }), true);
});

test('names which step broke when it does not find the rule', () => {
  const noSelector = find(HOVER_CSS, { selector: '.card:hover', prop: 'color' });
  assert.match(why(noSelector), /no rule for "\.card:hover"/);

  const noProp = find(HOVER_CSS, { selector: '.btn:hover', prop: 'color' });
  assert.match(why(noProp), /does not set color/);

  const wrongValue = find(HOVER_CSS, { selector: '.btn:hover', prop: 'background-color', value: 'red' });
  assert.match(why(wrongValue), /sets background-color: midnightblue/);
});

test('a commented-out rule does not count as having written it', () => {
  const css = '/* .btn:hover { background-color: red; } */\n.btn { color: blue; }';
  assert.equal(ok(find(css, { selector: '.btn:hover', prop: 'background-color' })), false);
});

test('forgives whitespace, case and combinator spacing', () => {
  const css = '.CARD   >   P{COLOR:RED}';
  assert.equal(find(css, { selector: '.CARD>P', prop: 'color' }), true);
  assert.equal(find(css, { selector: '.CARD > P', prop: 'color' }), true);
});

test('finds a selector inside a comma list', () => {
  assert.equal(find('h1,\nh2, h3 { margin: 0; }', { selector: 'h2', prop: 'margin' }), true);
});

const MEDIA_CSS = `
.nav { display: flex; flex-direction: row; }

@media (max-width: 600px) {
  .nav { flex-direction: column; }
}
`;

test('finds a rule inside the media block that was asked for', () => {
  assert.equal(find(MEDIA_CSS, {
    selector: '.nav', prop: 'flex-direction', value: 'column', media: 'max-width: 600px',
  }), true);
  // The brackets and the spacing around the colon are noise.
  assert.equal(find(MEDIA_CSS, {
    selector: '.nav', prop: 'flex-direction', media: '(max-width:600px)',
  }), true);
});

test('a rule outside the media block does not satisfy a media check', () => {
  // The selector exists, but only at full width — the student wrote the rule
  // and forgot to put it in the breakpoint, which is the mistake worth naming.
  const miss = find('.footer { text-align: left; }\n@media (max-width: 600px) { .nav { color: red; } }', {
    selector: '.footer', prop: 'text-align', media: 'max-width: 600px',
  });
  assert.equal(ok(miss), false);
  assert.match(why(miss), /but not inside @media/);
});

test('a selector inside the right block but missing the property says which', () => {
  // `.nav` is in MEDIA_CSS twice, inside the block and out. The more specific
  // complaint wins: the rule in the block is there, it just lacks `display`.
  const miss = find(MEDIA_CSS, { selector: '.nav', prop: 'display', media: 'max-width: 600px' });
  assert.equal(ok(miss), false);
  assert.match(why(miss), /inside @media \(max-width: 600px\) does not set display/);
});

test('without a media condition, a rule anywhere counts', () => {
  assert.equal(find(MEDIA_CSS, { selector: '.nav', prop: 'flex-direction', value: 'column' }), true);
});

test('a media block is taken whole, not cut at its first inner rule', () => {
  const css = '@media (max-width: 600px) { .a { color: red; } .b { color: blue; } }\n.c { color: green; }';
  assert.equal(find(css, { selector: '.b', prop: 'color', media: 'max-width: 600px' }), true);
  // ...and the rule after the block is still reachable, so the walk resumed in
  // the right place rather than swallowing the rest of the file.
  assert.equal(find(css, { selector: '.c', prop: 'color' }), true);
});

test('empty CSS fails rather than throwing', () => {
  for (const css of ['', null, undefined]) {
    assert.equal(ok(find(css, { selector: '.btn', prop: 'color' })), false);
  }
});

// --- gradingWidth -----------------------------------------------------------
//
// The rule that keeps the visible preview's own width out of grading. The
// preview is a pane in a 1024px-capped sheet — about 469px on a desktop, and
// about 940px below the `lg` breakpoint where the panes unstack. Grading a
// width-sensitive check there means a `@media (max-width: 600px)` rule is
// permanently active, and that two students get two verdicts for one file.

test('a width-sensitive check defaults to the documented desktop width', () => {
  for (const type of WIDTH_SENSITIVE_CHECKS) {
    assert.equal(gradingWidth({ type, selector: 'p', prop: 'color' }), DEFAULT_GRADING_WIDTH);
  }
});

test('the default width is a real desktop width, above any breakpoint taught here', () => {
  // 600px is the single most common breakpoint anyone teaches, and 768 and 900
  // are close behind. All three have to be comfortably below the default, or a
  // task's full-width check grades inside its own mobile branch.
  assert.ok(DEFAULT_GRADING_WIDTH > 900, `${DEFAULT_GRADING_WIDTH} is not above a 900px breakpoint`);
});

test('a check a width cannot change stays in the preview frame', () => {
  // console especially: the preview is the frame whose console the student's
  // own code wrote to, so moving it would grade an empty terminal.
  for (const type of ['dom', 'console', 'link', 'every', 'cssRule']) {
    assert.equal(gradingWidth({ type, selector: 'p' }), null, `${type} should not be re-measured`);
  }
});

test('an explicit "at" overrides the default, on any check type', () => {
  assert.equal(gradingWidth({ type: 'layout', at: 375 }), 375);
  assert.equal(gradingWidth({ type: 'style', at: 375 }), 375);
  assert.equal(gradingWidth({ type: 'dom', at: 375 }), 375);
  // Authored as a string by mistake — the validator rejects it, but the
  // partition must not then produce a NaN-wide frame.
  assert.equal(gradingWidth({ type: 'dom', at: '375' }), 375);
});

// --- partitionChecks --------------------------------------------------------

test('no checks means nothing to report', () => {
  for (const checks of [null, undefined, []]) {
    assert.deepEqual(partitionChecks(checks), { main: null, groups: [], reporters: 0 });
  }
});

test('structure-only checks are one frame, exactly as they always were', () => {
  // The whole of Module 1 is this case.
  const checks = [{ type: 'dom', selector: 'h1' }, { type: 'console', contains: 'hi' }];
  const { main, groups, reporters } = partitionChecks(checks);
  assert.equal(reporters, 1);
  assert.deepEqual(groups, []);
  assert.equal(main.length, 2);
});

test('a style check alone is graded at the default width, not in the preview', () => {
  // This is the regression the self-test caught: Module 1's CSS tasks and every
  // CSS task in Module 2 land here.
  const { main, groups, reporters } = partitionChecks([
    { type: 'style', selector: 'h1', prop: 'color', value: 'red' },
  ]);
  assert.equal(main, null, 'nothing is left for the preview to grade');
  assert.deepEqual(groups.map((g) => g.width), [DEFAULT_GRADING_WIDTH]);
  assert.equal(reporters, 1);
});

test('every check keeps its authored position', () => {
  const { main, groups } = partitionChecks([
    { type: 'dom', selector: 'h1' },
    { type: 'layout', selector: '.nav', at: 375 },
    { type: 'style', selector: 'p', prop: 'color' },
  ]);
  assert.deepEqual(main.map((c) => c.__index), [0], 'only the dom check stays behind');
  assert.deepEqual(groups.map((g) => g.width), [375, DEFAULT_GRADING_WIDTH]);
  assert.deepEqual(groups[0].checks.map((c) => c.__index), [1]);
  assert.deepEqual(groups[1].checks.map((c) => c.__index), [2]);
});

test('one extra frame per distinct width, in ascending order', () => {
  const { main, groups, reporters } = partitionChecks([
    { type: 'layout', selector: '.nav', at: 900 },
    { type: 'dom', selector: 'h1' },
    { type: 'layout', selector: '.nav', at: 375 },
    { type: 'style', selector: '.nav', prop: 'display', at: 375 },
  ]);
  assert.deepEqual(groups.map((g) => g.width), [375, 900]);
  assert.equal(groups[0].checks.length, 2);
  assert.equal(groups[1].checks.length, 1);
  assert.equal(main.length, 1);
  assert.equal(reporters, 3, 'the preview frame plus one per width');
});

test('an explicit "at" equal to the default shares that frame rather than adding one', () => {
  const { groups, reporters } = partitionChecks([
    { type: 'style', selector: 'p', prop: 'color' },
    { type: 'layout', selector: 'p', prop: 'width', at: DEFAULT_GRADING_WIDTH },
  ]);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].checks.length, 2);
  assert.equal(reporters, 1);
});

test('when every check needs another width, the preview grades nothing', () => {
  const { main, groups, reporters } = partitionChecks([{ type: 'layout', selector: '.nav', at: 375 }]);
  assert.equal(main, null, 'a null payload is what stops the preview reporting at all');
  assert.equal(groups.length, 1);
  assert.equal(reporters, 1);
});

test('a mixed task splits into exactly the frames it needs', () => {
  const { main, groups, reporters } = partitionChecks([
    { type: 'layout', selector: '.row', prop: 'flex-direction', value: 'column', at: 375 },
    { type: 'style', selector: '.row', prop: 'display', value: 'flex' },
    { type: 'dom', selector: '.row', minCount: 1 },
    { type: 'cssRule', selector: '.row', prop: 'gap' },
  ]);
  assert.deepEqual(main.map((c) => c.__index), [2, 3], 'dom and cssRule read no layout');
  assert.deepEqual(groups.map((g) => g.width), [375, DEFAULT_GRADING_WIDTH]);
  assert.equal(reporters, 3);
});

test('partitioning does not mutate the authored checks', () => {
  const checks = [{ type: 'layout', selector: '.nav', at: 375 }];
  partitionChecks(checks);
  assert.deepEqual(checks, [{ type: 'layout', selector: '.nav', at: 375 }]);
});

// --- MiniDOM selectors ------------------------------------------------------
// Module 2's checks name classes and ids constantly, and MiniDOM used to throw
// on both. These are the selector forms the module relies on.

const PAGE = `
<body>
  <nav class="nav">
    <ul>
      <li class="item active"><a href="#a">One</a></li>
      <li class="item"><a href="#b">Two</a></li>
    </ul>
  </nav>
  <main id="content">
    <div class="card"><p>Inner</p></div>
    <div class="card wide"><p>Wider</p></div>
    <p>Loose</p>
  </main>
</body>`;

const q = (selector) => ctxFor(PAGE).queryAll(selector);

test('matches by class, including one class of several', () => {
  assert.equal(q('.card').length, 2);
  assert.equal(q('.wide').length, 1);
  assert.equal(q('li.item.active').length, 1);
  assert.equal(q('.item').length, 2);
});

test('matches by id', () => {
  assert.equal(q('#content').length, 1);
  assert.equal(q('#content').pop().tag, 'main');
  assert.equal(q('#nope').length, 0);
});

test('class and id matching is case-sensitive, as it is in a browser', () => {
  assert.equal(q('.CARD').length, 0);
  assert.equal(q('#CONTENT').length, 0);
  // Tag names are not: HTML folds those.
  assert.equal(q('MAIN').length, 1);
});

test('descendant and child combinators differ', () => {
  assert.equal(q('.card p').length, 2);
  assert.equal(q('.card > p').length, 2);
  assert.equal(q('#content > p').length, 1, 'only the loose paragraph is a direct child');
  assert.equal(q('#content p').length, 3);
  assert.equal(q('nav > li').length, 0, 'the li is a grandchild, not a child');
  assert.equal(q('nav li').length, 2);
});

test('a descendant chain backtracks instead of committing to one ancestor', () => {
  // The old matcher walked up once and decremented greedily. Here the outer
  // div is the only ".box" that leads anywhere, and the inner one must not
  // consume the match.
  const nested = ctxFor('<div class="box"><div class="box"><span>hi</span></div></div>');
  assert.equal(nested.queryAll('.box .box span').length, 1);
});

test('a comma list is a union, with no element counted twice', () => {
  assert.equal(q('nav, p').length, 4, 'one nav plus three paragraphs');
  // Both branches match the same two elements; a real querySelectorAll returns
  // each once.
  assert.equal(q('.card, div').length, 2);
});

test('an unsupported selector throws rather than matching nothing', () => {
  // Matching nothing would turn a broken check into a passing test, which is
  // the one failure mode MiniDOM exists to prevent.
  for (const selector of ['a[href]', 'li + li', 'p ~ p', 'li:first-child']) {
    assert.throws(() => q(selector), /MiniDOM/, `"${selector}" should not be silently accepted`);
  }
});

// --- The injected shim ------------------------------------------------------

test('the shim carries the real checkers, not stale copies', () => {
  const doc = buildSrcDoc({
    html: '<p class="x">hi</p>',
    css: '.x { color: red; }',
    checks: [
      { type: 'style', selector: '.x', prop: 'color', value: 'red', message: 'a' },
      { type: 'layout', selector: '.x', rel: 'sameRow', message: 'b' },
      { type: 'cssRule', selector: '.x', prop: 'color', message: 'c' },
    ],
    runId: 1,
  });
  for (const fn of [compareStyleValue, relationVerdict, findCssRule]) {
    assert.ok(doc.includes(fn.toString()), `${fn.name} is not the injected version`);
  }
});

test('the shim still parses with the new checkers in it', () => {
  const doc = buildSrcDoc({
    html: '<p>hi</p>',
    css: 'p { color: red }',
    checks: [{ type: 'cssRule', selector: 'p', prop: 'color', message: 'm' }],
    runId: 7,
  });
  const scripts = [...doc.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  for (const [i, code] of scripts.entries()) {
    assert.doesNotThrow(() => new Function(code), `script #${i + 1} does not parse`);
  }
});

test('a check carrying __index reports under that index, not its payload slot', () => {
  // The whole point of __index: a check measured in a second frame is alone in
  // its payload, and must still come back as (say) check #4 of the task.
  const doc = buildSrcDoc({
    checks: [{ type: 'dom', selector: 'p', message: 'm', __index: 3 }],
    runId: 1,
  });
  assert.match(doc, /__index/, 'the fallback reporter does not honour __index');
});

// --- The validator ----------------------------------------------------------

const section = (checks) => ({
  id: 's', title: 'S',
  pages: [{
    id: 'p', type: 'task', prompt: 'do it',
    starter: { html: '<p>x</p>' }, solution: { html: '<p>x</p>' },
    checks,
  }],
});
/** The validator's complaints about one check, as one string. */
const complaints = (check) => checkSection(section([{ message: 'm', ...check }])).join(' | ');

test('the new check types are accepted', () => {
  assert.equal(complaints({ type: 'style', selector: 'p', prop: 'color', value: 'red' }), '');
  assert.equal(complaints({ type: 'style', selector: 'p', prop: 'padding-top', approx: 20 }), '');
  assert.equal(complaints({ type: 'layout', selector: '.card', rel: 'sameRow' }), '');
  assert.equal(complaints({ type: 'layout', selector: '.card', box: 'width', max: 400 }), '');
  assert.equal(complaints({ type: 'layout', selector: '.nav', prop: 'flex-direction', value: 'column', at: 375 }), '');
  assert.equal(complaints({ type: 'cssRule', selector: '.btn:hover', prop: 'background-color' }), '');
  assert.equal(complaints({ type: 'cssRule', selector: '.nav', prop: 'flex-direction', media: 'max-width: 600px' }), '');
});

test('a check that could never pass is caught at authoring time', () => {
  // Each of these is a mistake that produces a task a student cannot finish,
  // which is the failure mode the validator exists for.
  assert.match(complaints({ type: 'style', selector: 'p', prop: 'color' }), /nothing to compare against/);
  assert.match(complaints({ type: 'style', selector: 'p', prop: 'color', value: 'red', min: 2 }), /only min\+max combine/);
  assert.match(complaints({ type: 'style', prop: 'color', value: 'red' }), /no "selector"/);
  assert.match(complaints({ type: 'style', selector: 'p', prop: 'backgroundColor', value: 'red' }), /CSS spelling/);
  assert.match(complaints({ type: 'style', selector: 'p', prop: 'width', approx: '20px' }), /plain number/);
  assert.match(complaints({ type: 'style', selector: 'p', prop: 'width', tolerance: 2, min: 1 }), /no "approx"/);
  assert.match(complaints({ type: 'layout', selector: '.card' }), /must measure something/);
  assert.match(complaints({ type: 'layout', selector: '.card', box: 'depth', max: 9 }), /expected width or height/);
  assert.match(complaints({ type: 'layout', selector: '.card', rel: 'diagonal' }), /expected sameRow or stacked/);
  assert.match(complaints({ type: 'layout', selector: '.card', rel: 'sameRow', value: 'x' }), /a relation ignores/);
  assert.match(complaints({ type: 'layout', selector: '.card', box: 'width', value: '300px' }), /use min\/max\/approx/);
  assert.match(complaints({ type: 'layout', selector: '.card', box: 'width', prop: 'color', max: 9 }), /measures one thing/);
  assert.match(complaints({ type: 'cssRule', selector: '.btn:hover' }), /no CSS "prop"/);
  assert.match(complaints({ type: 'cssRule', selector: '.btn', prop: 'color', min: 2 }), /which it ignores/);
  assert.match(complaints({ type: 'console', contains: 'hi', at: 375 }), /only a style, layout, dom or every/);
  assert.match(complaints({ type: 'dom', selector: 'p', at: -1 }), /viewport width in pixels/);
  assert.match(complaints({ type: 'dom', selector: 'p', at: '375' }), /viewport width in pixels/);
});
