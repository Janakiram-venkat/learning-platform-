import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowRight, Terminal, Bot, Rocket, Zap, Code2, Trophy,
  MousePointerClick, CheckCircle2, Wrench, Cpu, Power, Play, RotateCcw,
} from 'lucide-react';
import logo from '../assets/pocketlab.png';

/* ---------------------------------------------------------------------------
   Pocket Lab — "Workbench" home page.
   The identity is a maker's electronics bench (the name literally means a lab
   in your pocket). The signature is the interactive device below: flip a
   switch and it runs a different demo. Everything else is kept quiet — a
   graph-paper canvas, hard-edged silkscreened panels, mono readouts.
--------------------------------------------------------------------------- */

// What the pocket device "runs" for each mode it's switched to. The screen is
// re-keyed on mode change so the power-on flicker replays.
const MODES = {
  code: {
    tag: 'CODE',
    file: 'main.py',
    Icon: Terminal,
    accent: 'text-signal',
    led: '#FFC93C',
    screen: (
      <>
        <div className="text-white/35">$ run main.py</div>
        <div><span className="text-[#FF9EC4]">def</span> <span className="text-led">greet</span><span className="text-white/80">(name):</span></div>
        <div className="pl-4"><span className="text-[#FF9EC4]">return</span> <span className="text-signal">f"Hi {'{name}'}! 👋"</span></div>
        <div><span className="text-led">print</span><span className="text-white/80">(greet(</span><span className="text-signal">"Coder"</span><span className="text-white/80">))</span></div>
        <div className="mt-2 text-emerald-400">→ Hi Coder! 👋</div>
      </>
    ),
  },
  ai: {
    tag: 'AI',
    file: 'vision.py',
    Icon: Cpu,
    accent: 'text-led',
    led: '#23B5D3',
    screen: (
      <>
        <div className="text-white/35">$ classify photo.jpg</div>
        <div className="text-white/80">loading model<span className="text-white/40"> ......</span> <span className="text-emerald-400">ok</span></div>
        <div className="text-white/80">scanning pixels <span className="text-led">▓▓▓▓▓▓▓▓</span> 100%</div>
        <div className="mt-2 text-emerald-400">→ it's a CAT <span className="text-white/50">(0.98 sure)</span> 🐱</div>
      </>
    ),
  },
  robot: {
    tag: 'ROBOT',
    file: 'rover.py',
    Icon: Bot,
    accent: 'text-wire',
    led: '#E8503A',
    screen: (
      <>
        <div className="text-white/35">$ connect rover</div>
        <div className="text-white/80">link established <span className="text-emerald-400">●</span></div>
        <div className="text-white/80"><span className="text-led">motor</span>.forward(<span className="text-signal">2s</span>)</div>
        <div className="text-white/80">sensor: wall @ <span className="text-wire">30cm</span></div>
        <div className="mt-2 text-emerald-400">→ turning left… done 🦾</div>
      </>
    ),
  },
};

const MODE_ORDER = ['code', 'ai', 'robot'];

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
          <span className="led led-pulse" style={{ color: '#FFC93C' }} />
          <span className="led" style={{ color: '#23B5D3' }} />
          <span className="led" style={{ color: '#E8503A' }} />
        </div>
      </div>

      {/* The screen — terminal that re-keys per mode so power-on replays */}
      <div className="rounded-lg border-2 border-ink bg-[#0B180F] p-4 shadow-inner">
        <div className="mb-2 flex items-center justify-between border-b border-white/10 pb-2">
          <span className="font-mono-lab text-[0.7rem] text-white/45">{active.file}</span>
          <span className={`font-mono-lab text-[0.7rem] ${active.accent}`}>● {active.tag} MODE</span>
        </div>
        <div key={mode} className="power-on min-h-[132px] font-mono-lab text-[0.82rem] leading-relaxed">
          {active.screen}
          <span className="term-cursor mt-1 inline-block h-4 w-2 bg-emerald-400 align-middle" />
        </div>
      </div>

      {/* The switch bank — flip one to run it */}
      <div className="mt-4 rounded-lg border-2 border-ink bg-ink/90 p-3">
        <div className="mb-2.5 ref-tag text-white/45">Mode select: flip a switch</div>
        <div className="grid grid-cols-3 gap-2">
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

// A short "readout" fact styled like a gauge on the bench.
const READOUTS = [
  { k: 'LESSONS', v: '50+' },
  { k: 'LIVE CODE', v: '∞' },
  { k: 'BUILT FOR AGES', v: '8–14' },
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
    <div className="rounded-lg border-2 border-ink bg-[#0B180F] p-3.5 shadow-inner">
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
          <span className="text-[#FF9EC4]">for</span> i <span className="text-[#FF9EC4]">in</span> range(<span className="text-signal">5</span>):
        </div>
        <div className="pl-4 text-white/80">
          led[i].<span className="text-led">on</span>()
        </div>
        <div className="mt-3 flex items-center gap-2">
          {Array.from({ length: LED_COUNT }).map((_, i) => (
            <span
              key={i}
              className="led transition-colors duration-150"
              style={{ color: i < lit ? '#FFC93C' : '#3a4a41' }}
            />
          ))}
          <span className="ml-auto text-emerald-400">
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
          <div className="mt-2.5 animate-slide-up text-emerald-400">→ it's a CAT 🐱 <span className="text-white/50">(0.98 sure)</span></div>
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
                  style={{ color: on ? '#3FBF7F' : '#4b5a51' }}
                />
                <span className={on ? 'text-white/85' : 'text-white/40'}>{s.label}</span>
                {on && <CheckCircle2 className="ml-auto h-3.5 w-3.5 text-emerald-400 animate-slide-up" />}
              </div>
            );
          })}
        </div>
        {done && (
          <div className="mt-2.5 animate-slide-up text-emerald-400">→ game.py shipped 🎮</div>
        )}
      </SimScreen>
      <div className="mt-3"><SimButton running={running} done={done} onRun={build} label="Build it" /></div>
    </>
  );
}

const KIT = [
  {
    ref: 'MOD-01',
    Icon: Terminal,
    title: 'Code & play',
    desc: 'Write real code in a real editor and run it in one click. No installs, instant results.',
    Sim: CodeSim,
  },
  {
    ref: 'MOD-02',
    Icon: Bot,
    title: 'Train AI & robots',
    desc: 'Teach a model to recognize things, then send commands that drive a friendly robot.',
    Sim: AiSim,
  },
  {
    ref: 'MOD-03',
    Icon: Wrench,
    title: 'Build real projects',
    desc: 'Go from your first line to games, mini-AIs, and robotics builds you can actually show off.',
    Sim: BuildSim,
  },
];

// Accents reuse the hero device's three LED colors so the sequence reads as
// the same machine booting: signal yellow → LED cyan → wire red.
const STEPS = [
  { n: '01', Icon: MousePointerClick, led: '#FFC93C', title: 'Pick a track', desc: 'Choose Python, AI, or Robotics and open your first level. No setup.' },
  { n: '02', Icon: Code2, led: '#23B5D3', title: 'Write real code', desc: 'Solve playful challenges in the editor and run your code live.' },
  { n: '03', Icon: Trophy, led: '#E8503A', title: 'Earn XP & badges', desc: 'Level up, collect badges, and unlock new powers as you master each skill.' },
];

// Learning tracks, framed as bench modules. `status` drives the LED state.
const TRACKS = [
  {
    ref: 'TRK-PY', emoji: '🐍', title: 'Python', line: 'Beginner friendly',
    desc: 'Master the language behind games, AI, and the web, one puzzle at a time.',
    status: 'READY', led: '#3FBF7F', to: '/course/python/lesson/intro',
  },
  {
    ref: 'TRK-AI', emoji: '🤖', title: 'AI & Machine Learning', line: 'Explorer',
    desc: 'Train smart models, teach a computer to see, and build your own mini-AI.',
    status: 'READY', led: '#23B5D3', to: '/course/ai/lesson/intro',
  },
];

// Testimonials as lab-notebook field notes.
const NOTES = [
  { quote: 'I built my own number-guessing game on day one. Coding feels like playing!', name: 'Aarav', age: 11, ref: 'LOG-114' },
  { quote: 'The badges make me want to finish every level. I taught an AI to recognize cats!', name: 'Mia', age: 9, ref: 'LOG-207' },
  { quote: 'I never thought I could write real Python. Now I help my friends debug theirs.', name: 'Rohan', age: 12, ref: 'LOG-333' },
];

function Eyebrow({ children }) {
  return (
    <span className="mb-4 inline-flex items-center gap-2 rounded-md border-2 border-ink bg-white px-3 py-1 ref-tag text-ink">
      <span className="led" style={{ color: '#1F7A5C' }} />
      {children}
    </span>
  );
}

export default function Home() {
  // Scroll to an in-page section when arriving with a hash (e.g. the navbar's
  // "Courses" link points to /#tracks from any page).
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
            <Eyebrow>A lab that fits in your pocket</Eyebrow>
            <h1 className="font-lab text-[2.6rem] font-extrabold leading-[1.02] tracking-tight sm:text-6xl">
              Flip a switch.
              <br />
              Run <span className="text-pcb">real</span> code.
            </h1>
            <p className="mt-6 max-w-xl text-lg font-semibold text-ink/70">
              Pocket Lab is a maker's bench for coding, AI, and robotics. Write real
              programs, train real models, and drive real robots, right in your
              browser. No installs. No lectures. Just build.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#tracks"
                className="lab-btn group inline-flex items-center justify-center gap-2 rounded-xl border-2 border-ink bg-signal px-7 py-3.5 text-lg font-extrabold text-ink"
              >
                <Power className="h-5 w-5" />
                Start Learning 
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </a>
              <a
                href="#how-it-works"
                className="lab-btn inline-flex items-center justify-center gap-2 rounded-xl border-2 border-ink bg-white px-7 py-3.5 text-lg font-extrabold text-ink"
              >
                See how it works
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

      {/* ============ The kit ============ */}
      <section className="w-full bg-paper py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <Eyebrow>The kit</Eyebrow>
          <h2 className="font-lab mb-3 text-3xl font-extrabold sm:text-4xl">What's on the bench</h2>
          <p className="mb-12 max-w-2xl text-lg font-semibold text-ink/65">
            Three modules, one workbench. Everything plugs into everything else.
          </p>

          <div className="grid gap-6 md:grid-cols-3">
            {KIT.map(({ ref, Icon, title, desc, Sim }) => (
              <div key={ref} className="lab-panel flex flex-col p-6">
                <div className="mb-5 flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-ink bg-pcb text-white">
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="ref-tag text-ink/45">{ref}</span>
                </div>
                <h3 className="font-lab mb-2 text-xl font-bold">{title}</h3>
                <p className="mb-5 font-semibold text-ink/65">{desc}</p>
                {/* Live mini-simulation — press the button to run it. */}
                <div className="mt-auto">
                  <Sim />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ How it works (a real 3-step sequence) ============ */}
      <section id="how-it-works" className="bench-grid w-full scroll-mt-20 border-y-2 border-ink/10 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <Eyebrow>Startup sequence</Eyebrow>
          <h2 className="font-lab mb-3 text-3xl font-extrabold sm:text-4xl">Three steps to your first build</h2>
          <p className="mb-12 max-w-2xl text-lg font-semibold text-ink/65">
            Open the browser, pick a track, and you're running real code in minutes.
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

      {/* ============ Featured quest: Python ============ */}
      <section className="w-full bg-paper py-20 sm:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-6 md:grid-cols-[1fr_minmax(0,380px)]">
          <div>
            <Eyebrow>Featured track · start here</Eyebrow>
            <h2 className="font-lab mb-3 text-3xl font-extrabold sm:text-4xl">
              Begin the Python journey <span aria-hidden>🐍</span>
            </h2>
            <p className="mb-6 max-w-xl text-lg font-semibold text-ink/65">
              Go from total beginner to building your own programs. Solve puzzles,
              run code, and unlock a badge at the end of every level.
            </p>
            <ul className="mb-8 space-y-2.5">
              {['Run real Python in your browser', 'Earn XP for every challenge', 'Build a project you can show off'].map((item) => (
                <li key={item} className="flex items-center gap-2.5 font-semibold text-ink/75">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-pcb" /> {item}
                </li>
              ))}
            </ul>
            <Link
              to="/course/python/lesson/intro"
              className="lab-btn inline-flex items-center gap-2 rounded-xl border-2 border-ink bg-signal px-6 py-3 font-extrabold text-ink"
            >
              <Rocket className="h-5 w-5" /> Start the Python track
            </Link>
          </div>

          {/* A second little terminal — a different demo than the hero device */}
          <div className="lab-panel overflow-hidden p-0">
            <div className="flex items-center justify-between border-b-2 border-ink bg-ink px-4 py-2.5">
              <span className="font-mono-lab text-[0.72rem] text-white/50">guess.py</span>
              <span className="ref-tag text-signal">PROJECT 01</span>
            </div>
            <div className="bg-[#0B180F] p-5 font-mono-lab text-[0.82rem] leading-relaxed">
              <div><span className="text-[#FF9EC4]">import</span> <span className="text-led">random</span></div>
              <div>secret <span className="text-white/60">=</span> random.randint(<span className="text-signal">1</span>, <span className="text-signal">10</span>)</div>
              <div><span className="text-[#FF9EC4]">if</span> guess <span className="text-white/60">==</span> secret:</div>
              <div className="pl-4"><span className="text-led">print</span>(<span className="text-signal">"You win! 🎉"</span>)</div>
              <div className="mt-2 text-emerald-400">→ You win! 🎉 <span className="term-cursor inline-block h-4 w-2 bg-emerald-400 align-middle" /></div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ Tracks / pick your path ============ */}
      <section id="tracks" className="bench-grid w-full scroll-mt-20 border-y-2 border-ink/10 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <Eyebrow>Modules</Eyebrow>
          <h2 className="font-lab mb-3 text-3xl font-extrabold sm:text-4xl">Pick your path</h2>
          <p className="mb-12 max-w-2xl text-lg font-semibold text-ink/65">
            Start with Python, then plug in AI as you level up.
          </p>

          <div className="grid gap-6 sm:grid-cols-2">
            {TRACKS.map(({ ref, emoji, title, line, desc, status, led, to }) => (
              <div key={ref} className="lab-panel lab-lift flex flex-col p-6">
                <div className="mb-4 flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-ink bg-white text-2xl" aria-hidden>{emoji}</span>
                  <span className="inline-flex items-center gap-1.5 ref-tag text-ink/55">
                    <span className="led" style={{ color: led }} /> {status}
                  </span>
                </div>
                <span className="ref-tag mb-1 text-ink/45">{ref}</span>
                <h3 className="font-lab mb-1 text-xl font-bold">{title}</h3>
                <p className="ref-tag mb-3 text-pcb">{line}</p>
                <p className="mb-5 flex-1 font-semibold text-ink/65">{desc}</p>
                <Link
                  to={to}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-ink bg-ink px-4 py-2.5 font-extrabold text-white transition-colors hover:bg-pcb"
                >
                  <Zap className="h-4 w-4" /> Open module
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ Field notes (testimonials) ============ */}
      <section className="w-full bg-paper py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <Eyebrow>Field notes</Eyebrow>
          <h2 className="font-lab mb-12 text-3xl font-extrabold sm:text-4xl">From the young makers' bench</h2>

          <div className="grid gap-6 md:grid-cols-3">
            {NOTES.map(({ quote, name, age, ref }) => (
              <figure key={ref} className="lab-panel lab-lift flex h-full flex-col p-6">
                <span className="ref-tag mb-3 text-ink/45">{ref}</span>
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
                Ready to boot up your lab?
              </h2>
              <p className="mx-auto mb-8 max-w-xl text-lg font-semibold text-white/85">
                Jump in free and write your very first line of code today. The bench
                is powered up and waiting.
              </p>
              <a
                href="#tracks"
                className="lab-btn inline-flex items-center gap-2 rounded-xl border-2 border-ink bg-signal px-8 py-3.5 text-lg font-extrabold text-ink"
              >
                <Rocket className="h-5 w-5" /> Start building free
                <ArrowRight className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ============ Footer ============ */}
      <footer className="w-full border-t-2 border-ink bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 py-12 sm:flex-row sm:justify-between">
          <div className="flex flex-col items-center gap-3 sm:items-start">
            <img src={logo} alt="Pocket Lab" className="h-9 w-auto" />
            <p className="font-semibold text-ink/60">Learn to code, train AI & build robots, by building.</p>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 ref-tag">
            <a href="#tracks" className="text-ink/60 transition-colors hover:text-pcb">Tracks</a>
            <Link to="/course/python/lesson/intro" className="text-ink/60 transition-colors hover:text-pcb">Python</Link>
            <Link to="/course/ai/lesson/intro" className="text-ink/60 transition-colors hover:text-pcb">AI</Link>
          </nav>
        </div>
        <div className="border-t-2 border-ink/10 py-5 text-center ref-tag text-ink/45">
          © {new Date().getFullYear()} Pocket Lab · built with 💚 for young makers
        </div>
      </footer>
    </div>
  );
}
