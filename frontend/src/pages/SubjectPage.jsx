import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Sparkles, Lock, GraduationCap } from 'lucide-react';

// Placeholder subjects — math & science both offer class 8, 9, 10.
const SUBJECTS = {
  math: {
    title: 'Math',
    emoji: '🔢',
    tagline: 'Level up your number skills with fun challenges.',
    accent: 'from-purple-500 to-violet-600',
    soft: 'bg-purple-100 text-purple-700',
    glow: 'bg-purple-200/50',
  },
  science: {
    title: 'Science',
    emoji: '🔬',
    tagline: 'Explore experiments and discover how the world works.',
    accent: 'from-emerald-500 to-green-600',
    soft: 'bg-emerald-100 text-emerald-700',
    glow: 'bg-emerald-200/50',
  },
};

const CLASSES = [
  { grade: 8, emoji: '📗', label: 'Class 8' },
  { grade: 9, emoji: '📘', label: 'Class 9' },
  { grade: 10, emoji: '📕', label: 'Class 10' },
];

export default function SubjectPage() {
  const { subject } = useParams();
  const info = SUBJECTS[subject];
  const [picked, setPicked] = useState(null);

  if (!info) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-4 px-6 py-24 text-center">
        <span className="text-5xl">🧭</span>
        <p className="font-display text-lg font-semibold text-[#6C63A6]">
          Hmm, we couldn't find that subject.
        </p>
        <Link
          to="/courses"
          className="rounded-2xl bg-gradient-to-r from-purple-600 to-violet-600 px-5 py-2.5 font-extrabold text-white shadow-md transition-transform hover:scale-105 active:scale-95"
        >
          Back to Quests
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-14">
      <Link
        to="/courses"
        className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[#6C63A6] transition-colors hover:text-purple-600"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Quests
      </Link>

      <div className={`mb-3 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-extrabold ${info.soft}`}>
        <Sparkles className="h-4 w-4" /> Choose Your Class
      </div>
      <h1 className="font-display mb-3 text-3xl font-bold text-[#2D2A4A] sm:text-4xl">
        {info.title} <span className="animate-wiggle inline-block">{info.emoji}</span>
      </h1>
      <p className="mb-10 max-w-2xl text-base font-semibold text-[#6C63A6] sm:text-lg">
        {info.tagline} Pick your class to begin — new lessons are being added soon!
      </p>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {CLASSES.map(({ grade, emoji, label }, i) => (
          <button
            key={grade}
            type="button"
            onClick={() => setPicked(grade)}
            className={`game-card animate-bounce-in relative flex flex-col overflow-hidden rounded-3xl border-2 border-purple-200 bg-white p-6 text-left shadow-lg transition-transform hover:scale-[1.02] active:scale-95 ${
              picked === grade ? 'ring-2 ring-purple-400' : ''
            }`}
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl ${info.glow}`} />
            <div className="relative flex flex-1 flex-col">
              <span className="mb-4 flex h-14 w-14 animate-float items-center justify-center rounded-2xl bg-gradient-to-br from-purple-50 to-white text-3xl shadow-sm ring-1 ring-purple-100">
                {emoji}
              </span>
              <h3 className="font-display mb-2 text-xl font-semibold text-[#2D2A4A]">{label}</h3>
              <p className="mb-5 flex-1 font-semibold text-[#6C63A6]">
                {info.title} lessons and quizzes made for {label}.
              </p>
              <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-purple-100 px-3 py-1 text-xs font-extrabold text-purple-700">
                <GraduationCap className="h-3.5 w-3.5" /> Grade {grade}
              </span>
            </div>
          </button>
        ))}
      </div>

      {picked && (
        <div className="mt-10 flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-purple-200 bg-white/60 p-10 text-center">
          <span className="animate-float text-5xl">🚧</span>
          <h2 className="font-display text-xl font-bold text-[#2D2A4A]">
            {info.title} · Class {picked} is on the way!
          </h2>
          <p className="max-w-md font-semibold text-[#6C63A6]">
            We're busy building awesome lessons for this class. Check back soon to
            start your quest!
          </p>
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-xs font-extrabold text-purple-700">
            <Lock className="h-3 w-3" /> Coming Soon
          </span>
        </div>
      )}
    </div>
  );
}
