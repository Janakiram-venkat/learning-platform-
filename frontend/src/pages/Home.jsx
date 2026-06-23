import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Terminal, Bot, Cpu, Rocket, Sparkles, Gamepad2, Star, Zap, Heart,
  MousePointerClick, Code2, Trophy, Brain, CheckCircle2, Lock, Quote,
} from 'lucide-react';
import logo from '../assets/pocketlab.png';

// Three.js is heavy — load it lazily so hero text paints instantly.
const FloatingScene = lazy(() => import('../components/three/FloatingScene'));

const FEATURES = [
  {
    icon: Terminal,
    title: 'Code & Play',
    desc: 'Write real code right in your browser and watch it come alive instantly!',
    color: 'from-purple-500 to-violet-600',
  },
  {
    icon: Bot,
    title: 'Train AI & Robots',
    desc: 'Teach smart programs and control friendly robots with the code you write.',
    color: 'from-orange-400 to-pink-500',
  },
  {
    icon: Cpu,
    title: 'Build Real Projects',
    desc: 'Go from zero to building AI, games, and robotics projects of your own.',
    color: 'from-teal-400 to-cyan-500',
  },
];

const STATS = [
  { icon: Star, label: 'Fun Lessons', value: '50+', color: 'text-amber-500' },
  { icon: Zap, label: 'Live Coding', value: '∞', color: 'text-purple-500' },
  { icon: Heart, label: 'Made for Kids', value: '100%', color: 'text-pink-500' },
];

// Three simple steps so a new learner instantly "gets" how the platform works.
const STEPS = [
  {
    icon: MousePointerClick,
    title: 'Pick a Quest',
    desc: 'Choose a track — Python, AI, or Robotics — and jump into your first level.',
    color: 'from-purple-500 to-violet-600',
  },
  {
    icon: Code2,
    title: 'Write Real Code',
    desc: 'Solve playful challenges in a real editor and run your code in one click.',
    color: 'from-teal-400 to-cyan-500',
  },
  {
    icon: Trophy,
    title: 'Earn XP & Badges',
    desc: 'Level up, collect badges, and unlock new powers as you master each skill.',
    color: 'from-amber-400 to-orange-500',
  },
];

// Learning tracks shown on the home page. `to` is null for tracks still in the lab.
const TRACKS = [
  {
    emoji: '🐍',
    title: 'Python Programming',
    level: 'Beginner Friendly',
    desc: 'Master the language behind games, AI, and the web — one puzzle at a time.',
    badge: 'bg-green-100 text-green-700',
    ring: 'border-purple-100',
    btn: 'from-purple-600 to-violet-600',
    to: '/course/python/lesson/intro',
  },
  {
    emoji: '🤖',
    title: 'AI & Machine Learning',
    level: 'Explorer',
    desc: 'Train smart models, teach computers to see, and build your own mini-AI.',
    badge: 'bg-blue-100 text-blue-700',
    ring: 'border-teal-100',
    btn: 'from-teal-500 to-cyan-600',
    to: '/courses',
  },
  {
    emoji: '🦾',
    title: 'Robotics',
    level: 'Coming Soon',
    desc: 'Write code that moves robots and brings your creations to life.',
    badge: 'bg-orange-100 text-orange-700',
    ring: 'border-orange-100',
    btn: 'from-orange-500 to-pink-500',
    to: null,
  },
];

const TESTIMONIALS = [
  { quote: 'I built my own number-guessing game on day one. Coding feels like playing!', name: 'Aarav', age: 11, emoji: '🎮' },
  { quote: 'The badges make me want to finish every level. I taught an AI to recognize cats!', name: 'Mia', age: 9, emoji: '🐱' },
  { quote: 'I never thought I could write real Python. Now I help my friends debug theirs.', name: 'Rohan', age: 12, emoji: '🚀' },
];

// A static, animated mock of the in-browser editor — sells the "code it live" promise
// far better than a video and ships zero extra weight.
function CodePreview() {
  return (
    <div className="game-card overflow-hidden rounded-3xl border-2 border-purple-100 bg-[#1E1B2E] shadow-xl">
      {/* Fake window chrome */}
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-red-400" />
        <span className="h-3 w-3 rounded-full bg-amber-400" />
        <span className="h-3 w-3 rounded-full bg-green-400" />
        <span className="ml-2 font-mono text-xs text-white/50">main.py</span>
      </div>

      {/* Code body */}
      <div className="px-5 py-4 font-mono text-sm leading-relaxed">
        <p><span className="text-pink-400">def</span> <span className="text-cyan-300">greet</span><span className="text-white/80">(name):</span></p>
        <p className="pl-4"><span className="text-purple-300">return</span> <span className="text-amber-300">f"Hi {'{name}'}! 👋"</span></p>
        <p className="mt-2"><span className="text-cyan-300">print</span><span className="text-white/80">(greet(</span><span className="text-amber-300">"Coder"</span><span className="text-white/80">))</span></p>
      </div>

      {/* Fake output terminal */}
      <div className="border-t border-white/10 bg-black/30 px-5 py-3 font-mono text-sm">
        <p className="text-white/40">▸ Output</p>
        <p className="text-green-400">
          Hi Coder! 👋
          <span className="ml-1 inline-block h-4 w-2 animate-pulse bg-green-400 align-middle" />
        </p>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col items-center overflow-hidden">
      {/* ============ Hero ============ */}
      <section className="relative w-full overflow-hidden bg-linear-to-b from-background via-[#EDE7FF] to-background">
        {/* 3D scene is heavy + can hurt readability on phones — only show it on larger screens. */}
        <div className="pointer-events-none absolute inset-0 hidden sm:block">
          <Suspense fallback={null}>
            <FloatingScene className="opacity-60" />
          </Suspense>
        </div>

        {/* Soft overlay keeps the hero text crisp on top of the moving shapes. */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(244,241,255,0.85)_0%,rgba(244,241,255,0.45)_55%,transparent_100%)]" />

        <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 py-16 text-center sm:py-28">
          <img
            src={logo}
            alt="Pocket Lab"
            className="animate-logo-float mb-8 h-16 w-auto sm:h-24 drop-shadow-xl"
          />

          <div className="mb-6 inline-flex animate-bounce-in items-center gap-2 rounded-full bg-white/80 px-5 py-2 text-sm font-bold text-purple-700 shadow-md ring-1 ring-purple-200 backdrop-blur">
            <Gamepad2 className="h-4 w-4" />
            Code · AI · Robotics — Learn by Playing!
          </div>

          <h1 className="font-display mb-6 text-4xl font-bold leading-tight tracking-tight sm:text-6xl md:text-7xl">
            <span className="gradient-text">Build the Future</span>
            <br />
            <span className="text-primary">with Code, AI &amp; Robots</span>
            <span className="animate-wiggle ml-3 inline-block">🤖</span>
          </h1>

          <p className="mb-10 max-w-2xl text-base font-semibold text-secondary sm:text-xl">
            Join the quest! Learn programming, train smart AI, and bring robots to life
            by solving fun challenges and running real code. No boring lectures — just play &amp; learn!
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <Link
              to="/courses"
              className="group flex animate-glow items-center gap-2 rounded-2xl bg-linear-to-r from-purple-600 to-violet-600 px-9 py-4 text-lg font-extrabold text-white shadow-lg shadow-purple-300 transition-transform hover:scale-105 active:scale-95"
            >
              <Sparkles className="h-5 w-5" />
              Play &amp; Learn
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#how-it-works"
              className="flex items-center gap-2 rounded-2xl bg-white/80 px-9 py-4 text-lg font-extrabold text-purple-700 shadow-md ring-1 ring-purple-200 backdrop-blur transition-transform hover:scale-105 active:scale-95"
            >
              <Gamepad2 className="h-5 w-5" />
              See How It Works
            </a>
          </div>

          {/* Fun stat chips */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-4">
            {STATS.map(({ icon: Icon, label, value, color }) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-2xl bg-white/80 px-5 py-3 shadow-md ring-1 ring-white backdrop-blur"
              >
                <Icon className={`h-6 w-6 ${color}`} />
                <div className="text-left">
                  <div className="font-display text-xl font-bold text-primary">{value}</div>
                  <div className="text-xs font-bold uppercase tracking-wide text-secondary">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ Superpowers / Features ============ */}
      <section className="w-full bg-white py-24">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="font-display mb-3 text-center text-4xl font-bold text-primary">
            Your Superpowers <span className="animate-wiggle inline-block">💪</span>
          </h2>
          <p className="mb-14 text-center text-lg font-semibold text-secondary">
            Everything you need to become a coding hero!
          </p>

          <div className="grid gap-8 md:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, desc, color }, i) => (
              <div
                key={title}
                className="game-card animate-bounce-in rounded-3xl border-2 border-purple-100 bg-linear-to-b from-white to-purple-50/40 p-8 text-center shadow-lg"
                style={{ animationDelay: `${i * 0.12}s` }}
              >
                <div className={`mx-auto mb-5 flex h-16 w-16 animate-float items-center justify-center rounded-2xl bg-linear-to-br ${color} text-white shadow-lg`}>
                  <Icon className="h-8 w-8" />
                </div>
                <h3 className="font-display mb-2 text-2xl font-semibold text-primary">{title}</h3>
                <p className="font-semibold text-secondary">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ How it works ============ */}
      <section id="how-it-works" className="w-full scroll-mt-20 bg-linear-to-b from-white to-background py-24">
        <div className="mx-auto max-w-5xl px-6">
          <span className="mx-auto mb-3 flex w-fit items-center gap-2 rounded-full bg-purple-100 px-4 py-1.5 text-sm font-extrabold text-purple-700">
            <Sparkles className="h-4 w-4" /> How It Works
          </span>
          <h2 className="font-display mb-3 text-center text-4xl font-bold text-primary">
            Three Steps to Hero <span className="animate-wiggle inline-block">⚡</span>
          </h2>
          <p className="mb-14 text-center text-lg font-semibold text-secondary">
            No setup, no installs — just open and start coding.
          </p>

          <div className="grid gap-8 md:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, desc, color }, i) => (
              <div key={title} className="relative text-center">
                {/* Step number bubble */}
                <span className="font-display absolute -top-3 left-1/2 z-10 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full bg-white text-sm font-extrabold text-purple-600 shadow-md ring-2 ring-purple-100">
                  {i + 1}
                </span>
                <div className="game-card rounded-3xl border-2 border-purple-100 bg-white px-6 pb-8 pt-10 shadow-lg">
                  <div className={`mx-auto mb-5 flex h-16 w-16 animate-float items-center justify-center rounded-2xl bg-linear-to-br ${color} text-white shadow-lg`}>
                    <Icon className="h-8 w-8" />
                  </div>
                  <h3 className="font-display mb-2 text-xl font-semibold text-primary">{title}</h3>
                  <p className="font-semibold text-secondary">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ Featured Quest (video replaced with live code preview) ============ */}
      <section className="w-full bg-background py-24">
        <div className="mx-auto flex max-w-5xl flex-col items-center px-6">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-1.5 text-sm font-extrabold text-amber-700">
            <Star className="h-4 w-4 fill-amber-500 text-amber-500" /> Featured Quest
          </span>
          <h2 className="font-display mb-12 text-center text-4xl font-bold text-primary">
            Begin the Python Journey
          </h2>

          <div className="grid w-full items-center gap-6 md:grid-cols-[minmax(0,1fr)_380px]">
            <div className="game-card relative overflow-hidden rounded-3xl border-2 border-purple-100 bg-white p-8 shadow-xl">
              <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-purple-100/60 blur-2xl" />
              <div className="relative">
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-purple-500 to-violet-600 text-2xl">
                    🐍
                  </span>
                  <h3 className="font-display text-2xl font-semibold text-primary">Python Programming</h3>
                </div>
                <div className="mb-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-extrabold text-green-700">⭐ Beginner Friendly</span>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-extrabold text-blue-700">🎮 Interactive</span>
                </div>
                <p className="mb-6 font-semibold text-secondary">
                  Go from total beginner to building your own programs. Solve puzzles,
                  run code, and unlock a badge at the end of every level!
                </p>
                <ul className="mb-6 space-y-2">
                  {['Run real Python in your browser', 'Earn XP for every challenge', 'Build a project you can show off'].map((item) => (
                    <li key={item} className="flex items-center gap-2 font-semibold text-secondary">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" /> {item}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/course/python/lesson/intro"
                  className="inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-purple-600 to-violet-600 px-6 py-3 font-extrabold text-white shadow-lg shadow-purple-200 transition-transform hover:scale-105 active:scale-95"
                >
                  <Rocket className="h-5 w-5" /> Start Quest
                </Link>
              </div>
            </div>

            <CodePreview />
          </div>
        </div>
      </section>

      {/* ============ Learning tracks ============ */}
      <section className="w-full bg-white py-24">
        <div className="mx-auto max-w-5xl px-6">
          <span className="mx-auto mb-3 flex w-fit items-center gap-2 rounded-full bg-teal-100 px-4 py-1.5 text-sm font-extrabold text-teal-700">
            <Brain className="h-4 w-4" /> Learning Tracks
          </span>
          <h2 className="font-display mb-3 text-center text-4xl font-bold text-primary">
            Pick Your Path <span className="animate-wiggle inline-block">🗺️</span>
          </h2>
          <p className="mb-14 text-center text-lg font-semibold text-secondary">
            Start with Python, then level up into AI and Robotics.
          </p>

          <div className="grid gap-6 md:grid-cols-3">
            {TRACKS.map(({ emoji, title, level, desc, badge, ring, btn, to }, i) => (
              <div
                key={title}
                className={`game-card animate-bounce-in flex flex-col rounded-3xl border-2 bg-white p-6 shadow-lg ${ring}`}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <span className="mb-4 flex h-14 w-14 animate-float items-center justify-center rounded-2xl bg-linear-to-br from-purple-50 to-white text-3xl shadow-sm ring-1 ring-purple-100">
                  {emoji}
                </span>
                <h3 className="font-display mb-2 text-xl font-semibold text-primary">{title}</h3>
                <span className={`mb-4 inline-block self-start rounded-full px-3 py-1 text-xs font-extrabold ${badge}`}>
                  {level}
                </span>
                <p className="mb-5 flex-1 font-semibold text-secondary">{desc}</p>
                {to ? (
                  <Link
                    to={to}
                    className={`flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r ${btn} px-4 py-3 font-extrabold text-white shadow-md transition-transform hover:scale-105 active:scale-95`}
                  >
                    <Rocket className="h-4 w-4" /> Start Track
                  </Link>
                ) : (
                  <span className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-100 px-4 py-3 font-extrabold text-gray-400">
                    <Lock className="h-4 w-4" /> Coming Soon
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ Testimonials ============ */}
      <section className="w-full bg-linear-to-b from-white to-background py-24">
        <div className="mx-auto max-w-5xl px-6">
          <span className="mx-auto mb-3 flex w-fit items-center gap-2 rounded-full bg-pink-100 px-4 py-1.5 text-sm font-extrabold text-pink-700">
            <Heart className="h-4 w-4" /> Loved by Young Coders
          </span>
          <h2 className="font-display mb-14 text-center text-4xl font-bold text-primary">
            What Our Heroes Say <span className="animate-wiggle inline-block">💬</span>
          </h2>

          <div className="grid gap-8 md:grid-cols-3">
            {TESTIMONIALS.map(({ quote, name, age, emoji }, i) => (
              <div
                key={name}
                className="game-card animate-bounce-in relative rounded-3xl border-2 border-purple-100 bg-white p-7 shadow-lg"
                style={{ animationDelay: `${i * 0.12}s` }}
              >
                <Quote className="mb-3 h-8 w-8 text-purple-200" />
                <p className="mb-6 font-semibold text-primary">{quote}</p>
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-linear-to-br from-purple-100 to-pink-100 text-xl">
                    {emoji}
                  </span>
                  <div>
                    <p className="font-display font-bold text-primary">{name}</p>
                    <p className="text-xs font-bold text-secondary">Age {age}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ Final CTA ============ */}
      <section className="w-full bg-background pb-24 pt-4">
        <div className="mx-auto max-w-5xl px-6">
          <div className="animate-glow relative overflow-hidden rounded-4xl bg-linear-to-br from-purple-600 via-violet-600 to-purple-700 px-8 py-16 text-center shadow-2xl">
            <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="relative">
              <span className="mb-4 inline-block animate-float text-5xl">🚀</span>
              <h2 className="font-display mb-3 text-3xl font-bold text-white sm:text-4xl">
                Ready to Start Your Adventure?
              </h2>
              <p className="mx-auto mb-8 max-w-xl text-lg font-semibold text-purple-100">
                Jump in for free and write your very first line of code today.
                Your superpowers are waiting!
              </p>
              <Link
                to="/courses"
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-9 py-4 text-lg font-extrabold text-purple-700 shadow-lg transition-transform hover:scale-105 active:scale-95"
              >
                <Sparkles className="h-5 w-5" /> Start Playing Free
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============ Footer ============ */}
      <footer className="w-full border-t border-border bg-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-6 py-12 sm:flex-row sm:justify-between">
          <div className="flex flex-col items-center gap-3 sm:items-start">
            <img src={logo} alt="Pocket Lab" className="h-10 w-auto" />
            <p className="text-sm font-semibold text-secondary">
              Learn to code, train AI &amp; build robots — by playing.
            </p>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <Link to="/courses" className="text-sm font-bold text-secondary transition-colors hover:text-purple-600">Courses</Link>
            <Link to="/course/python/lesson/intro" className="text-sm font-bold text-secondary transition-colors hover:text-purple-600">Python</Link>
            <Link to="/courses" className="text-sm font-bold text-secondary transition-colors hover:text-purple-600">Tracks</Link>
          </nav>
        </div>
        <div className="border-t border-border py-5 text-center text-xs font-semibold text-secondary">
          © {new Date().getFullYear()} Pocket Lab · Made with 💜 for young coders
        </div>
      </footer>
    </div>
  );
}
