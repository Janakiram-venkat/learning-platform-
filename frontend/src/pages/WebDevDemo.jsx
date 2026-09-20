// TEMPORARY — a harness for exercising CodeRunner and the lesson engine in
// isolation while the web-dev course is being built. Delete this file and its
// route once Module 1 ships (Phase 7).

import { useState } from 'react';
import CodeRunner from '../components/webdev/CodeRunner';
import LessonPager from '../components/lesson-engine/LessonPager';
import TaskSelfTest from '../components/webdev/TaskSelfTest';
import { SECTIONS } from '../data/webdev/module1';

/** Every written section, for the task self-test. */
const REAL_SECTIONS = SECTIONS.filter((s) => s.section).map((s) => s.section);

const CHECKS = [
  { type: 'dom', selector: 'h1', text: 'Hello', message: 'Your page has an <h1> that says "Hello".' },
  { type: 'dom', selector: 'img', attr: 'alt', message: 'Your image has an alt attribute.' },
  { type: 'style', selector: 'h1', prop: 'color', value: 'red', message: 'The heading is red.' },
  { type: 'console', contains: 'ready', message: 'You logged the word "ready" to the console.' },
];

// A throwaway section that exercises every page type and block kind the engine
// supports. The real Module 1 content lands in src/data/webdev/ in Phase 4.
const DEMO_SECTION = {
  id: 'demo-section',
  title: 'Engine smoke test',
  pages: [
    {
      id: 'p1',
      type: 'content',
      title: 'Markdown and callouts',
      blocks: [
        {
          type: 'text',
          md: [
            'This page checks the **Markdown renderer**. It should handle *emphasis*,',
            '`inline code`, [links](https://developer.mozilla.org), and lists:',
            '',
            '- a bullet',
            '- another bullet',
            '',
            '1. first',
            '2. second',
            '',
            'And a GFM table:',
            '',
            '| Tag | Does |',
            '| --- | --- |',
            '| `<h1>` | A big heading |',
            '| `<p>` | A paragraph |',
            '',
            '```html',
            '<p>A fenced code block, not runnable.</p>',
            '```',
          ].join('\n'),
        },
        { type: 'tip', md: 'This is a **Tip** callout. It should be green with a lightbulb.' },
        { type: 'warning', md: 'This is a **Warning** callout. It should be red with a triangle.' },
      ],
    },
    {
      id: 'p2',
      type: 'content',
      title: 'A runnable example',
      blocks: [
        { type: 'text', md: 'The example below should **auto-run** and show its result immediately.' },
        {
          type: 'example',
          tabs: ['html', 'css'],
          files: {
            html: '<h1>Auto-ran</h1>\n<p>No button press needed.</p>',
            css: 'body { font-family: sans-serif; padding: 1rem; }\nh1 { color: #1F7A5C; }',
          },
          caption: 'Edits here are throwaway — leave the page and come back to get this version again.',
        },
      ],
    },
    {
      id: 'p3',
      type: 'task',
      title: 'A graded task',
      required: true,
      prompt: [
        'Make the heading say **Hello** and give the paragraph the class `intro`.',
        '',
        'Press **Run** to check your work. Deliberately get it wrong twice to see',
        'the "Show me the solution" button appear.',
      ].join('\n'),
      tabs: ['html', 'css'],
      starter: {
        html: '<h1>Change me</h1>\n<p>Give me a class.</p>',
        css: '/* nothing needed here yet */',
      },
      checks: [
        { type: 'dom', selector: 'h1', text: 'Hello', message: 'The <h1> says "Hello".' },
        { type: 'dom', selector: 'p.intro', message: 'The paragraph has class="intro".' },
      ],
      hint: 'A class goes inside the opening tag: `<p class="something">`.',
      solution: {
        html: '<h1>Hello</h1>\n<p class="intro">Give me a class.</p>',
        css: '/* nothing needed here yet */',
      },
    },
    {
      id: 'p4',
      type: 'task',
      title: 'A console task',
      required: true,
      prompt: 'Use `console.log` to print the word **done**. This one has no preview worth looking at, so the runner should open on the Terminal tab.',
      tabs: ['js'],
      starter: { js: '// print the word "done" here\n' },
      checks: [
        { type: 'console', contains: 'done', message: 'The console shows the word "done".' },
      ],
      hint: '`console.log("done");`',
      solution: { js: 'console.log("done");' },
    },
    {
      id: 'p5',
      type: 'quiz',
      title: 'A knowledge check',
      required: true,
      questions: [
        {
          q: 'Which tag makes a hyperlink?',
          options: ['<link>', '<a>', '<href>', '<nav>'],
          answerIndex: 1,
          explanation: '`<a>` (anchor) makes a link. `<link>` is a different tag that loads a stylesheet in the `<head>`.',
        },
        {
          q: 'Where does CSS belong in a page?',
          options: ['Inside <body>', 'Inside <head>', 'Before <!DOCTYPE>', 'Anywhere at all'],
          answerIndex: 1,
          explanation: 'Styles load in the `<head>` so the browser knows how to paint the page before it draws the body.',
        },
      ],
    },
    {
      id: 'p6',
      type: 'content',
      title: 'The end',
      blocks: [
        { type: 'text', md: 'This is the last page. **Complete & Continue** should be unlocked only if pages 3, 4 and 5 all passed.' },
      ],
    },
  ],
};

/** Wipe this demo section's saved state so gating can be tested again. */
function resetDemoProgress() {
  try {
    const pages = JSON.parse(localStorage.getItem('webdevPages') || '{}');
    delete pages[DEMO_SECTION.id];
    localStorage.setItem('webdevPages', JSON.stringify(pages));

    const done = JSON.parse(localStorage.getItem('completedLessons') || '[]');
    localStorage.setItem(
      'completedLessons',
      JSON.stringify(done.filter((id) => id !== DEMO_SECTION.id)),
    );

    const code = JSON.parse(localStorage.getItem('webdevCode') || '{}');
    Object.keys(code)
      .filter((k) => k.startsWith(`${DEMO_SECTION.id}/`))
      .forEach((k) => delete code[k]);
    localStorage.setItem('webdevCode', JSON.stringify(code));
  } catch { /* ignore */ }
  window.location.reload();
}

export default function WebDevDemo() {
  const [results, setResults] = useState(null);
  const [completed, setCompleted] = useState(null);

  return (
    <div className="bench-grid min-h-screen p-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <h1 className="font-lab text-3xl font-extrabold text-ink">Web-dev harness</h1>

        {/* ---------------- Real content self-test ---------------- */}
        <TaskSelfTest sections={REAL_SECTIONS} />

        {/* ---------------- Lesson engine ---------------- */}
        <div className="rounded-2xl border-2 border-ink bg-white p-5 shadow-[4px_4px_0_rgba(22,36,29,0.9)] sm:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-lab text-2xl font-extrabold text-ink">Lesson engine</h2>
            <button
              onClick={resetDemoProgress}
              className="rounded-lg border-2 border-ink px-4 py-2 text-sm font-bold text-ink hover:bg-signal/25"
            >
              Reset demo progress
            </button>
          </div>

          {completed ? (
            <p className="rounded-xl border-2 border-pcb bg-pcb/10 p-5 font-bold text-ink">
              Section “{completed}” completed — onSectionComplete fired. In the real page
              this is where the student moves to the next section.
            </p>
          ) : (
            <LessonPager section={DEMO_SECTION} onSectionComplete={setCompleted} />
          )}
        </div>

        {/* ---------------- CodeRunner ---------------- */}
        <h2 className="font-lab text-2xl font-extrabold text-ink">CodeRunner scenarios</h2>

        <section className="space-y-3">
          <h3 className="font-lab text-lg font-bold text-ink">1. Example (HTML only, auto-run)</h3>
          <CodeRunner
            label="A first page"
            autoRun
            tabs={['html']}
            starter={{ html: '<h1>Hello, web!</h1>\n<p>This page is running in a sandbox.</p>' }}
          />
        </section>

        <section className="space-y-3">
          <h3 className="font-lab text-lg font-bold text-ink">2. Three tabs + autosave + checks</h3>
          <CodeRunner
            label="Graded task"
            storageKey="demo/task1"
            tabs={['html', 'css', 'js']}
            checks={CHECKS}
            onCheckResults={setResults}
            starter={{
              html: '<h1>Hello</h1>\n<img src="https://placehold.co/120" alt="a grey square">',
              css: 'h1 { color: red; }',
              js: 'console.log("ready");\nconsole.warn("a warning");\nconsole.log({ a: 1, b: [2, 3] });',
            }}
          />
          <ul className="space-y-1 text-sm font-semibold">
            {(results || []).map((r) => (
              <li key={r.index} className={r.passed ? 'text-pcb' : 'text-wire'}>
                {r.passed ? '✔' : '✘'} {r.message}{r.detail ? ` — ${r.detail}` : ''}
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="font-lab text-lg font-bold text-ink">3. Errors + JS-only (opens on terminal)</h3>
          <CodeRunner
            label="Console"
            tabs={['js']}
            starter={{ js: 'console.log("before");\nnotAFunction();\nconsole.log("never runs");' }}
          />
        </section>

        <section className="space-y-3">
          <h3 className="font-lab text-lg font-bold text-ink">4. Whole-document HTML (head/body preserved)</h3>
          <CodeRunner
            label="Full page"
            tabs={['html', 'css']}
            starter={{
              html: '<!DOCTYPE html>\n<html>\n  <head>\n    <title>My site</title>\n  </head>\n  <body>\n    <h1>Whole document</h1>\n  </body>\n</html>',
              css: 'body { font-family: sans-serif; background: #EDF3EE; }',
            }}
          />
        </section>

        <section className="space-y-3">
          <h3 className="font-lab text-lg font-bold text-ink">5. Runaway loop (press Run, then Stop)</h3>
          <CodeRunner
            label="Infinite loop"
            tabs={['js']}
            starter={{ js: 'while (true) { /* the Stop button should recover this */ }' }}
          />
        </section>
      </div>
    </div>
  );
}
