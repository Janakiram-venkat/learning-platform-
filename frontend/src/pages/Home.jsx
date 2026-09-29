import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowRight, Terminal, Bot, Rocket, Code2, Trophy,
  MousePointerClick, CheckCircle2, Wrench, Cpu, Power, Play, RotateCcw,
  Globe, Sparkles, Wand2,
} from 'lucide-react';
import logo from '../assets/pocketlab.png';

/* ---------------------------------------------------------------------------
   Pocket Lab — "Workbench" home page.
   Pocket Lab is a maker's bench for lots of subjects, not just coding: Python,
   AI, web, games, robots — and physics and chemistry on the way. The identity
   stays the electronics-kit workbench (silkscreened panels, graph paper, mono
   readouts). The signature is the interactive Pocket Lab device below; flip a
   switch and the same little machine boots a different subject.
--------------------------------------------------------------------------- */

// What the pocket device "runs" for each subject it's switched to. The screen
// is re-keyed on mode change so the power-on flicker replays. Four modes so
// the switch bank reads as a real multi-subject bench rather than a coding
// demo with a robot bolted on.
const MODES = {
  code: {
    tag: 'CODE',
    file: 'main.py',
    Icon: Terminal,
    accent: 'text-signal',
    led: '#FFB40A',
    screen: (
      <>
        <div className="text-white/35">$ run main.py</div>
        <div><span className="text-[#E86FE0]">def</span> <span className="text-led">greet</span><span className="text-white/80">(name):</span></div>
        <div className="pl-4"><span className="text-[#E86FE0]">return</span> <span className="text-signal">f"Hi {'{name}'}! 👋"</span></div>
        <div><span className="text-led">print</span><span className="text-white/80">(greet(</span><span className="text-signal">"Maker"</span><span className="text-white/80">))</span></div>
        <div className="mt-2 text-mint">→ Hi Maker! 👋</div>
      </>
    ),
  },
  ai: {
    tag: 'AI',
    file: 'vision.py',
    Icon: Cpu,
    accent: 'text-led',
    led: '#0097F8',
    screen: (
      <>
        <div className="text-white/35">$ classify photo.jpg</div>
        <div className="text-white/80">loading model<span className="text-white/40"> ......</span> <span className="text-mint">ok</span></div>
        <div className="text-white/80">scanning pixels <span className="text-led">▓▓▓▓▓▓▓▓</span> 100%</div>
        <div className="mt-2 text-mint">→ it's a CAT <span className="text-white/50">(0.98 sure)</span> 🐱</div>
      </>
    ),
  },
  web: {
    tag: 'WEB',
    file: 'index.html',
    Icon: Globe,
    accent: 'text-magenta',
    led: '#BD16BB',
    // The "screen" here isn't a terminal — it's a fake browser preview that
    // renders live under the code. Reinforces that web builds you something
    // you can see, unlike the other modes' terminal-first runs.
    screen: (
      <>
        <div className="text-white/35">$ open index.html</div>
        <div className="text-white/80">&lt;<span className="text-[#E86FE0]">h1</span>&gt;<span className="text-signal">Hello</span>&lt;/<span className="text-[#E86FE0]">h1</span>&gt;</div>
        <div className="text-white/80">&lt;<span className="text-[#E86FE0]">button</span>&gt;<span className="text-signal">Click me</span>&lt;/<span className="text-[#E86FE0]">button</span>&gt;</div>
        <div className="mt-2 rounded border border-white/15 bg-paper px-2 py-1.5 text-ink">
          <span className="font-lab text-sm font-extrabold">Hello</span>
          <span className="ml-2 inline-flex rounded border border-ink bg-signal px-1.5 py-0.5 text-[0.62rem] font-extrabold">Click me</span>
        </div>
      </>
    ),
  },
  robot: {
    tag: 'ROBOT',
    file: 'rover.py',
    Icon: Bot,
    accent: 'text-wire',
    led: '#E63C22',
    screen: (
      <>
        <div className="text-white/35">$ connect rover</div>
        <div className="text-white/80">link established <span className="text-mint">●</span></div>
        <div className="text-white/80"><span className="text-led">motor</span>.forward(<span className="text-signal">2s</span>)</div>
        <div className="text-white/80">sensor: wall @ <span className="text-wire">30cm</span></div>
        <div className="mt-2 text-mint">→ turning left… done 🦾</div>
      </>
    ),
  },
};

const MODE_ORDER = ['code', 'ai', 'web', 'robot'];

// The interactive Pocket Lab device — the page's signature element.
function PocketLabDevice() {
  const [mode, setMode] = useState('code');
  const active = MODES[mode];

  return (
    <div className="lab-panel-pcb w-full max-w-md p-4 sm:p-5">
      {/* Device top strip: brand plate + status LEDs */}
      <div className="mb-3 flex items-center justify-between">
        <span className="ref-tag rounded-md bg-ink px-2 py-1 text-signal">POCKET&nbsp;LAB · UNIT&nbsp;01</span>
        <div className="flex items-center gap-1.5">
          <span className="led led-pulse" style={{ color: '#FFB40A' }} />
          <span className="led" style={{ color: '#0097F8' }} />
          <span className="led" style={{ color: '#BD16BB' }} />
          <span className="led" style={{ color: '#E63C22' }} />
        </div>
      </div>

      {/* The screen — terminal that re-keys per mode so power-on replays */}
      <div className="rounded-lg border-2 border-ink bg-well p-4 shadow-inner">
        <div className="mb-2 flex items-center justify-between border-b border-white/10 pb-2">
          <span className="font-mono-lab text-[0.7rem] text-white/45">{active.file}</span>
          <span className={`font-mono-lab text-[0.7rem] ${active.accent}`}>● {active.tag} MODE</span>
        </div>
        <div key={mode} className="power-on min-h-[152px] font-mono-lab text-[0.82rem] leading-relaxed">
          {active.screen}
          <span className="term-cursor mt-1 inline-block h-4 w-2 bg-mint align-middle" />
        </div>
      </div>

      {/* The switch bank — flip one to run it. Four subjects, one row on
          desktop; wraps to 2×2 on the smallest screens. */}
      <div className="mt-4 rounded-lg border-2 border-ink bg-ink/90 p-3">
        <div className="mb-2.5 ref-tag text-white/45">Subject select: flip a switch</div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {MODE_ORDER.map((key) => {
            const m = MODES[key];
            const on = key === mode;
            return (
              <button
                key={key}
                onClick={() => setMode(key)}
                aria-pressed={on}
                className="group flex flex-col items-center gap-2 rounded-lg border-2 border-white/15 bg-white/5 px-2 py-2.5 outline-none transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-signal"
              >
                <m.Icon className={`h-5 w-5 transition-colors ${on ? m.accent : 'text-white/45'}`} />
                <span className={`ref-tag transition-colors ${on ? 'text-white' : 'text-white/45'}`}>{m.tag}</span>
                {/* Physical toggle track + knob */}
                <span
                  className="relative h-6 w-11 rounded-full border-2 border-ink transition-colors"
                  style={{ background: on ? m.led : '#2b3a31' }}
                >
                  <span
                    className="switch-knob absolute left-0 top-1/2 h-4 w-4 rounded-full bg-ink"
                    style={{ transform: on ? 'translate(22px, -50%)' : 'translate(2px, -50%)' }}
                  />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Readouts framed as gauges on the bench. Numbers on the honest side —
// "6 subjects" is what's actually on the shelf right now (Python, AI, Games,
// Robotics, Web, plus Physics/Chem on the workbench), and the "live labs" line
// captures the live sim/editor/preview loops instead of counting features.
const READOUTS = [
  { k: 'SUBJECTS', v: '7' },
  { k: 'LIVE LABS', v: '∞' },
  { k: 'AGES', v: '8–14' },
];

/* Small hook: collect timeout ids and clear them all (on re-run + unmount) so
   the card sims never leak timers or update after the section unmounts. */
function useTimers() {
  const ids = useRef([]);
  const clear = useCallback(() => {
    ids.current.forEach(clearTimeout);
    ids.current = [];
  }, []);
  const after = useCallback((ms, fn) => {
    ids.current.push(setTimeout(fn, ms));
  }, []);
  useEffect(() => clear, [clear]);
  return { after, clear };
}

// A little dark "screen" like the hero device, shared by the three sims.
function SimScreen({ file, tag, accent, children }) {
  return (
    <div className="rounded-lg border-2 border-ink bg-well p-3.5 shadow-inner">
      <div className="mb-2 flex items-center justify-between border-b border-white/10 pb-2">
        <span className="font-mono-lab text-[0.68rem] text-white/45">{file}</span>
        <span className={`font-mono-lab text-[0.68rem] ${accent}`}>● {tag}</span>
      </div>
      <div className="min-h-[104px] font-mono-lab text-[0.78rem] leading-relaxed">{children}</div>
    </div>
  );
}

// The run/reset control shared by the sims.
function SimButton({ running, done, onRun, label }) {
  return (
    <button
      onClick={onRun}
      disabled={running}
      className="lab-btn inline-flex items-center gap-2 rounded-lg border-2 border-ink bg-signal px-4 py-2 text-sm font-extrabold text-ink disabled:opacity-60"
    >
      {done ? <RotateCcw className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      {running ? 'Running…' : done ? 'Run again' : label}
    </button>
  );
}

// MOD-01 — press RUN and a real loop lights up 5 LEDs one by one. Output stays
// a single fixed-height row, so the card never grows as it runs.
const LED_COUNT = 5;
function CodeSim() {
  const { after, clear } = useTimers();
  const [lit, setLit] = useState(0); // how many LEDs are on
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  const run = () => {
    clear();
    setLit(0);
    setDone(false);
    setRunning(true);
    for (let i = 1; i <= LED_COUNT; i++) {
      after(240 * i, () => setLit(i));
    }
    after(240 * (LED_COUNT + 1), () => { setRunning(false); setDone(true); });
  };

  return (
    <>
      <SimScreen file="blink.py" tag="CODE" accent="text-signal">
        <div className="text-white/80">
          <span className="text-[#E86FE0]">for</span> i <span className="text-[#E86FE0]">in</span> range(<span className="text-signal">5</span>):
        </div>
        <div className="pl-4 text-white/80">
          led[i].<span className="text-led">on</span>()
        </div>
        <div className="mt-3 flex items-center gap-2">
          {Array.from({ length: LED_COUNT }).map((_, i) => (
            <span
              key={i}
              className="led transition-colors duration-150"
              style={{ color: i < lit ? '#FFB40A' : '#3a4a41' }}
            />
          ))}
          <span className="ml-auto text-mint">
            {done ? 'all lit ✨' : running ? `i = ${Math.max(lit - 1, 0)}` : ''}
          </span>
        </div>
      </SimScreen>
      <div className="mt-3"><SimButton running={running} done={done} onRun={run} label="Run it" /></div>
    </>
  );
}

// MOD-02 — press TRAIN: examples fly into the model, confidence fills, it predicts.
const AI_SAMPLES = ['🐱', '🐱', '🐶', '🐱'];
function AiSim() {
  const { after, clear } = useTimers();
  const [phase, setPhase] = useState('idle'); // idle | training | done
  const [conf, setConf] = useState(0);
  const [fed, setFed] = useState(-1); // index of last fed sample

  const train = () => {
    clear();
    setPhase('training');
    setConf(0);
    setFed(-1);
    AI_SAMPLES.forEach((_, i) => after(160 * (i + 1), () => setFed(i)));
    for (let p = 1; p <= 49; p++) {
      after(20 * p + 300, () => setConf(p * 2));
    }
    after(20 * 49 + 500, () => setPhase('done'));
  };

  return (
    <>
      <SimScreen file="vision.py" tag="AI" accent="text-led">
        <div className="mb-2 flex items-center gap-1.5">
          {AI_SAMPLES.map((s, i) => (
            <span
              key={i}
              className={`text-lg ${phase === 'training' && fed >= i ? 'animate-feed-fly' : ''}`}
              style={{ opacity: phase === 'training' && fed >= i ? undefined : phase === 'done' ? 0.35 : 1 }}
            >
              {s}
            </span>
          ))}
          <span className="ml-auto ref-tag text-white/40">samples</span>
        </div>
        <div className="mb-1 flex items-center justify-between text-white/70">
          <span>confidence</span>
          <span className="text-led">{conf}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-led transition-[width] duration-100" style={{ width: `${conf}%` }} />
        </div>
        {phase === 'done' && (
          <div className="mt-2.5 animate-slide-up text-mint">→ it's a CAT 🐱 <span className="text-white/50">(0.98 sure)</span></div>
        )}
      </SimScreen>
      <div className="mt-3">
        <SimButton running={phase === 'training'} done={phase === 'done'} onRun={train} label="Train it" />
      </div>
    </>
  );
}

// MOD-03 — press BUILD: the code → test → ship pipeline lights up, then ships.
const BUILD_STEPS = [
  { k: 'code', label: 'writing code' },
  { k: 'test', label: 'running tests' },
  { k: 'ship', label: 'shipping build' },
];
function BuildSim() {
  const { after, clear } = useTimers();
  const [step, setStep] = useState(-1); // last completed step index
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  const build = () => {
    clear();
    setStep(-1);
    setDone(false);
    setRunning(true);
    BUILD_STEPS.forEach((_, i) => after(520 * (i + 1), () => setStep(i)));
    after(520 * (BUILD_STEPS.length + 1), () => { setRunning(false); setDone(true); });
  };

  return (
    <>
      <SimScreen file="game.py" tag="BUILD" accent="text-wire">
        <div className="space-y-1.5">
          {BUILD_STEPS.map((s, i) => {
            const on = step >= i;
            return (
              <div key={s.k} className="flex items-center gap-2">
                <span
                  className={`led transition-colors ${on ? '' : 'opacity-30'}`}
                  style={{ color: on ? '#00C48C' : '#4b5a51' }}
                />
                <span className={on ? 'text-white/85' : 'text-white/40'}>{s.label}</span>
                {on && <CheckCircle2 className="ml-auto h-3.5 w-3.5 text-mint animate-slide-up" />}
              </div>
            );
          })}
        </div>
        {done && (
          <div className="mt-2.5 animate-slide-up text-mint">→ game.py shipped 🎮</div>
        )}
      </SimScreen>
      <div className="mt-3"><SimButton running={running} done={done} onRun={build} label="Build it" /></div>
    </>
  );
}

// Accents reuse the hero device's four LED colors so the sequence reads as
// the same machine booting: signal yellow → LED cyan → magenta → wire red.
const STEPS = [
  { n: '01', Icon: MousePointerClick, led: '#FFB40A', title: 'Pick a subject', desc: 'Choose Python, AI, web, games, or robotics. Every subject opens as its own lab — no setup, no downloads.' },
  { n: '02', Icon: Code2, led: '#0097F8', title: 'Learn by doing', desc: 'Every lesson ships a live lab. Write code, train a model, drag a robot, or drop a webpage — hit Run and watch it react.' },
  { n: '03', Icon: Trophy, led: '#E63C22', title: 'Build something real', desc: 'Finish each subject with a project you actually keep: a game, a mini-AI, a website, a robotics build.' },
];

// Field notes as lab-notebook entries. Rewritten to cover the wider surface
// area of subjects, so nobody reads the page as a coding-only site.
const NOTES = [
  { quote: 'I built my number-guessing game on day one, and now I have my own tiny website too.', name: 'Aarav', age: 11, subject: 'Python · Web', ref: 'LOG-114' },
  { quote: 'I taught the AI to spot cats. My little brother spent an hour trying to trick it.', name: 'Mia', age: 9, subject: 'AI', ref: 'LOG-207' },
  { quote: 'The robotics simulator feels like a real bench. I wired the sensors myself.', name: 'Rohan', age: 12, subject: 'Robotics', ref: 'LOG-333' },
];

function Eyebrow({ children }) {
  return (
    <span className="mb-4 inline-flex items-center gap-2 rounded-md border-2 border-ink bg-white px-3 py-1 ref-tag text-ink">
      <span className="led" style={{ color: '#5B0DA8' }} />
      {children}
    </span>
  );
}

// Three-line pitch about what Pocket Lab actually is, framed as bench
// diagnostics. The compact section this drives replaces the full subject
// grid — cards live on /courses now; the home page's job is to sell the
// idea and hand traffic over.
const PILLARS = [
  {
    Icon: Wand2, led: '#FFB40A',
    title: 'Learn by making',
    body: 'Every lesson is a live lab, not a lecture. You write, run, break, and see the result inside the same screen.',
  },
  {
    Icon: Sparkles, led: '#0097F8',
    title: 'Seven subjects, one workbench',
    body: 'Python, AI, web, games, and robotics ship today. Physics and chemistry are wired in next.',
  },
  {
    Icon: Trophy, led: '#E63C22',
    title: 'Real projects, real proof',
    body: 'Every track ends with something you keep — a website, a game, a mini-AI, a robotics build you can show off.',
  },
];

export default function Home() {
  // Scroll to an in-page section when arriving with a hash (e.g. the navbar's
  // "See how it works" button points to #how-it-works).
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const el = document.querySelector(hash);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, [hash]);

  return (
    <div className="flex flex-col items-center overflow-hidden bg-paper text-ink">
      {/* ============ Hero ============ */}
      <section className="bench-grid w-full border-b-2 border-ink/10">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 sm:py-24 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <Eyebrow>Seven benches · one workbench</Eyebrow>
            <h1 className="font-lab text-[2.6rem] font-extrabold leading-[1.02] tracking-tight sm:text-6xl">
              Flip a switch.
              <br />
              Learn something <span className="text-pcb">real</span>.
            </h1>
            <p className="mt-6 max-w-xl text-lg font-semibold text-ink/70">
              Pocket Lab is a maker's bench for the subjects that actually build
              things — Python, AI, web, games, and robotics, with physics and
              chemistry on the way. Every lesson runs live in your browser.
              No installs. No lectures. Just build.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/courses"
                className="lab-btn group inline-flex items-center justify-center gap-2 rounded-xl border-2 border-ink bg-signal px-7 py-3.5 text-lg font-extrabold text-ink"
              >
                <Power className="h-5 w-5" />
                Power on the lab
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#workshop"
                className="lab-btn inline-flex items-center justify-center gap-2 rounded-xl border-2 border-ink bg-white px-7 py-3.5 text-lg font-extrabold text-ink"
              >
                What is Pocket Lab?
              </a>
            </div>

            {/* Readout gauges */}
            <div className="mt-10 flex flex-wrap gap-3">
              {READOUTS.map(({ k, v }) => (
                <div key={k} className="rounded-lg border-2 border-ink bg-white px-4 py-2">
                  <div className="font-lab text-2xl font-extrabold leading-none">{v}</div>
                  <div className="ref-tag mt-1 text-ink/55">{k}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Signature: the interactive device */}
          <div className="flex justify-center lg:justify-end">
            <PocketLabDevice />
          </div>
        </div>
      </section>

      {/* ============ What Pocket Lab is (short, then send to /courses) ============
          Replaces the full subject grid on the home page — the catalogue now
          lives on /courses. This section is a three-line pitch: what the lab
          is, what makes it different, and a single door to the catalogue. */}
      <section id="workshop" className="w-full scroll-mt-20 bg-paper py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.15fr] lg:items-center">
            {/* Left column — the pitch. Copy first, then the CTA to /courses. */}
            <div>
              <Eyebrow>About the lab</Eyebrow>
              <h2 className="font-lab mb-4 text-3xl font-extrabold sm:text-4xl">
                Pocket Lab is a workshop, not a textbook.
              </h2>
              <p className="mb-4 max-w-xl text-lg font-semibold text-ink/70">
                It's a maker's bench that fits in a browser tab. Every subject
                opens as its own lab — code editor, live preview, one Run
                button. You spend your time building the thing, not reading
                about it.
              </p>
              <p className="mb-8 max-w-xl text-base font-semibold text-ink/60">
                The full catalogue lives on the Courses page — pick a bench,
                open the door, start building.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/courses"
                  className="lab-btn group inline-flex items-center justify-center gap-2 rounded-xl border-2 border-ink bg-ink px-6 py-3 text-lg font-extrabold text-white transition-colors hover:bg-pcb"
                >
                  Browse all subjects
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <a
                  href="#how-it-works"
                  className="lab-btn inline-flex items-center justify-center gap-2 rounded-xl border-2 border-ink bg-white px-6 py-3 text-lg font-extrabold text-ink"
                >
                  How it works
                </a>
              </div>
            </div>

            {/* Right column — three "bench readouts" that give the pitch a
                shape and match the workbench identity without duplicating
                the catalogue. */}
            <div className="grid gap-4">
              {PILLARS.map(({ Icon, led, title, body }) => (
                <div key={title} className="lab-panel relative flex items-start gap-4 overflow-hidden p-5">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 left-0 w-1.5"
                    style={{ background: led }}
                  />
                  <span
                    aria-hidden
                    className="ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-2 border-ink text-white"
                    style={{ background: led }}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-lab mb-1 text-lg font-bold">{title}</h3>
                    <p className="text-sm font-semibold leading-relaxed text-ink/65">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ How it works (a real 3-step sequence) ============ */}
      <section id="how-it-works" className="bench-grid w-full scroll-mt-20 border-y-2 border-ink/10 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <Eyebrow>Startup sequence</Eyebrow>
          <h2 className="font-lab mb-3 text-3xl font-extrabold sm:text-4xl">Three steps to your first build</h2>
          <p className="mb-12 max-w-2xl text-lg font-semibold text-ink/65">
            Open the browser, plug in a subject, and you're building something
            of your own inside ten minutes.
          </p>

          <div className="grid gap-6 md:grid-cols-3">
            {STEPS.map(({ n, Icon, title, desc, led }, i) => (
              <div key={n} className="group relative">
                {i < STEPS.length - 1 && (
                  <span className="pointer-events-none absolute top-1/2 hidden -translate-y-1/2 text-ink/30 transition-transform duration-200 group-hover:translate-x-1 md:block"
                    style={{ right: '-24px' }}>
                    <ArrowRight className="h-6 w-6" />
                  </span>
                )}
                <div className="lab-panel lab-lift h-full p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-2 border-ink font-lab text-lg font-extrabold text-ink"
                      style={{ background: led }}
                    >
                      {n}
                    </span>
                    <span className="ref-tag inline-flex items-center gap-1.5 text-ink/45">
                      <span className="led" style={{ color: led }} /> Step {n}
                    </span>
                    <Icon className="ml-auto h-5 w-5 text-ink/55 transition-colors group-hover:text-ink" />
                  </div>
                  <h3 className="font-lab mb-2 text-xl font-bold">{title}</h3>
                  <p className="font-semibold text-ink/65">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ Live benches (three side-by-side mini simulators) ============ */}
      <section className="w-full bg-paper py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <Eyebrow>On the benches, right now</Eyebrow>
          <h2 className="font-lab mb-3 text-3xl font-extrabold sm:text-4xl">Try three benches without signing in</h2>
          <p className="mb-12 max-w-2xl text-lg font-semibold text-ink/65">
            Every subject on Pocket Lab runs a loop like these — you write, you
            run, and the machine reacts. Press a button on any of the three
            panels below and watch it happen.
          </p>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="lab-panel flex flex-col p-6">
              <div className="mb-5 flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-ink bg-pcb text-white">
                  <Terminal className="h-6 w-6" />
                </span>
                <span className="ref-tag text-ink/45">BENCH-01</span>
              </div>
              <h3 className="font-lab mb-2 text-xl font-bold">Loops that light up</h3>
              <p className="mb-5 font-semibold text-ink/65">A real Python loop, five LEDs, one click.</p>
              <div className="mt-auto"><CodeSim /></div>
            </div>

            <div className="lab-panel flex flex-col p-6">
              <div className="mb-5 flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-ink bg-led text-white">
                  <Cpu className="h-6 w-6" />
                </span>
                <span className="ref-tag text-ink/45">BENCH-02</span>
              </div>
              <h3 className="font-lab mb-2 text-xl font-bold">Train a tiny model</h3>
              <p className="mb-5 font-semibold text-ink/65">Feed it examples, watch confidence climb, get a guess.</p>
              <div className="mt-auto"><AiSim /></div>
            </div>

            <div className="lab-panel flex flex-col p-6">
              <div className="mb-5 flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-ink bg-wire text-white">
                  <Wrench className="h-6 w-6" />
                </span>
                <span className="ref-tag text-ink/45">BENCH-03</span>
              </div>
              <h3 className="font-lab mb-2 text-xl font-bold">Build & ship</h3>
              <p className="mb-5 font-semibold text-ink/65">Code → test → ship, three green lights in a row.</p>
              <div className="mt-auto"><BuildSim /></div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ Featured track: Python (front door) ============ */}
      <section className="w-full bg-paper py-20 sm:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-6 md:grid-cols-[1fr_minmax(0,380px)]">
          <div>
            <Eyebrow>Front door · start here</Eyebrow>
            <h2 className="font-lab mb-3 text-3xl font-extrabold sm:text-4xl">
              New to all this? Python first <span aria-hidden>🐍</span>
            </h2>
            <p className="mb-6 max-w-xl text-lg font-semibold text-ink/65">
              Python is the front door to every other bench: AI needs it, games
              use it, robotics runs on it. Twenty short levels take you from
              "hello, world" to a program you built yourself.
            </p>
            <ul className="mb-8 space-y-2.5">
              {[
                'Run real Python in your browser, no setup',
                'Every lesson ships a working, editable example',
                'Finish with a mini-project you can actually show off',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5 font-semibold text-ink/75">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-pcb" /> {item}
                </li>
              ))}
            </ul>
            <Link
              to="/course/python/lesson/intro"
              className="lab-btn inline-flex items-center gap-2 rounded-xl border-2 border-ink bg-signal px-6 py-3 font-extrabold text-ink"
            >
              <Rocket className="h-5 w-5" /> Open Python bench
            </Link>
          </div>

          {/* A second little terminal — a different demo than the hero device */}
          <div className="lab-panel overflow-hidden p-0">
            <div className="flex items-center justify-between border-b-2 border-ink bg-ink px-4 py-2.5">
              <span className="font-mono-lab text-[0.72rem] text-white/50">guess.py</span>
              <span className="ref-tag text-signal">PROJECT 01</span>
            </div>
            <div className="bg-well p-5 font-mono-lab text-[0.82rem] leading-relaxed">
              <div><span className="text-[#E86FE0]">import</span> <span className="text-led">random</span></div>
              <div>secret <span className="text-white/60">=</span> random.randint(<span className="text-signal">1</span>, <span className="text-signal">10</span>)</div>
              <div><span className="text-[#E86FE0]">if</span> guess <span className="text-white/60">==</span> secret:</div>
              <div className="pl-4"><span className="text-led">print</span>(<span className="text-signal">"You win! 🎉"</span>)</div>
              <div className="mt-2 text-mint">→ You win! 🎉 <span className="term-cursor inline-block h-4 w-2 bg-mint align-middle" /></div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ Field notes (testimonials) ============ */}
      <section className="w-full bg-paper py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <Eyebrow>Field notes</Eyebrow>
          <h2 className="font-lab mb-12 text-3xl font-extrabold sm:text-4xl">From the young makers' bench</h2>

          <div className="grid gap-6 md:grid-cols-3">
            {NOTES.map(({ quote, name, age, subject, ref }) => (
              <figure key={ref} className="lab-panel lab-lift flex h-full flex-col p-6">
                <div className="mb-3 flex items-center justify-between">
                  <span className="ref-tag text-ink/45">{ref}</span>
                  <span className="ref-tag text-pcb">{subject}</span>
                </div>
                <blockquote className="mb-5 flex-1 font-semibold text-ink/80">“{quote}”</blockquote>
                <figcaption className="flex items-center gap-3 border-t-2 border-dashed border-ink/15 pt-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-ink bg-pcb font-lab font-bold text-white">
                    {name[0]}
                  </span>
                  <div>
                    <div className="font-lab font-bold">{name}</div>
                    <div className="ref-tag text-ink/50">Age {age}</div>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ============ Final CTA ============ */}
      <section className="w-full bg-paper pb-24 pt-4">
        <div className="mx-auto max-w-6xl px-6">
          <div className="lab-panel-pcb relative overflow-hidden px-8 py-14 text-center sm:py-16">
            {/* faint board traces */}
            <div className="pointer-events-none absolute inset-0 opacity-15"
              style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.6) 1px,transparent 1px)', backgroundSize: '28px 28px' }} />
            <div className="relative">
              <span className="mb-4 inline-flex items-center gap-2 rounded-md border-2 border-ink bg-signal px-3 py-1 ref-tag text-ink">
                <Power className="h-3.5 w-3.5" /> Power on
              </span>
              <h2 className="font-lab mb-3 text-3xl font-extrabold text-white sm:text-4xl">
                Which bench boots first?
              </h2>
              <p className="mx-auto mb-8 max-w-xl text-lg font-semibold text-white/85">
                Jump in free and pick your subject. Python, AI, web, games, or
                robotics — the workbench is powered up and waiting.
              </p>
              <Link
                to="/courses"
                className="lab-btn inline-flex items-center gap-2 rounded-xl border-2 border-ink bg-signal px-8 py-3.5 text-lg font-extrabold text-ink"
              >
                <Sparkles className="h-5 w-5" /> Explore the labs
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============ Footer ============ */}
      <footer className="w-full border-t-2 border-ink bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 py-12 sm:flex-row sm:justify-between">
          <div className="flex flex-col items-center gap-3 sm:items-start">
            <img src={logo} alt="Pocket Lab" className="h-9 w-auto" />
            <p className="font-semibold text-ink/60">A pocket-sized lab for every subject worth building.</p>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 ref-tag">
            <Link to="/courses" className="text-ink/60 transition-colors hover:text-pcb">Courses</Link>
            <Link to="/course/python/lesson/intro" className="text-ink/60 transition-colors hover:text-pcb">Python</Link>
            <Link to="/course/ai/lesson/intro" className="text-ink/60 transition-colors hover:text-pcb">AI</Link>
            <Link to="/course/webdev/lesson/wd1-intro" className="text-ink/60 transition-colors hover:text-pcb">Web</Link>
            <Link to="/course/gamedev/games" className="text-ink/60 transition-colors hover:text-pcb">Games</Link>
            <Link to="/course/robotics/lesson/robot-intro" className="text-ink/60 transition-colors hover:text-pcb">Robotics</Link>
          </nav>
        </div>
        <div className="border-t-2 border-ink/10 py-5 text-center ref-tag text-ink/45">
          © {new Date().getFullYear()} Pocket Lab · built with 💚 for young makers
        </div>
      </footer>
    </div>
  );
}
