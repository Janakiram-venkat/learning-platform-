import axios from 'axios';
import { runPythonInBrowser } from './pyodide';

// The backend serves every route under an `/api` prefix. Normalise whatever is
// configured so the base URL always ends with `/api`, even if the deploy env var
// (e.g. Vercel's VITE_API_URL) was set to the bare host without the suffix.
const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const API_URL = /\/api\/?$/.test(RAW_API_URL)
  ? RAW_API_URL.replace(/\/$/, '')
  : `${RAW_API_URL.replace(/\/$/, '')}/api`;

export const api = axios.create({
  baseURL: API_URL,
});

// Session token persistence + auto-attach as a Bearer header on every request.
const TOKEN_KEY = 'authToken';

export function setAuthToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Sign-in endpoints answer 401 for "wrong password" / "bad Google token" — that
// is a failed attempt, not an expired session, so they're excluded below.
const SIGN_IN_PATHS = ['/auth/login', '/auth/google', '/auth/signup'];

// A 401 anywhere else means the stored token is gone, expired, or rejected.
// Drop it and let AuthContext (which listens for this event) sign the user out
// so the route guards send them back to the sign-in gate.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error?.config?.url || '';
    if (error?.response?.status === 401 && !SIGN_IN_PATHS.some((p) => url.includes(p))) {
      setAuthToken(null);
      window.dispatchEvent(new Event('auth:expired'));
    }
    return Promise.reject(error);
  }
);

export const courseService = {
  getCourses: () => api.get('/courses'),
  getCourse: (courseId) => api.get(`/courses/${courseId}`),
  getModule: (courseId, moduleId) => api.get(`/courses/${courseId}/modules/${moduleId}`),
  // Uses the canonical content route (not the legacy /lessons/ alias).
  getLesson: (courseId, lessonId) => api.get(`/courses/${courseId}/content/lesson/${lessonId}`),
  getAssignment: (courseId, moduleId) => api.get(`/courses/${courseId}/assignments/${moduleId}`),
  getProject: (courseId, moduleId) => api.get(`/courses/${courseId}/projects/${moduleId}`),
  getLab: (courseId, moduleId) => api.get(`/courses/${courseId}/labs/${moduleId}`),
};

export const compilerService = {
  // Python now runs entirely in the browser (Pyodide in a Web Worker). The
  // result is wrapped as { data } so existing callers (res.data.output) are
  // unchanged. The backend /run-python endpoint is kept but no longer used.
  runPython: async (code, stdin = '') => {
    const result = await runPythonInBrowser(code, stdin);
    return { data: result };
  },
};

export const quizService = {
  submitQuiz: (courseId, lessonId, answers) =>
    api.post(`/courses/${courseId}/quiz/submit`, { lessonId, answers }),
};

export const feedbackService = {
  submit: (payload) => api.post('/feedback', payload),
};

export const authService = {
  signUp: (email, name, password, interests = []) =>
    api.post('/auth/signup', { email, name, password, interests }),
  login: (email, password) => api.post('/auth/login', { email, password }),
  googleSignIn: (token) => api.post('/auth/google', { token }),
  me: () => api.get('/auth/me'),
  updateProfile: (payload) => api.patch('/auth/profile', payload),
  changePassword: (payload) => api.post('/auth/password', payload),
  // Invalidates all existing JWTs for the user server-side. Call before
  // clearing the local token so route guards can't race a stale session.
  logout: () => api.post('/auth/logout').catch(() => {}), // best-effort; clear local state regardless
};

// Admin dashboard. Every call 403s unless the signed-in account is staff, so
// the UI guard in AppRoutes is convenience, not security.
export const adminService = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params = {}) => api.get('/admin/users', { params }),
  getCourseUsage: () => api.get('/admin/courses'),
  getFeedback: (limit = 100) => api.get('/admin/feedback', { params: { limit } }),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
};

// Game-dev contests. The server enforces the time window and the submit lock;
// the page's countdown is only a convenience.
export const contestService = {
  list: () => api.get('/contests'),
  get: (id) => api.get(`/contests/${id}`),
  getEntry: (id) => api.get(`/contests/${id}/entry`),
  saveEntry: (id, code) => api.put(`/contests/${id}/entry`, { code }),
  submit: (id, code) => api.post(`/contests/${id}/submit`, { code }),
  leaderboard: (id) => api.get(`/contests/${id}/leaderboard`),
};

export const adminContestService = {
  list: () => api.get('/admin/contests'),
  create: (payload) => api.post('/admin/contests', payload),
  update: (id, payload) => api.put(`/admin/contests/${id}`, payload),
  remove: (id) => api.delete(`/admin/contests/${id}`),
  entries: (id) => api.get(`/admin/contests/${id}/entries`),
  entry: (id, entryId) => api.get(`/admin/contests/${id}/entries/${entryId}`),
  score: (id, entryId, payload) => api.put(`/admin/contests/${id}/entries/${entryId}/score`, payload),
  duplicate: (id) => api.post(`/admin/contests/${id}/duplicate`),
  // Live controls: open the doors, call time, add minutes, show the board.
  // `minutes` null keeps whatever length the contest was scheduled for.
  startNow: (id, minutes = null) => api.post(`/admin/contests/${id}/start`, { minutes }),
  endNow: (id) => api.post(`/admin/contests/${id}/end`),
  addTime: (id, minutes) => api.post(`/admin/contests/${id}/time`, { minutes }),
  setResults: (id, published) => api.put(`/admin/contests/${id}/results`, { published }),
  invites: (id) => api.get(`/admin/contests/${id}/invites`),
  // `emails` is raw pasted text; the server splits and validates it.
  addInvites: (id, emails) => api.post(`/admin/contests/${id}/invites`, { emails }),
  removeInvite: (id, inviteId) => api.delete(`/admin/contests/${id}/invites/${inviteId}`),
};

export const progressService = {
  get: () => api.get('/progress'),
  // Full replace — used on initial hydration.
  save: (progress) => api.put('/progress', { progress }),
  // Additive merge — used for ongoing sync to prevent multi-tab overwrites.
  merge: (delta) => api.patch('/progress', { delta }),
};
