import { Routes, Route } from 'react-router-dom';
import Home from '../pages/Home';
import Courses from '../pages/Courses';
import LessonPage from '../pages/LessonPage';
import AssignmentPage from '../pages/AssignmentPage';
import ProjectPage from '../pages/ProjectPage';
import LabPage from '../pages/LabPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/courses" element={<Courses />} />
      <Route path="/course/:courseId/lesson/:lessonId" element={<LessonPage />} />
      <Route path="/course/:courseId/module/:moduleId/assignment" element={<AssignmentPage />} />
      <Route path="/course/:courseId/module/:moduleId/project" element={<ProjectPage />} />
      <Route path="/course/:courseId/module/:moduleId/lab" element={<LabPage />} />
    </Routes>
  );
}
