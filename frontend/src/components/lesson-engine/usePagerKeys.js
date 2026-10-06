import { useEffect } from 'react';

// Left/right arrow paging, shared by the three pagers.
//
// LessonPager, ChallengePager and ProjectPager each had their own identical
// copy of this — the same listener and the same "is the student typing?"
// guard, written out three times. They disagree about a great many things (see
// the header comment on each), but not about this, so it lives in one place
// and a fix to the guard reaches all three.

/**
 * Is this element one that swallows arrow keys?
 *
 * The Monaco check is the important one: `.monaco-editor` is not a form
 * control, so without it the pager would page away mid-word every time a
 * student moved the caret with an arrow key.
 *
 * @param {EventTarget|null} el
 * @returns {boolean}
 */
export function isTypingTarget(el) {
  if (!el) return false;
  return !!el.closest?.('input, textarea, select, [contenteditable="true"], .monaco-editor');
}

/**
 * Page with the left and right arrow keys, unless focus is in an editor.
 *
 * Both callbacks decide for themselves whether the move is allowed — a gated
 * pager simply does nothing on `onNext`, so gating never has to be restated
 * here.
 *
 * @param {() => void} onNext
 * @param {() => void} onBack
 */
export function usePagerKeys(onNext, onBack) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); onNext(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); onBack(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onNext, onBack]);
}
