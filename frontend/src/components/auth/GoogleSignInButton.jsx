import { useEffect, useRef } from 'react';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function GoogleSignInButton({ onSuccess, onError }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!CLIENT_ID) {
      onError?.('Google client ID is not configured (VITE_GOOGLE_CLIENT_ID).');
      return;
    }

    let cancelled = false;

    // The GIS script loads async; wait until window.google is available.
    const init = () => {
      if (cancelled) return;
      const google = window.google;
      if (!google?.accounts?.id || !containerRef.current) {
        setTimeout(init, 150);
        return;
      }

      google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: (response) => onSuccess?.(response.credential),
      });

      google.accounts.id.renderButton(containerRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'pill',
        width: 360,
      });
    };

    init();
    return () => {
      cancelled = true;
    };
  }, [onSuccess, onError]);

  return <div ref={containerRef} className="flex justify-center" />;
}
