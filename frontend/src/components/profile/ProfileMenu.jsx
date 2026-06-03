import { useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Award, LogOut, Mail, CalendarDays, Layers } from 'lucide-react';

export default function ProfileMenu({ open, onClose }) {
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

  if (!open || !user) return null;

  const joined = user.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    : '—';

  return (
    <div
      ref={ref}
      className="absolute right-0 top-12 z-50 w-80 origin-top-right rounded-2xl border border-gray-100 bg-white shadow-2xl animate-[popIn_0.25s_cubic-bezier(0.34,1.56,0.64,1)]"
    >
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-100 p-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-lg font-extrabold text-white">
          {user.name?.[0]?.toUpperCase() || '?'}
        </div>
        <div className="min-w-0">
          <p className="truncate font-bold text-gray-900">{user.name}</p>
          <p className="flex items-center gap-1 truncate text-sm text-gray-500">
            <Mail className="h-3.5 w-3.5 shrink-0" /> {user.email}
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
            <CalendarDays className="h-3 w-3 shrink-0" /> Joined {joined}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 px-5 py-4">
        <div className="rounded-xl bg-gray-50 p-3">
          <Layers className="mb-1 h-5 w-5 text-blue-600" />
          <p className="text-xl font-extrabold text-gray-900">{moduleCount}</p>
          <p className="text-xs text-gray-500">Modules done</p>
        </div>
        <div className="rounded-xl bg-gray-50 p-3">
          <Award className="mb-1 h-5 w-5 text-amber-500" />
          <p className="text-xl font-extrabold text-gray-900">{badges.length}</p>
          <p className="text-xs text-gray-500">Badges</p>
        </div>
      </div>

      {/* Badges */}
      <div className="max-h-56 overflow-y-auto px-5 pb-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Badges</p>
        {badges.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-400">
            Finish a module to earn your first badge! 🏆
          </p>
        ) : (
          <div className="space-y-2">
            {badges.map((b) => (
              <div
                key={b.id}
                className="flex items-center gap-3 rounded-xl bg-amber-50 p-2.5 ring-1 ring-amber-100"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 text-white shadow">
                  <Award className="h-4 w-4" strokeWidth={2.5} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-gray-800">{b.name}</p>
                  <p className="text-xs text-gray-400">Module badge</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 p-3">
        <button
          onClick={() => {
            signOut();
            onClose();
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-2.5 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </div>
  );
}
