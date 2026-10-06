// The sound pack behind game.play("coin").
//
// Every sound is synthesised on the spot with Web Audio — a couple of
// oscillators or a burst of noise with a quick fade — so there are no files to
// download or license. The names must match SOUNDS in stage.py.
//
// Audio has to live on the main thread (workers have no AudioContext), so the
// worker sends the names each frame played and this file makes the noise.

const MASTER_VOLUME = 0.25;
// A game that plays "coin" every frame would be a wall of noise. The same
// sound can't restart within this many ms, and only so many play at once.
const REPEAT_GAP_MS = 60;
const MAX_VOICES = 8;

let ac = null;
let master = null;
let noiseBuffer = null;
let voices = 0;
const lastPlayed = new Map();

function context() {
  if (ac) return ac;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  ac = new Ctx();
  master = ac.createGain();
  master.gain.value = MASTER_VOLUME;
  master.connect(ac.destination);
  return ac;
}

// Browsers only let a page make sound after the person has done something.
// Call this from the Play click (or Ctrl+Enter) so the first sound isn't lost.
export function unlockSounds() {
  const c = context();
  if (c && c.state === 'suspended') c.resume().catch(() => {});
}

function noise(c) {
  if (!noiseBuffer) {
    noiseBuffer = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  const src = c.createBufferSource();
  src.buffer = noiseBuffer;
  return src;
}

// One note: an oscillator sliding from `from` Hz to `to` Hz, fading out.
function tone(c, out, { type = 'square', from, to = from, at = 0, dur, vol = 1 }) {
  const t0 = c.currentTime + at;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t0);
  if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(gain).connect(out);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
  return t0 + dur;
}

// A burst of filtered noise — crashes, thuds and explosions.
function burst(c, out, { dur, freq, vol = 1 }) {
  const t0 = c.currentTime;
  const src = noise(c);
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(freq, t0);
  filter.frequency.exponentialRampToValueAtTime(40, t0 + dur);
  const gain = c.createGain();
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  src.connect(filter).connect(gain).connect(out);
  src.start(t0);
  src.stop(t0 + dur + 0.02);
  return t0 + dur;
}

// Each recipe returns the time its last note ends, so the voice can be freed.
const RECIPES = {
  coin: (c, o) => { tone(c, o, { from: 988, dur: 0.07, vol: 0.5 }); return tone(c, o, { from: 1319, at: 0.07, dur: 0.22, vol: 0.5 }); },
  jump: (c, o) => tone(c, o, { from: 300, to: 750, dur: 0.18, vol: 0.45 }),
  hit: (c, o) => { tone(c, o, { type: 'sawtooth', from: 220, to: 70, dur: 0.15, vol: 0.5 }); return burst(c, o, { dur: 0.12, freq: 2500, vol: 0.5 }); },
  boom: (c, o) => { tone(c, o, { type: 'sine', from: 120, to: 35, dur: 0.5, vol: 0.9 }); return burst(c, o, { dur: 0.6, freq: 1200, vol: 1 }); },
  laser: (c, o) => tone(c, o, { type: 'sawtooth', from: 1400, to: 180, dur: 0.16, vol: 0.35 }),
  powerup: (c, o) => {
    let end = 0;
    [523, 659, 784, 1047].forEach((f, i) => { end = tone(c, o, { from: f, at: i * 0.07, dur: 0.1, vol: 0.4 }); });
    return end;
  },
  win: (c, o) => {
    [523, 659, 784].forEach((f, i) => tone(c, o, { type: 'triangle', from: f, at: i * 0.12, dur: 0.14, vol: 0.7 }));
    return tone(c, o, { type: 'triangle', from: 1047, at: 0.36, dur: 0.45, vol: 0.7 });
  },
  lose: (c, o) => {
    [392, 330, 262].forEach((f, i) => tone(c, o, { type: 'triangle', from: f, at: i * 0.18, dur: 0.2, vol: 0.7 }));
    return tone(c, o, { type: 'triangle', from: 196, to: 150, at: 0.54, dur: 0.5, vol: 0.7 });
  },
  click: (c, o) => tone(c, o, { type: 'square', from: 1800, to: 900, dur: 0.03, vol: 0.3 }),
  pop: (c, o) => tone(c, o, { type: 'sine', from: 400, to: 1200, dur: 0.08, vol: 0.6 }),
};

export const SOUND_NAMES = Object.keys(RECIPES);

export function playSounds(names) {
  if (!names?.length) return;
  const c = context();
  if (!c || c.state !== 'running') return;
  const now = performance.now();
  for (const name of names) {
    const recipe = RECIPES[name];
    if (!recipe || voices >= MAX_VOICES) continue;
    if (now - (lastPlayed.get(name) ?? -Infinity) < REPEAT_GAP_MS) continue;
    lastPlayed.set(name, now);
    voices++;
    const end = recipe(c, master);
    setTimeout(() => { voices--; }, Math.max(0, (end - c.currentTime) * 1000) + 50);
  }
}
