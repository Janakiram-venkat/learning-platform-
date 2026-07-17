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

export const courseService = {
  getCourses: () => api.get('/courses'),
  getCourse: (courseId) => api.get(`/courses/${courseId}`),
  getModule: (courseId, moduleId) => api.get(`/courses/${courseId}/modules/${moduleId}`),
  getLesson: (courseId, lessonId) => api.get(`/courses/${courseId}/lessons/${lessonId}`),
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
  submitQuiz: (courseId, lessonId, answers) => api.post(`/courses/${courseId}/quiz/submit`, { lessonId, answers }),
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
};

export const progressService = {
  get: () => api.get('/progress'),
  save: (progress) => api.put('/progress', { progress }),
};
