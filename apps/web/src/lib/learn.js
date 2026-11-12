import { localDate, shiftDate } from './prayer';
export const XP = { correct: 2, lesson: 10, review: 3 };
export const LEVELS = ['Complete Beginner', 'Arabic Alphabet Learner', 'Basic Arabic Reader', 'Quran Reading Beginner', 'Tajweed Learner', 'Quran Reader', 'Memorisation Learner'];
export const defaultAcademy = () => ({
  profile: { level: 1, dailyGoal: 20, assessmentDone: false, voice: 'female-Asmaa', updatedAt: 0 },
  activity: {}, letters: {}, lessons: {}, attempts: [], vocab: {}, savedWords: [], bookmarks: [], hifzStatus: {}, builder: {},
  reading: { surah: 112, ayah: 1, translit: 'full', fontSize: 30, updatedAt: 0 }
});
export const todayKey = () => localDate();
export function streakDays(activity, today = localDate()) {
  let day = (activity[today]?.xp || 0) > 0 ? today : shiftDate(today, -1);
  let count = 0;
  while ((activity[day]?.xp || 0) > 0) { count++; day = shiftDate(day, -1); }
  return count;
}
export function weekActivity(activity, today = localDate()) {
  return Array.from({ length: 7 }, (_, i) => { const day = shiftDate(today, i - 6); return { day, xp: activity[day]?.xp || 0 }; });
}
export function academyStats(state) {
  return {
    lettersMastered: Object.values(state.letters).filter(l => l.mastered).length,
    wordsLearned: Object.values(state.vocab).filter(v => v.state === 'known').length,
    lessonsCompleted: Object.values(state.lessons).filter(l => l.status === 'completed').length,
    exercises: state.attempts.length,
    streak: streakDays(state.activity),
    todayXp: state.activity[todayKey()]?.xp || 0
  };
}
const newer = (a, b) => ((a?.updatedAt || 0) >= (b?.updatedAt || 0) ? a : b);
export function mergeAcademy(local, server) {
  if (!server) return local;
  const out = { ...local };
  out.profile = newer(local.profile, server.profile) || local.profile;
  out.reading = newer(local.reading, server.reading) || local.reading;
  for (const key of ['letters', 'lessons', 'vocab', 'hifzStatus', 'builder', 'activity']) {
    out[key] = { ...server[key], ...local[key] };
    for (const id of Object.keys(out[key])) out[key][id] = newer(local[key][id], server[key][id]) || out[key][id];
  }
  const seen = new Set();
  out.attempts = [...(local.attempts || []), ...(server.attempts || [])].filter(a => (seen.has(a.id) ? false : (seen.add(a.id), true))).slice(-500);
  out.savedWords = [...new Set([...(local.savedWords || []), ...(server.savedWords || [])])];
  out.bookmarks = [...new Set([...(local.bookmarks || []), ...(server.bookmarks || [])])];
  return out;
}
export const stripMarks = text => text.replace(/[ً-ْٰـ]/g, '');
export const shuffle = arr => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const PRAISE = ['That’s right — beautifully done.', 'Correct. Keep that gentle pace.', 'Yes! A little closer every day.', 'MashaAllah, exactly right.', 'Correct — your practice is showing.'];
export const ENCOURAGE = ['Not quite — and that’s how learning works.', 'A useful mistake. Here’s the idea:', 'Close. Look at the correct answer:', 'No pressure — this one teaches something:'];