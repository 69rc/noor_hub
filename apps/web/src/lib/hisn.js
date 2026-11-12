export const HISN_STATE_KEY = 'sakinah.hisn';

export function todayKey(tz) {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  } catch {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}

export function searchChapters(chapters, query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return chapters;
  return chapters.filter(c =>
    c.titleEn.toLowerCase().includes(q) ||
    c.titleAr.includes(q) ||
    String(c.id) === q
  );
}

export function chapterProgress(items, counters) {
  const total = items.length;
  let done = 0;
  for (const item of items) {
    if ((counters[item.id] || 0) >= item.repeat) done++;
  }
  return { done, total, complete: total > 0 && done === total };
}

export function incrementCounter(state, date, itemId, repeat) {
  const day = state.counters?.[date] || {};
  const current = day[itemId] || 0;
  const next = Math.min(current + 1, repeat);
  return {
    ...state,
    counters: { ...state.counters, [date]: { ...day, [itemId]: next } }
  };
}

export function resetChapterCounters(state, date, items) {
  const day = { ...(state.counters?.[date] || {}) };
  for (const item of items) delete day[item.id];
  return { ...state, counters: { ...state.counters, [date]: day } };
}

export function markChapterComplete(state, date, chapterId) {
  const day = state.completed?.[date] || [];
  if (day.includes(chapterId)) return state;
  return { ...state, completed: { ...state.completed, [date]: [...day, chapterId] } };
}

export function unmarkChapterComplete(state, date, chapterId) {
  const day = state.completed?.[date] || [];
  return { ...state, completed: { ...state.completed, [date]: day.filter(id => id !== chapterId) } };
}

export function defaultHisnState() {
  return { counters: {}, completed: {}, prefs: { translit: true, translation: true, fontSize: 28 } };
}

export function cleanArabic(s) {
  return (s || '').replace(/^[\s(.]+/, '').replace(/[\s).]+$/, '').trim();
}

export function cleanTranslit(s) {
  return (s || '').replace(/^[\s(.]+/, '').replace(/[\s).]+$/, '').trim();
}