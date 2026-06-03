import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Rocket, BookOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import SignInModal from '../auth/SignInModal';
import ProfileMenu from '../profile/ProfileMenu';

export default function Navbar() {
  const { user } = useAuth();
  const [signInOpen, setSignInOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 flex h-[64px] items-center border-b-2 border-purple-100 bg-white/80 px-6 backdrop-blur-md">
      <div className="mr-8 flex items-center gap-2">
        <span className="flex h-9 w-9 animate-float items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-violet-600 text-white shadow-md">
          <Rocket className="h-5 w-5" />
        </span>
        <Link to="/" className="font-display text-2xl font-bold tracking-tight text-[#2D2A4A]">
          Code<span className="text-purple-600">Quest</span>
        </Link>
      </div>
      <div className="flex gap-2">
        <Link
          to="/courses"
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 font-bold text-[#6C63A6] transition-colors hover:bg-purple-50 hover:text-purple-700"
        >
          <BookOpen className="h-4 w-4" /> Courses
        </Link>
      </div>

      <div className="relative ml-auto">
        {user ? (
          <>
            <button
              onClick={() => setProfileOpen((o) => !o)}
              className="group flex items-center gap-2"
            >
              <span className="hidden font-bold text-[#6C63A6] group-hover:text-purple-700 sm:block">{user.name}</span>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-violet-600 text-sm font-extrabold text-white ring-2 ring-transparent transition-all group-hover:ring-purple-200">
                {user.name?.[0]?.toUpperCase() || '?'}
              </span>
            </button>
            <ProfileMenu open={profileOpen} onClose={() => setProfileOpen(false)} />
          </>
        ) : (
          <button
            onClick={() => setSignInOpen(true)}
            className="rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 px-5 py-2.5 font-extrabold text-white shadow-md shadow-purple-200 transition-transform hover:scale-105 active:scale-95"
          >
            Sign in
          </button>
        )}
      </div>

      <SignInModal open={signInOpen} onClose={() => setSignInOpen(false)} />
    </nav>
  );
}
