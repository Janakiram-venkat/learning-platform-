import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { courseService } from '../services/api';
import { Lock, Gamepad2, CheckCircle2, ArrowRight, BookOpen } from 'lucide-react';
import {
  countGameStepsDone, isGameModuleUnlocked,
} from '../utils/progress';

// The game course's front door: one card per module, each one a whole game.
export default function GameCoursePage() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    courseService.getCourse(courseId)
      .then((res) => { if (active) setCourse(res.data.data); })
      .catch(() => { /* handled by the empty state below */ })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [courseId]);

  if (loading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24">
        <div className="animate-float text-5xl">🎮</div>
        <p className="font-lab text-lg font-semibold text-ink/65">Loading the arcade…</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
        <span className="text-5xl">🕹️</span>
        <p className="font-lab text-lg font-semibold text-ink/65">This course isn't ready yet.</p>
        <Link to="/" className="lab-btn rounded-xl border-2 border-ink bg-signal px-5 py-2.5 font-extrabold text-ink">Back to Quests</Link>
      </div>
    );
  }

  return (
    <div className="bench-grid flex-1 px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10 text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-md border-2 border-ink bg-white px-3 py-1 ref-tag text-ink">
            <span className="led" style={{ color: '#E8503A' }} /> TRK-GAME
          </span>
          <h1 className="font-lab text-3xl font-extrabold text-ink sm:text-4xl">{course.title}</h1>
          <p className="mx-auto mt-3 max-w-xl text-lg text-ink/65">{course.description}</p>
          {course.prerequisite?.note && (
            <p className="mx-auto mt-3 max-w-xl text-sm font-semibold text-ink/50">
              Before you start: {course.prerequisite.note}
            </p>
          )}
          <Link
            to={`/course/${courseId}/reference`}
            className="lab-btn mt-5 inline-flex items-center gap-2 rounded-xl border-2 border-ink bg-white px-4 py-2.5 font-extrabold text-ink"
          >
            <BookOpen className="h-4 w-4" /> The stage library — every tool, explained
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {course.modules?.map((m, idx) => {
            const moduleKey = `module${m.moduleId ?? m.id}`;
            const total = m.stepCount ?? m.steps?.length ?? 0;
            const done = countGameStepsDone(moduleKey, total);
            const unlocked = isGameModuleUnlocked(course, idx);
            const complete = total > 0 && done >= total;
            const ready = total > 0;

            const inner = (
              <>
                <div className="mb-3 flex items-start justify-between gap-3">
                  <span className="text-4xl">{m.emoji || '🎮'}</span>
                  {complete ? (
                    <CheckCircle2 className="h-6 w-6 text-pcb" />
                  ) : !unlocked || !ready ? (
                    <Lock className="h-5 w-5 text-ink/30" />
                  ) : (
                    <Gamepad2 className="h-6 w-6 text-wire" />
                  )}
                </div>
                <p className="ref-tag text-pcb">Game {idx + 1}</p>
                <h2 className="font-lab text-xl font-extrabold text-ink">{m.title}</h2>
                <p className="mt-2 min-h-[3rem] text-sm text-ink/65">{m.tagline}</p>

                {ready ? (
                  <>
                    <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full border-2 border-ink bg-ink/10">
                      <div
                        className="h-full bg-signal transition-all"
                        style={{ width: `${total ? (done / total) * 100 : 0}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs font-bold text-ink/50">{done} of {total} steps built</p>
                  </>
                ) : (
                  <p className="mt-4 text-xs font-extrabold uppercase tracking-wide text-ink/40">Coming soon</p>
                )}
              </>
            );

            const base = 'lab-panel block p-5 text-left';
            if (!ready || !unlocked) {
              return (
                <div
                  key={moduleKey}
                  title={ready ? 'Finish the game before this one to unlock it' : 'Not built yet'}
                  className={`${base} cursor-not-allowed opacity-55`}
                >
                  {inner}
                </div>
              );
            }
            return (
              <Link key={moduleKey} to={`/course/${courseId}/module/${moduleKey}/step/0`} className={base}>
                {inner}
                <span className="mt-4 inline-flex items-center gap-1.5 font-extrabold text-pcb">
                  {done > 0 ? 'Keep building' : 'Start building'} <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
