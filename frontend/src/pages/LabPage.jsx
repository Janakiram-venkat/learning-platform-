import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { isAssignmentUnlocked } from '../lib/progress';
import { useCourseContent } from '../hooks/useCourseContent';
import LabRunner from '../components/lab/LabRunner';

// Full-page host for an Interactive Lab. Gates the lab behind finishing the
// module's lessons, then hands the content to the embeddable <LabRunner>.
export default function LabPage() {
  const { courseId, moduleId } = useParams(); // moduleId e.g. "module1"
  const navigate = useNavigate();

  const { course, item: lab, loading } = useCourseContent(courseId, 'lab', moduleId);

  // A student who deep-links to a lab they haven't unlocked goes back to the
  // course list rather than seeing content they haven't earned.
  useEffect(() => {
    if (!course) return;
    const numericId = moduleId.replace('module', '');
    const mod = course.modules?.find((m) => String(m.moduleId ?? m.id) === numericId);
    if (!mod || !isAssignmentUnlocked(mod)) navigate('/', { replace: true });
  }, [course, moduleId, navigate]);

  if (loading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24">
        <div className="animate-float text-5xl">🤖</div>
        <p className="font-lab text-lg font-semibold text-ink/65">Booting up the lab...</p>
      </div>
    );
  }

  if (!lab) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
        <span className="text-5xl">🚧</span>
        <p className="font-lab text-lg font-semibold text-ink/65">This lab isn't ready yet.</p>
        <Link to="/" className="lab-btn rounded-xl border-2 border-ink bg-signal px-5 py-2.5 font-extrabold text-ink">Back to Quests</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
      <LabRunner lab={lab} course={course} courseId={courseId} moduleId={moduleId} />
    </div>
  );
}
