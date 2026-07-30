import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from '../pages/Home';
import { useAuth } from '../context/AuthContext';

// Home is the landing page, so it stays in the main bundle. Everything else is
// split out: the course pages pull in Monaco and the game runtime, and a student
// who's only looking at the landing page shouldn't be downloading either.
const Dashboard = lazy(() => import('../pages/Dashboard'));
const LessonPage = lazy(() => import('../pages/LessonPage'));
const AssignmentPage = lazy(() => import('../pages/AssignmentPage'));
const ProjectPage = lazy(() => import('../pages/ProjectPage'));
const LabPage = lazy(() => import('../pages/LabPage'));
const SubjectPage = lazy(() => import('../pages/SubjectPage'));
const GameCoursePage = lazy(() => import('../pages/GameCoursePage'));
const GamePage = lazy(() => import('../pages/GamePage'));
const GameReference = lazy(() => import('../pages/GameReference'));
const AdminPage = lazy(() => import('../pages/AdminPage'));

function RouteFallback() {
  return (
    <div className="flex flex-1 items-center justify-center bg-paper py-24 font-lab font-bold text-ink/60">
      Loading…
    </div>
  );
}

// Keeps the admin dashboard out of a student's way. This is a convenience
// guard only — every /admin endpoint checks the staff flag server-side, so a
// student who forces the route sees an empty page, not data.
function AdminRoute({ children }) {
  const { user } = useAuth();
  if (!user?.is_admin) return <Navigate to="/" replace />;
  return children;
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/subject/:subject" element={<SubjectPage />} />
        <Route path="/course/:courseId/lesson/:lessonId" element={<LessonPage />} />
        <Route path="/course/:courseId/module/:moduleId/assignment" element={<AssignmentPage />} />
        <Route path="/course/:courseId/module/:moduleId/project" element={<ProjectPage />} />
        <Route path="/course/:courseId/module/:moduleId/lab" element={<LabPage />} />
        <Route path="/course/:courseId/games" element={<GameCoursePage />} />
        <Route path="/course/:courseId/reference" element={<GameReference />} />
        <Route path="/course/:courseId/module/:moduleId/step/:stepIndex" element={<GamePage />} />
        <Route
          path="/admin"
          element={<AdminRoute><AdminPage /></AdminRoute>}
        />
      </Routes>
    </Suspense>
  );
}
