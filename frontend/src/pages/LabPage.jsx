import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { courseService } from '../services/api';
import { isAssignmentUnlocked } from '../utils/progress';
import LabRunner from '../components/lab/LabRunner';

// Full-page host for an Interactive Lab. Gates the lab behind finishing the
// module's lessons, then hands the content to the embeddable <LabRunner>.
export default function LabPage() {
  const { courseId, moduleId } = useParams(); // moduleId e.g. "module1"
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [lab, setLab] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset the loading flag when the route params change and we refetch
    setLoading(true);
    Promise.all([
      courseService.getCourse(courseId),
      courseService.getLab(courseId, moduleId),
    ])
      .then(([courseRes, labRes]) => {
        if (!active) return;
        const courseData = courseRes.data.data;
        const numericId = moduleId.replace('module', '');
        const mod = courseData.modules?.find((m) => String(m.moduleId ?? m.id) === numericId);
        if (!mod || !isAssignmentUnlocked(mod)) {
          navigate('/', { replace: true });
          return;
        }
        setCourse(courseData);
        setLab(labRes.data.data);
      })
      .catch(() => { if (active) setNotFound(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [courseId, moduleId, navigate]);

  if (loading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24">
        <div className="animate-float text-5xl">🤖</div>
        <p className="font-lab text-lg font-semibold text-ink/65">Booting up the lab...</p>
      </div>
    );
  }

  if (notFound || !lab) {
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
