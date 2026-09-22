import { Link } from 'react-router-dom';
import { FlaskConical, ArrowRight } from 'lucide-react';
import { PHYSICS_8, isReady } from '../data/virtualLab';

function LessonCard({ lesson, number }) {
  if (!isReady(lesson.id)) {
    return (
      <div className="flex items-center gap-3 rounded-xl border-2 border-dashed border-ink/25 bg-paper px-4 py-3 opacity-70">
        <span className="font-mono-lab text-xs text-ink/40">{String(number).padStart(2, '0')}</span>
        <span className="flex-1 font-lab font-bold text-ink/60">{lesson.title}</span>
        <span className="rounded-full border-2 border-ink/25 px-2.5 py-0.5 text-xs font-bold text-ink/50">Soon</span>
      </div>
    );
  }
  return (
    <Link
      to={`/virtual-lab/${lesson.id}`}
      className="flex items-center gap-3 rounded-xl border-2 border-ink bg-white px-4 py-3 shadow-[4px_4px_0_rgba(22,36,29,0.9)] transition-transform hover:-translate-y-0.5"
    >
      <span className="font-mono-lab text-xs text-ink/50">{String(number).padStart(2, '0')}</span>
      <span className="flex-1 font-lab font-extrabold text-ink">{lesson.title}</span>
      <span className="flex items-center gap-1 rounded-full border-2 border-ink bg-signal px-2.5 py-0.5 text-xs font-extrabold text-ink">
        Play <ArrowRight className="h-3 w-3" />
      </span>
    </Link>
  );
}

export default function VirtualLabPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <div className="lab-panel-pcb mb-6 flex items-center gap-4 px-7 py-6">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-ink bg-signal">
          <FlaskConical className="h-6 w-6 text-ink" />
        </span>
        <div>
          <p className="ref-tag text-white/60">Experiment, build and test in your browser</p>
          <h1 className="font-lab text-2xl font-extrabold text-white">Virtual Lab</h1>
        </div>
      </div>

      <div className="mb-8 flex flex-wrap items-center gap-2">
        <span className="ref-tag rounded-md border-2 border-ink bg-white px-3 py-1 text-ink">Class 8</span>
        <span className="rounded-full border-2 border-ink bg-signal px-4 py-1.5 font-lab text-sm font-extrabold text-ink">
          Physics
        </span>
        {['Chemistry', 'Biology'].map((s) => (
          <span key={s} className="rounded-full border-2 border-dashed border-ink/30 px-4 py-1.5 font-lab text-sm font-bold text-ink/40">
            {s} · soon
          </span>
        ))}
      </div>

      {PHYSICS_8.modules.map((mod) => {
        const live = mod.lessons.filter((l) => isReady(l.id)).length;
        return (
          <section key={mod.id} className="mb-10">
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h2 className="font-lab text-xl font-extrabold text-ink">
                <span className="mr-2">{mod.emoji}</span>
                {mod.id}. {mod.title}
              </h2>
              <span className="font-mono-lab text-xs text-ink/50">{live}/{mod.lessons.length} live</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {mod.lessons.map((lesson, i) => (
                <LessonCard key={lesson.id} lesson={lesson} number={i + 1} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
