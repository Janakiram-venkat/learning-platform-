import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Sparkles, Lock, GraduationCap, Clock, Play } from 'lucide-react';
import { courseService } from '../services/api';

// Placeholder subjects — currently just Math, offering class 8, 9, 10.
const SUBJECTS = {
  math: {
    title: 'Math',
    emoji: '🔢',
    tagline: 'Level up your number skills with fun challenges.',
  },
};

const CLASSES = [
  { grade: 8, emoji: '📗', label: 'Class 8' },
  { grade: 9, emoji: '📘', label: 'Class 9' },
  { grade: 10, emoji: '📕', label: 'Class 10' },
];

export default function SubjectPage() {
  const { subject } = useParams();
  const info = SUBJECTS[subject];
  const [picked, setPicked] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load any courses that belong to this subject (tagged with `subject` in
  // their course.json). Subjects without courses fall back to the class picker.
  useEffect(() => {
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset the loading flag when `subject` changes and we refetch
    setLoading(true);
    courseService.getCourses()
      .then((res) => {
        if (!active) return;
        const all = res.data.data || [];
        setCourses(all.filter((c) => c.subject === subject));
      })
      .catch(() => { if (active) setCourses([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [subject]);

  if (!info) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-4 px-6 py-24 text-center">
        <span className="text-5xl">🧭</span>
        <p className="font-lab text-lg font-semibold text-ink/65">
          Hmm, we couldn't find that subject.
        </p>
        <Link
          to="/"
          className="lab-btn rounded-xl border-2 border-ink bg-signal px-5 py-2.5 font-extrabold text-ink"
        >
          Back to Quests
        </Link>
      </div>
    );
  }

  const hasCourses = courses.length > 0;

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-14">
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-ink/60 transition-colors hover:text-pcb"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Quests
      </Link>

      <span className="mb-3 inline-flex items-center gap-2 rounded-md border-2 border-ink bg-white px-3 py-1 ref-tag text-ink">
        <Sparkles className="h-4 w-4" /> {hasCourses ? 'Choose a chapter' : 'Choose your class'}
      </span>
      <h1 className="font-lab mb-3 text-3xl font-extrabold text-ink sm:text-4xl">
        {info.title} <span className="animate-wiggle inline-block">{info.emoji}</span>
      </h1>
      <p className="mb-10 max-w-2xl text-base font-semibold text-ink/65 sm:text-lg">
        {info.tagline}{' '}
        {hasCourses ? 'Pick a chapter and start your adventure!' : 'Pick your class to begin — new lessons are being added soon!'}
      </p>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center gap-4 py-16">
          <div className="animate-float text-5xl">🎲</div>
          <p className="font-lab text-lg font-semibold text-ink/65">Loading chapters...</p>
        </div>
      )}

      {/* Real courses for this subject, if any are tagged to it */}
      {!loading && hasCourses && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course, i) => (
            <div
              key={course.courseId}
              className="lab-panel lab-lift animate-bounce-in flex flex-col p-6"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className="flex flex-1 flex-col">
                <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg border-2 border-ink bg-white text-3xl">
                  {course.emoji || info.emoji}
                </span>
                <h3 className="font-lab mb-2 text-xl font-bold text-ink">{course.title}</h3>
                {course.level && (
                  <span className="mb-4 inline-block self-start rounded-md border-2 border-ink/15 bg-white px-2.5 py-1 ref-tag text-pcb">
                    {course.level}
                  </span>
                )}
                <p className="mb-5 flex-1 font-semibold text-ink/65">{course.description}</p>
                {course.estimatedHours != null && (
                  <div className="mb-5 flex items-center gap-1.5 text-sm font-bold text-ink/60">
                    <Clock className="h-4 w-4" /> {course.estimatedHours} Hours of Fun
                  </div>
                )}
                <Link
                  to={`/course/${course.courseId}/lesson/intro`}
                  className="lab-btn flex w-full items-center justify-center gap-2 rounded-xl border-2 border-ink bg-signal px-4 py-3 font-extrabold text-ink"
                >
                  <Play className="h-4 w-4 fill-ink" /> Start Chapter
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fallback: subjects without courses yet keep the class picker */}
      {!loading && !hasCourses && (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {CLASSES.map(({ grade, emoji, label }, i) => (
              <button
                key={grade}
                type="button"
                onClick={() => setPicked(grade)}
                className={`lab-panel lab-lift animate-bounce-in flex flex-col p-6 text-left ${
                  picked === grade ? 'ring-2 ring-pcb ring-offset-2 ring-offset-paper' : ''
                }`}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="flex flex-1 flex-col">
                  <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg border-2 border-ink bg-white text-3xl">
                    {emoji}
                  </span>
                  <h3 className="font-lab mb-2 text-xl font-bold text-ink">{label}</h3>
                  <p className="mb-5 flex-1 font-semibold text-ink/65">
                    {info.title} lessons and quizzes made for {label}.
                  </p>
                  <span className="inline-flex items-center gap-1.5 self-start rounded-md border-2 border-ink/15 bg-white px-2.5 py-1 ref-tag text-pcb">
                    <GraduationCap className="h-3.5 w-3.5" /> Grade {grade}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {picked && (
            <div className="mt-10 flex flex-col items-center gap-3 rounded-[14px] border-2 border-dashed border-ink/25 bg-white/60 p-10 text-center">
              <span className="animate-float text-5xl">🚧</span>
              <h2 className="font-lab text-xl font-bold text-ink">
                {info.title} · Class {picked} is on the way!
              </h2>
              <p className="max-w-md font-semibold text-ink/65">
                We're busy building awesome lessons for this class. Check back soon to
                start your quest!
              </p>
              <span className="inline-flex items-center gap-1 rounded-md border-2 border-ink/15 bg-white px-2.5 py-1 ref-tag text-pcb">
                <Lock className="h-3 w-3" /> Coming Soon
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
