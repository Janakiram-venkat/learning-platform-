import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Code2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import SignInModal from '../auth/SignInModal';
import ProfileMenu from '../profile/ProfileMenu';

export default function Navbar() {
  const { user } = useAuth();
  const [signInOpen, setSignInOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <nav className="sticky top-0 bg-white border-b border-gray-200 z-50 h-[60px] flex items-center px-6">
      <div className="flex items-center space-x-2 mr-8">
        <Code2 className="text-blue-600 w-6 h-6" />
        <Link to="/" className="font-bold text-xl text-gray-900 tracking-tight">LearnCode</Link>
      </div>
      <div className="flex space-x-6">
        <Link to="/courses" className="text-gray-600 hover:text-gray-900 font-medium">Courses</Link>
      </div>

      <div className="relative ml-auto">
        {user ? (
          <>
            <button
              onClick={() => setProfileOpen((o) => !o)}
              className="flex items-center gap-2 group"
            >
              <span className="hidden sm:block font-medium text-gray-700 group-hover:text-gray-900">{user.name}</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white ring-2 ring-transparent transition-all group-hover:ring-blue-200">
                {user.name?.[0]?.toUpperCase() || '?'}
              </span>
            </button>
            <ProfileMenu open={profileOpen} onClose={() => setProfileOpen(false)} />
          </>
        ) : (
          <button
            onClick={() => setSignInOpen(true)}
            className="rounded-lg bg-blue-600 px-5 py-2 font-bold text-white transition-colors hover:bg-blue-700"
          >
            Sign in
          </button>
        )}
      </div>

      <SignInModal open={signInOpen} onClose={() => setSignInOpen(false)} />
    </nav>
  );
}
