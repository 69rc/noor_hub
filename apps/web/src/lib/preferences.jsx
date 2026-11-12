import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_PREFERENCES, loadPreferences } from './constants';
import { useAutoLocation } from './geolocation';
const PreferencesContext = createContext(null);
export function PreferencesProvider({ children }) {
  const [preferences, setPreferences] = useState(loadPreferences);
  const [systemDark, setSystemDark] = useState(() => matchMedia('(prefers-color-scheme: dark)').matches);
  useEffect(() => { const media = matchMedia('(prefers-color-scheme: dark)'); const listener = e => setSystemDark(e.matches); media.addEventListener('change', listener); return () => media.removeEventListener('change', listener); }, []);
  const dark = preferences.theme === 'dark' || (preferences.theme === 'system' && systemDark);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#101d19' : '#174b3a');
    try { localStorage.setItem('sakinah.preferences', JSON.stringify(preferences)); } catch { window.dispatchEvent(new CustomEvent('sakinah-storage-error')); }
  }, [preferences, dark]);
  const update = patch => setPreferences(current => ({ ...current, ...(typeof patch === 'function' ? patch(current) : patch) }));
  useAutoLocation(preferences.location, update);
  const value = useMemo(() => ({ preferences, update, dark, reset: () => setPreferences(structuredClone(DEFAULT_PREFERENCES)) }), [preferences, dark]);
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}
export const usePreferences = () => useContext(PreferencesContext);