import { useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import GoogleSignInButton from './GoogleSignInButton';
import logo from '../../assets/pocketlab.png';

export default function SignInModal({ open, onClose }) {
  const { signIn, signInWithGoogle } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleGoogle = useCallback(async (credential) => {
    setError('');
    try {
      await signInWithGoogle(credential);
      onClose();
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
        'Google sign-in failed. Please try again.'
      );
    }
  }, [signInWithGoogle, onClose]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !email.trim()) {
      setError('Please enter both your name and email.');
      return;
    }
    setSubmitting(true);
    try {
      await signIn(email.trim(), name.trim());
      setName('');
      setEmail('');
      onClose();
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
        'Could not sign in. Is the backend running and the database connected?'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
      onClick={onClose}
    >
      <div
        className="relative mx-4 w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl animate-[popIn_0.35s_cubic-bezier(0.34,1.56,0.64,1)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 transition-colors hover:text-gray-700"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <img src={logo} alt="Pocket Lab" className="h-12 w-auto" />
          <div>
            <h2 className="text-xl font-extrabold text-gray-900">Welcome</h2>
            <p className="text-sm text-gray-500">Sign in to save your progress</p>
          </div>
        </div>

        <GoogleSignInButton onSuccess={handleGoogle} onError={setError} />

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs font-medium uppercase tracking-wide text-gray-400">or</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ada Lovelace"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white transition-colors hover:bg-blue-700 disabled:bg-blue-300"
          >
            {submitting ? 'Signing in…' : 'Continue'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-gray-400">
          No password needed for now — just your name and email.
        </p>
      </div>
    </div>
  );
}
