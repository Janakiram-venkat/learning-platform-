import { useEffect } from 'react';
import { Award, X, RotateCcw, PartyPopper } from 'lucide-react';

// A small confetti burst rendered with pure CSS — no extra dependencies.
const CONFETTI_COLORS = ['#FFC93C', '#1F7A5C', '#E8503A', '#23B5D3', '#16241D', '#3FBF7F'];
const CONFETTI_PIECES = Array.from({ length: 40 }, (_, i) => i);

export default function Celebration({ open, title, message, badge, onClose, variant = 'success' }) {
  const isRetry = variant === 'retry';
  const isLesson = variant === 'lesson'; // lesson complete: animation only, no badge

  // Auto-dismiss after a few seconds so it never blocks the lesson.
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(onClose, 4500);
    return () => clearTimeout(timer);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-[fadeIn_0.25s_ease-out]"
      onClick={onClose}
    >
      {/* Confetti layer — only on success */}
      {!isRetry && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {CONFETTI_PIECES.map((i) => (
            <span
              key={i}
              className="absolute top-0 block h-3 w-2 rounded-sm animate-[confettiFall_linear_forwards]"
              style={{
                left: `${(i / CONFETTI_PIECES.length) * 100}%`,
                backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                animationDuration: `${2 + (i % 5) * 0.4}s`,
                animationDelay: `${(i % 7) * 0.12}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Modal card */}
      <div
        className="lab-panel relative mx-4 w-full max-w-sm p-8 text-center animate-[popIn_0.45s_cubic-bezier(0.34,1.56,0.64,1)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-ink/40 transition-colors hover:text-ink"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Icon disc */}
        <div
          className={`mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-ink shadow-lg animate-[badgePop_0.6s_cubic-bezier(0.34,1.56,0.64,1)_0.15s_both] ${
            isRetry ? 'bg-wire' : isLesson ? 'bg-pcb' : 'bg-signal'
          }`}
        >
          {isRetry ? (
            <RotateCcw className="h-12 w-12 text-white drop-shadow" strokeWidth={2.5} />
          ) : isLesson ? (
            <PartyPopper className="h-12 w-12 text-white drop-shadow" strokeWidth={2.5} />
          ) : (
            <Award className="h-12 w-12 text-ink drop-shadow" strokeWidth={2.5} />
          )}
        </div>

        <h2 className="font-lab mb-2 text-2xl font-extrabold text-ink">{title}</h2>
        <p className="mb-5 text-ink/65">{message}</p>

        {badge && !isRetry && (
          <div className="inline-flex items-center gap-2 rounded-lg border-2 border-ink bg-signal/25 px-4 py-2 text-sm font-bold text-ink">
            <Award className="h-4 w-4" />
            Badge earned: {badge}
          </div>
        )}

        {isRetry && (
          <button
            onClick={onClose}
            className="lab-btn inline-flex items-center gap-2 rounded-xl border-2 border-ink bg-signal px-6 py-2.5 font-extrabold text-ink"
          >
            <RotateCcw className="h-4 w-4" />
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}
