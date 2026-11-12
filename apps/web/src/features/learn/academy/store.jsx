import { createContext, useContext, useEffect, useRef } from 'react';
import { useLocalState } from '../../../lib/hooks';
import { useAuth } from '../../../lib/auth';
import { defaultAcademy, mergeAcademy, todayKey, XP } from '../../../lib/learn';
import { gradeReview } from '../../../lib/hifz';
const AcademyContext = createContext(null);
export function AcademyProvider({ children }) {
  const [state, setState] = useLocalState('sakinah.academy', defaultAcademy);
  const { user, authorizedApi } = useAuth();
  const stateRef = useRef(state); stateRef.current = state;
  const userId = user?.id;
  useEffect(() => {
    if (!userId) return undefined;
    let active = true;
    authorizedApi('learn/state').then(res => { if (active && res?.state) setState(local => mergeAcademy(local, res.state)); }).catch(() => {});
    return () => { active = false; };
  }, [userId, authorizedApi, setState]);
  useEffect(() => {
    if (!userId) return undefined;
    const timer = setTimeout(() => { authorizedApi('learn/sync', { method: 'POST', body: JSON.stringify({ state: stateRef.current }) }).catch(() => {}); }, 1500);
    return () => clearTimeout(timer);
  }, [state, userId, authorizedApi]);
  const bump = (s, xp, lessons = 0, exercises = 0) => {
    const day = todayKey(); const a = s.activity[day] || { xp: 0, lessons: 0, exercises: 0 };
    return { ...s.activity, [day]: { xp: a.xp + xp, lessons: a.lessons + lessons, exercises: a.exercises + exercises, updatedAt: Date.now() } };
  };
  const actions = {
    attempt(entry) { setState(s => ({ ...s, attempts: [...s.attempts, { id: crypto.randomUUID(), at: Date.now(), ...entry }].slice(-500), activity: bump(s, entry.correct ? XP.correct : 0, 0, 1) })); },
    completeLesson(id, score, total) {
      setState(s => {
        const prev = s.lessons[id]; const first = prev?.status !== 'completed';
        return { ...s, lessons: { ...s.lessons, [id]: { status: 'completed', score, total, bestScore: Math.max(score, prev?.bestScore || 0), completedAt: Date.now(), updatedAt: Date.now() } }, activity: bump(s, first ? XP.lesson : 0, first ? 1 : 0) };
      });
    },
    savePosition(id, position) { setState(s => (s.lessons[id]?.status === 'completed' ? s : { ...s, lessons: { ...s.lessons, [id]: { ...(s.lessons[id] || {}), status: 'in-progress', position, updatedAt: Date.now() } } })); },
    setLetter(id, mastered) { setState(s => ({ ...s, letters: { ...s.letters, [id]: { mastered, updatedAt: Date.now() } } })); },
    setProfile(patch) { setState(s => ({ ...s, profile: { ...s.profile, ...patch, updatedAt: Date.now() } })); },
    setReading(patch) { setState(s => ({ ...s, reading: { ...s.reading, ...patch, updatedAt: Date.now() } })); },
    reviewWord(key, grade) {
      setState(s => {
        const entry = s.vocab[key] || { interval: 1, due: todayKey(), reviews: 0 };
        const graded = gradeReview(entry, grade);
        return { ...s, vocab: { ...s.vocab, [key]: { ...graded, state: graded.interval >= 7 ? 'known' : 'learning', updatedAt: Date.now() } }, activity: bump(s, XP.review) };
      });
    },
    toggleSaved(key) { setState(s => ({ ...s, savedWords: s.savedWords.includes(key) ? s.savedWords.filter(k => k !== key) : [...s.savedWords, key] })); },
    toggleBookmark(ref) { setState(s => ({ ...s, bookmarks: s.bookmarks.includes(ref) ? s.bookmarks.filter(k => k !== ref) : [...s.bookmarks, ref] })); },
    setHifzStatus(ref, status) { setState(s => ({ ...s, hifzStatus: { ...s.hifzStatus, [ref]: { status, updatedAt: Date.now() } } })); },
    setBuilder(id, stars) { setState(s => ({ ...s, builder: { ...s.builder, [id]: { stars: Math.max(stars, s.builder[id]?.stars || 0), updatedAt: Date.now() } }, activity: bump(s, XP.correct) })); }
  };
  return <AcademyContext.Provider value={{ state, ...actions }}>{children}</AcademyContext.Provider>;
}
export const useAcademy = () => useContext(AcademyContext);