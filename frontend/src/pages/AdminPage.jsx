import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Users, Star, Zap, BookOpen, Trash2, Search, RefreshCw, ShieldCheck,
  MessageSquare, GraduationCap, UserPlus, Mail,
} from 'lucide-react';
import { adminService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const TABS = [
  { key: 'users', label: 'Students', icon: Users },
  { key: 'courses', label: 'Courses', icon: BookOpen },
  { key: 'feedback', label: 'Feedback', icon: MessageSquare },
];

function Stat({ icon: Icon, value, label, sub, tone = 'pcb' }) {
  const toneCls = { pcb: 'bg-pcb', signal: 'bg-signal', wire: 'bg-wire', led: 'bg-led' }[tone];
  return (
    <div className="lab-panel p-5">
      <span className={`mb-3 flex h-11 w-11 items-center justify-center rounded-lg border-2 border-ink ${toneCls}`}>
        <Icon className={`h-5 w-5 ${tone === 'signal' ? 'text-ink' : 'text-white'}`} />
      </span>
      <div className="font-lab text-3xl font-extrabold leading-none text-ink">{value}</div>
      <div className="ref-tag mt-1.5 text-ink/55">{label}</div>
      {sub && <div className="mt-1 text-xs font-bold text-pcb">{sub}</div>}
    </div>
  );
}

function Stars({ rating }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-4 w-4 ${n <= rating ? 'fill-signal text-signal' : 'text-ink/20'}`}
        />
      ))}
    </span>
  );
}

const fmtDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
};

export default function AdminPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('users');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, u, c, f] = await Promise.all([
        adminService.getStats(),
        adminService.getUsers(),
        adminService.getCourseUsage(),
        adminService.getFeedback(100),
      ]);
      setStats(s.data);
      setUsers(u.data);
      setCourses(c.data);
      setFeedback(f.data);
      setError('');
    } catch (err) {
      setError(err?.response?.data?.detail || 'Could not load the dashboard. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the dashboard is a read of server state on mount; the loading flag is what renders the pending UI
    load();
  }, [load]);

  // Filtering happens client-side: the list is small and it keeps typing instant.
  const visibleUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  }, [users, search]);

  const removeUser = async (target) => {
    if (!window.confirm(`Delete ${target.name} (${target.email}) and all their progress? This can't be undone.`)) return;
    try {
      await adminService.deleteUser(target.id);
      setUsers((cur) => cur.filter((u) => u.id !== target.id));
      setStats((cur) => (cur ? { ...cur, total_users: cur.total_users - 1 } : cur));
    } catch (err) {
      setError(err?.response?.data?.detail || 'Could not delete that account.');
    }
  };

  const maxLearners = Math.max(1, ...courses.map((c) => c.learners));

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      {/* Header */}
      <div className="lab-panel-pcb relative mb-8 overflow-hidden px-7 py-6">
        <div
          className="pointer-events-none absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.6) 1px,transparent 1px)',
            backgroundSize: '26px 26px',
          }}
        />
        <div className="relative flex flex-wrap items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-ink bg-signal">
            <ShieldCheck className="h-6 w-6 text-ink" />
          </span>
          <div className="mr-auto">
            <div className="ref-tag text-white/60">Admin console</div>
            <h1 className="font-lab text-2xl font-extrabold text-white">
              Welcome back, {user?.name?.split(' ')[0] || 'Admin'}
            </h1>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="lab-btn flex items-center gap-2 rounded-xl border-2 border-ink bg-signal px-4 py-2.5 font-extrabold text-ink disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <p className="lab-panel mb-6 border-wire p-4 text-center font-bold text-wire">{error}</p>
      )}

      {/* Headline stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat icon={Users} value={stats?.total_users ?? '—'} label="Students" sub={`${stats?.google_users ?? 0} via Google`} />
        <Stat icon={UserPlus} value={stats?.new_users_7d ?? '—'} label="New this week" tone="led" />
        <Stat icon={GraduationCap} value={stats?.lessons_completed ?? '—'} label="Lessons done" sub={`${stats?.assignments_completed ?? 0} assignments`} tone="signal" />
        <Stat
          icon={Star}
          value={stats?.average_rating ?? '—'}
          label="Avg rating"
          sub={`${stats?.feedback_count ?? 0} reviews`}
          tone="wire"
        />
      </div>

      {/* Tabs */}
      <div className="mb-5 flex flex-wrap gap-2">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 rounded-xl border-2 border-ink px-4 py-2.5 font-extrabold transition-colors ${
              tab === key ? 'bg-ink text-white' : 'bg-white text-ink hover:bg-pcb/10'
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {/* ---------------- Students ---------------- */}
      {tab === 'users' && (
        <section className="lab-panel overflow-hidden">
          <div className="flex items-center gap-3 border-b-2 border-ink/10 p-4">
            <Search className="h-4 w-4 shrink-0 text-ink/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full bg-transparent font-semibold text-ink outline-none placeholder:text-ink/40"
            />
            <span className="ref-tag shrink-0 text-ink/45">{visibleUsers.length} shown</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="ref-tag border-b-2 border-ink/10 text-ink/50">
                  <th className="p-4">Student</th>
                  <th className="p-4">Joined</th>
                  <th className="p-4">XP</th>
                  <th className="p-4">Lessons</th>
                  <th className="p-4">Labs</th>
                  <th className="p-4">Projects</th>
                  <th className="p-4" />
                </tr>
              </thead>
              <tbody>
                {visibleUsers.map((u) => (
                  <tr key={u.id} className="border-b border-ink/5 last:border-0 hover:bg-pcb/5">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-ink bg-pcb font-lab text-sm font-extrabold text-white">
                          {u.name?.[0]?.toUpperCase() || '?'}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 font-extrabold text-ink">
                            <span className="truncate">{u.name}</span>
                            {u.is_admin && (
                              <span className="rounded-md border border-ink bg-signal px-1.5 py-0.5 text-[10px] font-extrabold uppercase text-ink">
                                Admin
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 truncate text-xs font-semibold text-ink/50">
                            <Mail className="h-3 w-3 shrink-0" /> {u.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm font-semibold text-ink/60">{fmtDate(u.created_at)}</td>
                    <td className="p-4 font-lab font-extrabold text-ink">{u.total_xp}</td>
                    <td className="p-4 font-semibold text-ink/70">{u.lessons_completed}</td>
                    <td className="p-4 font-semibold text-ink/70">{u.labs_completed}</td>
                    <td className="p-4 font-semibold text-ink/70">{u.projects_completed}</td>
                    <td className="p-4 text-right">
                      {!u.is_admin && (
                        <button
                          onClick={() => removeUser(u)}
                          className="rounded-lg p-2 text-ink/35 transition-colors hover:bg-wire/10 hover:text-wire"
                          aria-label={`Delete ${u.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {!loading && visibleUsers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center font-bold text-ink/45">
                      No students match that search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ---------------- Courses ---------------- */}
      {tab === 'courses' && (
        <section className="lab-panel p-6">
          <p className="mb-5 text-sm font-semibold text-ink/55">
            How many students have completed at least one item in each course.
          </p>
          <div className="space-y-4">
            {courses.map((c) => (
              <div key={c.course_id}>
                <div className="mb-1.5 flex items-baseline justify-between gap-3">
                  <span className="font-extrabold text-ink">{c.title}</span>
                  <span className="ref-tag text-ink/50">
                    {c.learners} {c.learners === 1 ? 'learner' : 'learners'} · {c.items_completed} done
                  </span>
                </div>
                <div className="h-3.5 overflow-hidden rounded-full border-2 border-ink bg-paper">
                  <div
                    className="h-full rounded-r-full bg-pcb transition-[width] duration-700"
                    style={{ width: `${Math.round((c.learners / maxLearners) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
            {!loading && courses.length === 0 && (
              <p className="py-6 text-center font-bold text-ink/45">No course activity yet.</p>
            )}
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat icon={Zap} value={stats?.total_xp ?? '—'} label="Total XP" tone="signal" />
            <Stat icon={BookOpen} value={stats?.labs_completed ?? '—'} label="Labs done" tone="led" />
            <Stat icon={GraduationCap} value={stats?.projects_completed ?? '—'} label="Projects done" />
            <Stat icon={Users} value={stats?.active_users_7d ?? '—'} label="Started learning" tone="wire" />
          </div>
        </section>
      )}

      {/* ---------------- Feedback ---------------- */}
      {tab === 'feedback' && (
        <section className="space-y-4">
          {feedback.map((f) => (
            <article key={f.id} className="lab-panel p-5">
              <div className="mb-2 flex flex-wrap items-center gap-3">
                <Stars rating={f.rating} />
                <span className="font-extrabold text-ink">{f.user_email || 'Anonymous'}</span>
                {f.course_id && (
                  <span className="rounded-md border-2 border-ink bg-paper px-2 py-0.5 text-xs font-extrabold text-ink">
                    {f.course_id}
                  </span>
                )}
                <span className="ref-tag ml-auto text-ink/45">{fmtDate(f.created_at)}</span>
              </div>
              {f.comment ? (
                <p className="font-semibold text-ink/75">“{f.comment}”</p>
              ) : (
                <p className="text-sm font-semibold italic text-ink/40">No comment left.</p>
              )}
            </article>
          ))}
          {!loading && feedback.length === 0 && (
            <p className="lab-panel p-8 text-center font-bold text-ink/45">No feedback yet.</p>
          )}
        </section>
      )}
    </div>
  );
}
