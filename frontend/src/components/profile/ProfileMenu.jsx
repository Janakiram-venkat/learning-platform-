import { useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getXP, getLevelInfo } from '../../utils/progress';
import { INTERESTS } from '../../constants/interests';
import { Award, LogOut, Mail, CalendarDays, Layers, Zap, Heart, Settings, LayoutDashboard } from 'lucide-react';

export default function ProfileMenu({ open, onClose, onOpenSettings }) {
  const { user, signOut } = useAuth();
  const ref = useRef(null);

  // Close when clicking outside the popup.
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  const badges = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('earnedBadges') || '[]');
    } catch {
      return [];
    }
  }, [open]); // re-read each time the popup opens

  // Modules done = module badges earned (one badge is awarded per finished module).
  const moduleCount = useMemo(
    () => badges.filter((b) => b.type === 'module').length,
    [badges]
  );

  // XP / level — re-read each time the popup opens.
  const { xp, level, intoLevel, perLevel } = useMemo(() => {
    const x = getXP();
    const info = getLevelInfo(x);
    return { xp: x, ...info };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open || !user) return null;

  // Map stored interest keys back to their emoji + label for display.
  const myInterests = (user.interests || [])
    .map((key) => INTERESTS.find((i) => i.key === key))
    .filter(Boolean);

  const joined = user.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    : '—';

  return (
    <div
      ref={ref}
      className="absolute right-0 top-12 z-50 w-80 origin-top-right rounded-2xl border-2 border-ink bg-white shadow-[6px_6px_0_rgba(22,36,29,0.9)] animate-[popIn_0.25s_cubic-bezier(0.34,1.56,0.64,1)]"
    >
      {/* Header */}
      <div className="flex items-center gap-3 border-b-2 border-ink/12 p-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-ink bg-pcb font-lab text-lg font-extrabold text-white">
          {user.name?.[0]?.toUpperCase() || '?'}
        </div>
        <div className="min-w-0">
          <p className="font-lab truncate font-bold text-ink">{user.name}</p>
          <p className="flex items-center gap-1 truncate text-sm text-ink/55">
            <Mail className="h-3.5 w-3.5 shrink-0" /> {user.email}
          </p>
          <p className="mt-0.5 flex items-center gap-1 ref-tag text-ink/40">
            <CalendarDays className="h-3 w-3 shrink-0" /> Joined {joined}
          </p>
        </div>
      </div>

      {/* Level / XP progress */}
      <div className="px-5 pt-4">
        <div className="rounded-xl border-2 border-ink bg-pcb p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-lab font-extrabold text-white">
              <Zap className="h-4 w-4 fill-signal text-signal" /> Level {level}
            </span>
            <span className="text-sm font-bold text-white/85">{xp} XP</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full border border-ink bg-ink/40">
            <div
              className="h-full rounded-full bg-signal transition-all duration-500"
              style={{ width: `${(intoLevel / perLevel) * 100}%` }}
            />
          </div>
          <p className="mt-1.5 ref-tag text-white/70">{perLevel - intoLevel} XP to Level {level + 1}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 px-5 py-4">
        <div className="rounded-xl border-2 border-ink/12 bg-paper p-3">
          <Layers className="mb-1 h-5 w-5 text-pcb" />
          <p className="font-lab text-xl font-extrabold text-ink">{moduleCount}</p>
          <p className="ref-tag text-ink/50">Modules done</p>
        </div>
        <div className="rounded-xl border-2 border-ink/12 bg-paper p-3">
          <Award className="mb-1 h-5 w-5 text-signal" />
          <p className="font-lab text-xl font-extrabold text-ink">{badges.length}</p>
          <p className="ref-tag text-ink/50">Badges</p>
        </div>
      </div>

      {/* Interests */}
      {myInterests.length > 0 && (
        <div className="px-5 pb-1">
          <p className="mb-2 flex items-center gap-1 ref-tag text-ink/45">
            <Heart className="h-3 w-3" /> Interests
          </p>
          <div className="flex flex-wrap gap-1.5">
            {myInterests.map(({ key, label, emoji }) => (
              <span
                key={key}
                className="flex items-center gap-1 rounded-md border-2 border-ink/12 bg-white px-2.5 py-1 text-xs font-bold text-ink"
              >
                <span>{emoji}</span> {label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Badges */}
      <div className="max-h-40 overflow-y-auto px-5 pb-4 pt-3">
        <p className="mb-2 ref-tag text-ink/45">Recent badges</p>
        {badges.length === 0 ? (
          <p className="rounded-xl border-2 border-dashed border-ink/20 bg-paper p-4 text-center text-sm font-semibold text-ink/45">
            Finish a module to earn your first badge! 🏆
          </p>
        ) : (
          <div className="space-y-2">
            {badges.slice(0, 3).map((b) => (
              <div
                key={b.id}
                className="flex items-center gap-3 rounded-xl border-2 border-ink/12 bg-paper p-2.5"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-signal text-ink shadow">
                  <Award className="h-4 w-4" strokeWidth={2.5} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-ink">{b.name}</p>
                  <p className="ref-tag text-ink/45">{b.type === 'arcade' ? 'Arcade badge' : 'Module badge'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="space-y-2 border-t-2 border-ink/12 p-3">
        <Link
          to="/dashboard"
          onClick={onClose}
          className="lab-btn flex w-full items-center justify-center gap-2 rounded-xl border-2 border-ink bg-signal py-2.5 font-extrabold text-ink"
        >
          <LayoutDashboard className="h-4 w-4" /> View full progress
        </Link>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              onClose();
              onOpenSettings?.();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-ink/15 py-2.5 font-bold text-ink/70 transition-colors hover:bg-ink/5"
          >
            <Settings className="h-4 w-4" /> Settings
          </button>
          <button
            onClick={() => {
              signOut();
              onClose();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-ink/15 py-2.5 font-bold text-ink/70 transition-colors hover:bg-ink/5"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
