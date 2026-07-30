import { useEffect, useRef, useState } from 'react';

/**
 * Tracks whether a node is on screen.
 *
 * Every 3D widget uses this to decide whether its `<Canvas>` should be mounted
 * at all. A browser only allows a handful of live WebGL contexts, and a lesson
 * can hold several widgets, so an off-screen scene gives its context back
 * rather than sitting there burning frames.
 */
export default function useInView({ rootMargin = '200px' } = {}) {
  const ref = useRef(null);
  // No IntersectionObserver (very old browser) — show it and never observe.
  const unobservable = typeof IntersectionObserver === 'undefined';
  const [inView, setInView] = useState(unobservable);

  useEffect(() => {
    const node = ref.current;
    if (!node || unobservable) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [rootMargin, unobservable]);

  return [ref, inView];
}
