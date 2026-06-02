import { Link } from 'react-router-dom';
import { ArrowRight, Code, Terminal, CheckCircle } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full max-w-5xl px-6 py-24 flex flex-col items-center text-center">
        <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight mb-6">
          Learn Coding Through Practice
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mb-10">
          Interactive coding lessons for students. Learn Python interactively with real-world examples and live coding exercises.
        </p>
        <Link 
          to="/courses" 
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-4 rounded-lg flex items-center transition-colors"
        >
          Start Learning <ArrowRight className="ml-2 w-5 h-5" />
        </Link>
      </section>

      {/* Benefits Section */}
      <section className="w-full bg-gray-50 py-20 border-y border-gray-200">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-3 gap-10">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
              <Terminal className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Interactive Compiler</h3>
            <p className="text-gray-600">Run code directly in your browser without any setup.</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
              <Code className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Practice Exercises</h3>
            <p className="text-gray-600">Reinforce your learning with hands-on coding tasks.</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Beginner Friendly</h3>
            <p className="text-gray-600">Designed specifically for students starting their journey.</p>
          </div>
        </div>
      </section>

      {/* Featured Course */}
      <section className="w-full max-w-5xl px-6 py-20 flex flex-col items-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-10">Featured Course</h2>
        <div className="w-full grid md:grid-cols-[minmax(0,1fr)_320px] gap-6 items-stretch">
          <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Python Programming</h3>
            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-medium mb-4">Beginner Friendly</span>
            <p className="text-gray-600 mb-6">Learn Python from basics to projects.</p>
            <Link 
              to="/course/python/lesson/intro" 
              className="w-full block text-center border border-gray-300 hover:bg-gray-50 text-gray-900 font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Open Course
            </Link>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="aspect-video bg-gray-900">
              <iframe
                className="w-full h-full"
                src="https://www.youtube-nocookie.com/embed/Pih0lGbE5GI?rel=0"
                title="Python programming video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
