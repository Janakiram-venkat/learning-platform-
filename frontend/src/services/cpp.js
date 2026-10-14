// C++ execution: like Java, it compiles on the server rather than in the
// browser, so it goes to the API's /run-cpp (see
// backend/app/services/cpp_runner.py for how a read past the end of input is
// turned into `needs_input`).
//
// Exposes runCpp(code, stdin) returning the same { output, needs_input } shape
// as the Python and Java paths, so useCodeRunner treats all three alike.

import { api } from './api';

export async function runCpp(code, stdin = '') {
  try {
    const res = await api.post('/run-cpp', { code, stdin });
    return res.data.data;
  } catch (err) {
    // A 502 carries the runner's own explanation (unreachable, busy, no g++);
    // anything else is ours to phrase.
    const detail = err?.response?.data?.detail;
    const message = detail || 'Could not reach the C++ runner. Check your connection and try again.';
    return { output: `Error:\n${message}`, needs_input: false };
  }
}
