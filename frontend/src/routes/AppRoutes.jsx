import { Routes, Route } from 'react-router-dom';
import Home from '../pages/Home';
import Courses from '../pages/Courses';
import LessonPage from '../pages/LessonPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/courses" element={<Courses />} />
      <Route path="/course/:courseId/lesson/:lessonId" element={<LessonPage />} />
    </Routes>
  );
}
