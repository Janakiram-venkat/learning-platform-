import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowLeft, ArrowRight, Sparkles, Check, Rocket } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { INTERESTS } from '../../constants/interests';
import GoogleSignInButton from './GoogleSignInButton';
import logo from '../../assets/pocketlab.png';

const FIELD =
  'w-full rounded-xl border-2 border-ink/20 bg-paper px-4 py-3 font-semibold text-ink outline-none transition-colors placeholder:text-ink/40 focus:border-pcb focus:bg-white focus:ring-4 focus:ring-pcb/15';

export default function SignInModal({ open, onClose }) {
  const { signUp, login, signInWithGoogle, updateProfile } = useAuth();

  const [mode, setMode] = useState('login');   // 'login' | 'signup'
  const [step, setStep] = useState('account'); // signup only: 'account' | 'interests'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [interests, setInterests] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // True once a brand-new Google account is created: we keep the modal open on
  // the interests step so the new student can personalise their path.
  const [googleOnboarding, setGoogleOnboarding] = useState(false);

  const isSignup = mode === 'signup';

  const reset = () => {
    setName(''); setEmail(''); setPassword('');
    setInterests([]); setError(''); setStep('account');
    setGoogleOnboarding(false);
  };

  const close = () => { reset(); onClose(); };

  const switchMode = (next) => {
    setMode(next);
    setStep('account');
    setError('');
  };

  const toggleInterest = (key) =>
    setInterests((cur) => (cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key]));

  const handleGoogle = useCallback(async (credential) => {
    setError('');
    try {
      const { isNew } = await signInWithGoogle(credential);
      // First-time Google users pick their interests before we let them in.
      if (isNew) {
        setGoogleOnboarding(true);
        setStep('interests');
        return;
      }
      close();
    } catch (err) {
      setError(err?.response?.data?.detail || 'Google sign-in failed. Please try again.');
    }
  }, [signInWithGoogle]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;

  // --- Step 1 validation (also gates the "Next" button on sign-up) ---
  const accountValid =
    email.trim() && password && (!isSignup || (name.trim() && password.length >= 8));

  const goToInterests = () => {
    setError('');
    if (!name.trim()) return setError('Tell us your name so we can cheer you on!');
    if (!email.trim()) return setError('Please enter your email.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    setStep('interests');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) return setError('Please enter your email and password.');
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      close();
    } catch (err) {
      setError(err?.response?.data?.detail || 'Could not sign in. Check your details and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignup = async () => {
    setError('');
    setSubmitting(true);
    try {
      await signUp(email.trim(), name.trim(), password, interests);
      close();
    } catch (err) {
      setError(err?.response?.data?.detail || 'Could not create your account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Save interests for a freshly-created Google account, then close.
  const handleGoogleOnboard = async () => {
    setError('');
    setSubmitting(true);
    try {
      if (interests.length > 0) await updateProfile({ interests });
      close();
    } catch (err) {
      setError(err?.response?.data?.detail || 'Could not save your interests. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const showInterests = (isSignup || googleOnboarding) && step === 'interests';
  const wide = showInterests;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-primary/40 p-4 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
      onClick={close}
    >
      <div
        className={`relative max-h-[92vh] w-full overflow-y-auto rounded-[2rem] bg-white shadow-2xl animate-[popIn_0.35s_cubic-bezier(0.34,1.56,0.64,1)] ${wide ? 'max-w-2xl' : 'max-w-md'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Device-plate header band */}
        <div className="relative overflow-hidden border-b-2 border-ink bg-pcb px-8 pb-10 pt-7 text-center">
          <div className="pointer-events-none absolute inset-0 opacity-15"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.6) 1px,transparent 1px)', backgroundSize: '26px 26px' }} />
          <button
            onClick={close}
            className="absolute right-4 top-4 rounded-full p-1.5 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <img src={logo} alt="Pocket Lab" className="animate-logo-float relative mx-auto mb-3 h-12 w-auto drop-shadow-lg" />
          <h2 className="font-lab relative text-2xl font-bold text-white">
            {showInterests
              ? 'What do you love? ⚡'
              : isSignup ? 'Join the Adventure!' : 'Welcome Back, Hero!'}
          </h2>
          <p className="relative mt-1 text-sm font-semibold text-white/80">
            {showInterests
              ? 'Pick the topics that excite you the most'
              : isSignup ? 'Create your free account to start playing' : 'Sign in to keep leveling up'}
          </p>

          {/* Step dots for the sign-up wizard */}
          {isSignup && (
            <div className="mt-4 flex items-center justify-center gap-2">
              {['account', 'interests'].map((s) => (
                <span
                  key={s}
                  className={`h-2 rounded-full transition-all ${step === s ? 'w-6 bg-white' : 'w-2 bg-white/40'}`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="px-8 pb-8 pt-6">
          {/* ===================== INTERESTS STEP ===================== */}
          {showInterests ? (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {INTERESTS.map(({ key, label, emoji, gradient }) => {
                  const selected = interests.includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleInterest(key)}
                      aria-pressed={selected}
                      className={`group relative flex flex-col items-center gap-1.5 rounded-2xl border-2 p-3 text-center transition-all active:scale-95 ${
                        selected
                          ? 'border-transparent bg-linear-to-br text-white shadow-lg ' + gradient
                          : 'border-ink/15 bg-white text-ink hover:-translate-y-0.5 hover:border-pcb/40 hover:shadow-md'
                      }`}
                    >
                      {selected && (
                        <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white/30">
                          <Check className="h-3.5 w-3.5" strokeWidth={3} />
                        </span>
                      )}
                      <span className="text-2xl transition-transform group-hover:scale-110">{emoji}</span>
                      <span className="text-xs font-extrabold leading-tight">{label}</span>
                    </button>
                  );
                })}
              </div>

              <p className="mt-4 text-center text-xs font-semibold text-secondary">
                {interests.length > 0
                  ? `Awesome! You picked ${interests.length} ${interests.length === 1 ? 'topic' : 'topics'} 🎉`
                  : 'Pick as many as you like — you can change these later.'}
              </p>

              {error && <p className="mt-3 text-center text-sm font-bold text-wire">{error}</p>}

              <div className="mt-5 flex items-center gap-3">
                {googleOnboarding ? (
                  <button
                    type="button"
                    onClick={close}
                    disabled={submitting}
                    className="flex items-center justify-center gap-1.5 rounded-xl border-2 border-ink/15 px-5 py-3 font-extrabold text-ink/60 transition-colors hover:bg-ink/5 disabled:opacity-60"
                  >
                    Skip
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setStep('account'); setError(''); }}
                    className="flex items-center justify-center gap-1.5 rounded-xl border-2 border-ink/15 px-5 py-3 font-extrabold text-ink/60 transition-colors hover:bg-ink/5"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back
                  </button>
                )}
                <button
                  type="button"
                  onClick={googleOnboarding ? handleGoogleOnboard : handleSignup}
                  disabled={submitting}
                  className="lab-btn flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-ink bg-signal py-3 font-extrabold text-ink disabled:opacity-60"
                >
                  <Rocket className="h-5 w-5" />
                  {googleOnboarding
                    ? (submitting ? 'Saving…' : "Let's Go!")
                    : (submitting ? 'Creating…' : 'Create My Account')}
                </button>
              </div>
            </>
          ) : (
            /* ===================== ACCOUNT STEP (login + signup step 1) ===================== */
            <>
              <GoogleSignInButton onSuccess={handleGoogle} onError={setError} />

              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-ink/10" />
                <span className="text-xs font-bold uppercase tracking-wide text-secondary/60">or</span>
                <div className="h-px flex-1 bg-ink/10" />
              </div>

              <form onSubmit={isSignup ? (e) => { e.preventDefault(); goToInterests(); } : handleLogin} className="space-y-4">
                {isSignup && (
                  <div>
                    <label className="mb-1 block text-sm font-extrabold text-primary">Your Name</label>
                    <input
                      type="text" value={name} onChange={(e) => setName(e.target.value)}
                      placeholder="Ada the Coder" autoComplete="name" className={FIELD}
                    />
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-sm font-extrabold text-primary">Email</label>
                  <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com" autoComplete="email" className={FIELD}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-extrabold text-primary">Password</label>
                  <input
                    type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder={isSignup ? 'At least 8 characters' : '••••••••'}
                    autoComplete={isSignup ? 'new-password' : 'current-password'} className={FIELD}
                  />
                </div>

                {error && <p className="text-center text-sm font-bold text-wire">{error}</p>}

                <button
                  type="submit"
                  disabled={submitting || (isSignup && !accountValid)}
                  className="lab-btn flex w-full items-center justify-center gap-2 rounded-xl border-2 border-ink bg-signal py-3.5 font-extrabold text-ink disabled:opacity-50"
                >
                  {isSignup ? (
                    <>Next: Pick Interests <ArrowRight className="h-5 w-5" /></>
                  ) : (
                    <><Sparkles className="h-5 w-5" /> {submitting ? 'Signing in…' : 'Sign In'}</>
                  )}
                </button>
              </form>
            </>
          )}

          {/* Mode toggle */}
          {!showInterests && (
            <p className="mt-6 text-center text-sm font-semibold text-secondary">
              {isSignup ? 'Already have an account?' : 'New to Pocket Lab?'}{' '}
              <button
                type="button"
                onClick={() => switchMode(isSignup ? 'login' : 'signup')}
                className="font-extrabold text-pcb transition-colors hover:text-ink"
              >
                {isSignup ? 'Sign in' : 'Create one free'}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
