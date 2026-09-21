// Headless checks over the Module 1 Mini Project.
//
//   node --test src/data/webdev/module1/project.test.mjs
//
// Three halves (the third is the one that matters):
//
//  1. Rules. lib/webdev/projectRules.js is pure and import-free, so the unlock
//     order, the resume position, the "is it finished" verdict and both
//     storage keys are tested directly — no DOM, no localStorage.
//
//  2. Wiring, read off the source of the components. The three claims that
//     make this project a project rather than five exercises — one draft key
//     for every milestone, the pager not remounting the editor between them,
//     and the revealed solution having no storage key at all — are structural,
//     so they are asserted against the files that implement them. A regression
//     would otherwise only show up as a student losing their page.
//
//  3. Grading. Milestone and rubric checks are run through the same
//     `matchElements` / `domVerdict` / `everyVerdict` the sandbox injects into
//     the frame, over MiniDOM (./miniDom.mjs). So: every starter fails, every
//     solution passes, each milestone grades ONLY its own new work, and the
//     rubric catches a page that was broken after the fact.
//
// WHAT THIS CANNOT VERIFY — a browser is still required:
//   - `link` checks (label[for] -> input[id] / textarea[id], milestone 5 and
//     the rubric). That grader lives inside the injected runtime string and
//     has no exported form. The link-shaped assertions are skipped and the
//     count of skips is asserted, so a new one cannot creep in unnoticed.
//   - The rubric running itself on arrival (`autoRun`), the milestone→
//     milestone carry-over actually surviving in a live Monaco buffer, the
//     unlock UI, the celebration, and anything else about React or rendering.
//   - Anything the real HTML parser does that MiniDOM does not: implicit
//     <tbody>, error recovery on mis-nested tags. No selector here mentions
//     tbody, which is an authoring claim rather than a proven one.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { checkSection } from '../../../lib/webdev/validate.js';
import {
  buildSrcDoc, domVerdict, everyVerdict, matchElements,
} from '../../../lib/webdev/sandbox.js';
import {
  finishedPageKey,
  isPageUnlocked,
  openingPage,
  projectDraftKey,
  projectMilestoneIds,
  projectMilestones,
  projectProgress,
  projectRubricPage,
  unlockedThrough,
} from '../../../lib/webdev/projectRules.js';
import project from './wd1-project.js';
import challenge from './wd1-challenge.js';
import { ctxFor } from './miniDom.mjs';

const read = (name) => readFileSync(fileURLToPath(new URL(name, import.meta.url)), 'utf8');
const readSrc = (rel) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8');

const indexSource = read('./index.js');
const pagerSource = readSrc('../../../components/lesson-engine/ProjectPager.jsx');
const taskPageSource = readSrc('../../../components/lesson-engine/TaskPage.jsx');

const milestones = projectMilestones(project);
const rubric = projectRubricPage(project);
const ids = projectMilestoneIds(project);
const pageOf = (id) => project.pages.find((p) => p.id === id);

/** Which checks MiniDOM can answer. `link` needs the in-frame grader. */
const isGradable = (check) => check.type === 'dom' || check.type === 'every';

/** The verdict of one check against some HTML, using the sandbox's own rules. */
function verdict(check, html) {
  const ctx = ctxFor(html);
  const matched = matchElements(check, ctx);
  const out = check.type === 'every'
    ? everyVerdict(check, ctx.queryAll(check.selector), matched)
    : domVerdict(check, matched);
  return out === true || !!(out && out.passed);
}

/**
 * Grade one page's checks against some HTML.
 * @returns {{ verdicts: boolean[], skipped: number, allPassed: boolean, failed: string[] }}
 */
function grade(page, html) {
  const gradable = page.checks.filter(isGradable);
  const verdicts = gradable.map((c) => verdict(c, html));
  return {
    verdicts,
    skipped: page.checks.length - gradable.length,
    allPassed: verdicts.length > 0 && verdicts.every(Boolean),
    failed: gradable.filter((c, i) => !verdicts[i]).map((c) => c.message),
  };
}

/** The verdict of one named check, found by a fragment of its message. */
function verdictOf(page, html, messageFragment) {
  const check = page.checks.find((c) => c.message.includes(messageFragment));
  assert.ok(check, `no check on ${page.id} whose message contains "${messageFragment}"`);
  assert.ok(isGradable(check), `the "${messageFragment}" check is not gradable in Node`);
  return verdict(check, html);
}

// ---------------------------------------------------------------------------
// Shape
// ---------------------------------------------------------------------------

test('the project is well-formed by the same validator sections use', () => {
  const problems = checkSection(project);
  assert.deepEqual(problems, [], problems.join('\n'));
});

test('it is five milestones then the rubric, in the commissioned order', () => {
  assert.deepEqual(ids, [
    'm1-skeleton', 'm2-about', 'm3-lists', 'm4-table', 'm5-contact',
  ]);
  assert.equal(milestones.length, 5);
  assert.equal(rubric.id, 'rubric');
  // The rubric is the LAST page, and the only one with the role.
  assert.equal(project.pages.at(-1).id, rubric.id);
  assert.equal(project.pages.filter((p) => p.role === 'rubric').length, 1);
});

test('every milestone carries an instruction, hints and a solution', () => {
  for (const page of project.pages) {
    assert.ok(page.prompt.length > 120, `${page.id}: thin prompt`);
    assert.ok(page.hint && page.hint.length > 40, `${page.id}: thin hint`);
    // "1-2 hints": the hint is one markdown block of bullets.
    const bullets = page.hint.split('\n').filter((l) => l.startsWith('- ')).length;
    assert.ok(bullets >= 1 && bullets <= 2, `${page.id}: ${bullets} hints, expected 1-2`);
    assert.ok(page.solution?.html, `${page.id}: no solution`);
  }
});

test('Module 1 is HTML only — no css or js tab anywhere in the project', () => {
  for (const page of project.pages) {
    assert.deepEqual(page.tabs, ['html'], `${page.id} shows a tab other than html`);
    assert.deepEqual(Object.keys(page.starter), ['html'], `${page.id} starts with non-html files`);
    assert.deepEqual(Object.keys(page.solution), ['html'], `${page.id} solves with non-html files`);
  }
});

test('the project is registered but kept out of SECTIONS', () => {
  assert.match(indexSource, /import wd1Project from '\.\/wd1-project'/);
  assert.match(indexSource, /export const PROJECT = wd1Project/);
  assert.doesNotMatch(
    indexSource,
    /SECTIONS = \[[\s\S]*wd1Project[\s\S]*\];/,
    'the project is in SECTIONS — it would be counted as a lesson',
  );
  // And it is validated on import alongside the challenge.
  assert.match(indexSource, /CHALLENGE,\s*\n\s*PROJECT,/);
});

test('project, challenge and section page ids cannot collide in storage', () => {
  assert.doesNotMatch(indexSource, /id: 'wd1-project'/); // not a section id
  const challengeIds = new Set(challenge.pages.map((p) => p.id));
  for (const page of project.pages) {
    assert.equal(challengeIds.has(page.id), false, `${page.id} is also a challenge task id`);
  }
});

// ---------------------------------------------------------------------------
// Storage keys: one draft for the project, one stable key for Module 2
// ---------------------------------------------------------------------------

test('there is ONE draft key for the whole project, and it names the project', () => {
  const key = projectDraftKey(project.id);
  assert.equal(key, 'wd1-project/page');
  // The same key for every page is the entire carry-over mechanism, so assert
  // it is not derived from the page in any way.
  for (const page of project.pages) {
    assert.equal(projectDraftKey(project.id), key);
    assert.equal(key.includes(page.id), false, `the draft key mentions ${page.id}`);
  }
  // Section drafts are "<sectionId>/<pageId>" — this shares their namespace
  // but cannot collide, because no section has the id "wd1-project".
  assert.equal(key.split('/')[0], project.id);
});

test('the finished page is parked under a stable, documented key', () => {
  assert.equal(finishedPageKey('wd1-project'), 'wd1-project/finished-page');
  // Distinct from the live draft: a student breaking their page later must not
  // corrupt what Module 2 starts from.
  assert.notEqual(finishedPageKey(project.id), projectDraftKey(project.id));
  // It lives under a "wd<N>-" prefix, which is what the course's own progress
  // reset matches on — so resetting web-dev clears it with everything else.
  assert.match(finishedPageKey(project.id), /^wd\d+-/);
  // And it is documented where a Module 2 author would look for it.
  const rulesSource = readSrc('../../../lib/webdev/projectRules.js');
  assert.match(rulesSource, /Module 2/);
  assert.match(rulesSource, /loadCode\(finishedPageKey\('wd1-project'\)\)/);
});

test('the finished page is only ever written by a completed project', () => {
  const projectSource = readSrc('../../../lib/webdev/project.js');
  // recordProjectResult returns early unless the whole project is complete,
  // and the snapshot write sits after that guard.
  const body = projectSource.slice(projectSource.indexOf('export function recordProjectResult'));
  const guardAt = body.indexOf('if (!progress.isComplete) return false;');
  const writeAt = body.indexOf('saveCode(finishedPageKey');
  assert.ok(guardAt > -1, 'the completion guard is gone');
  assert.ok(writeAt > guardAt, 'the snapshot is written before the completion guard');
});

// ---------------------------------------------------------------------------
// Unlock order
// ---------------------------------------------------------------------------

test('nothing but milestone 1 is open on a fresh start', () => {
  assert.equal(unlockedThrough(project, []), 0);
  assert.deepEqual(
    project.pages.map((p, i) => isPageUnlocked(project, [], i)),
    [true, false, false, false, false, false],
  );
});

test('milestone N unlocks when N-1 passes, one at a time', () => {
  for (let n = 0; n <= ids.length; n += 1) {
    const done = ids.slice(0, n);
    assert.equal(unlockedThrough(project, done), n, `after ${n} milestones`);
    assert.deepEqual(
      project.pages.map((p, i) => isPageUnlocked(project, done, i)),
      project.pages.map((p, i) => i <= n),
      `unlock row after ${n} milestones`,
    );
  }
});

test('the rubric is the page that opens once every milestone has passed', () => {
  const rubricIndex = project.pages.findIndex((p) => p.id === rubric.id);
  assert.equal(isPageUnlocked(project, ids.slice(0, 4), rubricIndex), false);
  assert.equal(isPageUnlocked(project, ids, rubricIndex), true);
});

test('passing out of order does not unlock the gap', () => {
  // Someone whose stored progress has milestone 3 but not milestone 2 (synced
  // from a half-reset device, say) is still held at milestone 2.
  const done = ['m1-skeleton', 'm3-lists'];
  assert.equal(unlockedThrough(project, done), 1);
  assert.equal(isPageUnlocked(project, done, 3), false);
});

test('a passed milestone never locks again — going back is always allowed', () => {
  for (let i = 0; i < ids.length; i += 1) {
    assert.equal(isPageUnlocked(project, ids, i), true, `milestone ${i + 1} locked after finishing`);
  }
});

test('resuming: the saved position is honoured, but never past the gate', () => {
  const done = ids.slice(0, 2); // milestones 1 and 2 passed
  assert.equal(openingPage(project, done, 1), 1, 'back where they were');
  assert.equal(openingPage(project, done, 0), 0);
  assert.equal(openingPage(project, done, 5), 2, 'clamped to the gate');
  assert.equal(openingPage(project, done, -3), 0);
  assert.equal(openingPage(project, done, null), 2, 'no saved position: the gate');
  assert.equal(openingPage(project, [], null), 0, 'a fresh student starts at the start');
});

// ---------------------------------------------------------------------------
// Completion
// ---------------------------------------------------------------------------

test('the project is not complete until the rubric itself passes', () => {
  const all = projectProgress(project, ids);
  assert.equal(all.passed, 5);
  assert.equal(all.milestonesDone, true);
  assert.equal(all.rubricPassed, false);
  assert.equal(all.isComplete, false, 'five milestones alone finished the project');

  const finished = projectProgress(project, [...ids, rubric.id]);
  assert.equal(finished.rubricPassed, true);
  assert.equal(finished.isComplete, true);
});

test('a rubric pass on its own is not a finished project either', () => {
  // Defensive: nothing should be able to record the rubric without the
  // milestones, but "complete" must mean complete.
  const odd = projectProgress(project, [rubric.id]);
  assert.equal(odd.isComplete, false);
});

test('completion is recorded through the shared project mechanism, untouched', () => {
  const projectSource = readSrc('../../../lib/webdev/project.js');
  assert.match(projectSource, /markProjectComplete\(projectCompletionKey\(moduleId\)\)/);
  assert.match(projectSource, /return `module\$\{moduleId\}`/);
  // The one call a future gate would use — exported, and deliberately unused.
  assert.match(projectSource, /export function isProjectPassed/);
});

test('Module 2 is not gated behind this project', () => {
  // Nothing in the course data or the pager calls the gate helper.
  for (const [name, source] of [['ProjectPager', pagerSource], ['index.js', indexSource]]) {
    assert.doesNotMatch(source, /isProjectPassed/, `${name} gates on the project`);
  }
});

// ---------------------------------------------------------------------------
// Wiring: the claims that make this one document
// ---------------------------------------------------------------------------

test('the pager hands every milestone the same project-wide draft key', () => {
  assert.match(pagerSource, /draftKey=\{projectDraftKey\(project\.id\)\}/);
  // …and not a per-page one.
  assert.doesNotMatch(pagerSource, /draftKey=\{[^}]*page\.id/);
});

test('the pager does not remount the editor between milestones', () => {
  // A `key` on the wrapper would throw away the live Monaco buffer, losing up
  // to one autosave debounce of typing on every Next.
  const wrapper = pagerSource.slice(pagerSource.indexOf('<div className="min-h-[40vh]">'));
  assert.doesNotMatch(wrapper.slice(0, 400), /key=\{/, 'the milestone wrapper is keyed');
  assert.match(pagerSource, /NOT keyed/);
});

test('TaskPage falls back to per-page keys when no draftKey is given', () => {
  // Sections and the challenge must keep one draft per task.
  assert.match(taskPageSource, /storageKey=\{draftKey \?\? `\$\{sectionId\}\/\$\{page\.id\}`\}/);
});

test('revealing a solution cannot write into the student draft', () => {
  const solutionBlock = taskPageSource.slice(taskPageSource.indexOf('label="Solution"'));
  const runner = solutionBlock.slice(0, solutionBlock.indexOf('/>'));
  assert.doesNotMatch(runner, /storageKey/, 'the solution runner has a storage key');
  assert.match(runner, /readOnly/);
  // CodeRunner only ever saves when it has a storageKey, and only ever
  // reports changes when it is not read-only.
  const runnerSource = readSrc('../../../components/webdev/CodeRunner.jsx');
  assert.match(runnerSource, /if \(!storageKey \|\| readOnly\) return undefined;/);
  assert.match(runnerSource, /onChange=\{readOnly \? undefined : setActiveFile\}/);
});

test('every editor on the page gets its own Monaco model path', () => {
  const runnerSource = readSrc('../../../components/webdev/CodeRunner.jsx');
  // One id per CodeRunner instance, taken at mount…
  assert.match(runnerSource, /const \[runnerId\] = useState\(nextRunnerId\)/);
  // …and the path is built from it, so two runners on one page (the student's
  // editor and a revealed solution) can never share a model.
  assert.match(runnerSource, /path=\{editorPath\(runnerId, TAB_META\[tab\]\.label\)\}/);
  const pathSource = readSrc('../../../components/webdev/editorPath.js');
  assert.match(pathSource, /counter \+= 1/);
});

test('the rubric grades itself on arrival', () => {
  assert.match(pagerSource, /autoRun=\{isRubric\}/);
  assert.match(taskPageSource, /autoRun=\{autoRun\}/);
});

// ---------------------------------------------------------------------------
// Grading: starters, solutions, and "only my own new work"
// ---------------------------------------------------------------------------

test('every page uses only checks the grader supports', () => {
  const supported = new Set(['dom', 'every', 'link', 'console', 'style']);
  for (const page of project.pages) {
    for (const check of page.checks) {
      assert.ok(supported.has(check.type), `${page.id}: unknown check type "${check.type}"`);
    }
  }
});

test('only the form pages lean on a check Node cannot grade', () => {
  const ungradable = project.pages
    .filter((p) => p.checks.some((c) => !isGradable(c)))
    .map((p) => `${p.id}:${p.checks.filter((c) => !isGradable(c)).length}`);
  assert.deepEqual(ungradable, ['m5-contact:2', 'rubric:2'], 'the skip list above is out of date');
});

test('the empty scaffold passes nothing — every milestone has work to do', () => {
  for (const page of project.pages) {
    const { allPassed, verdicts } = grade(page, page.starter.html);
    assert.ok(verdicts.length > 0, `${page.id}: nothing gradable in Node`);
    assert.equal(allPassed, false, `${page.id}: the starter already passes`);
  }
});

test('each milestone solution passes that milestone', () => {
  for (const page of project.pages) {
    const { allPassed, failed } = grade(page, page.solution.html);
    assert.equal(allPassed, true, `${page.id}: the solution fails — ${failed.join(' | ')}`);
  }
});

test('the document is cumulative: milestone N passes every milestone before it', () => {
  milestones.forEach((page, n) => {
    for (let earlier = 0; earlier <= n; earlier += 1) {
      const { allPassed, failed } = grade(milestones[earlier], page.solution.html);
      assert.equal(
        allPassed, true,
        `the milestone ${n + 1} page no longer satisfies milestone ${earlier + 1}: ${failed.join(' | ')}`,
      );
    }
  });
});

test('each milestone checks ONLY its own new work, so the one before it fails', () => {
  for (let n = 1; n < milestones.length; n += 1) {
    const previousPage = milestones[n - 1].solution.html;
    assert.equal(
      grade(milestones[n], previousPage).allPassed, false,
      `milestone ${n + 1} passes on the milestone ${n} page — it asks for nothing new`,
    );
  }
});

test('milestone 1 grades the skeleton and nothing beyond it', () => {
  const m1 = pageOf('m1-skeleton');
  // A page with a title, one h1 and a paragraph passes even with no lists,
  // no table and no form — those belong to later milestones.
  assert.equal(grade(m1, m1.solution.html).allPassed, true);
  assert.equal(verdictOf(m1, '<title>Me</title><h1>Me</h1><p>Hello.</p>', 'exactly one <h1>'), true);
  // Two h1s is the mistake it does catch.
  assert.equal(
    verdictOf(m1, '<title>Me</title><h1>Me</h1><h1>Also me</h1><p>Hi.</p>', 'exactly one <h1>'),
    false,
  );
  // And an empty paragraph is not a paragraph.
  assert.equal(verdictOf(m1, '<title>Me</title><h1>Me</h1><p></p>', 'intro paragraph'), false);
});

test('milestone 2: alt text that describes nothing does not count', () => {
  const m2 = pageOf('m2-about');
  const lazyAlt = (alt) => m2.solution.html.replace(/alt="[^"]*"/, `alt="${alt}"`);
  for (const alt of ['image', 'photo', 'Picture', 'cat.jpg', 'me', '']) {
    assert.equal(verdictOf(m2, lazyAlt(alt), 'describes what is in the picture'), false,
      `alt="${alt}" was accepted`);
  }
  assert.equal(verdictOf(m2, lazyAlt('A tabby asleep on my keyboard'), 'describes what is in the picture'), true);
});

test('milestone 2: a link with no href, or no text, is not a link', () => {
  const m2 = pageOf('m2-about');
  const base = m2.solution.html;
  assert.equal(verdictOf(m2, base.replace(/<a href="[^"]*">/, '<a>'), 'both an href and words'), false);
  assert.equal(
    verdictOf(m2, base.replace(/>my notes page</, '><'), 'both an href and words'),
    false,
  );
});

test('milestone 3: bullets and numbers are different tags, and both are required', () => {
  const m3 = pageOf('m3-lists');
  const ulOnly = m3.solution.html.replace(/<ol>[\s\S]*?<\/ol>/, '');
  assert.notEqual(ulOnly, m3.solution.html, 'the <ol> fixture stopped matching');
  assert.equal(verdictOf(m3, ulOnly, '<ul> holding at least three'), true);
  assert.equal(verdictOf(m3, ulOnly, '<ol> holding at least three'), false);

  // Loose <li> with no list around them satisfy neither.
  const loose = '<h2>a</h2><h2>b</h2><h2>c</h2><li>one</li><li>two</li><li>three</li>';
  assert.equal(verdictOf(m3, loose, '<ul> holding at least three'), false);
});

test('milestone 4: a table needs a real header row and three data rows', () => {
  const m4 = pageOf('m4-table');
  const base = m4.solution.html;

  const noThead = base.replace('<thead>', '').replace('</thead>', '');
  assert.equal(verdictOf(m4, noThead, '<thead> holding a row'), false);

  const tdHeader = base.replace(/<th>/g, '<td>').replace(/<\/th>/g, '</td>');
  assert.equal(verdictOf(m4, tdHeader, '<thead> holding a row'), false,
    '<thead> full of <td> counted as a header row');

  const shortTable = base.replace(
    /      <tr>\n        <td>Pixel art<\/td>[\s\S]*?<\/tr>\n/,
    '',
  );
  assert.notEqual(shortTable, base, 'the dropped-row fixture stopped matching');
  // Three columns means a dropped row still leaves six <td>, which is why the
  // rows are counted separately — this is the check that catches it.
  assert.equal(verdictOf(m4, shortTable, 'at least six <td>'), true);
  assert.equal(verdictOf(m4, shortTable, 'at least four rows'), false);
  assert.equal(grade(m4, shortTable).allPassed, false);
});

test('milestone 5: three labelled fields, and the message box is a textarea', () => {
  const m5 = pageOf('m5-contact');
  const base = m5.solution.html;

  const noTextarea = base.replace(/<textarea[^>]*><\/textarea>/, '<input type="text" id="message">');
  assert.notEqual(noTextarea, base, 'the textarea fixture stopped matching');
  assert.equal(verdictOf(m5, noTextarea, '<textarea> inside the form'), false);
  assert.equal(verdictOf(m5, noTextarea, 'exactly two <input>'), false,
    'a third input slipped past the input count');

  const noFor = base.replace('for="email"', '');
  assert.equal(verdictOf(m5, noFor, 'exactly three <label>'), false);

  const noEmailType = base.replace('type="email"', 'type="text"');
  assert.equal(verdictOf(m5, noEmailType, 'type="email"'), false);

  const emptyButton = base.replace(/<button type="submit">[^<]*<\/button>/, '<button type="submit"></button>');
  assert.notEqual(emptyButton, base, 'the button fixture stopped matching');
  assert.equal(verdictOf(m5, emptyButton, '<button> that has words on it'), false);
});

// ---------------------------------------------------------------------------
// The rubric: it re-checks everything, and names what broke
// ---------------------------------------------------------------------------

test('the finished page passes every rubric item', () => {
  const { allPassed, failed, skipped } = grade(rubric, rubric.solution.html);
  assert.equal(allPassed, true, `the rubric fails its own reference page — ${failed.join(' | ')}`);
  assert.equal(skipped, 2, 'the two label/field link checks are the only ungradable ones');
});

test('the rubric re-checks every milestone, not just the last one', () => {
  // Milestone 5 finishes the page, so its solution IS the rubric's reference
  // page — that equality is the point, not an oversight.
  assert.equal(milestones.at(-1).solution.html, rubric.solution.html);

  // Every earlier milestone's solution is a PREFIX of it, so each one must
  // fail the rubric: the rubric has something to say about all five stages,
  // not just the last.
  for (const page of milestones.slice(0, -1)) {
    assert.equal(grade(rubric, page.solution.html).allPassed, false,
      `the rubric passes on the milestone "${page.id}" page, which is unfinished`);
  }
});

test('breaking an earlier milestone is caught by the rubric, by name', () => {
  const base = rubric.solution.html;

  /** @param {string} html @returns {string[]} the rubric items that failed */
  const failuresOf = (html) => grade(rubric, html).failed;

  // 1. A second <h1> sneaks in (milestone 1).
  const twoH1 = base.replace('<h2>About me</h2>', '<h1>About me</h1>');
  assert.deepEqual(failuresOf(twoH1).filter((m) => m.includes('exactly one <h1>')).length, 1);

  // 2. The alt text is deleted (milestone 2).
  const noAlt = base.replace(/ alt="[^"]*"/, '');
  assert.notEqual(noAlt, base, 'the alt fixture stopped matching');
  assert.ok(failuresOf(noAlt).some((m) => m.includes('Every image on the page has alt text')));

  // 3. The goals list is deleted (milestone 3).
  const noOl = base.replace(/<ol>[\s\S]*?<\/ol>/, '');
  assert.notEqual(noOl, base, 'the <ol> fixture stopped matching');
  assert.ok(failuresOf(noOl).some((m) => m.includes('goals list is an <ol>')));

  // 4. The table header is downgraded to data cells (milestone 4).
  const noThead = base.replace('<thead>', '').replace('</thead>', '');
  assert.ok(failuresOf(noThead).some((m) => m.includes('<thead> row of <th>')));

  // 5. An input loses its id, so its label points at nothing (milestone 5).
  const noId = base.replace('id="email"', '');
  assert.ok(failuresOf(noId).some((m) => m.includes('Every input in the form has an id')));

  // 6. A heading jumps two levels (page-level quality).
  const deepHeading = base.replace('<h2>My skills</h2>', '<h4>My skills</h4>');
  const deepFailures = failuresOf(deepHeading);
  assert.ok(deepFailures.some((m) => m.includes('an <h4>')));
  assert.ok(deepFailures.some((m) => m.includes('Every section has its own <h2>')));

  // None of these are silent: each fixture fails the rubric as a whole.
  for (const broken of [twoH1, noAlt, noOl, noThead, noId, deepHeading]) {
    assert.equal(grade(rubric, broken).allPassed, false);
  }
});

test('one broken item does not take the rest of the rubric down with it', () => {
  // A student who deletes their table should see the table items fail and
  // everything else still ticked — that is what makes the list usable.
  const noTable = rubric.solution.html.replace(/<table>[\s\S]*?<\/table>/, '');
  const { failed } = grade(rubric, noTable);
  assert.equal(
    failed.every((m) => m.toLowerCase().includes('table') || m.includes('data rows')),
    true,
    `expected only the table items to fail, got: ${failed.join(' | ')}`,
  );
  assert.equal(failed.length, 3, `expected the three table items, got: ${failed.join(' | ')}`);
});

// ---------------------------------------------------------------------------
// The `every` check type, which the rubric leans on
// ---------------------------------------------------------------------------

test('"every" means all of them, where "dom" only ever meant one of them', () => {
  const mixed =
    '<img src="cat.jpg" alt="A tabby asleep on my keyboard">' +
    '<img src="mountain.jpg">';

  const domCheck = rubric.checks.find((c) => c.message.includes('describes the picture'));
  const everyCheck = rubric.checks.find((c) => c.message.includes('Every image'));

  assert.equal(verdict(domCheck, mixed), true, 'the dom check is satisfied by one good image');
  assert.equal(verdict(everyCheck, mixed), false, 'the every check let a bare image through');

  const bothDescribed = mixed.replace('src="mountain.jpg"', 'src="mountain.jpg" alt="The farm where our beans grow"');
  assert.equal(verdict(everyCheck, bothDescribed), true);
});

test('"every" is not vacuously true on a page with none of them', () => {
  const everyCheck = rubric.checks.find((c) => c.message.includes('Every image'));
  assert.equal(verdict(everyCheck, '<h1>No pictures here</h1>'), false);

  // And it says so, rather than just "no".
  const ctx = ctxFor('<h1>No pictures here</h1>');
  const out = everyVerdict(everyCheck, ctx.queryAll('img'), []);
  assert.equal(out.passed, false);
  assert.match(out.detail, /no img on the page at all/);
});

test('"every" counts the offenders in its failure detail', () => {
  const everyCheck = rubric.checks.find((c) => c.message.includes('Every image'));
  const ctx = ctxFor('<img src="a.jpg" alt="one"><img src="b.jpg"><img src="c.jpg">');
  const out = everyVerdict(everyCheck, ctx.queryAll('img'), matchElements(everyCheck, ctx));
  assert.equal(out.passed, false);
  assert.match(out.detail, /2 of the 3 img elements on the page do not/);
});

test('the sandbox injects the real graders, so this file grades what the frame grades', () => {
  const doc = buildSrcDoc({ html: '<p>x</p>', checks: [], runId: 1 });
  for (const fn of [matchElements, domVerdict, everyVerdict]) {
    assert.ok(doc.includes(fn.toString()), `${fn.name} is not injected by source`);
  }
});

test('the validator rejects an "every" check that would pass on any page', () => {
  const problems = checkSection({
    id: 'x', title: 'x',
    pages: [{
      id: 'p1', type: 'task', prompt: 'p', starter: { html: 'x' }, solution: { html: 'x' },
      checks: [{ type: 'every', selector: 'img', message: 'every image is an image' }],
    }],
  });
  assert.ok(problems.some((p) => p.includes('has no filter')), problems.join('\n'));
});
