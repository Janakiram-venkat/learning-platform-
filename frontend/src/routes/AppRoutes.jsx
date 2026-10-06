import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, Outlet, useParams } from 'react-router-dom';
import Home from '../pages/Home';
import RequireAuth from '../components/auth/RequireAuth';
import { useAuth } from '../context/AuthContext';

// Home is the landing page, so it stays in the main bundle. Everything else is
// split out: the course pages pull in Monaco and the game runtime, and a student
// who's only looking at the landing page shouldn't be downloading either.
const CoursesPage = lazy(() => import('../pages/CoursesPage'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const LessonPage = lazy(() => import('../pages/LessonPage'));
const WebDevLessonPage = lazy(() => import('../pages/WebDevLessonPage'));
const WebDevChallengePage = lazy(() => import('../pages/WebDevChallengePage'));
const WebDevProjectPage = lazy(() => import('../pages/WebDevProjectPage'));
const AssignmentPage = lazy(() => import('../pages/AssignmentPage'));
const ProjectPage = lazy(() => import('../pages/ProjectPage'));
const LabPage = lazy(() => import('../pages/LabPage'));
const SubjectPage = lazy(() => import('../pages/SubjectPage'));
const GameCoursePage = lazy(() => import('../pages/GameCoursePage'));
const GamePage = lazy(() => import('../pages/GamePage'));
const GameReference = lazy(() => import('../pages/GameReference'));
const GameManual = lazy(() => import('../pages/GameManual'));
const AdminPage = lazy(() => import('../pages/AdminPage'));
const ContestListPage = lazy(() => import('../pages/ContestListPage'));
const ContestPage = lazy(() => import('../pages/ContestPage'));
const PhysicsCoursePage = lazy(() => import('../pages/PhysicsCoursePage'));
const PhysicsExperimentPage = lazy(() => import('../pages/PhysicsExperimentPage'));

function RouteFallback() {
  return (
    <div className="flex flex-1 items-center justify-center bg-paper py-24 font-lab font-bold text-ink/60">
      Loading…
    </div>
  );
}

// Physics used to live at /virtual-lab as its own product. It is a course now,
// so the old paths forward to the new ones, carrying the experiment id across
// so a bookmarked experiment still lands on that experiment.
function LegacyVirtualLabExperiment() {
  const { experimentId } = useParams();
  return <Navigate to={`/course/physics/${experimentId}`} replace />;
}

// Keeps the admin dashboard out of a student's way. Nested inside RequireAuth,
// so by the time this runs the session is already resolved. Convenience guard
// only — every /admin endpoint checks the staff flag server-side, so a student
// who forces the route sees an empty page, not data.
function AdminRoute({ children }) {
  const { user } = useAuth();
  if (!user?.is_admin) return <Navigate to="/" replace />;
  return children;
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        {/* Public: the landing page is the only thing a signed-out visitor sees. */}
        <Route path="/" element={<Home />} />
        {/* The game dev manual is public on purpose: a contest is open to people
            who have not worked through the course, so "read the manual first" is
            only fair advice if reading it does not need an account. */}
        <Route path="/manual" element={<GameManual />} />
        {/* Physics is public on purpose, exactly as the Virtual Lab it grew
            out of was: its experiments are browser-only widgets that touch no
            API, so an account would buy the student nothing. That is why these
            two sit here rather than under RequireAuth with the other courses. */}
        <Route path="/course/physics" element={<PhysicsCoursePage />} />
        <Route path="/course/physics/:experimentId" element={<PhysicsExperimentPage />} />
        {/* Retired /virtual-lab addresses, kept alive as redirects. */}
        <Route path="/virtual-lab" element={<Navigate to="/course/physics" replace />} />
        <Route path="/virtual-lab/:experimentId" element={<LegacyVirtualLabExperiment />} />
        {/* The catalogue is public too: a visitor should see what they would be
            signing up for. Opening a track still hits RequireAuth below. */}
        <Route path="/courses" element={<CoursesPage />} />

        {/* Everything course-related needs an account. Grouping them under one
            pathless route means a new course page is gated by default. */}
        <Route element={<RequireAuth><Outlet /></RequireAuth>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/subject/:subject" element={<SubjectPage />} />
          {/* The web-dev course is paged and runs its code in a browser
              sandbox, so it has its own lesson page. Declared before the
              generic route so it wins for this one course id. */}
          <Route path="/course/webdev/lesson/:lessonId" element={<WebDevLessonPage />} />
          <Route path="/course/:courseId/lesson/:lessonId" element={<LessonPage />} />
          {/* Same reason as the lesson route above: the web-dev challenge
              grades real HTML in the sandbox rather than running the arcade's
              multiple-choice rounds, so it has its own page. Declared first so
              it wins for this one course id; every other course still gets
              AssignmentPage. */}
          <Route
            path="/course/webdev/module/:moduleId/assignment"
            element={<WebDevChallengePage />}
          />
          <Route path="/course/:courseId/module/:moduleId/assignment" element={<AssignmentPage />} />
          {/* Same reason again: the web-dev mini project is five sandbox-graded
              milestones over one HTML document, not a Python program run
              server-side. Declared first so it wins for this one course id. */}
          <Route path="/course/webdev/module/:moduleId/project" element={<WebDevProjectPage />} />
          <Route path="/course/:courseId/module/:moduleId/project" element={<ProjectPage />} />
          <Route path="/course/:courseId/module/:moduleId/lab" element={<LabPage />} />
          <Route path="/course/:courseId/games" element={<GameCoursePage />} />
          <Route path="/course/:courseId/reference" element={<GameReference />} />
          <Route path="/course/:courseId/module/:moduleId/step/:stepIndex" element={<GamePage />} />
          <Route path="/contests" element={<ContestListPage />} />
          <Route path="/contests/:contestId" element={<ContestPage />} />
          <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
        </Route>
      </Routes>
    </Suspense>
  );
}
