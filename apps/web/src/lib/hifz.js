import { localDate, shiftDate } from './prayer';

export const HIFZ_INTERVALS = [1, 3, 7, 14, 30, 60];
export const HIFZ_GRADES = [
  { value: 'again', label: 'Again', hint: 'back to 1 day' },
  { value: 'good', label: 'Good', hint: 'next step' },
  { value: 'easy', label: 'Easy', hint: 'skip a step' }
];
export const TOTAL_AYAHS = 6236;

export const todayKey = () => localDate();

export function markMemorized(entry, today = todayKey()) {
  return entry || { interval: 1, due: shiftDate(today, 1), reviews: 0, memorizedAt: today };
}

export function gradeReview(entry, grade, today = todayKey()) {
  const index = Math.max(0, HIFZ_INTERVALS.indexOf(entry.interval));
  const interval = grade === 'again' ? 1 : HIFZ_INTERVALS[Math.min(HIFZ_INTERVALS.length - 1, grade === 'easy' ? index + 2 : index + 1)];
  return { ...entry, interval, due: shiftDate(today, interval), reviews: (entry.reviews || 0) + 1 };
}

export function dueKeys(state, today = todayKey()) {
  return Object.keys(state)
    .filter(key => state[key].due <= today)
    .sort((a, b) => state[a].due.localeCompare(state[b].due) || a.localeCompare(b));
}

export function surahProgress(state, surah) {
  return Object.keys(state).filter(key => key.startsWith(`${surah}:`)).length;
}
