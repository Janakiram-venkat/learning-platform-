import { Link } from 'react-router-dom';
import { FlaskConical, ArrowLeft } from 'lucide-react';

// Placeholder until the virtual lab is built.
export default function VirtualLabPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <div className="lab-panel-pcb mb-8 flex items-center gap-4 px-7 py-6">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-ink bg-signal">
          <FlaskConical className="h-6 w-6 text-ink" />
        </span>
        <div>
          <p className="ref-tag text-white/60">Experiment, build and test in your browser</p>
          <h1 className="font-lab text-2xl font-extrabold text-white">Virtual Lab</h1>
        </div>
      </div>

      <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-ink/25 bg-paper px-6 py-20 text-center">
        <span className="mb-4 rounded-full border-2 border-ink bg-signal px-4 py-1 font-lab text-sm font-extrabold text-ink">
          Coming soon
        </span>
        <h2 className="font-lab text-xl font-extrabold text-ink">The lab is still being wired up</h2>
        <p className="mt-2 max-w-md font-semibold text-ink/60">
          Check back soon for hands-on experiments you can run right here.
        </p>
        <Link
          to="/"
          className="mt-6 flex items-center gap-1.5 rounded-lg px-3 py-2 font-bold text-ink/70 transition-colors hover:bg-pcb/10 hover:text-pcb"
        >
          <ArrowLeft className="h-4 w-4" /> Back home
        </Link>
      </div>
    </div>
  );
}
