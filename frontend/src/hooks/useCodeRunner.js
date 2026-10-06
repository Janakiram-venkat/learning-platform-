import { useCallback, useEffect, useRef, useState } from 'react';
import { compilerService } from '../services/api';
import { warmupPyodide, isPyodideReady } from '../services/pyodide';

// ---------------------------------------------------------------------------
// useCodeRunner — drives an interactive terminal on top of a *batch* runner.
//
// The runner executes a whole program at once, so it can't truly pause on a
// read from stdin. We fake interactivity with a re-run technique: when the
// program stops waiting for input (the runner reports `needs_input`), we prompt
// the learner, append their answer to the accumulated stdin, and re-run the
// entire program. Because a teaching program's output is deterministic, each
// re-run reproduces the same prefix plus a bit more — so we only render the
// *new* slice of stdout (the delta), giving a smooth line-by-line terminal feel.
//
// This is language-agnostic: `language` only decides which runner the call goes
// to (Pyodide in a Web Worker for Python, the API for Java) and what we say
// while a runtime is still downloading. Both return { output, needs_input }.
// ---------------------------------------------------------------------------

const idOf = (() => { let n = 0; return () => ++n; })();

export function useCodeRunner(language = 'python') {
  // Rendered terminal lines: { id, type: 'out'|'in'|'sys'|'err', text }
  const [lines, setLines] = useState([]);
  const [running, setRunning] = useState(false);
  const [waiting, setWaiting] = useState(false); // program is awaiting input

  const codeRef = useRef('');        // program currently being run
  const stdinRef = useRef([]);       // answers typed so far, in order
  const shownRef = useRef(0);        // length of stdout already rendered
  // Read inside callbacks rather than closed over, so switching course (and so
  // language) never leaves a stale runner bound to the previous one.
  const languageRef = useRef(language);
  useEffect(() => { languageRef.current = language; }, [language]);

  // Start downloading the Python runtime as soon as an editor mounts so the
  // first Run is fast (the ~10MB fetch happens once, then it's cached). Java
  // compiles on the server, so it has nothing to warm up.
  useEffect(() => { if (language !== 'java') warmupPyodide(); }, [language]);

  const push = useCallback((type, text) => {
    if (text === '' && type === 'out') return;
    setLines((prev) => [...prev, { id: idOf(), type, text }]);
  }, []);

  // Apply one runner result: render only the newly-produced stdout, then
  // either prompt for input again or mark the program finished.
  const applyResult = useCallback((data) => {
    const full = data.output ?? '';
    const delta = full.slice(shownRef.current);
    shownRef.current = full.length;

    if (delta) {
      const isErr = /(^|\n)Error:\n/.test(delta);
      push(isErr ? 'err' : 'out', delta);
    }

    if (data.needs_input) {
      setWaiting(true);
    } else {
      setWaiting(false);
      push('sys', '↳ program finished');
    }
  }, [push]);

  const callRunner = useCallback(async () => {
    setRunning(true);
    try {
      const stdin = stdinRef.current.length
        ? stdinRef.current.join('\n') + '\n'
        : '';
      const res = await compilerService.run(languageRef.current, codeRef.current, stdin);
      applyResult(res.data);
    } catch {
      setWaiting(false);
      push('err', '⚠ Could not reach the runner. Check your connection and try again.');
    } finally {
      setRunning(false);
    }
  }, [applyResult, push]);

  // Start a fresh run of `code`.
  const run = useCallback((code) => {
    codeRef.current = code ?? '';
    stdinRef.current = [];
    shownRef.current = 0;
    setWaiting(false);
    // On Python's very first run the runtime may still be downloading — say so.
    const booting = languageRef.current !== 'java' && !isPyodideReady();
    setLines(booting
      ? [{ id: idOf(), type: 'sys', text: 'Booting the Python runtime (one-time download)…' }]
      : []);
    callRunner();
  }, [callRunner]);

  // The learner typed a line while the program was waiting for input.
  const submitInput = useCallback((text) => {
    if (!waiting || running) return;
    push('in', text);
    stdinRef.current = [...stdinRef.current, text];
    setWaiting(false);
    callRunner();
  }, [waiting, running, push, callRunner]);

  const reset = useCallback(() => {
    stdinRef.current = [];
    shownRef.current = 0;
    setLines([]);
    setWaiting(false);
    setRunning(false);
  }, []);

  return { lines, running, waiting, run, submitInput, reset };
}
