import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { courseService } from '../services/api';

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    courseService.getCourses()
      .then(res => {
        setCourses(res.data.data);
      })
      .catch(err => {
        console.error("Failed to load courses:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">Loading courses...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto w-full px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Available Courses</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map(course => (
          <div key={course.courseId} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{course.title}</h3>
            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-medium mb-4 self-start">{course.level}</span>
            <p className="text-gray-600 flex-1 mb-6">{course.description}</p>
            <div className="text-sm text-gray-500 mb-6">
              {course.estimatedHours} Hours
            </div>
            {/* Hardcoded link to intro lesson for MVP */}
            <Link 
              to={`/course/${course.courseId}/lesson/intro`} 
              className="w-full block text-center bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Start Course
            </Link>
          </div>
        ))}
        {courses.length === 0 && (
          <p className="text-gray-500 col-span-full">No courses available at the moment.</p>
        )}
      </div>
    </div>
  );
}
