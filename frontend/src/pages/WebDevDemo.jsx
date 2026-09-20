// TEMPORARY — a harness for exercising CodeRunner in isolation while the
// web-dev lesson engine is being built. Delete this file and its route once
// Module 1 ships (Phase 7).

import { useState } from 'react';
import CodeRunner from '../components/webdev/CodeRunner';

const CHECKS = [
  { type: 'dom', selector: 'h1', text: 'Hello', message: 'Your page has an <h1> that says "Hello".' },
  { type: 'dom', selector: 'img', attr: 'alt', message: 'Your image has an alt attribute.' },
  { type: 'style', selector: 'h1', prop: 'color', value: 'red', message: 'The heading is red.' },
  { type: 'console', contains: 'ready', message: 'You logged the word "ready" to the console.' },
];

export default function WebDevDemo() {
  const [results, setResults] = useState(null);

  return (
    <div className="bench-grid min-h-screen p-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <h1 className="font-lab text-3xl font-extrabold text-ink">CodeRunner harness</h1>

        <section className="space-y-3">
          <h2 className="font-lab text-xl font-bold text-ink">1. Example (HTML only, auto-run)</h2>
          <CodeRunner
            label="A first page"
            autoRun
            tabs={['html']}
            starter={{ html: '<h1>Hello, web!</h1>\n<p>This page is running in a sandbox.</p>' }}
          />
        </section>

        <section className="space-y-3">
          <h2 className="font-lab text-xl font-bold text-ink">2. Three tabs + autosave + checks</h2>
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
          <h2 className="font-lab text-xl font-bold text-ink">3. Errors + JS-only (opens on terminal)</h2>
          <CodeRunner
            label="Console"
            tabs={['js']}
            starter={{ js: 'console.log("before");\nnotAFunction();\nconsole.log("never runs");' }}
          />
        </section>

        <section className="space-y-3">
          <h2 className="font-lab text-xl font-bold text-ink">4. Whole-document HTML (head/body preserved)</h2>
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
          <h2 className="font-lab text-xl font-bold text-ink">5. Runaway loop (press Run, then Stop)</h2>
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
