import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { progressService } from '../services/api';
import { snapshotProgress, applyProgress, clearProgress } from '../utils/progress';

/**
 * Keeps each signed-in student's progress in sync with the backend.
 *
 *  - On login: pull the server's saved progress into the local cache (server
 *    is the source of truth). If the account has none yet, seed it from
 *    whatever is in the local cache (covers "played a bit, then signed up").
 *  - On any progress change: debounce, then push the full snapshot up.
 *  - On logout: wipe the local cache so the next user starts clean.
 *
 * Renders nothing — it's a behavioural component mounted once near the root.
 */
export default function ProgressSync() {
  const { user } = useAuth();
  // The email we've successfully hydrated; gates pushes so we never overwrite
  // a user's server data before we've loaded it.
  const hydratedFor = useRef(null);
  const prevEmail = useRef(null);
  const timer = useRef(null);

  // Hydrate on login / clear on logout.
  useEffect(() => {
    const email = user?.email || null;

    if (!email) {
      if (prevEmail.current) clearProgress(); // real sign-out, not anonymous load
      prevEmail.current = null;
      hydratedFor.current = null;
      return;
    }

    let cancelled = false;
    const localSeed = snapshotProgress(); // capture before we overwrite anything

    progressService.get()
      .then((res) => {
        if (cancelled) return;
        const server = res.data?.progress || {};
        if (server && Object.keys(server).length > 0) {
          clearProgress();
          applyProgress(server); // returning user — server wins
        } else if (Object.keys(localSeed).length > 0) {
          progressService.save(localSeed).catch(() => {}); // seed new account
        }
        hydratedFor.current = email;
      })
      .catch(() => {
        // Network/auth hiccup: keep local cache, allow future pushes anyway.
        hydratedFor.current = email;
      });

    prevEmail.current = email;
    return () => { cancelled = true; };
  }, [user]);

  // Debounced push whenever progress changes.
  useEffect(() => {
    const email = user?.email || null;
    if (!email) return;

    const onChange = () => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        if (hydratedFor.current !== email) return; // don't push before hydrate
        progressService.save(snapshotProgress()).catch(() => {});
      }, 1000);
    };

    window.addEventListener('progress-change', onChange);
    window.addEventListener('xp-change', onChange);
    return () => {
      window.removeEventListener('progress-change', onChange);
      window.removeEventListener('xp-change', onChange);
      clearTimeout(timer.current);
    };
  }, [user]);

  return null;
}
