import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import SignInModal from './SignInModal';
import logo from '../../assets/pocketlab.png';

/**
 * Gates a route behind a signed-in account.
 *
 * Instead of bouncing to the home page we render a sign-in panel *at the
 * requested URL* and open the modal. That way a shared lesson link survives:
 * the moment the student signs in, `user` flips and the real page renders
 * underneath — no redirect, no lost deep link.
 *
 * This is the convenience half of the check. Course content endpoints are
 * mounted behind `get_current_user` on the backend, so a forced route shows an
 * empty page rather than the lesson.
 */
export default function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  // The modal starts open — a signed-out student who lands here wants the form,
  // not another button to press. Closing it reveals the panel behind, which can
  // re-open it.
  const [dismissed, setDismissed] = useState(false);

  // Still confirming a stored token — don't flash the gate at a signed-in user.
  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-paper py-24 font-lab font-bold text-ink/60">
        Loading…
      </div>
    );
  }

  if (user) return children;

  return (
    <div className="flex flex-1 items-center justify-center bg-paper px-6 py-20">
      <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] border-2 border-ink bg-white text-center shadow-xl">
        <div
          className="relative overflow-hidden border-b-2 border-ink bg-pcb px-8 pb-8 pt-7"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.12) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.12) 1px,transparent 1px)',
            backgroundSize: '26px 26px',
          }}
        >
          <img src={logo} alt="Pocket Lab" className="mx-auto mb-3 h-11 w-auto drop-shadow-lg" />
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border-2 border-ink bg-signal">
            <Lock className="h-6 w-6 text-ink" strokeWidth={2.5} />
          </span>
        </div>

        <div className="px-8 pb-8 pt-6">
          <h1 className="font-lab text-2xl font-bold text-ink">Members only ⚡</h1>
          <p className="mt-2 text-sm font-semibold text-secondary">
            Sign in to open this course — it&apos;s free, and it keeps your XP, badges
            and progress saved wherever you learn.
          </p>

          <button
            onClick={() => setDismissed(false)}
            className="lab-btn mt-6 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-ink bg-signal py-3.5 font-extrabold text-ink"
          >
            <Sparkles className="h-5 w-5" /> Sign in to continue
          </button>

          <Link
            to="/"
            className="mt-4 inline-block text-sm font-extrabold text-pcb transition-colors hover:text-ink"
          >
            Back to home
          </Link>
        </div>
      </div>

      <SignInModal open={!dismissed} onClose={() => setDismissed(true)} />
    </div>
  );
}
