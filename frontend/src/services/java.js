// Java execution, the counterpart to `pyodide.js`. Python runs in a Web Worker
// in the browser; Java can't, so it goes to the API's /run-java (see
// backend/app/services/java_runner.py for why and what runs it).
//
// Exposes runJava(code, stdin) returning the SAME result shape as the Python
// path - { output, needs_input } - so useCodeRunner and the Terminal treat both
// languages identically.

import { api } from './api';

export function isJavaReady() {
  // Nothing to download: the compiler lives on the server, so the first Run is
  // no slower than any later one. Kept so callers can ask both runners this.
  return true;
}

export function warmupJava() {
  return Promise.resolve({ ready: true });
}

export async function runJava(code, stdin = '') {
  try {
    const res = await api.post('/run-java', { code, stdin });
    return res.data.data;
  } catch (err) {
    // A 502 carries the runner's own explanation (unreachable, busy, no JDK);
    // anything else is ours to phrase.
    const detail = err?.response?.data?.detail;
    const message = detail || 'Could not reach the Java runner. Check your connection and try again.';
    return { output: `Error:\n${message}`, needs_input: false };
  }
}
