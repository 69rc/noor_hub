import { useCallback, useEffect, useState } from 'react';
export function useLocalState(key, initial) {
  const [state, setState] = useState(() => { try { const saved = localStorage.getItem(key); return saved ? JSON.parse(saved) : typeof initial === 'function' ? initial() : initial; } catch { return typeof initial === 'function' ? initial() : initial; } });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(state)); } catch { window.dispatchEvent(new CustomEvent('sakinah-storage-error')); } }, [key, state]);
  return [state, setState];
}
export function useOnline() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => { const update = () => setOnline(navigator.onLine); window.addEventListener('online', update); window.addEventListener('offline', update); return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); }; }, []);
  return online;
}
export function useResource(loader, deps) {
  const [state, setState] = useState({ data: null, loading: true, error: '', offline: false });
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt(v => v + 1), []);
  useEffect(() => {
    let active = true;
    setState(current => ({ ...current, loading: true, error: '' }));
    Promise.resolve(loader()).then(result => { if (active) setState({ data: result.data ?? result, loading: false, error: '', offline: Boolean(result.offline) }); }).catch(error => { if (active) setState({ data: null, loading: false, error: error.message || 'Unable to load this content.', offline: false }); });
    return () => { active = false; };
  }, [...deps, attempt]);
  return { ...state, retry };
}
export function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const timer = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(timer); }, []);
  return now;
}