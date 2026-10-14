import { useCallback, useState } from 'react';
import { CheckCircle2, XCircle, FlaskConical } from 'lucide-react';
import CodeRunner from '../components/webdev/CodeRunner';

// ---------------------------------------------------------------------------
// TEMPORARY — delete before Module 2 ships (Phase 11).
//
// This page exists to prove the half of the CSS checkers that Node cannot
// reach. lib/webdev/checkers.test.mjs tests every DECISION the checkers make,
// because those are pure functions of a reading. It cannot test the READINGS:
//
//   - does a 375px-wide hidden frame really trigger `@media (max-width: 600px)`?
//   - does an off-screen frame have measurable layout at all, or does
//     getBoundingClientRect answer zero for everything?
//   - is a check WITHOUT `at` graded at DEFAULT_GRADING_WIDTH rather than at
//     the visible preview's own ~469px, which would leave a 600px breakpoint
//     permanently active while grading? (This is the bug the first run of this
//     page found — see the `default-width` fixture, which exists to catch it
//     coming back.)
//   - does `box-sizing: border-box` really make a padded 300px box measure 300?
//   - do verdicts from three frames arrive, merge, and come back in the order
//     the author wrote them?
//
// Every one of those is a browser question with a yes/no answer, so each row
// below is a fixture with the verdict it must produce, and the page says
// whether the checkers agreed. A red row is a broken checker, not a broken
// student.
//
// Reached at /webdev-checks, registered in routes/AppRoutes.jsx behind
// import.meta.env.DEV, so a production build never includes it.
// ---------------------------------------------------------------------------

/** A page of three equal cards, the backdrop for the layout fixtures. */
const CARDS_HTML = [
  '<div class="row">',
  '  <div class="card">One</div>',
  '  <div class="card">Two</div>',
  '  <div class="card">Three</div>',
  '</div>',
].join('\n');

/**
 * The fixtures.
 *
 * `want` is one boolean per check, in authored order: the verdict the checker
 * MUST reach for that check over that code. A fixture with a `false` in it is
 * not a broken fixture — it is the half of the matrix that proves a check can
 * still fail, which is the half that a checker returning `true` unconditionally
 * would pass.
 */
const FIXTURES = [
  {
    id: 'style-value',
    title: 'style · an exact value, matched and missed',
    note: 'The authored word "red" has to resolve to the rgb() the browser reports.',
    tabs: ['html', 'css'],
    files: { html: '<h1 class="title">Hi</h1>', css: '.title { color: red; }' },
    checks: [
      { type: 'style', selector: '.title', prop: 'color', value: 'red', message: 'the heading is red' },
      { type: 'style', selector: '.title', prop: 'color', value: 'blue', message: 'the heading is blue' },
    ],
    want: [true, false],
  },
  {
    id: 'style-every',
    title: 'style · every, over a page with one offender',
    note: '"At least one card has padding" must not pass this; the third card has none.',
    tabs: ['html', 'css'],
    files: {
      html: CARDS_HTML,
      css: '.card { padding: 20px; }\n.card:last-child { padding: 0; }',
    },
    checks: [
      { type: 'style', selector: '.card', prop: 'padding-top', approx: 20, message: 'some card has 20px padding' },
      { type: 'style', selector: '.card', prop: 'padding-top', approx: 20, every: true, message: 'EVERY card has 20px padding' },
    ],
    want: [true, false],
  },
  {
    id: 'style-not',
    title: 'style · not, over a rule that lost to specificity',
    note: 'The id rule wins, so the class rule never applies. This is the Challenge’s bug task in miniature.',
    tabs: ['html', 'css'],
    files: {
      html: '<h1 id="main" class="title">Hi</h1>',
      css: '#main { color: black; }\n.title { color: red; }',
    },
    checks: [
      { type: 'style', selector: '.title', prop: 'color', not: 'black', message: 'the heading is no longer black' },
      { type: 'style', selector: '.title', prop: 'color', value: 'black', message: 'the heading is still black (it is)' },
    ],
    want: [false, true],
  },
  {
    id: 'layout-box',
    title: 'layout · box-sizing, measured rather than read',
    note: 'Both boxes declare width: 300px. Only border-box actually measures 300.',
    tabs: ['html', 'css'],
    files: {
      html: '<div class="border-box">a</div>\n<div class="content-box">b</div>',
      css: [
        'div { width: 300px; padding: 20px; border: 5px solid black; }',
        '.border-box { box-sizing: border-box; }',
        '.content-box { box-sizing: content-box; }',
      ].join('\n'),
    },
    checks: [
      { type: 'layout', selector: '.border-box', box: 'width', approx: 300, message: 'the border-box div measures 300' },
      { type: 'layout', selector: '.content-box', box: 'width', approx: 300, message: 'the content-box div measures 300 (it measures 350)' },
    ],
    want: [true, false],
  },
  {
    id: 'layout-rel',
    title: 'layout · in a row, or stacked',
    note: 'display:flex alone does not prove a row — flex-direction can still stack them.',
    tabs: ['html', 'css'],
    files: { html: CARDS_HTML, css: '.row { display: flex; gap: 8px; }' },
    checks: [
      { type: 'layout', selector: '.card', rel: 'sameRow', message: 'the cards are side by side' },
      { type: 'layout', selector: '.card', rel: 'stacked', message: 'the cards are stacked (they are not)' },
    ],
    want: [true, false],
  },
  {
    id: 'layout-rel-column',
    title: 'layout · the same checks over a column',
    note: 'The mirror image, so neither verdict can be hard-coded.',
    tabs: ['html', 'css'],
    files: { html: CARDS_HTML, css: '.row { display: flex; flex-direction: column; }' },
    checks: [
      { type: 'layout', selector: '.card', rel: 'sameRow', message: 'the cards are side by side (they are not)' },
      { type: 'layout', selector: '.card', rel: 'stacked', message: 'the cards are stacked' },
    ],
    want: [false, true],
  },
  {
    id: 'at-media',
    title: 'at: 375 · does a narrow frame really trigger the media query?',
    note: 'THE critical fixture. Check [0] has no "at", so it is graded at DEFAULT_GRADING_WIDTH (1100) — NOT in the visible preview, which is only ~469px and would have this media query permanently active.',
    tabs: ['html', 'css'],
    files: {
      html: CARDS_HTML,
      css: [
        '.row { display: flex; flex-direction: row; }',
        '',
        '@media (max-width: 600px) {',
        '  .row { flex-direction: column; }',
        '}',
      ].join('\n'),
    },
    checks: [
      { type: 'layout', selector: '.row', prop: 'flex-direction', value: 'row', message: 'at the default 1100px the row is a row' },
      { type: 'layout', selector: '.row', prop: 'flex-direction', value: 'column', at: 375, message: 'at 375px the row becomes a column' },
      { type: 'layout', selector: '.card', rel: 'stacked', at: 375, message: 'at 375px the cards are stacked' },
    ],
    want: [true, true, true],
  },
  {
    id: 'default-width',
    title: 'default width · the preview’s own width must not leak into grading',
    note: 'A breakpoint of 900px is above the preview (~469px) and below the 1100px default. If the default width is not being used, check [0] reads "column" and this fixture fails — which is exactly the bug this pair of frames was added to fix.',
    tabs: ['html', 'css'],
    files: {
      html: CARDS_HTML,
      css: [
        '.row { display: flex; flex-direction: row; }',
        '',
        '/* Active in the visible preview. Must NOT be active while grading. */',
        '@media (max-width: 900px) {',
        '  .row { flex-direction: column; }',
        '}',
      ].join('\n'),
    },
    checks: [
      { type: 'layout', selector: '.row', prop: 'flex-direction', value: 'row', message: 'graded at 1100px, so above the 900px breakpoint' },
      { type: 'style', selector: '.row', prop: 'flex-direction', value: 'row', message: 'a style check gets the same default width' },
      { type: 'layout', selector: '.row', prop: 'flex-direction', value: 'column', at: 500, message: 'at 500px the breakpoint applies' },
    ],
    want: [true, true, true],
  },
  {
    id: 'at-media-missing',
    title: 'at: 375 · and does it fail when no media query was written?',
    note: 'Same checks, no breakpoint. If these pass, the narrow frame is not being measured at all.',
    tabs: ['html', 'css'],
    files: { html: CARDS_HTML, css: '.row { display: flex; flex-direction: row; }' },
    checks: [
      { type: 'layout', selector: '.row', prop: 'flex-direction', value: 'column', at: 375, message: 'at 375px the row becomes a column (no media query, so no)' },
      { type: 'layout', selector: '.card', rel: 'stacked', at: 375, message: 'at 375px the cards are stacked (no, still a row)' },
    ],
    want: [false, false],
  },
  {
    id: 'at-merge',
    title: 'at · three frames, merged back into authored order',
    note: 'Three widths — 375, the 1100 default for the un-"at"ed style check, and 900. Verdicts must arrive as one list, in this order, exactly once.',
    tabs: ['html', 'css'],
    files: {
      html: CARDS_HTML,
      css: [
        '.row { display: flex; flex-direction: row; }',
        '@media (max-width: 500px) { .row { flex-direction: column; } }',
      ].join('\n'),
    },
    checks: [
      { type: 'layout', selector: '.row', prop: 'flex-direction', value: 'column', at: 375, message: '#1 at 375px: column' },
      { type: 'style', selector: '.row', prop: 'display', value: 'flex', message: '#2 at the 1100px default: flex' },
      { type: 'layout', selector: '.row', prop: 'flex-direction', value: 'row', at: 900, message: '#3 at 900px: row' },
    ],
    want: [true, true, true],
  },
  {
    id: 'cssrule-hover',
    title: 'cssRule · a state the page is not in',
    note: 'Nothing computed can see a :hover rule. This reads the source instead.',
    tabs: ['html', 'css'],
    files: {
      html: '<button class="btn">Click</button>',
      css: [
        '.btn { background-color: steelblue; transition: background-color 0.3s ease; }',
        '.btn:hover { background-color: midnightblue; }',
      ].join('\n'),
    },
    checks: [
      { type: 'cssRule', selector: '.btn:hover', prop: 'background-color', message: 'there is a :hover rule' },
      { type: 'cssRule', selector: '.btn', prop: 'transition', value: 'background-color', message: 'the button transitions its background' },
      { type: 'cssRule', selector: '.btn:focus', prop: 'outline', message: 'there is a :focus rule (there is not)' },
    ],
    want: [true, true, false],
  },
  {
    id: 'cssrule-style-tag',
    title: 'cssRule · CSS written in a <style> tag in the HTML',
    note: 'Section 1 teaches <style> before the css tab exists. Both have to be readable.',
    tabs: ['html'],
    files: { html: '<style>\n  .btn:hover { color: red; }\n</style>\n<button class="btn">Click</button>' },
    checks: [
      { type: 'cssRule', selector: '.btn:hover', prop: 'color', message: 'the <style> block is read too' },
    ],
    want: [true],
  },
];

/** One fixture: runs on mount, then says whether the verdicts were the wanted ones. */
function Fixture({ fixture, onVerdict }) {
  const [results, setResults] = useState(null);
  const [reports, setReports] = useState(0);

  const handleResults = useCallback((next) => {
    setResults(next);
    setReports((n) => n + 1);
    const got = next.map((r) => r.passed);
    const want = fixture.want;
    const sameOrder = next.every((r, i) => r.index === i);
    const agreed = got.length === want.length
      && got.every((v, i) => v === want[i])
      && sameOrder;
    onVerdict(fixture.id, agreed);
  }, [fixture, onVerdict]);

  const outcome = results === null ? null
    : results.map((r) => r.passed).join(',') === fixture.want.join(',')
      && results.every((r, i) => r.index === i);

  return (
    <section className="rounded-2xl border-2 border-ink bg-white p-5">
      <div className="mb-2 flex flex-wrap items-center gap-3">
        {outcome === null
          ? <span className="text-sm font-bold text-ink/40">running…</span>
          : outcome
            ? <span className="flex items-center gap-1.5 font-extrabold text-pcb"><CheckCircle2 className="h-5 w-5" /> AGREED</span>
            : <span className="flex items-center gap-1.5 font-extrabold text-wire"><XCircle className="h-5 w-5" /> DISAGREED</span>}
        <h2 className="font-lab font-extrabold text-ink">{fixture.title}</h2>
      </div>
      <p className="mb-3 text-sm text-ink/60">{fixture.note}</p>

      {/* More than one report for a single run means the merge let a partial
          result through — a task would visibly flash the wrong score. */}
      {reports > 1 && (
        <p className="mb-3 text-sm font-bold text-wire">
          reported {reports} times for one run — the verdicts are not being merged
        </p>
      )}

      {results && (
        <ul className="mb-3 space-y-1">
          {results.map((r, i) => {
            const wanted = fixture.want[i];
            const right = r.passed === wanted && r.index === i;
            return (
              <li key={r.index} className="font-mono-lab text-xs">
                <span className={right ? 'text-pcb' : 'text-wire font-bold'}>
                  [{r.index}] got {String(r.passed)}, wanted {String(wanted)}
                </span>
                <span className="text-ink/50"> — {r.message}</span>
                {r.detail && <span className="text-ink/40"> ({r.detail})</span>}
              </li>
            );
          })}
        </ul>
      )}

      <CodeRunner
        label={fixture.id}
        starter={fixture.files}
        tabs={fixture.tabs}
        checks={fixture.checks}
        autoRun
        onCheckResults={handleResults}
      />
    </section>
  );
}

export default function WebDevCheckerSelfTest() {
  const [verdicts, setVerdicts] = useState({});

  const onVerdict = useCallback((id, agreed) => {
    setVerdicts((prev) => (prev[id] === agreed ? prev : { ...prev, [id]: agreed }));
  }, []);

  const done = Object.keys(verdicts).length;
  const bad = Object.values(verdicts).filter((v) => !v).length;

  return (
    <main className="bench-grid min-h-screen p-4 sm:p-8">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <header className="rounded-2xl border-2 border-ink bg-white p-6 shadow-[4px_4px_0_rgba(27,27,27,0.9)]">
          <h1 className="font-lab flex items-center gap-2 text-2xl font-extrabold text-ink">
            <FlaskConical className="h-6 w-6" aria-hidden="true" /> CSS checker self-test
          </h1>
          <p className="mt-2 text-ink/65">
            Temporary scaffolding for Module 2. Each fixture below runs real code in a real
            frame and states the verdict its checks must reach. Node tests the decisions; this
            tests the readings — computed styles, real geometry, and whether a 375px frame
            really triggers a media query.
          </p>
          <p className="mt-2 text-sm text-ink/55">
            Note the widths. The visible preview pane is only about 469px wide, so no
            width-sensitive check is graded there: <code className="font-mono-lab">style</code> and{' '}
            <code className="font-mono-lab">layout</code> checks are measured at{' '}
            <strong>{1100}px</strong> unless they name their own width with{' '}
            <code className="font-mono-lab">at</code>. Structure, link and console checks still
            grade in the preview, where the student’s own code ran.
          </p>
          <p
            className={`mt-3 font-lab font-extrabold ${
              done < FIXTURES.length ? 'text-ink/50' : bad ? 'text-wire' : 'text-pcb'
            }`}
          >
            {done < FIXTURES.length
              ? `${done} of ${FIXTURES.length} fixtures reported…`
              : bad
                ? `${bad} of ${FIXTURES.length} fixtures DISAGREED — a checker is wrong.`
                : `All ${FIXTURES.length} fixtures agreed.`}
          </p>
        </header>

        {FIXTURES.map((fixture) => (
          <Fixture key={fixture.id} fixture={fixture} onVerdict={onVerdict} />
        ))}
      </div>
    </main>
  );
}
