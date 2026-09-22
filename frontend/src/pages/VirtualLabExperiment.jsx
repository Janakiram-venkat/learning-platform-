import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import LessonWidget from '../components/lesson/LessonWidget';
import { getExperiment } from '../data/virtualLab';

// One playable experiment. Public, like the hub: no account, no backend.
export default function VirtualLabExperiment() {
  const { experimentId } = useParams();
  const exp = getExperiment(experimentId);

  if (!exp || !exp.block) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-6 py-24 text-center">
        <span className="text-5xl">🧪</span>
        <p className="font-lab text-lg font-semibold text-ink/65">This experiment is not ready yet.</p>
        <Link
          to="/virtual-lab"
          className="rounded-xl border-2 border-ink bg-signal px-5 py-2.5 font-extrabold text-ink"
        >
          Back to the lab
        </Link>
      </div>
    );
  }

  const { block } = exp;

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <Link
        to="/virtual-lab"
        className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-ink/60 transition-colors hover:text-pcb"
      >
        <ArrowLeft className="h-4 w-4" /> Virtual Lab
      </Link>

      <p className="ref-tag text-ink/60">
        Class 8 · Physics · {exp.module.title} · Lesson {exp.number}
      </p>
      <h1 className="font-lab mt-1 text-3xl font-extrabold text-ink sm:text-4xl">
        {exp.module.emoji} {exp.title}
      </h1>
      {block.hook && <p className="mt-2 max-w-2xl text-base font-semibold text-ink/65">{block.hook}</p>}

      <div className="@container">
        <LessonWidget block={block} />
      </div>

      {block.takeaway && (
        <div className="rounded-2xl border-2 border-ink bg-white p-5 shadow-[4px_4px_0_rgba(22,36,29,0.9)]">
          <p className="ref-tag text-ink/50">Takeaway</p>
          <p className="mt-1 font-lab text-lg font-extrabold text-ink">{block.takeaway}</p>
        </div>
      )}

      <div className="mt-8 flex items-center justify-between gap-3">
        {exp.prev ? (
          <Link to={`/virtual-lab/${exp.prev.id}`} className="inline-flex items-center gap-2 font-bold text-ink/70 hover:text-pcb">
            <ArrowLeft className="h-4 w-4" /> {exp.prev.title}
          </Link>
        ) : <span />}
        {exp.next ? (
          <Link to={`/virtual-lab/${exp.next.id}`} className="inline-flex items-center gap-2 font-bold text-ink/70 hover:text-pcb">
            {exp.next.title} <ArrowRight className="h-4 w-4" />
          </Link>
        ) : <span />}
      </div>
    </div>
  );
}
