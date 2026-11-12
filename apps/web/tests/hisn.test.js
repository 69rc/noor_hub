import { describe, expect, it } from 'vitest';
import book from '../src/data/hisn.json';
import { searchChapters, chapterProgress, incrementCounter, resetChapterCounters, markChapterComplete, unmarkChapterComplete, defaultHisnState, cleanArabic, cleanTranslit, todayKey } from '../src/lib/hisn';

describe('Hisn al-Muslim dataset integrity', () => {
  it('bundles the complete book with 132 sequential chapters', () => {
    expect(book.chapters).toHaveLength(132);
    book.chapters.forEach((c, i) => expect(c.id).toBe(i + 1));
  });
  it('attributes the author and sources', () => {
    expect(book.author).toContain('al-Qahtani');
    expect(book.sources.arabic).toContain('HisnElMuslim');
    expect(book.sources.english).toContain('hisnmuslim.com');
  });
  it('gives every chapter an English title, Arabic title and audio', () => {
    for (const c of book.chapters) {
      expect(c.titleEn.trim().length).toBeGreaterThan(0);
      expect(c.titleAr.trim().length).toBeGreaterThan(0);
      expect(c.audio).toMatch(/^https:\/\/.+\.mp3$/);
      expect(c.items.length).toBeGreaterThan(0);
    }
  });
  it('gives every entry Arabic text, a positive repetition count and a reference', () => {
    for (const c of book.chapters) {
      for (const item of c.items) {
        expect(item.ar.trim().length).toBeGreaterThan(0);
        expect(Number.isInteger(item.repeat)).toBe(true);
        expect(item.repeat).toBeGreaterThanOrEqual(1);
        expect(item.refs.length).toBeGreaterThan(0);
        for (const r of item.refs) expect(r.trim().length).toBeGreaterThan(0);
      }
    }
  });
  it('combines morning and evening remembrance in chapter 27', () => {
    const c = book.chapters.find(x => x.id === 27);
    expect(c.titleAr).toContain('الصباح');
    expect(c.titleAr).toContain('المساء');
    expect(c.items.length).toBeGreaterThanOrEqual(20);
  });
  it('labels entries without a translation honestly (Arabic only)', () => {
    const untranslated = book.chapters.flatMap(c => c.items.filter(i => !i.en));
    for (const item of untranslated) expect(item.ar.trim().length).toBeGreaterThan(0);
  });
});

describe('Hisn helpers', () => {
  const items = [{ id: 1, repeat: 3 }, { id: 2, repeat: 1 }, { id: 3, repeat: 33 }];
  it('searches by English title, Arabic title and number', () => {
    expect(searchChapters(book.chapters, 'wake')).toHaveLength(1);
    expect(searchChapters(book.chapters, '27').map(c => c.id)).toEqual([27]);
    expect(searchChapters(book.chapters, '')).toHaveLength(132);
    expect(searchChapters(book.chapters, 'zzzznope')).toHaveLength(0);
  });
  it('computes chapter progress from counters', () => {
    expect(chapterProgress(items, {})).toEqual({ done: 0, total: 3, complete: false });
    expect(chapterProgress(items, { 1: 3, 2: 1, 3: 33 })).toEqual({ done: 3, total: 3, complete: true });
    expect(chapterProgress(items, { 1: 2 })).toEqual({ done: 0, total: 3, complete: false });
  });
  it('increments a counter and caps it at the repetition target', () => {
    let s = defaultHisnState();
    s = incrementCounter(s, '2026-11-12', 1, 3);
    s = incrementCounter(s, '2026-11-12', 1, 3);
    expect(s.counters['2026-11-12'][1]).toBe(2);
    s = incrementCounter(s, '2026-11-12', 1, 3);
    s = incrementCounter(s, '2026-11-12', 1, 3);
    expect(s.counters['2026-11-12'][1]).toBe(3);
  });
  it('keeps counters separate per day', () => {
    let s = defaultHisnState();
    s = incrementCounter(s, '2026-11-12', 1, 3);
    s = incrementCounter(s, '2026-11-13', 1, 3);
    expect(s.counters['2026-11-12'][1]).toBe(1);
    expect(s.counters['2026-11-13'][1]).toBe(1);
  });
  it('resets only the given chapter counters', () => {
    let s = defaultHisnState();
    s = incrementCounter(s, 'd', 1, 3);
    s = incrementCounter(s, 'd', 99, 5);
    s = resetChapterCounters(s, 'd', items);
    expect(s.counters.d[1]).toBeUndefined();
    expect(s.counters.d[99]).toBe(1);
  });
  it('marks and unmarks a chapter complete without duplicates', () => {
    let s = markChapterComplete(defaultHisnState(), 'd', 27);
    s = markChapterComplete(s, 'd', 27);
    expect(s.completed.d).toEqual([27]);
    s = unmarkChapterComplete(s, 'd', 27);
    expect(s.completed.d).toEqual([]);
  });
  it('strips decorative outer parentheses and dots from display text', () => {
    expect(cleanArabic('((سُبْحَانَ اللَّهِ)).')).toBe('سُبْحَانَ اللَّهِ');
    expect(cleanArabic('(.الْحَمْدُ لِلَّهِ )')).toBe('الْحَمْدُ لِلَّهِ');
    expect(cleanTranslit('(Bismil-lah.)')).toBe('Bismil-lah');
    expect(cleanArabic('')).toBe('');
  });
  it('produces a stable YYYY-MM-DD day key', () => {
    expect(todayKey('UTC')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(todayKey('Invalid/Zone')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});