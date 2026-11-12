import { describe, expect, it } from 'vitest';
import { academyStats, defaultAcademy, mergeAcademy, streakDays, stripMarks, shuffle, weekActivity } from '../src/lib/learn';
import { harfiUrl } from '../src/lib/learn-audio';
import { ASSESSMENT, LESSON_CATALOG, TOTAL_LESSONS, levelFromAssessment, recommendNext, suggestedLevel } from '../src/data/learn/path';
import { LETTERS, LETTER_GROUPS } from '../src/data/learn/letters';
import { HARAKAT } from '../src/data/learn/harakat';
import { BUILDER_LEVELS } from '../src/data/learn/builder';
import { TAJWEED_LESSONS } from '../src/data/learn/tajweed';

describe('academy progress logic', () => {
  it('counts a streak only across consecutive days with XP', () => {
    const activity = { '2026-11-08': { xp: 4 }, '2026-11-09': { xp: 2 }, '2026-11-10': { xp: 6 } };
    expect(streakDays(activity, '2026-11-10')).toBe(3);
    expect(streakDays(activity, '2026-11-11')).toBe(3);
    expect(streakDays({ ...activity, '2026-11-09': { xp: 0 } }, '2026-11-10')).toBe(1);
    expect(streakDays({}, '2026-11-10')).toBe(0);
  });
  it('builds a seven-day activity window ending today', () => {
    const week = weekActivity({ '2026-11-10': { xp: 5 } }, '2026-11-10');
    expect(week).toHaveLength(7);
    expect(week.at(-1)).toEqual({ day: '2026-11-10', xp: 5 });
    expect(week[0].day).toBe('2026-11-04');
  });
  it('derives dashboard stats from state', () => {
    const state = defaultAcademy();
    state.letters = { alif: { mastered: true }, ba: { mastered: false } };
    state.vocab = { '112:1:1': { state: 'known' }, '112:1:2': { state: 'learning' } };
    state.lessons = { 'letters-1': { status: 'completed' }, 'harakat-fathah': { status: 'in-progress' } };
    state.activity = { [new Date().toISOString().slice(0, 10)]: { xp: 8 } };
    const stats = academyStats(state);
    expect(stats.lettersMastered).toBe(1);
    expect(stats.wordsLearned).toBe(1);
    expect(stats.lessonsCompleted).toBe(1);
  });
  it('merges server and local state by most recent update', () => {
    const local = defaultAcademy();
    local.profile = { ...local.profile, level: 3, updatedAt: 200 };
    local.lessons = { 'letters-1': { status: 'completed', updatedAt: 300 } };
    local.attempts = [{ id: 'a' }];
    local.savedWords = ['112:1:1'];
    const server = {
      profile: { level: 1, dailyGoal: 20, assessmentDone: false, voice: 'female-Asmaa', updatedAt: 100 },
      lessons: { 'letters-1': { status: 'in-progress', updatedAt: 250 }, 'harakat-fathah': { status: 'completed', updatedAt: 400 } },
      letters: {}, vocab: {}, hifzStatus: {}, builder: {}, activity: {},
      attempts: [{ id: 'a' }, { id: 'b' }], savedWords: ['112:1:2'], bookmarks: ['1:1']
    };
    const merged = mergeAcademy(local, server);
    expect(merged.profile.level).toBe(3);
    expect(merged.lessons['letters-1'].status).toBe('completed');
    expect(merged.lessons['harakat-fathah'].status).toBe('completed');
    expect(merged.attempts.map(a => a.id)).toEqual(['a', 'b']);
    expect(merged.savedWords.sort()).toEqual(['112:1:1', '112:1:2']);
    expect(merged.bookmarks).toEqual(['1:1']);
  });
  it('strips vowel marks for letter-joining checks', () => {
    expect(stripMarks('كَتَبَ')).toBe('كتب');
    expect(stripMarks('أُمّ')).toBe('أم');
    expect(stripMarks('بَابٌ')).toBe('باب');
  });
  it('shuffle keeps every element exactly once', () => {
    const input = [1, 2, 3, 4, 5];
    expect(shuffle(input).sort()).toEqual(input);
    expect(input).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('learning path', () => {
  it('catalog ids are unique and match the advertised total', () => {
    const ids = LESSON_CATALOG.map(l => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(TOTAL_LESSONS).toBe(ids.length);
  });
  it('recommends the first uncompleted lesson in order', () => {
    const state = defaultAcademy();
    expect(recommendNext(state).id).toBe('letters-1');
    state.lessons['letters-1'] = { status: 'completed' };
    expect(recommendNext(state).id).toBe('letters-2');
  });
  it('maps assessment scores to starting levels', () => {
    expect(levelFromAssessment(0)).toBe(1);
    expect(levelFromAssessment(2)).toBe(1);
    expect(levelFromAssessment(3)).toBe(2);
    expect(levelFromAssessment(4)).toBe(2);
    expect(levelFromAssessment(6)).toBe(3);
  });
  it('suggests higher levels only as mastery grows', () => {
    expect(suggestedLevel({ lettersMastered: 0, wordsLearned: 0 })).toBe(1);
    expect(suggestedLevel({ lettersMastered: 7, wordsLearned: 0 })).toBe(2);
    expect(suggestedLevel({ lettersMastered: 28, wordsLearned: 0 })).toBe(4);
    expect(suggestedLevel({ lettersMastered: 28, wordsLearned: 20 })).toBe(6);
  });
  it('placement questions have valid answers and explanations', () => {
    for (const q of ASSESSMENT) {
      expect(q.explain).toBeTruthy();
      if (q.type === 'tf') expect(typeof q.answer).toBe('boolean');
      else { expect(q.answer).toBeGreaterThanOrEqual(0); expect(q.answer).toBeLessThan(q.options.length); }
    }
  });
});

describe('academy content integrity', () => {
  it('bundles all 28 letters with audio, forms and examples', () => {
    expect(LETTERS).toHaveLength(28);
    expect(LETTER_GROUPS.flat()).toHaveLength(28);
    const audio = new Set();
    for (const letter of LETTERS) {
      expect(letter.ch).toMatch(/^[\u0600-\u06FF]$/);
      expect(letter.name).toBeTruthy();
      expect(letter.hint).toBeTruthy();
      expect(letter.forms).toHaveLength(3);
      expect(letter.examples.length).toBeGreaterThan(0);
      expect(audio.has(letter.audio), letter.id).toBe(false);
      audio.add(letter.audio);
    }
  });
  it('gives every harakat examples with audio and a drill', () => {
    expect(HARAKAT).toHaveLength(8);
    for (const h of HARAKAT) {
      expect(h.mark).toBeTruthy();
      expect(h.explain).toBeTruthy();
      expect(h.drill).toMatch(/^book3\/audio\//);
      for (const ex of h.examples) { expect(ex.ar).toBeTruthy(); expect(ex.tl).toBeTruthy(); expect(ex.meaning).toBeTruthy(); expect(ex.audio).toMatch(/^book[23]\/audio\//); }
    }
  });
  it('builder words carry stripped forms that can be rebuilt', () => {
    for (const level of BUILDER_LEVELS) {
      expect(level.items.length).toBeGreaterThan(0);
      for (const item of level.items) {
        expect(stripMarks(item.ar).length).toBeGreaterThan(1);
        expect(item.audio).toMatch(/^book[23]\/audio\//);
      }
    }
  });
  it('tajweed lessons cite exact Quran references and valid quizzes', () => {
    expect(TAJWEED_LESSONS).toHaveLength(8);
    for (const lesson of TAJWEED_LESSONS) {
      expect(lesson.examples.length).toBeGreaterThan(0);
      for (const ex of lesson.examples) expect(ex.ref, `${lesson.id} reference`).toMatch(/^Quran \d{1,3}:\d{1,3}$/);
      for (const q of lesson.quiz) {
        expect(q.explain).toBeTruthy();
        if (q.type === 'tf') expect(typeof q.answer).toBe('boolean');
        else { expect(q.answer).toBeGreaterThanOrEqual(0); expect(q.answer).toBeLessThan(q.options.length); }
      }
    }
  });
});

describe('harfi audio urls', () => {
  it('builds letter urls per voice', () => {
    expect(harfiUrl('02-Baa.mp3')).toBe('https://raw.githubusercontent.com/alaneas/harfibooks/main/audio/female-Asmaa/02-Baa.mp3');
    expect(harfiUrl('02-Baa.mp3', 'male-ArabicKnight')).toContain('audio/male-ArabicKnight/02-Baa.mp3');
  });
  it('swaps the voice inside book paths', () => {
    expect(harfiUrl('book3/audio/female-Asmaa/02-01.mp3', 'male-ArabicKnight')).toBe('https://raw.githubusercontent.com/alaneas/harfibooks/main/book3/audio/male-ArabicKnight/02-01.mp3');
  });
});