import { describe, expect, it } from 'vitest';
import { HIFZ_INTERVALS, dueKeys, gradeReview, markMemorized, surahProgress } from '../src/lib/hifz';
import { shiftDate } from '../src/lib/prayer';

const today = '2026-11-10';

describe('hifz spaced review', () => {
  it('schedules a first review for tomorrow', () => {
    const entry = markMemorized(undefined, today);
    expect(entry).toEqual({ interval: 1, due: '2026-11-11', reviews: 0, memorizedAt: today });
  });
  it('keeps an existing entry when re-marking', () => {
    const entry = { interval: 7, due: '2026-11-12', reviews: 2, memorizedAt: '2026-11-01' };
    expect(markMemorized(entry, today)).toBe(entry);
  });
  it('steps intervals on good and skips on easy', () => {
    let entry = markMemorized(undefined, today);
    entry = gradeReview(entry, 'good', today);
    expect(entry.interval).toBe(3);
    expect(entry.due).toBe(shiftDate(today, 3));
    entry = gradeReview(entry, 'easy', today);
    expect(entry.interval).toBe(14);
    expect(entry.reviews).toBe(2);
  });
  it('resets to one day on again and caps at the last interval', () => {
    const entry = { interval: 60, due: today, reviews: 5, memorizedAt: today };
    expect(gradeReview(entry, 'again', today).interval).toBe(1);
    expect(gradeReview(entry, 'good', today).interval).toBe(HIFZ_INTERVALS.at(-1));
    expect(gradeReview(entry, 'easy', today).interval).toBe(HIFZ_INTERVALS.at(-1));
  });
  it('queues only verses due today or earlier, oldest first', () => {
    const state = {
      '2:1': { due: '2026-11-09' },
      '1:1': { due: today },
      '3:1': { due: '2026-11-20' }
    };
    expect(dueKeys(state, today)).toEqual(['2:1', '1:1']);
  });
  it('counts memorized ayahs per surah', () => {
    const state = { '1:1': {}, '1:2': {}, '2:1': {} };
    expect(surahProgress(state, 1)).toBe(2);
    expect(surahProgress(state, 2)).toBe(1);
    expect(surahProgress(state, 114)).toBe(0);
  });
});
