// Main-thread side of the game runtime. Owns the worker, hands it the
// OffscreenCanvas, forwards key state, and grades behaviour checks.

// Running a program should never take this long. Booting Python legitimately
// can, so the two get separate budgets — see runGame/checkGame, which wait for
// the boot BEFORE starting the run clock. Charging boot time to the run clock
// is how a slow connection turns into a bogus "endless loop" error.
const RUN_TIMEOUT_MS = 15000;
const BOOT_TIMEOUT_MS = 60000;

let worker = null;
let seq = 0;
let attachedTo = null;   // the <canvas> element whose control we transferred
let ready = false;
let warmed = null;
const pending = new Map();
const listeners = new Set();
const statusListeners = new Set();

function setReady(value) {
  if (ready === value) return;
  ready = value;
  for (const fn of statusListeners) fn(ready);
}

function ensureWorker() {
  if (worker) return worker;
  // The `new URL(...)` must sit directly inside `new Worker(...)` for Vite to
  // bundle the worker as its own chunk.
  worker = new Worker(new URL('../workers/game.worker.js', import.meta.url), { type: 'module' });
  worker.onmessage = (e) => {
    const { id, type } = e.data;
    // Unsolicited events (the game ended, a crash mid-loop) go to subscribers.
    if (id == null) {
      for (const fn of listeners) fn(e.data);
      return;
    }
    const resolve = pending.get(id);
    if (!resolve) return;
    pending.delete(id);
    if (type === 'ready') setReady(true);
    resolve(e.data);
  };
  return worker;
}

function killWorker() {
  if (worker) { worker.terminate(); worker = null; }
  setReady(false);
  warmed = null;
  attachedTo = null;
  pending.clear();
}

function post(message, timeoutMs = RUN_TIMEOUT_MS) {
  return new Promise((resolve) => {
    const w = ensureWorker();
    const id = ++seq;
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      pending.delete(id);
      killWorker();
      resolve({ type: 'result', error: 'Your game took too long to respond. Check for a loop that never ends.' });
    }, timeoutMs);
    pending.set(id, (val) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(val);
    });
    w.postMessage({ ...message, id });
  });
}

export function isGameRuntimeReady() {
  return ready;
}

export function onGameEvent(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Fires with `true` once Python is loaded, and `false` whenever the runtime is
// torn down and has to boot again — so the UI can be honest about the wait.
export function onRuntimeStatus(fn) {
  statusListeners.add(fn);
  return () => statusListeners.delete(fn);
}

// A canvas can only be transferred once, so a remounted element needs a fresh
// worker. Returns true when the canvas is now under worker control.
export function attachCanvas(el) {
  if (!el || attachedTo === el) return true;
  if (attachedTo) killWorker();   // previous element is gone — start over
  const w = ensureWorker();
  const offscreen = el.transferControlToOffscreen();
  w.postMessage({ type: 'canvas', canvas: offscreen }, [offscreen]);
  attachedTo = el;
  // Whether this is the first canvas or a replacement for a torn-down one,
  // start loading Python immediately rather than waiting for the first Play.
  warmupGameRuntime();
  return true;
}

export function warmupGameRuntime() {
  if (!warmed) {
    warmed = post({ type: 'warmup' }, BOOT_TIMEOUT_MS).then((res) => {
      const ok = res?.type === 'ready';
      // A boot that failed or timed out must not be remembered as done, or
      // every later run would skip the wait and fail against the run clock.
      if (ok) setReady(true);
      else warmed = null;
      return ok;
    });
  }
  return warmed;
}

export async function runGame(code) {
  await warmupGameRuntime();
  return post({ type: 'run', code });
}

export function stopGame() {
  if (worker) worker.postMessage({ type: 'stop' });
}

export function setKeys(keys) {
  if (worker) worker.postMessage({ type: 'keys', keys });
}

// ---------------------------------------------------------------------------
// Behaviour checks.
//
// A step is complete when the GAME BEHAVES, not when its source matches a
// template. We run the program headless for N frames, recording where every
// thing sat on every frame, then evaluate rules against that trace. Any
// correct solution passes, however the student wrote it.
// ---------------------------------------------------------------------------

// Pull one thing's position history out of a trace. `name` may be omitted to
// mean "whichever thing best satisfies the rule".
function seriesFor(trace, name, kind) {
  const names = new Set();
  for (const f of trace) {
    for (const t of f.all) {
      if (name && t.name !== name) continue;
      if (kind && t.kind !== kind) continue;
      names.add(t.name ?? `#${f.all.indexOf(t)}`);
    }
  }
  const out = [];
  for (const key of names) {
    const pts = [];
    for (const f of trace) {
      const idx = key.startsWith('#') ? Number(key.slice(1)) : null;
      const t = idx != null ? f.all[idx] : f.all.find((x) => x.name === key);
      if (t) pts.push({ x: t.x, y: t.y, frame: f.frame });
    }
    if (pts.length) out.push({ key, pts });
  }
  return out;
}

const RULES = {
  // At least `count` things exist (optionally of a kind, e.g. "Sprite").
  exists: (rule, ctx) => {
    const want = rule.count ?? 1;
    return ctx.trace.some((f) =>
      f.all.filter((t) => (!rule.kind || t.kind === rule.kind) && (!rule.name || t.name === rule.name)).length >= want
    );
  },
  // Something travels at least `distance` px along an axis.
  moves: (rule, ctx) => {
    const axis = rule.axis || 'x';
    const min = rule.distance ?? 20;
    return seriesFor(ctx.trace, rule.name, rule.kind).some(({ pts }) => {
      const vals = pts.map((p) => p[axis]);
      return Math.max(...vals) - Math.min(...vals) >= min;
    });
  },
  // Something stays perfectly still on an axis (used for "don't move it yet").
  still: (rule, ctx) => seriesFor(ctx.trace, rule.name, rule.kind).some(({ pts }) => {
    const axis = rule.axis || 'x';
    const vals = pts.map((p) => p[axis]);
    return Math.max(...vals) - Math.min(...vals) < 1;
  }),
  // Direction along an axis flips at least `times` — i.e. it bounces.
  bounces: (rule, ctx) => {
    const axis = rule.axis || 'x';
    const times = rule.times ?? 1;
    return seriesFor(ctx.trace, rule.name, rule.kind).some(({ pts }) => {
      let flips = 0;
      let dir = 0;
      for (let i = 1; i < pts.length; i++) {
        const d = Math.sign(pts[i][axis] - pts[i - 1][axis]);
        if (d === 0) continue;
        if (dir !== 0 && d !== dir) flips++;
        dir = d;
      }
      return flips >= times;
    });
  },
  // Nothing ever leaves the stage (with a little slack).
  stays_inside: (rule, ctx) => {
    const pad = rule.slack ?? 4;
    return seriesFor(ctx.trace, rule.name, rule.kind).some(({ pts }) =>
      pts.every((p) => p.x >= -pad && p.x <= ctx.stageW + pad && p.y >= -pad && p.y <= ctx.stageH + pad)
    );
  },
  // Something sits inside a region of the stage for the whole run.
  in_area: (rule, ctx) => seriesFor(ctx.trace, rule.name, rule.kind).some(({ pts }) =>
    pts.every((p) => p.x >= rule.x1 && p.x <= rule.x2 && p.y >= rule.y1 && p.y <= rule.y2)
  ),
  // A thing jumps back to the start while it is still ABOVE `y` — i.e. it was
  // caught partway down rather than reaching the floor. This is how "the catch
  // actually works" is graded: without collision code the only reset happens at
  // the very bottom, so nothing ever resets early.
  reset_above: (rule, ctx) => {
    const axis = rule.axis || 'y';
    const limit = rule.y ?? 300;
    const jump = rule.jump ?? 50;
    return seriesFor(ctx.trace, rule.name, rule.kind).some(({ pts }) => {
      for (let i = 1; i < pts.length; i++) {
        const before = pts[i - 1][axis];
        const after = pts[i][axis];
        if (before - after > jump && before < limit) return true;
      }
      return false;
    });
  },
  // Something's LAST position on the trace sits inside a region — for
  // checks that only care where a thing settles, not its path getting there.
  ends_in_area: (rule, ctx) => seriesFor(ctx.trace, rule.name, rule.kind).some(({ pts }) => {
    const last = pts[pts.length - 1];
    return last.x >= rule.x1 && last.x <= rule.x2 && last.y >= rule.y1 && last.y <= rule.y2;
  }),
  // Some Text on stage changes its words during the run — a live score.
  text_changes: (rule, ctx) => {
    const words = new Map(); // name/index -> set of distinct strings seen
    for (const f of ctx.trace) {
      f.all.forEach((t, i) => {
        if (t.kind !== 'Text') return;
        if (rule.name && t.name !== rule.name) return;
        const key = t.name ?? `#${i}`;
        if (!words.has(key)) words.set(key, new Set());
        words.get(key).add(String(t.words));
      });
    }
    return [...words.values()].some((set) => set.size > 1);
  },
  // The number of things on stage drops — something got removed/caught.
  count_drops: (rule, ctx) => {
    const counts = ctx.trace.map((f) => f.all.filter((t) => !rule.kind || t.kind === rule.kind).length);
    return Math.min(...counts) < Math.max(...counts);
  },
  // game.stop() was reached.
  game_over: (_rule, ctx) => ctx.trace.some((f) => f.over),
  // A Sprite's scale_x/scale_y actually changes at some point — squash and
  // stretch really happening, not just sitting at 1.0 the whole run.
  scale_changes: (rule, ctx) => {
    const seen = new Map();
    for (const f of ctx.trace) {
      for (const t of f.all) {
        if (t.kind !== 'Sprite') continue;
        if (rule.name && t.name !== rule.name) continue;
        const key = t.name;
        if (!seen.has(key)) seen.set(key, new Set());
        seen.get(key).add(`${t.scale_x},${t.scale_y}`);
      }
    }
    return [...seen.values()].some((set) => set.size > 1);
  },
  // game.shake() ran at some point during the run.
  shakes: (_rule, ctx) => ctx.trace.some((f) => f.shaking),
};

// Compare two scenarios: something must end up in a different place when the
// keys are held than when they aren't. This is how "the arrow keys work" is
// graded without caring which key or which axis the student wired up.
function differsBetween(rule, byScenario) {
  const a = byScenario[rule.between?.[0]];
  const b = byScenario[rule.between?.[1]];
  if (!a?.trace?.length || !b?.trace?.length) return false;
  const lastA = a.trace[a.trace.length - 1].all;
  const lastB = b.trace[b.trace.length - 1].all;
  const min = Math.min(lastA.length, lastB.length);
  for (let i = 0; i < min; i++) {
    if (Math.abs(lastA[i].x - lastB[i].x) > 2 || Math.abs(lastA[i].y - lastB[i].y) > 2) return true;
  }
  return false;
}

export function scenariosFor(check) {
  return check.scenarios?.length
    ? check.scenarios
    : [{ name: 'default', frames: check.frames || 90, keys: check.keys || {} }];
}

// Grade a check's rules against already-collected scenario traces. Split out
// from checkGame so the course content can be verified against reference
// solutions without a browser.
export function gradeTrace(check, byScenario) {
  const first = scenariosFor(check)[0].name;
  return (check.rules || []).map((rule) => {
    const scenario = byScenario[rule.in] || byScenario[first];
    const ctx = { trace: scenario?.trace || [], stageW: scenario?.stageW, stageH: scenario?.stageH };
    let passed;
    try {
      passed = rule.what === 'differs'
        ? differsBetween(rule, byScenario)
        : Boolean(RULES[rule.what]?.(rule, ctx));
    } catch {
      // A malformed rule must never look like a pass.
      passed = false;
    }
    return { label: rule.label, passed };
  });
}

// Run every scenario a check needs, then grade its rules.
// Returns { ok, error, results: [{ label, passed }] }.
export async function checkGame(code, check) {
  await warmupGameRuntime();
  const byScenario = {};
  for (const s of scenariosFor(check)) {
    const res = await post({ type: 'check', code, frames: s.frames, keys: s.keys || {} });
    if (res.error) return { ok: false, error: res.error, results: [] };
    if (!res.trace?.length) {
      return { ok: false, error: 'Your game did not run for even one frame. Is game.start() the last line?', results: [] };
    }
    byScenario[s.name] = res;
  }
  return { ok: true, error: '', results: gradeTrace(check, byScenario) };
}
