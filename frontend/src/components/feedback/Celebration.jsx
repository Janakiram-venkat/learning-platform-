import { useEffect } from 'react';
import { Award, X, RotateCcw, PartyPopper } from 'lucide-react';

// A small confetti burst rendered with pure CSS — no extra dependencies.
const CONFETTI_COLORS = ['#34d399', '#60a5fa', '#fbbf24', '#f472b6', '#a78bfa', '#f87171'];
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
        className="relative mx-4 w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-2xl animate-[popIn_0.45s_cubic-bezier(0.34,1.56,0.64,1)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 transition-colors hover:text-gray-700"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Icon disc */}
        <div
          className={`mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full shadow-lg animate-[badgePop_0.6s_cubic-bezier(0.34,1.56,0.64,1)_0.15s_both] ${
            isRetry
              ? 'bg-gradient-to-br from-orange-400 to-rose-500'
              : isLesson
              ? 'bg-gradient-to-br from-teal-400 to-emerald-500'
              : 'bg-gradient-to-br from-amber-400 to-yellow-500'
          }`}
        >
          {isRetry ? (
            <RotateCcw className="h-12 w-12 text-white drop-shadow" strokeWidth={2.5} />
          ) : isLesson ? (
            <PartyPopper className="h-12 w-12 text-white drop-shadow" strokeWidth={2.5} />
          ) : (
            <Award className="h-12 w-12 text-white drop-shadow" strokeWidth={2.5} />
          )}
        </div>

        <h2 className="mb-2 text-2xl font-extrabold text-gray-900">{title}</h2>
        <p className="mb-5 text-gray-600">{message}</p>

        {badge && !isRetry && (
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-sm font-bold text-amber-700 ring-1 ring-amber-200">
            <Award className="h-4 w-4" />
            Badge earned: {badge}
          </div>
        )}

        {isRetry && (
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-2.5 font-bold text-white transition-colors hover:bg-orange-600"
          >
            <RotateCcw className="h-4 w-4" />
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}
