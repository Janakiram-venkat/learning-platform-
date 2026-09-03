// Game runtime: Pyodide + an OffscreenCanvas, both living in this worker.
//
// The student's program runs to completion (it defines sprites and an
// every_frame function, then calls game.start()). Only THEN do we start a
// requestAnimationFrame loop here in JS, calling back into Python's _tick()
// once per frame and painting the snapshot it returns. Python never loops, so
// it never blocks — and a runaway loop inside their own update function is
// still killable by terminating the worker.
import { loadPyodide } from 'https://cdn.jsdelivr.net/pyodide/v0.28.0/full/pyodide.mjs';
import STAGE_SOURCE from '../game/stage.py?raw';

const INDEX_URL = 'https://cdn.jsdelivr.net/pyodide/v0.28.0/full/';
const MAX_HEADLESS_FRAMES = 2000;

let pyodidePromise = null;
let canvas = null;
let ctx = null;
let stage = null;      // the Python `stage` module proxy
let rafId = null;
let heldKeys = new Set();
let lastSnapshot = null;

function getPyodide() {
  if (!pyodidePromise) {
    pyodidePromise = loadPyodide({ indexURL: INDEX_URL }).then(async (py) => {
      // Install the house library on Pyodide's filesystem so `import stage`
      // and `from stage import ...` both work in student code.
      py.FS.writeFile('/home/pyodide/stage.py', STAGE_SOURCE, { encoding: 'utf8' });
      stage = py.pyimport('stage');
      return py;
    });
  }
  return pyodidePromise;
}

// Strip Pyodide's internal frames so a learner sees only their own code, and
// translate the two mistakes they will actually hit into plain language.
function friendlyError(msg) {
  const raw = String(msg);
  const lines = raw.split('\n');
  const firstUser = lines.findIndex((l) => l.includes('File "<exec>"'));
  const header = lines[0].startsWith('Traceback') ? lines[0] + '\n' : '';
  let text = firstUser === -1 ? raw : header + lines.slice(firstUser).join('\n');
  text = text.replace(/"<exec>"/g, '"your game"').trim();

  if (/NameError: name 'Game'/.test(text)) {
    return 'It looks like the first line is missing. Every game starts with:\n\nfrom stage import Game, Sprite';
  }
  if (/AttributeError: 'NoneType'/.test(text)) {
    return `${text}\n\nTip: make your Game(...) before you make any sprites.`;
  }
  return text;
}

function stopLoop() {
  if (rafId != null) {
    (self.cancelAnimationFrame || clearTimeout)(rafId);
    rafId = null;
  }
}

// --- rendering -------------------------------------------------------------

function paint(snap) {
  if (!ctx || !snap) return;
  const { width, height, background, things } = snap;
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  ctx.fillStyle = background || '#0B1020';
  ctx.fillRect(0, 0, width, height);

  for (const t of things) {
    if (t.kind === 'emoji') {
      // A colour emoji paints its own colours, but a Sprite whose look is
      // ordinary text ("cat", "1UP") is drawn in fillStyle — so it MUST be set
      // here. Left unset it inherits whatever was used last, which is the
      // background fill above: text drawn in the background colour, invisible.
      ctx.fillStyle = t.color || '#FFFFFF';
      ctx.font = `${t.size}px system-ui, "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      // scale_x/scale_y stretch or squash the sprite (squash-and-stretch
      // juice). Translate to its centre first so the scale grows from the
      // middle of the sprite, not from the canvas origin.
      const sx = t.scale_x ?? 1;
      const sy = t.scale_y ?? 1;
      if (sx !== 1 || sy !== 1) {
        ctx.save();
        ctx.translate(t.x, t.y);
        ctx.scale(sx, sy);
        ctx.fillText(t.look, 0, 0);
        ctx.restore();
      } else {
        ctx.fillText(t.look, t.x, t.y);
      }
    } else if (t.kind === 'box') {
      ctx.fillStyle = t.color;
      ctx.fillRect(t.x, t.y, t.width, t.height);
    } else if (t.kind === 'ball') {
      ctx.fillStyle = t.color;
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
      ctx.fill();
    } else if (t.kind === 'text') {
      ctx.fillStyle = t.color;
      ctx.font = `bold ${t.size}px system-ui, sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(t.words, t.x, t.y);
    }
  }
}

// --- running ---------------------------------------------------------------

// Execute the student's program once. Returns { ok, output, error, started }.
async function execProgram(py, code) {
  stage._reset();
  let out = '';
  const decoder = new TextDecoder('utf-8');
  py.setStdout({ write: (buf) => { out += decoder.decode(buf, { stream: true }); return buf.length; } });
  py.setStderr({ write: (buf) => buf.length });
  py.setStdin({ stdin: () => null });

  const builtins = py.pyimport('builtins');
  const ns = builtins.dict();
  ns.set('__name__', '__main__');
  let error = '';
  try {
    await py.runPythonAsync(code, { globals: ns });
  } catch (err) {
    error = friendlyError(err && err.message ? err.message : err);
  } finally {
    ns.destroy();
    builtins.destroy();
  }
  return { ok: !error, output: out, error, started: stage._started() };
}

function frameStep() {
  let snapJson;
  try {
    snapJson = stage._tick_json(JSON.stringify([...heldKeys]));
  } catch (err) {
    stopLoop();
    self.postMessage({ type: 'error', error: friendlyError(err && err.message ? err.message : err) });
    return;
  }
  if (snapJson === 'null') { stopLoop(); return; }
  const snap = JSON.parse(snapJson);
  lastSnapshot = snap;
  paint(snap);
  if (snap.over) {
    stopLoop();
    self.postMessage({ type: 'over', frame: snap.frame });
    return;
  }
  schedule();
}

function schedule() {
  rafId = self.requestAnimationFrame
    ? self.requestAnimationFrame(frameStep)
    : setTimeout(frameStep, 16);
}

// Run the program with no rendering for `frames` ticks, recording where every
// thing was on each tick. This trace is what the behaviour checks grade.
async function runHeadless(py, code, frames, keys) {
  const res = await execProgram(py, code);
  if (!res.ok) return { ...res, trace: [] };

  const total = Math.min(frames || 60, MAX_HEADLESS_FRAMES);
  const trace = [];
  let stageW = 0;
  let stageH = 0;
  try {
    for (let f = 0; f < total; f++) {
      // `keys` maps a frame number to the keys held down at that moment, so a
      // check can drive the player character (e.g. "hold left for 30 frames").
      const held = keys && keys[f] ? keys[f] : (keys && keys['*']) || [];
      const snapJson = stage._tick_json(JSON.stringify(held));
      if (snapJson === 'null') break;
      const snap = JSON.parse(snapJson);
      stageW = snap.width;
      stageH = snap.height;
      trace.push({ frame: snap.frame, over: snap.over, all: snap.all, shaking: !!snap.shaking });
      if (snap.over) break;
    }
  } catch (err) {
    return { ok: false, output: res.output, error: friendlyError(err && err.message ? err.message : err), trace, stageW, stageH };
  }
  return { ok: true, output: res.output, error: '', trace, stageW, stageH };
}

// --- messages --------------------------------------------------------------

self.onmessage = async (e) => {
  const { id, type } = e.data;

  if (type === 'canvas') {
    canvas = e.data.canvas;
    ctx = canvas.getContext('2d');
    return;
  }

  if (type === 'keys') {
    heldKeys = new Set(e.data.keys);
    return;
  }

  if (type === 'stop') {
    stopLoop();
    return;
  }

  if (type === 'warmup') {
    try { await getPyodide(); self.postMessage({ id, type: 'ready' }); }
    catch (err) { self.postMessage({ id, type: 'error', error: String(err) }); }
    return;
  }

  if (type === 'run') {
    stopLoop();
    let py;
    try { py = await getPyodide(); }
    catch { self.postMessage({ id, type: 'result', error: 'Could not load the Python runtime.' }); return; }

    const res = await execProgram(py, e.data.code);
    if (!res.ok) {
      self.postMessage({ id, type: 'result', output: res.output, error: res.error });
      return;
    }
    if (!res.started) {
      self.postMessage({
        id, type: 'result', output: res.output,
        error: 'Your game never started. Add game.start() as the last line.',
      });
      return;
    }
    // Paint frame zero immediately so a still scene (no every_frame) shows up.
    const snapJson = stage._snapshot_json();
    if (snapJson !== 'null') { lastSnapshot = JSON.parse(snapJson); paint(lastSnapshot); }
    self.postMessage({ id, type: 'result', output: res.output, error: '' });
    // A scene with no every_frame is already finished — it is on screen and
    // nothing can ever change it. Say so, rather than spinning a frame loop
    // that leaves the UI stuck showing "Stop" for a picture.
    if (stage._is_animated()) schedule();
    else self.postMessage({ type: 'over', frame: 0 });
    return;
  }

  if (type === 'check') {
    stopLoop();
    let py;
    try { py = await getPyodide(); }
    catch { self.postMessage({ id, type: 'trace', error: 'Could not load the Python runtime.' }); return; }
    const res = await runHeadless(py, e.data.code, e.data.frames, e.data.keys);
    self.postMessage({ id, type: 'trace', ...res });
    return;
  }
};
