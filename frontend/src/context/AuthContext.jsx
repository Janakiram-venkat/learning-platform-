import { createContext, useContext, useState, useCallback } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

const STORAGE_KEY = 'currentUser';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const persist = useCallback((profile) => {
    setUser(profile);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    return profile;
  }, []);

  const signIn = useCallback(async (email, name) => {
    const res = await authService.signIn(email, name);
    return persist(res.data);
  }, [persist]);

  const signInWithGoogle = useCallback(async (credential) => {
    const res = await authService.googleSignIn(credential);
    return persist(res.data);
  }, [persist]);

  const signOut = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ user, signIn, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
