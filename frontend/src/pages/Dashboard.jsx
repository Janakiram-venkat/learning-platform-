import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, BookOpen, Layers, Gamepad2, Hammer, FlaskConical,
  Award, Zap, CalendarDays, Mail, Trophy, Star, Rocket, Heart, Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { INTERESTS } from '../constants/interests';
import {
  getXP, getLevelInfo, getCompletedLessons, getCompletedAssignments,
  getCompletedProjects, getCompletedLabs,
} from '../utils/progress';

const prefersReduced = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Read + JSON-parse a localStorage value, falling back on missing/corrupt data.
function readJSON(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

// Count-up that eases a number from 0 → target on mount.
function useCountUp(target, duration = 900) {
  const [val, setVal] = useState(() => (prefersReduced() ? target : 0));
  useEffect(() => {
    if (prefersReduced() || target === 0) return undefined;
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

// A bench gauge: big count-up number over a mono label.
function Gauge({ icon: Icon, value, label, sub, tone = 'pcb' }) {
  const n = useCountUp(value);
  const toneCls = { pcb: 'bg-pcb', signal: 'bg-signal text-ink', wire: 'bg-wire', led: 'bg-led', ink: 'bg-ink' }[tone];
  const iconInk = tone === 'signal';
  return (
    <div className="lab-panel lab-lift p-5">
      <span className={`mb-3 flex h-11 w-11 items-center justify-center rounded-lg border-2 border-ink ${toneCls}`}>
        <Icon className={`h-5 w-5 ${iconInk ? 'text-ink' : 'text-white'}`} />
      </span>
      <div className="font-lab text-3xl font-extrabold leading-none text-ink">{n}</div>
      <div className="ref-tag mt-1.5 text-ink/55">{label}</div>
      {sub && <div className="mt-1 text-xs font-bold text-pcb">{sub}</div>}
    </div>
  );
}

// The animated XP dial — sweeps from empty to the level's fill on mount.
function XPRing({ level, intoLevel, perLevel }) {
  const R = 54;
  const C = 2 * Math.PI * R;
  const pct = Math.max(0, Math.min(1, intoLevel / perLevel));
  const [mounted, setMounted] = useState(prefersReduced());
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 90);
    return () => clearTimeout(t);
  }, []);
  const offset = mounted ? C * (1 - pct) : C;
  return (
    <div className="relative h-[150px] w-[150px] shrink-0">
      <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
        <circle cx="70" cy="70" r={R} fill="none" stroke="rgba(22,36,29,0.14)" strokeWidth="13" />
        <circle
          cx="70" cy="70" r={R} fill="none" stroke="#FFC93C" strokeWidth="13" strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={offset} className="ring-progress"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <span className="ref-tag text-white/60">Level</span>
        <span className="font-lab text-5xl font-extrabold leading-none">{level}</span>
      </div>
    </div>
  );
}

function BadgeTile({ badge, index }) {
  const isArcade = badge.type === 'arcade';
  const Icon = isArcade ? Gamepad2 : Award;
  const disc = isArcade ? 'bg-led' : 'bg-signal';
  const iconCls = isArcade ? 'text-white' : 'text-ink';
  const when = badge.earnedAt
    ? new Date(badge.earnedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : null;
  return (
    <div
      className="badge-pop lab-panel lab-lift flex items-center gap-3 p-4"
      style={{ animationDelay: `${Math.min(index, 12) * 0.06}s` }}
    >
      <span className={`badge-shine flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-ink ${disc} shadow`}>
        <Icon className={`h-6 w-6 ${iconCls}`} strokeWidth={2.5} />
      </span>
      <div className="min-w-0">
        <p className="truncate font-lab font-bold text-ink">{badge.name}</p>
        <p className="ref-tag text-ink/50">{isArcade ? 'Arcade badge' : 'Module badge'}{when ? ` · ${when}` : ''}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();

  // Read the saved progress once when the page mounts.
  const data = useMemo(() => {
    const badges = readJSON('earnedBadges', []);
    const starMap = readJSON('assignmentStars', {});
    const stars = Object.values(starMap).reduce((a, b) => a + (Number(b) || 0), 0);
    const xp = getXP();
    return {
      badges,
      stars,
      xp,
      ...getLevelInfo(xp),
      lessons: getCompletedLessons().length,
      modules: badges.filter((b) => b.type === 'module').length,
      challenges: getCompletedAssignments().length,
      projects: getCompletedProjects().length,
      labs: getCompletedLabs().length,
    };
  }, []);

  // Signed-out state — a friendly gate rather than a blank page.
  if (!user) {
    return (
      <div className="bench-grid flex min-h-[calc(100vh-64px)] w-full flex-col items-center justify-center px-6 py-20 text-center">
        <div className="lab-panel max-w-md p-8">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg border-2 border-ink bg-signal">
            <Lock className="h-6 w-6 text-ink" />
          </span>
          <h1 className="font-lab mb-2 text-2xl font-extrabold text-ink">Sign in to see your bench</h1>
          <p className="mb-6 font-semibold text-ink/65">
            Your XP, badges, and progress live here once you're signed in. Head back and hit “Sign in” up top.
          </p>
          <Link
            to="/"
            className="lab-btn inline-flex items-center gap-2 rounded-xl border-2 border-ink bg-signal px-6 py-3 font-extrabold text-ink"
          >
            <ArrowLeft className="h-5 w-5" /> Back to Pocket Lab
          </Link>
        </div>
      </div>
    );
  }

  const myInterests = (user.interests || [])
    .map((key) => INTERESTS.find((i) => i.key === key))
    .filter(Boolean);
  const joined = user.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    : '—';

  return (
    <div className="bench-grid min-h-[calc(100vh-64px)] w-full">
      <div className="mx-auto max-w-6xl px-6 py-10 sm:py-12">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-ink/60 transition-colors hover:text-pcb">
          <ArrowLeft className="h-4 w-4" /> Back to Pocket Lab
        </Link>

        <span className="mb-4 inline-flex items-center gap-2 rounded-md border-2 border-ink bg-white px-3 py-1 ref-tag text-ink">
          <span className="led" style={{ color: '#1F7A5C' }} /> Progress bench
        </span>

        {/* Profile + XP hero */}
        <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
          {/* Who */}
          <div className="lab-panel flex flex-col p-6">
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border-2 border-ink bg-pcb font-lab text-2xl font-extrabold text-white">
                {user.name?.[0]?.toUpperCase() || '?'}
              </span>
              <div className="min-w-0">
                <h1 className="font-lab truncate text-2xl font-extrabold text-ink">{user.name}</h1>
                <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-ink/60">
                  <Mail className="h-3.5 w-3.5 shrink-0" /> {user.email}
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 ref-tag text-ink/45">
                  <CalendarDays className="h-3 w-3 shrink-0" /> Joined {joined}
                </p>
              </div>
            </div>

            {myInterests.length > 0 && (
              <div className="mt-5 border-t-2 border-dashed border-ink/15 pt-4">
                <p className="mb-2 flex items-center gap-1.5 ref-tag text-ink/50">
                  <Heart className="h-3.5 w-3.5" /> Interests
                </p>
                <div className="flex flex-wrap gap-2">
                  {myInterests.map(({ key, label, emoji }) => (
                    <span key={key} className="inline-flex items-center gap-1 rounded-md border-2 border-ink/15 bg-white px-2.5 py-1 text-xs font-bold text-ink">
                      <span>{emoji}</span> {label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* XP dial */}
          <div className="lab-panel-pcb flex flex-col items-center gap-6 p-6 sm:flex-row">
            <XPRing level={data.level} intoLevel={data.intoLevel} perLevel={data.perLevel} />
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center gap-2 sm:justify-start">
                <Zap className="h-5 w-5 fill-signal text-signal" />
                <span className="font-lab text-2xl font-extrabold text-white">{data.xp} XP</span>
              </div>
              <p className="mt-1 font-semibold text-white/80">
                {data.toNext} XP to Level {data.level + 1}
              </p>
              {/* Progress bar */}
              <div className="mt-4 h-3 w-full overflow-hidden rounded-full border-2 border-ink bg-ink/40">
                <div
                  className="ring-progress h-full rounded-full bg-signal"
                  style={{ width: `${(data.intoLevel / data.perLevel) * 100}%` }}
                />
              </div>
              <div className="mt-1.5 flex justify-between ref-tag text-white/60">
                <span>Lv {data.level}</span>
                <span>{data.intoLevel}/{data.perLevel}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stat gauges */}
        <h2 className="font-lab mb-4 mt-10 text-xl font-extrabold text-ink">Your readouts</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <Gauge icon={BookOpen} value={data.lessons} label="Lessons" tone="pcb" />
          <Gauge icon={Layers} value={data.modules} label="Modules" tone="ink" />
          <Gauge icon={Gamepad2} value={data.challenges} label="Challenges" tone="led"
            sub={data.stars > 0 ? `${data.stars}★ collected` : null} />
          <Gauge icon={Hammer} value={data.projects} label="Projects" tone="wire" />
          <Gauge icon={FlaskConical} value={data.labs} label="Labs" tone="signal" />
        </div>

        {/* Badges */}
        <div className="mt-10 flex items-center justify-between">
          <h2 className="font-lab text-xl font-extrabold text-ink">Badge shelf</h2>
          <span className="inline-flex items-center gap-1.5 ref-tag text-ink/55">
            <Trophy className="h-4 w-4 text-signal" /> {data.badges.length} earned
          </span>
        </div>

        {data.badges.length === 0 ? (
          <div className="mt-4 lab-panel flex flex-col items-center gap-3 p-10 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-ink/30 text-ink/40">
              <Award className="h-6 w-6" />
            </span>
            <p className="font-lab text-lg font-bold text-ink">No badges yet</p>
            <p className="max-w-sm font-semibold text-ink/60">
              Finish every lesson in a module to earn your first badge. It'll show up right here.
            </p>
            <Link to="/#tracks" className="lab-btn mt-1 inline-flex items-center gap-2 rounded-xl border-2 border-ink bg-signal px-5 py-2.5 font-extrabold text-ink">
              <Rocket className="h-4 w-4" /> Start a module
            </Link>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.badges.map((b, i) => <BadgeTile key={b.id} badge={b} index={i} />)}
          </div>
        )}

        {/* Keep going */}
        <div className="lab-panel-pcb relative mt-10 overflow-hidden px-8 py-10 text-center">
          <div className="pointer-events-none absolute inset-0 opacity-15"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.6) 1px,transparent 1px)', backgroundSize: '28px 28px' }} />
          <div className="relative">
            <h2 className="font-lab mb-2 text-2xl font-extrabold text-white">Keep the streak going</h2>
            <p className="mx-auto mb-6 max-w-md font-semibold text-white/85">
              Every lesson adds XP and gets you closer to the next badge. Pick up where you left off.
            </p>
            <Link to="/#tracks" className="lab-btn inline-flex items-center gap-2 rounded-xl border-2 border-ink bg-signal px-7 py-3.5 text-lg font-extrabold text-ink">
              <Star className="h-5 w-5 fill-ink" /> Keep learning
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
