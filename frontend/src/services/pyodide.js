// Client-side Python execution powered by Pyodide running in a Web Worker.
// Exposes runPythonInBrowser(code, stdin) with the SAME result shape the old
// backend returned — { output, needs_input } — so useCodeRunner and the Terminal
// keep working unchanged. A per-run timeout kills a frozen worker (infinite
// loops) since we can't otherwise interrupt sync Python on the main thread.

const RUN_TIMEOUT_MS = 10000;

let worker = null;
let seq = 0;
let ready = false;
let warmed = null;
const pending = new Map(); // id -> resolve fn

function ensureWorker() {
  if (worker) return worker;
  // The `new URL(...)` must sit directly inside `new Worker(...)` for Vite to
  // detect and bundle the worker as a separate chunk.
  worker = new Worker(new URL('../workers/pyodide.worker.js', import.meta.url), { type: 'module' });
  worker.onmessage = (e) => {
    const { id, result, ready: isReady, error } = e.data;
    const resolve = pending.get(id);
    if (!resolve) return;
    pending.delete(id);
    if (isReady) { ready = true; resolve({ ready: true }); return; }
    if (error) { resolve({ output: `Error: ${error}`, needs_input: false }); return; }
    if (result) { ready = true; resolve(result); }
  };
  return worker;
}

function killWorker(message) {
  if (worker) { worker.terminate(); worker = null; }
  ready = false;
  warmed = null;
  for (const resolve of pending.values()) resolve({ output: `Error: ${message}`, needs_input: false });
  pending.clear();
}

export function isPyodideReady() {
  return ready;
}

// Kick off the (large, one-time) runtime download early so the first Run is fast.
export function warmupPyodide() {
  if (!warmed) {
    warmed = new Promise((resolve) => {
      const id = ++seq;
      pending.set(id, resolve);
      ensureWorker().postMessage({ id, type: 'warmup' });
    });
  }
  return warmed;
}

export function runPythonInBrowser(code, stdin = '') {
  return new Promise((resolve) => {
    const w = ensureWorker();
    const id = ++seq;
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      pending.delete(id);
      // The worker is stuck (likely an infinite loop) — terminate and restart.
      killWorker('Execution timed out (over 10s). Check for an infinite loop.');
      resolve({ output: 'Error: Execution timed out (over 10s). Check for an infinite loop.', needs_input: false });
    }, RUN_TIMEOUT_MS);

    pending.set(id, (val) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(val);
    });
    w.postMessage({ id, type: 'run', code, stdin });
  });
}
