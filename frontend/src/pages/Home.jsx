import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Terminal, Bot, Cpu, Rocket, Sparkles, Gamepad2, Star, Zap, Heart } from 'lucide-react';

// Three.js is heavy — load it lazily so hero text paints instantly.
const FloatingScene = lazy(() => import('../components/three/FloatingScene'));

const FEATURES = [
  {
    icon: Terminal,
    title: 'Code & Play',
    desc: 'Write real code right in your browser and watch it come alive instantly!',
    color: 'from-purple-500 to-violet-600',
    bg: 'bg-purple-100 text-purple-600',
  },
  {
    icon: Bot,
    title: 'Train AI & Robots',
    desc: 'Teach smart programs and control friendly robots with the code you write.',
    color: 'from-orange-400 to-pink-500',
    bg: 'bg-orange-100 text-orange-600',
  },
  {
    icon: Cpu,
    title: 'Build Real Projects',
    desc: 'Go from zero to building AI, games, and robotics projects of your own.',
    color: 'from-teal-400 to-cyan-500',
    bg: 'bg-teal-100 text-teal-600',
  },
];

const STATS = [
  { icon: Star, label: 'Fun Lessons', value: '50+', color: 'text-amber-500' },
  { icon: Zap, label: 'Live Coding', value: '∞', color: 'text-purple-500' },
  { icon: Heart, label: 'Made for Kids', value: '100%', color: 'text-pink-500' },
];

export default function Home() {
  return (
    <div className="flex flex-col items-center overflow-hidden">
      {/* Hero Section with Three.js background */}
      <section className="relative w-full overflow-hidden bg-gradient-to-b from-[#F4F1FF] via-[#EDE7FF] to-[#F4F1FF]">
        {/* 3D scene is heavy + can hurt readability on phones — only show it on larger screens. */}
        <div className="pointer-events-none absolute inset-0 hidden sm:block">
          <Suspense fallback={null}>
            <FloatingScene className="opacity-60" />
          </Suspense>
        </div>

        {/* Soft overlay keeps the hero text crisp on top of the moving shapes. */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(244,241,255,0.85)_0%,rgba(244,241,255,0.45)_55%,transparent_100%)]" />

        <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 py-16 text-center sm:py-28">
          <div className="mb-6 inline-flex animate-bounce-in items-center gap-2 rounded-full bg-white/80 px-5 py-2 text-sm font-bold text-purple-700 shadow-md ring-1 ring-purple-200 backdrop-blur">
            <Gamepad2 className="h-4 w-4" />
            Code · AI · Robotics — Learn by Playing!
          </div>

          <h1 className="font-display mb-6 text-4xl font-bold leading-tight tracking-tight sm:text-6xl md:text-7xl">
            <span className="gradient-text">Build the Future</span>
            <br />
            <span className="text-[#2D2A4A]">with Code, AI &amp; Robots</span>
            <span className="animate-wiggle ml-3 inline-block">🤖</span>
          </h1>

          <p className="mb-10 max-w-2xl text-base font-semibold text-[#6C63A6] sm:text-xl">
            Join the quest! Learn programming, train smart AI, and bring robots to life
            by solving fun challenges and running real code. No boring lectures — just play &amp; learn!
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <Link
              to="/courses"
              className="group flex animate-glow items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-600 px-9 py-4 text-lg font-extrabold text-white shadow-lg shadow-purple-300 transition-transform hover:scale-105 active:scale-95"
            >
              <Sparkles className="h-5 w-5" />
              Play & Learn
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/course/python/lesson/intro"
              className="rounded-2xl bg-white px-9 py-4 text-lg font-extrabold text-purple-700 shadow-md ring-2 ring-purple-200 transition-transform hover:scale-105 active:scale-95"
            >
              Quick Start ⚡
            </Link>
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
                  <div className="font-display text-xl font-bold text-[#2D2A4A]">{value}</div>
                  <div className="text-xs font-bold uppercase tracking-wide text-[#6C63A6]">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Power-ups / Benefits Section */}
      <section className="w-full bg-white py-24">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="font-display mb-3 text-center text-4xl font-bold text-[#2D2A4A]">
            Your Superpowers <span className="animate-wiggle inline-block">💪</span>
          </h2>
          <p className="mb-14 text-center text-lg font-semibold text-[#6C63A6]">
            Everything you need to become a coding hero!
          </p>

          <div className="grid gap-8 md:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, desc, color }, i) => (
              <div
                key={title}
                className="game-card animate-bounce-in rounded-3xl border-2 border-purple-100 bg-gradient-to-b from-white to-purple-50/40 p-8 text-center shadow-lg"
                style={{ animationDelay: `${i * 0.12}s` }}
              >
                <div className={`mx-auto mb-5 flex h-16 w-16 animate-float items-center justify-center rounded-2xl bg-gradient-to-br ${color} text-white shadow-lg`}>
                  <Icon className="h-8 w-8" />
                </div>
                <h3 className="font-display mb-2 text-2xl font-semibold text-[#2D2A4A]">{title}</h3>
                <p className="font-semibold text-[#6C63A6]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Quest */}
      <section className="w-full bg-gradient-to-b from-white to-[#F4F1FF] py-24">
        <div className="mx-auto flex max-w-5xl flex-col items-center px-6">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-1.5 text-sm font-extrabold text-amber-700">
            <Star className="h-4 w-4 fill-amber-500 text-amber-500" /> Featured Quest
          </span>
          <h2 className="font-display mb-12 text-center text-4xl font-bold text-[#2D2A4A]">
            Begin the Python Journey
          </h2>

          <div className="grid w-full items-stretch gap-6 md:grid-cols-[minmax(0,1fr)_340px]">
            <div className="game-card relative overflow-hidden rounded-3xl border-2 border-purple-100 bg-white p-8 shadow-xl">
              <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-purple-100/60 blur-2xl" />
              <div className="relative">
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 text-2xl">
                    🐍
                  </span>
                  <h3 className="font-display text-2xl font-semibold text-[#2D2A4A]">Python Programming</h3>
                </div>
                <div className="mb-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-extrabold text-green-700">⭐ Beginner Friendly</span>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-extrabold text-blue-700">🎮 Interactive</span>
                </div>
                <p className="mb-6 font-semibold text-[#6C63A6]">
                  Go from total beginner to building your own programs. Solve puzzles,
                  run code, and unlock a badge at the end of every level!
                </p>
                <Link
                  to="/course/python/lesson/intro"
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-600 px-6 py-3 font-extrabold text-white shadow-lg shadow-purple-200 transition-transform hover:scale-105 active:scale-95"
                >
                  <Rocket className="h-5 w-5" /> Start Quest
                </Link>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border-2 border-purple-100 bg-white shadow-xl">
              <div className="aspect-video bg-gray-900">
                <iframe
                  className="h-full w-full"
                  src="https://www.youtube-nocookie.com/embed/Pih0lGbE5GI?rel=0"
                  title="Python programming video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
              <div className="p-5 text-center">
                <p className="font-display text-lg font-semibold text-[#2D2A4A]">🎬 Watch the Intro</p>
                <p className="text-sm font-semibold text-[#6C63A6]">See what your adventure looks like!</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
