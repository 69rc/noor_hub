import { describe, it, expect } from 'vitest';
import { activeTahajjudWindow, nextTahajjudWindow, tahajjudStreak, tahajjudBestStreak } from '../src/lib/tahajjud';
import { calculatePrayerTimes, dateFromKey, localDate } from '../src/lib/prayer';

const location = { label: 'Makkah, Saudi Arabia', country: 'SA', latitude: 21.4225, longitude: 39.8262, timezone: 'Asia/Riyadh' };
const method = 'UmmAlQura';
const asr = 'standard';
const tz = 'Asia/Riyadh';
const baseKey = '2026-03-15';
const base = calculatePrayerTimes(location, method, asr, dateFromKey(baseKey));

describe('activeTahajjudWindow', () => {
  it('detects the window that is in progress at the middle of the last third', () => {
    const start = base.sunnah.lastThirdOfTheNight;
    const end = base.fajrTomorrow;
    const mid = new Date((start.getTime() + end.getTime()) / 2);
    const win = activeTahajjudWindow(location, method, asr, mid, tz);
    expect(win).not.toBeNull();
    expect(win.start.getTime()).toBe(start.getTime());
    expect(win.end.getTime()).toBe(end.getTime());
    expect(win.start <= mid && mid <= win.end).toBe(true);
  });

  it('labels the night by the civil date of the moment (post-midnight fix)', () => {
    const mid = new Date((base.sunnah.lastThirdOfTheNight.getTime() + base.fajrTomorrow.getTime()) / 2);
    const win = activeTahajjudWindow(location, method, asr, mid, tz);
    expect(win.nightKey).toBe(localDate(mid, tz));
  });

  it('returns null during the daytime, outside any last-third window', () => {
    const dhuhr = base.times.dhuhr;
    expect(activeTahajjudWindow(location, method, asr, dhuhr, tz)).toBeNull();
  });

  it('returns null when coordinates are missing', () => {
    expect(activeTahajjudWindow({ timezone: tz }, method, asr, new Date(), tz)).toBeNull();
  });
});

describe('nextTahajjudWindow', () => {
  it('returns the upcoming window with a start strictly in the future', () => {
    const now = base.times.dhuhr;
    const next = nextTahajjudWindow(location, method, asr, now, tz);
    expect(next).not.toBeNull();
    expect(next.start.getTime()).toBeGreaterThan(now.getTime());
    expect(next.start.getTime()).toBe(base.sunnah.lastThirdOfTheNight.getTime());
    expect(next.end.getTime()).toBe(base.fajrTomorrow.getTime());
  });
});

describe('tahajjudStreak', () => {
  const rec = date => ({ date });
  it('counts consecutive nights ending today', () => {
    expect(tahajjudStreak([rec('2026-03-13'), rec('2026-03-14'), rec('2026-03-15')], '2026-03-15')).toBe(3);
  });
  it('counts from yesterday when today is not yet recorded', () => {
    expect(tahajjudStreak([rec('2026-03-13'), rec('2026-03-14')], '2026-03-15')).toBe(2);
  });
  it('stops at a gap', () => {
    expect(tahajjudStreak([rec('2026-03-10'), rec('2026-03-14'), rec('2026-03-15')], '2026-03-15')).toBe(2);
  });
  it('is zero with no records or when neither today nor yesterday is present', () => {
    expect(tahajjudStreak([], '2026-03-15')).toBe(0);
    expect(tahajjudStreak([rec('2026-03-01')], '2026-03-15')).toBe(0);
  });
  it('ignores duplicate nights', () => {
    expect(tahajjudStreak([rec('2026-03-15'), rec('2026-03-15'), rec('2026-03-14')], '2026-03-15')).toBe(2);
  });
});

describe('tahajjudBestStreak', () => {
  const rec = date => ({ date });
  it('finds the longest consecutive run', () => {
    expect(tahajjudBestStreak([rec('2026-03-01'), rec('2026-03-02'), rec('2026-03-03'), rec('2026-03-05'), rec('2026-03-06')])).toBe(3);
  });
  it('is one for a single night and zero for none', () => {
    expect(tahajjudBestStreak([rec('2026-03-01')])).toBe(1);
    expect(tahajjudBestStreak([])).toBe(0);
  });
  it('is order independent', () => {
    expect(tahajjudBestStreak([rec('2026-03-06'), rec('2026-03-04'), rec('2026-03-05')])).toBe(3);
  });
});
