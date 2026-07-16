import { useState } from 'react';
import { Star, X } from 'lucide-react';
import { feedbackService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { getCompletedModuleCount } from '../../utils/progress';

// Asked after every few modules: a 5-star rating for content + animations
// plus an optional comment box for improvement ideas. Saved to the backend.
export default function FeedbackModal({ open, courseId, onClose }) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  if (!open) return null;

  const reset = () => {
    setRating(0);
    setHover(0);
    setComment('');
    setError('');
    setDone(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please pick a star rating first.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await feedbackService.submit({
        rating,
        comment: comment.trim() || null,
        user_email: user?.email || null,
        course_id: courseId || null,
        modules_completed: getCompletedModuleCount(),
      });
      setDone(true);
      // Brief thank-you, then close.
      setTimeout(close, 1400);
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
        'Could not save your feedback. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const active = hover || rating;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
      onClick={close}
    >
      <div
        className="lab-panel relative mx-4 w-full max-w-md p-8 animate-[popIn_0.35s_cubic-bezier(0.34,1.56,0.64,1)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={close}
          className="absolute right-4 top-4 text-ink/40 transition-colors hover:text-ink"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {done ? (
          <div className="py-6 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-ink bg-signal shadow-lg animate-[badgePop_0.6s_cubic-bezier(0.34,1.56,0.64,1)_both]">
              <Star className="h-10 w-10 fill-ink text-ink drop-shadow" />
            </div>
            <h2 className="font-lab text-2xl font-extrabold text-ink">Thank you! 🎉</h2>
            <p className="mt-1 text-ink/65">Your feedback helps us improve.</p>
          </div>
        ) : (
          <>
            <div className="mb-6 text-center">
              <h2 className="font-lab text-xl font-extrabold text-ink">How's it going so far?</h2>
              <p className="mt-1 text-sm text-ink/55">
                Rate the lessons and animations — your feedback shapes what's next.
              </p>
            </div>

            <div className="mb-6 flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => { setRating(n); setError(''); }}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  className="transition-transform active:scale-90"
                  aria-label={`${n} star${n > 1 ? 's' : ''}`}
                >
                  <Star
                    className={`h-10 w-10 transition-colors ${
                      n <= active
                        ? 'fill-signal text-signal'
                        : 'fill-ink/5 text-ink/25'
                    }`}
                  />
                </button>
              ))}
            </div>

            <label className="mb-1 block text-sm font-semibold text-ink/75">
              Any suggestions or improvements? <span className="font-normal text-ink/40">(optional)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="Tell us what you loved or what we could do better…"
              className="w-full resize-none rounded-xl border-2 border-ink/20 px-4 py-3 text-ink outline-none transition-colors focus:border-pcb focus:ring-2 focus:ring-pcb/20"
            />

            {error && <p className="mt-3 text-sm font-medium text-wire">{error}</p>}

            <div className="mt-5 flex items-center gap-3">
              <button
                onClick={close}
                className="flex-1 rounded-xl border-2 border-ink/20 py-3 font-bold text-ink/60 transition-colors hover:bg-ink/5"
              >
                Maybe later
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="lab-btn flex-1 rounded-xl border-2 border-ink bg-pcb py-3 font-extrabold text-white disabled:opacity-60"
              >
                {submitting ? 'Sending…' : 'Submit'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
