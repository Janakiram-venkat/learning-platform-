import { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronLeft, SkipForward } from 'lucide-react';
import { useCompletionFlow } from '../../hooks/useCompletionFlow';
import { awardXPOnce } from '../../lib/progress';
import { STAGES, TERMINAL_STAGE } from './stages';

// ---------------------------------------------------------------------------
// LabRunner — the embeddable engine for a data-driven, multi-stage lab.
//
// Content lives in courses/<course>/labs/module<N>.json. Each stage's `type`
// is looked up in the STAGES registry (see ./stages/index.js); the runner only
// knows about progressing through them, not what any of them do. Rendered both
// as a full page (LabPage) and inside the AI course lesson's right panel.
// No code editor.
// ---------------------------------------------------------------------------

export default function LabRunner({ lab, course, courseId, moduleId }) {
  const [stageIdx, setStageIdx] = useState(0);
  const topRef = useRef(null);
  const { complete } = useCompletionFlow();

  // Scroll the runner to the top whenever we move to a new stage.
  useEffect(() => { topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [stageIdx]);

  const goToStage = (fn) => setStageIdx((i) => fn(i));

  const handleStageComplete = (stage, idx) => {
    awardXPOnce(`lab-${courseId}-${moduleId}-s${idx}`, stage.xp || 0);

    // The last interactive stage finishes the lab — the screen after it is the
    // rewards screen, which has nothing left to complete.
    if (idx >= lab.stages.length - 2) {
      complete({
        kind: 'labs',
        id: `${courseId}-${moduleId}`,
        badge: lab.badge
          ? { id: `lab-${courseId}-${moduleId}`, name: lab.badge, type: 'lab' }
          : undefined,
      });
    }

    goToStage((i) => Math.min(i + 1, lab.stages.length - 1));
  };

  // Skip the current stage without awarding XP or marking it complete.
  const handleSkip = () => goToStage((i) => Math.min(i + 1, lab.stages.length - 1));
  // Step back to revisit an earlier stage.
  const handleBack = () => goToStage((i) => Math.max(i - 1, 0));

  const stage = lab.stages[stageIdx];
  const total = lab.stages.length;
  const pct = Math.round((stageIdx / (total - 1)) * 100);
  const isTerminal = stage.type === TERMINAL_STAGE;
  const canSkip = !isTerminal && stageIdx < total - 1;
  const canGoBack = stageIdx > 0;

  const StageComponent = STAGES[stage.type];

  return (
    <div ref={topRef}>
      {/* Header */}
      <div className="mb-2 flex items-center gap-3">
        <span className="text-4xl">{lab.emoji || '🧪'}</span>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-pcb">Interactive Lab · {lab.difficulty} · {lab.duration}</p>
          <h1 className="font-lab text-2xl font-extrabold text-[#16241D] sm:text-3xl">{lab.title}</h1>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6 mt-4">
        <div className="mb-1 flex items-center justify-between gap-3 text-xs font-bold text-ink/55">
          <div className="flex items-center gap-3">
            <span>Stage {stageIdx + 1} of {total}</span>
            {canGoBack && (
              <button
                onClick={handleBack}
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-bold text-ink/40 transition-colors hover:bg-ink/5 hover:text-pcb"
                title="Go back to the previous stage"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Back
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1"><ChevronRight className="h-3 w-3" /> {stage.title}</span>
            {canSkip && (
              <button
                onClick={handleSkip}
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-bold text-ink/40 transition-colors hover:bg-ink/5 hover:text-pcb"
                title="Skip to the next stage (no XP awarded)"
              >
                Skip <SkipForward className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-ink/15">
          <div className="h-full rounded-full bg-pcb transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Stage card */}
      <div className="rounded-3xl border border-ink/12 bg-white p-5 shadow-sm sm:p-7" key={stageIdx}>
        {!isTerminal && (
          <>
            <h2 className="font-lab text-xl font-extrabold text-[#16241D] sm:text-2xl">{stage.title}</h2>
            {stage.prompt && <p className="mb-5 mt-1 text-ink/65">{stage.prompt}</p>}
          </>
        )}

        {!StageComponent ? (
          <p className="text-ink/55">Unknown stage type "{stage.type}".</p>
        ) : isTerminal ? (
          <StageComponent stage={stage} courseId={courseId} moduleId={moduleId} course={course} />
        ) : (
          <StageComponent stage={stage} onComplete={() => handleStageComplete(stage, stageIdx)} />
        )}
      </div>
    </div>
  );
}
