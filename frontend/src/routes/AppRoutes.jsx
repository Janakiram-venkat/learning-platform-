import { Routes, Route } from 'react-router-dom';
import Home from '../pages/Home';
import Dashboard from '../pages/Dashboard';
import LessonPage from '../pages/LessonPage';
import AssignmentPage from '../pages/AssignmentPage';
import ProjectPage from '../pages/ProjectPage';
import LabPage from '../pages/LabPage';
import SubjectPage from '../pages/SubjectPage';
import GameCoursePage from '../pages/GameCoursePage';
import GamePage from '../pages/GamePage';
import GameReference from '../pages/GameReference';

export default function AppRoutes() {
  return (
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
    </Routes>
  );
}
