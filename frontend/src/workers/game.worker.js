// Game runtime: Pyodide + an OffscreenCanvas, both living in this worker.
//
// The student's program runs to completion (it defines sprites and an
// every_frame function, then calls game.start()). Only THEN do we start a
// requestAnimationFrame loop here in JS, calling back into Python's
// _step_json() once per frame and painting the snapshot it returns. Python never loops, so
// it never blocks — and a runaway loop inside their own update function is
// still killable by terminating the worker.
import { loadPyodide } from 'https://cdn.jsdelivr.net/pyodide/v0.28.0/full/pyodide.mjs';
import STAGE_SOURCE from '../game/stage.py?raw';

const INDEX_URL = 'https://cdn.jsdelivr.net/pyodide/v0.28.0/full/';
const MAX_HEADLESS_FRAMES = 2000;

// The live game advances in fixed 1/60 s steps whatever the screen's refresh
// rate, so a game plays at the same speed on a 60Hz and a 120Hz laptop.
const STEP_MS = 1000 / 60;
// A slow frame (or a tab coming back into view) owes a burst of updates. Cap
// the catch-up so the game doesn't fast-forward; the rest of the debt is dropped.
const MAX_STEPS_PER_FRAME = 4;
// How often the loop tells the page it's still alive (and flushes prints). The
// page treats a long silence as a frozen game — see gameRuntime.js.
const BEAT_MS = 250;
// Output from print() inside every_frame is capped per flush, so a game that
// prints every frame can't flood the page.
const MAX_OUTPUT_FLUSH = 4000;

let pyodidePromise = null;
let canvas = null;
let ctx = null;
let stage = null;      // the Python `stage` module proxy
let rafId = null;
let heldKeys = new Set();
let lastSnapshot = null;
// The pointer, as fractions of the screen (0..1) — the page doesn't know the
// stage's size, so it's turned into stage pixels here, per frame. Clicks queue
// up until the next update so a quick tap between frames still counts.
let pointer = null;        // { x, y } or null until it first moves over the stage
let pointerDown = false;
let pendingClicks = [];

// Where Python's stdout goes right now: the setup run's buffer while the
// program runs, then the live buffer while the game loop runs, then nowhere.
let stdoutSink = null;
let liveOutput = '';
let lastTime = null;
let debt = 0;
let lastBeat = 0;

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
  stdoutSink = null;
}

// Send any prints from the game loop to the page, along with the heartbeat.
function beat(now) {
  lastBeat = now;
  let text;
  if (liveOutput) {
    text = liveOutput.length > MAX_OUTPUT_FLUSH ? liveOutput.slice(-MAX_OUTPUT_FLUSH) : liveOutput;
    liveOutput = '';
  }
  self.postMessage({ type: 'alive', output: text });
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
      // juice) and angle spins it. Translate to its centre first so both
      // happen around the middle of the sprite, not the canvas origin.
      const sx = t.scale_x ?? 1;
      const sy = t.scale_y ?? 1;
      const angle = t.angle || 0;
      if (sx !== 1 || sy !== 1 || angle) {
        ctx.save();
        ctx.translate(t.x, t.y);
        // Turn first, then stretch, so a squash always runs along the
        // sprite's own body rather than the screen's axes.
        if (angle) ctx.rotate((angle * Math.PI) / 180);
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
  stdoutSink = (text) => { out += text; };
  liveOutput = '';
  py.setStdout({
    write: (buf) => {
      if (stdoutSink) stdoutSink(decoder.decode(buf, { stream: true }));
      return buf.length;
    },
  });
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
  // Setup is over. Prints from here on come from inside every_frame.
  stdoutSink = null;
  return { ok: !error, output: out, error, started: stage._started() };
}

// The mouse as Python wants it: stage pixels, plus the clicks since last time.
// Takes the queued clicks, so call it only when an update will actually run.
function takeMouse() {
  const w = lastSnapshot?.width || 0;
  const h = lastSnapshot?.height || 0;
  const px = (p) => [Math.round(p.x * w), Math.round(p.y * h)];
  const mouse = {
    x: pointer ? px(pointer)[0] : null,
    y: pointer ? px(pointer)[1] : null,
    down: pointerDown,
    clicks: pendingClicks.map(px),
  };
  pendingClicks = [];
  return mouse;
}

function sendSounds(snap) {
  if (snap?.sounds?.length) self.postMessage({ type: 'sound', names: snap.sounds });
}

function frameStep(timestamp) {
  const now = typeof timestamp === 'number' ? timestamp : performance.now();
  if (lastTime == null) lastTime = now - STEP_MS; // the first frame always updates
  debt += now - lastTime;
  lastTime = now;

  const steps = Math.min(Math.floor(debt / STEP_MS), MAX_STEPS_PER_FRAME);
  // Anything beyond the cap is forgiven rather than carried into a burst later.
  debt = steps === MAX_STEPS_PER_FRAME ? 0 : debt - steps * STEP_MS;

  if (steps > 0) {
    let snapJson;
    try {
      snapJson = stage._step_json(JSON.stringify([...heldKeys]), steps, JSON.stringify(takeMouse()));
    } catch (err) {
      stopLoop();
      self.postMessage({ type: 'error', error: friendlyError(err && err.message ? err.message : err) });
      return;
    }
    if (snapJson === 'null') { stopLoop(); return; }
    const snap = JSON.parse(snapJson);
    lastSnapshot = snap;
    paint(snap);
    sendSounds(snap);
    if (snap.over) {
      beat(now); // flush the last prints before saying goodbye
      stopLoop();
      self.postMessage({ type: 'over', frame: snap.frame });
      return;
    }
  }
  if (now - lastBeat >= BEAT_MS) beat(now);
  schedule();
}

function schedule() {
  rafId = self.requestAnimationFrame
    ? self.requestAnimationFrame(frameStep)
    : setTimeout(frameStep, 16);
}

function startLoop() {
  lastTime = null;
  debt = 0;
  lastBeat = performance.now();
  liveOutput = '';
  stdoutSink = (text) => { liveOutput += text; };
  schedule();
}

// A check scenario can drive the mouse too, in stage pixels:
//   mouse:  { "*": [x, y], "40": [x, y] }   where the pointer sits (from that frame on)
//   clicks: { "30": [x, y] }                 a click on that frame
function headlessMouse(f, mouse, clicks, state) {
  if (!mouse && !clicks) return null;
  const at = mouse && (mouse[f] || (f === 0 && mouse['*']));
  if (at) state.pos = at;
  const click = clicks && clicks[f];
  return {
    x: state.pos ? state.pos[0] : null,
    y: state.pos ? state.pos[1] : null,
    down: !!click,
    clicks: click ? [click] : [],
  };
}

// Run the program with no rendering for `frames` ticks, recording where every
// thing was on each tick. This trace is what the behaviour checks grade.
async function runHeadless(py, code, frames, keys, mouse, clicks) {
  const res = await execProgram(py, code);
  if (!res.ok) return { ...res, trace: [] };

  const total = Math.min(frames || 60, MAX_HEADLESS_FRAMES);
  const trace = [];
  let stageW = 0;
  let stageH = 0;
  const mouseState = { pos: null };
  try {
    for (let f = 0; f < total; f++) {
      // `keys` maps a frame number to the keys held down at that moment, so a
      // check can drive the player character (e.g. "hold left for 30 frames").
      const held = keys && keys[f] ? keys[f] : (keys && keys['*']) || [];
      const m = headlessMouse(f, mouse, clicks, mouseState);
      const snapJson = stage._tick_json(JSON.stringify(held), JSON.stringify(m));
      if (snapJson === 'null') break;
      const snap = JSON.parse(snapJson);
      stageW = snap.width;
      stageH = snap.height;
      trace.push({
        frame: snap.frame, over: snap.over, all: snap.all, shaking: !!snap.shaking, sounds: snap.sounds || [],
      });
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

  // The pointer moved, or its button went down or up. x/y are 0..1 across the
  // screen; `click` marks the press itself.
  if (type === 'mouse') {
    if (e.data.x != null) pointer = { x: e.data.x, y: e.data.y };
    pointerDown = !!e.data.down;
    if (e.data.click && pointer) pendingClicks.push(pointer);
    return;
  }

  if (type === 'stop') {
    stopLoop();
    // Tells the page's freeze watchdog the loop ended cleanly.
    self.postMessage({ type: 'stopped' });
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
    if (snapJson !== 'null') { lastSnapshot = JSON.parse(snapJson); paint(lastSnapshot); sendSounds(lastSnapshot); }
    // A click made before this run (e.g. on the last game) must not count.
    pendingClicks = [];
    // The stage's real size, so the page can give the screen the right shape.
    const size = lastSnapshot ? { width: lastSnapshot.width, height: lastSnapshot.height } : null;
    const animated = stage._is_animated();
    self.postMessage({ id, type: 'result', output: res.output, error: '', size, animated });
    // A scene with no every_frame is already finished — it is on screen and
    // nothing can ever change it. Say so, rather than spinning a frame loop
    // that leaves the UI stuck showing "Stop" for a picture.
    if (animated) startLoop();
    else self.postMessage({ type: 'over', frame: 0 });
    return;
  }

  if (type === 'check') {
    stopLoop();
    let py;
    try { py = await getPyodide(); }
    catch { self.postMessage({ id, type: 'trace', error: 'Could not load the Python runtime.' }); return; }
    const res = await runHeadless(py, e.data.code, e.data.frames, e.data.keys, e.data.mouse, e.data.clicks);
    self.postMessage({ id, type: 'trace', ...res });
    return;
  }
};
