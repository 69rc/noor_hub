import { calculatePrayerTimes, dateFromKey, localDate, shiftDate } from './prayer';

const defaultTz = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

// The night runs from Maghrib to the next Fajr; its last third is the tahajjud window.
// A night that begins "yesterday" evening ends at "today" Fajr, so a window can contain a
// moment whose civil date is the following day. We therefore probe the neighbouring base
// dates rather than assuming the window belongs to localDate(now).
export function activeTahajjudWindow(location, method, asr, now = new Date(), timezone = defaultTz()) {
  if (!location || location.latitude == null || location.longitude == null) return null;
  const base = localDate(now, timezone);
  for (const offset of [-1, 0, 1]) {
    const key = offset === 0 ? base : shiftDate(base, offset);
    const result = calculatePrayerTimes(location, method, asr, dateFromKey(key));
    const start = result.sunnah.lastThirdOfTheNight;
    const end = result.fajrTomorrow;
    if (now >= start && now <= end) return { nightKey: base, start, end, result };
  }
  return null;
}

// The next window that has not begun yet — used to show "tonight at …" and to preview the prompt.
export function nextTahajjudWindow(location, method, asr, now = new Date(), timezone = defaultTz()) {
  if (!location || location.latitude == null || location.longitude == null) return null;
  const base = localDate(now, timezone);
  for (const offset of [0, 1, 2]) {
    const key = offset === 0 ? base : shiftDate(base, offset);
    const result = calculatePrayerTimes(location, method, asr, dateFromKey(key));
    const start = result.sunnah.lastThirdOfTheNight;
    const end = result.fajrTomorrow;
    if (start > now) return { nightKey: localDate(start, timezone), start, end, result };
  }
  return null;
}

// Consecutive nights ending today (or, before tonight's prayer, ending yesterday).
export function tahajjudStreak(records, todayKey) {
  const nights = new Set((records || []).map(r => r.date).filter(Boolean));
  if (!nights.size) return 0;
  let cursor = nights.has(todayKey) ? todayKey : shiftDate(todayKey, -1);
  let streak = 0;
  while (nights.has(cursor)) { streak += 1; cursor = shiftDate(cursor, -1); }
  return streak;
}

// Longest ever run of consecutive nights.
export function tahajjudBestStreak(records) {
  const nights = [...new Set((records || []).map(r => r.date).filter(Boolean))].sort();
  let best = 0;
  let run = 0;
  let previous = null;
  for (const night of nights) {
    run = previous && shiftDate(previous, 1) === night ? run + 1 : 1;
    if (run > best) best = run;
    previous = night;
  }
  return best;
}
