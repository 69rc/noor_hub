import { useEffect, useRef } from 'react';

export function deviceTimezone() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return 'UTC'; }
}

const DENIED_KEY = 'sakinah.geo-denied';
const REFRESH_MS = 30 * 60 * 1000;

function wasDenied() { try { return localStorage.getItem(DENIED_KEY) === '1'; } catch { return false; } }
function rememberDenied() { try { localStorage.setItem(DENIED_KEY, '1'); } catch { /* private mode */ } }

async function permissionState() {
  try {
    if (navigator.permissions?.query) return (await navigator.permissions.query({ name: 'geolocation' })).state;
  } catch { /* unsupported */ }
  return 'prompt';
}

// Follow the device location for prayer times unless the user pinned a place.
// Coordinates stay on this device; the browser/OS permission prompt is always respected.
export function useAutoLocation(location, update) {
  const locationRef = useRef(location);
  locationRef.current = location;
  const busyRef = useRef(false);
  const lastFixRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const apply = pos => {
      if (cancelled) return;
      lastFixRef.current = Date.now();
      update(cur => ({
        ...cur,
        location: {
          ...cur.location,
          latitude: Number(pos.coords.latitude.toFixed(4)),
          longitude: Number(pos.coords.longitude.toFixed(4)),
          timezone: deviceTimezone(),
          label: 'My location',
          manual: false
        }
      }));
    };
    const attempt = async silent => {
      if (busyRef.current || cancelled) return;
      if (locationRef.current.manual === true) return;
      if (!navigator.geolocation) return;
      const state = await permissionState();
      if (state === 'denied') return;
      if (silent && state !== 'granted') return;
      if (!silent && state === 'prompt' && wasDenied()) return;
      busyRef.current = true;
      navigator.geolocation.getCurrentPosition(
        pos => { busyRef.current = false; apply(pos); },
        err => { busyRef.current = false; if (err.code === 1) rememberDenied(); },
        { timeout: 12000, maximumAge: 300000 }
      );
    };
    attempt(false);
    const onFocus = () => { if (Date.now() - lastFixRef.current > REFRESH_MS) attempt(true); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}