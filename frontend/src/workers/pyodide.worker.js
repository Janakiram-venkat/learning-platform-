// Pyodide runs inside this Web Worker so a heavy program (or the ~10MB runtime
// download) never freezes the UI, and an infinite loop can be killed by
// terminating the worker from the main thread. Loaded as an ESM module worker.
import { loadPyodide } from 'https://cdn.jsdelivr.net/pyodide/v0.28.0/full/pyodide.mjs';

const INDEX_URL = 'https://cdn.jsdelivr.net/pyodide/v0.28.0/full/';
const MAX_LOAD_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1500;

let pyodidePromise = null;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadWithRetry() {
  let lastError;
  for (let attempt = 1; attempt <= MAX_LOAD_ATTEMPTS; attempt++) {
    try {
      return await loadPyodide({ indexURL: INDEX_URL });
    } catch (err) {
      lastError = err;
      if (attempt < MAX_LOAD_ATTEMPTS) {
        await sleep(RETRY_DELAY_MS * attempt); // back-off: 1.5s, 3s
      }
    }
  }
  throw new Error(
    `Python runtime failed to load after ${MAX_LOAD_ATTEMPTS} attempts. ` +
    `Check your internet connection and try refreshing the page. (${lastError})`
  );
}

function getPyodide() {
  if (!pyodidePromise) {
    pyodidePromise = loadWithRetry();
  }
  return pyodidePromise;
}

// Strip Pyodide's internal runner/compile frames so learners see only frames
// from their own code. Those internals always sit between the "Traceback…"
// header and the first frame in the user's code ("<exec>"), so we keep the
// header plus everything from that first user frame onward.
function cleanTraceback(msg) {
  const raw = String(msg);
  const lines = raw.split('\n');
  const firstUser = lines.findIndex((l) => l.includes('File "<exec>"'));
  let result;
  if (firstUser === -1) {
    result = raw;
  } else {
    const header = lines[0].startsWith('Traceback') ? lines[0] + '\n' : '';
    result = header + lines.slice(firstUser).join('\n');
  }
  return result.replace(/"<exec>"/g, '"your code"').trim();
}

self.onmessage = async (e) => {
  const { id, type, code, stdin } = e.data;

  if (type === 'warmup') {
    try {
      await getPyodide();
      self.postMessage({ id, ready: true });
    } catch (err) {
      self.postMessage({ id, error: String(err) });
    }
    return;
  }

  if (type !== 'run') return;

  let pyodide;
  try {
    pyodide = await getPyodide();
  } catch (err) {
    self.postMessage({
      id,
      result: {
        output: `⚠️ ${String(err)}`,
        needs_input: false,
      },
    });
    return;
  }

  // Feed stdin line by line; return null once exhausted so input() raises
  // EOFError — that's our "waiting for input" signal (same as the old backend).
  const parts = stdin ? stdin.split('\n') : [];
  let idx = 0;
  pyodide.setStdin({
    stdin: () => {
      if (idx >= parts.length) return null;
      const line = parts[idx++];
      // A trailing '' from a stdin that ends in '\n' is the sentinel, not input.
      if (idx === parts.length && line === '') return null;
      return line + '\n';
    },
  });

  // Capture stdout (including un-terminated input() prompts) via write().
  let out = '';
  const decoder = new TextDecoder('utf-8');
  pyodide.setStdout({ write: (buf) => { out += decoder.decode(buf, { stream: true }); return buf.length; } });
  pyodide.setStderr({ write: (buf) => buf.length }); // tracebacks come from the exception

  const builtins = pyodide.pyimport('builtins');
  const ns = builtins.dict();
  ns.set('__name__', '__main__');

  let needsInput = false;
  let errorText = '';
  try {
    await pyodide.runPythonAsync(code, { globals: ns });
  } catch (err) {
    const msg = String(err && err.message ? err.message : err);
    if (/\bEOFError\b/.test(msg)) needsInput = true;      // program is waiting for input
    else errorText = cleanTraceback(msg);
  } finally {
    ns.destroy();
    builtins.destroy();
  }

  let output = out;
  if (errorText) {
    const prefix = out ? out + (out.endsWith('\n') ? '' : '\n') : '';
    output = `${prefix}Error:\n${errorText}`;
  }
  self.postMessage({ id, result: { output, needs_input: needsInput } });
};
