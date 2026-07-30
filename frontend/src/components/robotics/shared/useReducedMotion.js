import { useEffect, useState } from 'react';

/**
 * True when the student has asked their OS for less animation.
 *
 * The 3D widgets teach *with* motion, so they don't go fully static: they stop
 * looping on their own and wait to be stepped by hand instead. Nothing becomes
 * unreachable, it just stops moving unasked.
 */
export default function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    const onChange = (e) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
}
