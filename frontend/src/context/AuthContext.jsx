import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authService, setAuthToken, getAuthToken } from '../services/api';

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

  const clear = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    setAuthToken(null);
  }, []);

  // Handle an { access_token, user } auth response: store the token + profile.
  const applyAuth = useCallback((data) => {
    setAuthToken(data.access_token);
    return persist(data.user);
  }, [persist]);

  // On load, if we have a token, confirm it's still valid (and refresh the
  // profile). If it's expired/invalid, sign the user out cleanly.
  useEffect(() => {
    if (!getAuthToken()) return;
    authService.me()
      .then((res) => persist(res.data))
      .catch(() => clear());
  }, [persist, clear]);

  const signUp = useCallback(async (email, name, password, interests = []) => {
    const res = await authService.signUp(email, name, password, interests);
    return applyAuth(res.data);
  }, [applyAuth]);

  const login = useCallback(async (email, password) => {
    const res = await authService.login(email, password);
    return applyAuth(res.data);
  }, [applyAuth]);

  // Returns { user, isNew } so the caller can show first-time onboarding.
  const signInWithGoogle = useCallback(async (credential) => {
    const res = await authService.googleSignIn(credential);
    const profile = applyAuth(res.data);
    return { user: profile, isNew: !!res.data.is_new };
  }, [applyAuth]);

  // Update the signed-in user's name and/or interests.
  const updateProfile = useCallback(async (changes) => {
    const res = await authService.updateProfile(changes);
    return persist(res.data);
  }, [persist]);

  // Set or change the signed-in user's password.
  const changePassword = useCallback(async (changes) => {
    const res = await authService.changePassword(changes);
    return persist(res.data);
  }, [persist]);

  const signOut = useCallback(() => clear(), [clear]);

  return (
    <AuthContext.Provider
      value={{ user, signUp, login, signInWithGoogle, updateProfile, changePassword, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- the context hook lives with its provider; not a fast-refresh concern
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
