import { Link } from 'react-router-dom';
import { ArrowRight, Award } from 'lucide-react';
import { getNextLessonAfterModule } from '../../../lib/progress';
import ConfettiBurst from '../shared/ConfettiBurst';

// Rewards: the closing screen — badge, recap, and where to go next.
export default function RewardsStage({ stage, courseId, moduleId, course }) {
  const nextLessonId = getNextLessonAfterModule(course, moduleId.replace('module', ''));
  return (
    <div className="relative text-center">
      <ConfettiBurst />
      <div className="relative">
        <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full border-2 border-ink bg-pcb shadow-lg animate-[badgePop_0.6s_cubic-bezier(0.34,1.56,0.64,1)_0.1s_both]">
          <Award className="h-14 w-14 text-white drop-shadow" strokeWidth={2.5} />
        </div>
        <h2 className="font-lab text-3xl font-extrabold text-[#16241D]">{stage.title}</h2>
        <div className="mx-auto mt-5 max-w-sm space-y-2">
          {stage.messages.map((m, i) => (
            <p key={i} className="rounded-xl bg-white p-3 font-bold text-ink/75 shadow-sm ring-1 ring-ink/12 animate-slide-up" style={{ animationDelay: `${i * 0.12}s` }}>
              {m}
            </p>
          ))}
        </div>
        {nextLessonId ? (
          <Link
            to={`/course/${courseId}/lesson/${nextLessonId}`}
            className="mt-7 inline-flex items-center gap-2 rounded-2xl border-2 border-ink bg-pcb px-7 py-3.5 font-extrabold text-white shadow-md transition-transform hover:scale-[1.02] active:scale-95"
          >
            Continue Learning <ArrowRight className="h-5 w-5" />
          </Link>
        ) : (
          <Link
            to="/"
            className="mt-7 inline-flex items-center gap-2 rounded-2xl border-2 border-ink bg-pcb px-7 py-3.5 font-extrabold text-white shadow-md transition-transform hover:scale-[1.02] active:scale-95"
          >
            Back to Quests <ArrowRight className="h-5 w-5" />
          </Link>
        )}
      </div>
    </div>
  );
}
