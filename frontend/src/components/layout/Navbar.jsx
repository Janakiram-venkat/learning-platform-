import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import SignInModal from '../auth/SignInModal';
import ProfileMenu from '../profile/ProfileMenu';
import SettingsModal from '../profile/SettingsModal';
import XPBadge from '../profile/XPBadge';
import logo from '../../assets/pocketlab.png';

export default function Navbar() {
  const { user } = useAuth();
  const [signInOpen, setSignInOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 flex h-[64px] items-center border-b-2 border-ink bg-paper/85 px-6 backdrop-blur-md">
      <Link to="/" className="mr-4 flex shrink-0 items-center sm:mr-8">
        <img
          src={logo}
          alt="Pocket Lab"
          className="h-8 w-auto sm:h-9"
        />
      </Link>
      <div className="flex gap-2">
        <Link
          to="/#tracks"
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 font-bold text-ink/70 transition-colors hover:bg-pcb/10 hover:text-pcb"
        >
          <BookOpen className="h-4 w-4" /> Courses
        </Link>
      </div>

      <div className="relative ml-auto flex items-center gap-3">
        {user && <XPBadge />}
        {user ? (
          <>
            <button
              onClick={() => setProfileOpen((o) => !o)}
              className="group flex items-center gap-2"
            >
              <span className="hidden font-bold text-ink/70 group-hover:text-pcb sm:block">{user.name}</span>
              <span className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-ink bg-pcb font-lab text-sm font-extrabold text-white transition-transform group-hover:-translate-y-0.5">
                {user.name?.[0]?.toUpperCase() || '?'}
              </span>
            </button>
            <ProfileMenu
              open={profileOpen}
              onClose={() => setProfileOpen(false)}
              onOpenSettings={() => setSettingsOpen(true)}
            />
          </>
        ) : (
          <button
            onClick={() => setSignInOpen(true)}
            className="lab-btn rounded-xl border-2 border-ink bg-signal px-5 py-2.5 font-extrabold text-ink"
          >
            Sign in
          </button>
        )}
      </div>

      <SignInModal open={signInOpen} onClose={() => setSignInOpen(false)} />
      {settingsOpen && <SettingsModal open onClose={() => setSettingsOpen(false)} />}
    </nav>
  );
}
