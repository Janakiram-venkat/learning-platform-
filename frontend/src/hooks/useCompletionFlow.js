import { useCallback, useRef, useState } from 'react';
import { completionSet } from '../lib/progress/completion';
import { awardBadge, awardXPOnce } from '../lib/progress/xp';
import { markFeedbackAsked, shouldAskFeedback } from '../lib/progress/feedback';

// ---------------------------------------------------------------------------
// useCompletionFlow — "the student just finished something" in one place.
//
// Finishing a lesson, arcade round, project, lab or game step always ran the
// same chain: record the completion, award XP once, drop a badge in the
// profile, show a celebration, and — every couple of modules — ask for feedback
// before moving on. Each page had its own inlined copy, including five
// hand-rolled variants of the badge-writing block.
//
// Navigation deliberately stays with the page: where "next" goes differs a lot
// between a lesson, a project and a game step, and hiding that in here would
// make the pages harder to read, not easier.
// ---------------------------------------------------------------------------

export function useCompletionFlow() {
  const [celebration, setCelebration] = useState(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  // What to run once the student is finished with the celebration + any
  // feedback prompt. Held in a ref so a re-render can't drop it.
  const pendingNext = useRef(null);

  /**
   * Record a completion and hand back what actually changed.
   *
   * @param {object}   opts
   * @param {string}  [opts.kind]        completion kind — see COMPLETION_KEYS
   * @param {string}  [opts.id]          the id to record for that kind
   * @param {string}  [opts.xpKey]       claim key, so re-takes don't farm XP
   * @param {number}  [opts.xp]          XP to award the first time
   * @param {object}  [opts.badge]       { id, name, type }
   * @param {object|function} [opts.celebration]
   *        The celebration payload, or a builder receiving
   *        `{ firstTime, xpGained, badgeAwarded }` so the copy can react to it.
   * @returns {{ firstTime: boolean, xpGained: number, badgeAwarded: boolean }}
   */
  const complete = useCallback(({ kind, id, xpKey, xp = 0, badge, celebration: cel }) => {
    const firstTime = kind && id ? completionSet(kind).mark(id) : false;
    const xpGained = xpKey ? awardXPOnce(xpKey, xp) : 0;
    const badgeAwarded = badge ? awardBadge(badge) : false;

    const result = { firstTime, xpGained, badgeAwarded };

    if (cel) {
      setCelebration(typeof cel === 'function' ? cel(result) : cel);
    }
    return result;
  }, []);

  /**
   * Dismiss the celebration and continue.
   *
   * If a feedback prompt is due, it opens first and `next` runs after the
   * student closes it — so they're never interrupted mid-navigation.
   */
  const closeCelebration = useCallback((next) => {
    setCelebration(null);
    if (shouldAskFeedback()) {
      pendingNext.current = next || null;
      setFeedbackOpen(true);
      return;
    }
    next?.();
  }, []);

  /** Close the feedback modal (submitted or dismissed) and run the deferred step. */
  const closeFeedback = useCallback(() => {
    markFeedbackAsked();
    setFeedbackOpen(false);
    const next = pendingNext.current;
    pendingNext.current = null;
    next?.();
  }, []);

  /** Clear celebration + feedback state, e.g. when navigating to new content. */
  const reset = useCallback(() => {
    setCelebration(null);
    setFeedbackOpen(false);
    pendingNext.current = null;
  }, []);

  return {
    celebration,
    setCelebration,
    closeCelebration,
    feedbackOpen,
    closeFeedback,
    complete,
    reset,
  };
}
