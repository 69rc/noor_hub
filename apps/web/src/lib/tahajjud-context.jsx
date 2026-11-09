import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { usePreferences } from './preferences';
import { useLocalState } from './hooks';
import { localDate, shiftDate } from './prayer';
import { activeTahajjudWindow, nextTahajjudWindow, tahajjudStreak, tahajjudBestStreak } from './tahajjud';

const TahajjudContext = createContext(null);
const TICK_MS = 20000;
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`);
const clamp = (value, min, max) => Math.min(max, Math.max(min, Math.round(Number(value) || min)));

// Owns all tahajjud state so the Worship tab and the app-wide prompt stay in sync, and so the
// prompt can fire even when the user is on another screen. Purely local: no network, no account.
export function TahajjudProvider({ children }) {
  const { preferences, update } = usePreferences();
  const tz = preferences.location.timezone;
  const enabled = preferences.notifications.tahajjud;

  const [records, setRecords] = useLocalState('sakinah.tahajjud', []);
  const [goal, setGoal] = useLocalState('sakinah.tahajjud-goal', { nights: 2, rakahs: 2 });
  const [promptState, setPromptState] = useLocalState('sakinah.tahajjud-prompt', { nightKey: null, dismissed: false, snoozedUntil: 0, notified: false });
  const [previewing, setPreviewing] = useState(false);
  const [tick, setTick] = useState(0);

  const bump = useCallback(() => setTick(value => value + 1), []);
  useEffect(() => { const id = setInterval(bump, TICK_MS); return () => clearInterval(id); }, [bump]);
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') bump(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', bump);
    return () => { document.removeEventListener('visibilitychange', onVisible); window.removeEventListener('focus', bump); };
  }, [bump]);

  const now = useMemo(() => new Date(), [tick]);
  const todayKey = useMemo(() => localDate(now, tz), [now, tz]);
  const activeWindow = useMemo(() => activeTahajjudWindow(preferences.location, preferences.method, preferences.asr, now, tz), [preferences.location, preferences.method, preferences.asr, now, tz]);
  const upcomingWindow = useMemo(() => nextTahajjudWindow(preferences.location, preferences.method, preferences.asr, now, tz), [preferences.location, preferences.method, preferences.asr, now, tz]);

  // Start each night with a clean prompt state.
  useEffect(() => { setPromptState(ps => (ps.nightKey === todayKey ? ps : { nightKey: todayKey, dismissed: false, snoozedUntil: 0, notified: false })); }, [todayKey, setPromptState]);

  // Fire one system notification per night when the window opens and reminders are on. On iPhone
  // this only surfaces in an installed PWA with permission; the in-app prompt is the fallback.
  useEffect(() => {
    if (!enabled || !activeWindow || promptState.notified) return;
    setPromptState(ps => (ps.notified ? ps : { ...ps, notified: true, nightKey: todayKey }));
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try { new Notification('Tahajjud · Noor Hub', { body: 'The last third of the night has begun. Make wudu, then pray — even two rak‘ahs.', icon: '/icons/icon-192.png', badge: '/icons/icon-192.png', tag: `tahajjud:${todayKey}` }); } catch { /* constructor can throw on some platforms */ }
    }
  }, [enabled, activeWindow, promptState.notified, setPromptState, todayKey]);

  const tonight = useMemo(() => records.find(r => r.date === todayKey) || null, [records, todayKey]);
  const streak = useMemo(() => tahajjudStreak(records, todayKey), [records, todayKey]);
  const best = useMemo(() => tahajjudBestStreak(records), [records]);
  const weekCount = useMemo(() => records.filter(r => r.date >= shiftDate(todayKey, -6) && r.date <= todayKey).length, [records, todayKey]);
  const snoozed = promptState.snoozedUntil > Date.now();
  const promptVisible = previewing || Boolean(enabled && activeWindow && !tonight && !promptState.dismissed && !snoozed);

  const recordNight = useCallback((opts = {}) => {
    const key = opts.date || localDate(new Date(), tz);
    const next = { id: (records.find(x => x.date === key) || {}).id || uuid(), date: key, rakahs: clamp(opts.rakahs, 2, 100), witr: clamp(opts.witr, 0, 20), at: new Date().toISOString() };
    setRecords(current => [next, ...current.filter(x => x.date !== key)]);
    return next;
  }, [records, setRecords, tz]);

  const removeRecord = useCallback(id => setRecords(current => current.filter(x => x.id !== id)), [setRecords]);
  const updateGoal = useCallback(patch => setGoal(current => ({ ...current, ...patch })), [setGoal]);
  const dismissPrompt = useCallback(() => { setPreviewing(false); setPromptState(ps => ({ ...ps, dismissed: true, nightKey: todayKey })); }, [setPromptState, todayKey]);
  const snoozePrompt = useCallback((minutes = 15) => { setPreviewing(false); setPromptState(ps => ({ ...ps, snoozedUntil: Date.now() + minutes * 60000, nightKey: todayKey })); }, [setPromptState, todayKey]);
  const previewPrompt = useCallback(() => setPreviewing(true), []);
  const closePreview = useCallback(() => setPreviewing(false), []);
  const markPrayed = useCallback(rakahs => { const record = recordNight({ rakahs, witr: 0 }); setPreviewing(false); setPromptState(ps => ({ ...ps, dismissed: true, nightKey: todayKey })); return record; }, [recordNight, setPromptState, todayKey]);

  // Enabling never hard-requires notification permission: the in-app prompt works regardless, and
  // we request permission best-effort so installed PWAs can also alert in the background.
  const setReminder = useCallback(async value => {
    update(current => ({ notifications: { ...current.notifications, tahajjud: value } }));
    if (value && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      try { return await Notification.requestPermission(); } catch { return Notification.permission; }
    }
    return typeof Notification !== 'undefined' ? Notification.permission : 'unsupported';
  }, [update]);

  const value = useMemo(() => ({
    records, goal, todayKey, tonight, streak, best, weekCount, enabled,
    activeWindow, upcomingWindow, displayWindow: activeWindow || upcomingWindow,
    promptVisible, previewing,
    recordNight, removeRecord, updateGoal, dismissPrompt, snoozePrompt, previewPrompt, closePreview, markPrayed, setReminder
  }), [records, goal, todayKey, tonight, streak, best, weekCount, enabled, activeWindow, upcomingWindow, promptVisible, previewing, recordNight, removeRecord, updateGoal, dismissPrompt, snoozePrompt, previewPrompt, closePreview, markPrayed, setReminder]);

  return <TahajjudContext.Provider value={value}>{children}</TahajjudContext.Provider>;
}

export function useTahajjud() {
  const context = useContext(TahajjudContext);
  if (!context) throw new Error('useTahajjud must be used within a TahajjudProvider');
  return context;
}
