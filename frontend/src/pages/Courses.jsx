import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Play, Sparkles, Cpu, Lock, Calculator, FlaskConical } from 'lucide-react';
import { courseService } from '../services/api';

// Rotating friendly accent colors + emojis so each course card feels unique.
const CARD_THEMES = [
  { ring: 'border-purple-200', badge: 'bg-purple-100 text-purple-700', btn: 'from-purple-600 to-violet-600', glow: 'bg-purple-200/50', emoji: '🐍' },
  { ring: 'border-teal-200', badge: 'bg-teal-100 text-teal-700', btn: 'from-teal-500 to-cyan-600', glow: 'bg-teal-200/50', emoji: '🚀' },
  { ring: 'border-orange-200', badge: 'bg-orange-100 text-orange-700', btn: 'from-orange-500 to-pink-500', glow: 'bg-orange-200/50', emoji: '🎮' },
  { ring: 'border-pink-200', badge: 'bg-pink-100 text-pink-700', btn: 'from-pink-500 to-rose-500', glow: 'bg-pink-200/50', emoji: '⭐' },
];

// Tracks we're building next — shown as "coming soon" teasers below the live courses.
const COMING_SOON = [
  { icon: Cpu, title: 'Robotics', desc: 'Write code that moves robots in the real world.', accent: 'from-teal-400 to-cyan-500', bg: 'bg-teal-100 text-teal-600' },
  { icon: Calculator, title: 'Math', desc: 'Level up your number skills with fun challenges.', accent: 'from-purple-400 to-violet-500', bg: 'bg-purple-100 text-purple-600', to: '/subject/math' },
  { icon: FlaskConical, title: 'Science', desc: 'Explore experiments and discover how the world works.', accent: 'from-emerald-400 to-green-500', bg: 'bg-emerald-100 text-emerald-600', to: '/subject/science' },
];

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    courseService.getCourses()
      .then(res => {
        setCourses(res.data.data);
      })
      .catch(err => {
        console.error("Failed to load courses:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24">
        <div className="animate-float text-5xl">🎲</div>
        <p className="font-display text-lg font-semibold text-[#6C63A6]">Loading your quests...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-14">
      <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-purple-100 px-4 py-1.5 text-sm font-extrabold text-purple-700">
        <Sparkles className="h-4 w-4" /> Pick Your Adventure
      </div>
      <h1 className="font-display mb-3 text-3xl font-bold text-[#2D2A4A] sm:text-4xl">
        Choose a Quest <span className="animate-wiggle inline-block">🗺️</span>
      </h1>
      <p className="mb-10 max-w-2xl text-base font-semibold text-[#6C63A6] sm:text-lg">
        Start your journey with real programming. Master the fundamentals in Python,
        then level up into AI and robotics as new tracks unlock!
      </p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course, i) => {
          const theme = CARD_THEMES[i % CARD_THEMES.length];
          return (
            <div
              key={course.courseId}
              className={`game-card animate-bounce-in relative flex flex-col overflow-hidden rounded-3xl border-2 bg-white p-6 shadow-lg ${theme.ring}`}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl ${theme.glow}`} />
              <div className="relative flex flex-1 flex-col">
                <span className="mb-4 flex h-14 w-14 animate-float items-center justify-center rounded-2xl bg-gradient-to-br from-purple-50 to-white text-3xl shadow-sm ring-1 ring-purple-100">
                  {course.emoji || theme.emoji}
                </span>
                <h3 className="font-display mb-2 text-xl font-semibold text-[#2D2A4A]">{course.title}</h3>
                <span className={`mb-4 inline-block self-start rounded-full px-3 py-1 text-xs font-extrabold ${theme.badge}`}>
                  {course.level}
                </span>
                <p className="mb-5 flex-1 font-semibold text-[#6C63A6]">{course.description}</p>
                <div className="mb-5 flex items-center gap-1.5 text-sm font-bold text-[#6C63A6]">
                  <Clock className="h-4 w-4" /> {course.estimatedHours} Hours of Fun
                </div>
                {/* Hardcoded link to intro lesson for MVP */}
                <Link
                  to={`/course/${course.courseId}/lesson/intro`}
                  className={`flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r ${theme.btn} px-4 py-3 font-extrabold text-white shadow-md transition-transform hover:scale-105 active:scale-95`}
                >
                  <Play className="h-4 w-4 fill-white" /> Start Quest
                </Link>
              </div>
            </div>
          );
        })}
        {courses.length === 0 && (
          <div className="col-span-full flex flex-col items-center gap-3 py-16 text-center">
            <span className="text-5xl">📭</span>
            <p className="font-display text-lg font-semibold text-[#6C63A6]">No quests available yet — check back soon!</p>
          </div>
        )}
      </div>

      {/* Coming soon — AI & Robotics tracks */}
      <div className="mt-16">
        <h2 className="font-display mb-1 text-2xl font-bold text-[#2D2A4A]">
          Coming Soon <span className="animate-wiggle inline-block">🔭</span>
        </h2>
        <p className="mb-6 text-sm font-semibold text-[#6C63A6]">
          New quests are in the lab — get ready to level up!
        </p>
        <div className="grid gap-6 sm:grid-cols-2">
          {COMING_SOON.map(({ icon: Icon, title, desc, accent, bg, to }) => {
            const cardContent = (
              <>
                <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} text-white shadow-md`}>
                  <Icon className="h-7 w-7" />
                </span>
                <div className="flex-1">
                  <h3 className="font-display text-lg font-semibold text-[#2D2A4A]">{title}</h3>
                  <p className="text-sm font-semibold text-[#6C63A6]">{desc}</p>
                </div>
                {to ? (
                  <span className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-extrabold ${bg}`}>
                    <Play className="h-3 w-3 fill-current" /> Explore
                  </span>
                ) : (
                  <span className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-extrabold ${bg}`}>
                    <Lock className="h-3 w-3" /> Soon
                  </span>
                )}
              </>
            );

            return to ? (
              <Link
                key={title}
                to={to}
                className="relative flex items-center gap-4 overflow-hidden rounded-3xl border-2 border-dashed border-purple-200 bg-white/60 p-6 transition-transform hover:scale-[1.02] active:scale-95"
              >
                {cardContent}
              </Link>
            ) : (
              <div
                key={title}
                className="relative flex items-center gap-4 overflow-hidden rounded-3xl border-2 border-dashed border-purple-200 bg-white/60 p-6"
              >
                {cardContent}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
