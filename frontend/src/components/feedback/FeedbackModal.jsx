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
        className="relative mx-4 w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl animate-[popIn_0.35s_cubic-bezier(0.34,1.56,0.64,1)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={close}
          className="absolute right-4 top-4 text-gray-400 transition-colors hover:text-gray-700"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {done ? (
          <div className="py-6 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 shadow-lg animate-[badgePop_0.6s_cubic-bezier(0.34,1.56,0.64,1)_both]">
              <Star className="h-10 w-10 fill-white text-white drop-shadow" />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900">Thank you! 🎉</h2>
            <p className="mt-1 text-gray-600">Your feedback helps us improve.</p>
          </div>
        ) : (
          <>
            <div className="mb-6 text-center">
              <h2 className="text-xl font-extrabold text-gray-900">How's it going so far?</h2>
              <p className="mt-1 text-sm text-gray-500">
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
                        ? 'fill-amber-400 text-amber-400'
                        : 'fill-gray-100 text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>

            <label className="mb-1 block text-sm font-semibold text-gray-700">
              Any suggestions or improvements? <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="Tell us what you loved or what we could do better…"
              className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}

            <div className="mt-5 flex items-center gap-3">
              <button
                onClick={close}
                className="flex-1 rounded-xl border border-gray-200 py-3 font-bold text-gray-600 transition-colors hover:bg-gray-50"
              >
                Maybe later
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 rounded-xl bg-blue-600 py-3 font-bold text-white transition-colors hover:bg-blue-700 disabled:bg-blue-300"
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
