import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Lock, Check, Heart, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { INTERESTS } from '../../constants/interests';

const FIELD =
  'w-full rounded-xl border-2 border-ink/20 bg-paper px-4 py-3 font-semibold text-ink outline-none transition-colors placeholder:text-ink/40 focus:border-pcb focus:bg-white focus:ring-4 focus:ring-pcb/15';

const TABS = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'security', label: 'Security', icon: Lock },
];

export default function SettingsModal({ open, onClose }) {
  const { user, updateProfile, changePassword } = useAuth();

  const [tab, setTab] = useState('profile');

  // Profile tab
  const [name, setName] = useState(user?.name || '');
  const [interests, setInterests] = useState(user?.interests || []);
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Security tab
  const hasPassword = !!user?.has_password;
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  // Lock the background from scrolling while the modal is open, and pad for the
  // now-missing scrollbar so the page underneath doesn't shift sideways.
  useEffect(() => {
    if (!open) return;
    const scrollbarW = window.innerWidth - document.documentElement.clientWidth;
    const prevOverflow = document.body.style.overflow;
    const prevPad = document.body.style.paddingRight;
    document.body.style.overflow = 'hidden';
    if (scrollbarW > 0) document.body.style.paddingRight = `${scrollbarW}px`;
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPad;
    };
  }, [open]);

  if (!open || !user) return null;

  const toggleInterest = (key) =>
    setInterests((cur) => (cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key]));

  const close = () => {
    setProfileMsg(''); setProfileErr(''); setPwMsg(''); setPwErr('');
    setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    onClose();
  };

  const handleSaveProfile = async () => {
    setProfileMsg(''); setProfileErr('');
    if (!name.trim()) return setProfileErr('Please enter your name.');
    setSavingProfile(true);
    try {
      await updateProfile({ name: name.trim(), interests });
      setProfileMsg('Saved! 🎉');
    } catch (err) {
      setProfileErr(err?.response?.data?.detail || 'Could not save. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    setPwMsg(''); setPwErr('');
    if (hasPassword && !currentPassword) return setPwErr('Enter your current password.');
    if (newPassword.length < 8) return setPwErr('New password must be at least 8 characters.');
    if (newPassword !== confirmPassword) return setPwErr('Passwords do not match.');
    setSavingPw(true);
    try {
      await changePassword(
        hasPassword
          ? { current_password: currentPassword, new_password: newPassword }
          : { new_password: newPassword }
      );
      setPwMsg(hasPassword ? 'Password updated! 🔒' : 'Password set! 🔒');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) {
      setPwErr(err?.response?.data?.detail || 'Could not update your password. Please try again.');
    } finally {
      setSavingPw(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-primary/40 p-4 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
      onClick={close}
    >
      <div
        className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-[2rem] bg-white shadow-2xl animate-[popIn_0.35s_cubic-bezier(0.34,1.56,0.64,1)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative overflow-hidden border-b-2 border-ink bg-pcb px-8 pb-6 pt-7 text-center">
          <div className="pointer-events-none absolute inset-0 opacity-15"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.6) 1px,transparent 1px)', backgroundSize: '26px 26px' }} />
          <button
            onClick={close}
            className="absolute right-4 top-4 rounded-full p-1.5 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <h2 className="font-lab relative text-2xl font-bold text-white">Settings</h2>
          <p className="relative mt-1 text-sm font-semibold text-white/80">Manage your account</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b-2 border-ink/12 px-6 pt-4">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 rounded-t-xl px-4 py-2.5 text-sm font-extrabold transition-colors ${
                tab === key
                  ? 'border-b-2 border-pcb text-pcb'
                  : 'text-ink/55 hover:text-pcb'
              }`}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>

        <div className="px-8 pb-8 pt-6">
          {/* ===================== PROFILE TAB ===================== */}
          {tab === 'profile' ? (
            <>
              <div className="mb-5">
                <label className="mb-1 block text-sm font-extrabold text-ink">Your Name</label>
                <input
                  type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Ada the Coder" autoComplete="name" className={FIELD}
                />
              </div>

              <p className="mb-2 flex items-center gap-1 text-sm font-extrabold text-ink">
                <Heart className="h-4 w-4 text-pcb" /> Interests
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {INTERESTS.map(({ key, label, emoji }) => {
                  const selected = interests.includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleInterest(key)}
                      aria-pressed={selected}
                      className={`group relative flex flex-col items-center gap-1.5 rounded-2xl border-2 p-3 text-center transition-all active:scale-95 ${
                        selected
                          ? 'border-ink bg-pcb text-white shadow-md'
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

              {profileErr && <p className="mt-4 text-center text-sm font-bold text-wire">{profileErr}</p>}
              {profileMsg && <p className="mt-4 text-center text-sm font-bold text-pcb">{profileMsg}</p>}

              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="lab-btn mt-5 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-ink bg-signal py-3.5 font-extrabold text-ink disabled:opacity-60"
              >
                <Save className="h-5 w-5" /> {savingProfile ? 'Saving…' : 'Save Changes'}
              </button>
            </>
          ) : (
            /* ===================== SECURITY TAB ===================== */
            <>
              {!hasPassword && (
                <p className="mb-4 rounded-xl border-2 border-ink/15 bg-pcb/8 px-4 py-3 text-sm font-semibold text-ink">
                  You signed up with Google. Set a password to also sign in with your email.
                </p>
              )}
              <div className="space-y-4">
                {hasPassword && (
                  <div>
                    <label className="mb-1 block text-sm font-extrabold text-ink">Current Password</label>
                    <input
                      type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••" autoComplete="current-password" className={FIELD}
                    />
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-sm font-extrabold text-ink">New Password</label>
                  <input
                    type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters" autoComplete="new-password" className={FIELD}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-extrabold text-ink">Confirm New Password</label>
                  <input
                    type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password" autoComplete="new-password" className={FIELD}
                  />
                </div>
              </div>

              {pwErr && <p className="mt-4 text-center text-sm font-bold text-wire">{pwErr}</p>}
              {pwMsg && <p className="mt-4 text-center text-sm font-bold text-pcb">{pwMsg}</p>}

              <button
                type="button"
                onClick={handleChangePassword}
                disabled={savingPw}
                className="lab-btn mt-5 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-ink bg-signal py-3.5 font-extrabold text-ink disabled:opacity-60"
              >
                <Lock className="h-5 w-5" /> {savingPw ? 'Saving…' : hasPassword ? 'Update Password' : 'Set Password'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
