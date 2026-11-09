import { useEffect, useMemo, useRef, useState } from 'react';
import { usePreferences } from '../../lib/preferences';
import { calculatePrayerTimes, dateFromKey, localDate } from '../../lib/prayer';
import { PRAYERS, PRAYER_NAMES } from '../../lib/constants';

export function Reminders() {
  const { preferences } = usePreferences();
  const [tick, setTick] = useState(0);
  const fired = useRef(new Set());
  useEffect(() => { const id = setInterval(() => setTick(value => value + 1), 15000); return () => clearInterval(id); }, []);
  const today = localDate(new Date(), preferences.location.timezone);
  const result = useMemo(() => calculatePrayerTimes(preferences.location, preferences.method, preferences.asr, dateFromKey(today)), [preferences.location, preferences.method, preferences.asr, today]);
  useEffect(() => { fired.current.clear(); }, [today]);
  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const current = Date.now();
    const fire = (key, title, body) => { if (fired.current.has(key)) return; fired.current.add(key); try { new Notification(title, { body, icon: '/icons/icon-192.png', tag: key }); } catch { /* notification construction can fail on some platforms */ } };
    const lead = preferences.notifications.lead * 60000;
    for (const name of PRAYERS) {
      if (!preferences.notifications[name]) continue;
      const delta = result.times[name].getTime() - current;
      if (delta <= lead && delta > -60000) fire(`${today}:${name}`, `${PRAYER_NAMES[name]} · Noor Hub`, lead ? `A gentle reminder: ${PRAYER_NAMES[name]} is in ${preferences.notifications.lead} minutes.` : `It’s time for ${PRAYER_NAMES[name]}.`);
    }
  }, [tick, preferences.notifications, result, today]);
  return null;
}