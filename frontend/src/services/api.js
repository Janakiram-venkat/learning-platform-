import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: API_URL,
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
  runPython: (code, stdin = '') => api.post('/run-python', { code, stdin }),
};

export const quizService = {
  submitQuiz: (courseId, lessonId, answers) => api.post(`/courses/${courseId}/quiz/submit`, { lessonId, answers }),
};

export const feedbackService = {
  submit: (payload) => api.post('/feedback', payload),
};

export const authService = {
  signIn: (email, name) => api.post('/auth/signin', { email, name }),
  googleSignIn: (token) => api.post('/auth/google', { token }),
  getUser: (email) => api.get(`/users/${encodeURIComponent(email)}`),
};
