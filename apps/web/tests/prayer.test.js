import { describe, it, expect } from 'vitest';
import { calculatePrayerTimes, countdown, hijriDate, localDate, nextPrayer, shiftDate, validateLocation } from '../src/lib/prayer.js';

const MAKKAH = { latitude: 21.4225, longitude: 39.8262, timezone: 'Asia/Riyadh' };
const DATE = new Date('2026-11-09T12:00:00Z');

describe('prayer calculation', () => {
  it('orders fajr < sunrise < dhuhr < asr < maghrib < isha', () => {
    const { times } = calculatePrayerTimes(MAKKAH, 'UmmAlQura', 'standard', DATE);
    expect(times.fajr < times.sunrise).toBe(true);
    expect(times.sunrise < times.dhuhr).toBe(true);
    expect(times.dhuhr < times.asr).toBe(true);
    expect(times.asr < times.maghrib).toBe(true);
    expect(times.maghrib < times.isha).toBe(true);
  });
  it('hanafi Asr is later than standard Asr', () => {
    const standard = calculatePrayerTimes(MAKKAH, 'UmmAlQura', 'standard', DATE);
    const hanafi = calculatePrayerTimes(MAKKAH, 'UmmAlQura', 'hanafi', DATE);
    expect(hanafi.times.asr > standard.times.asr).toBe(true);
  });
  it('produces a qibla bearing within 0..360', () => {
    const { qibla } = calculatePrayerTimes(MAKKAH, 'UmmAlQura', 'standard', DATE);
    expect(qibla).toBeGreaterThanOrEqual(0);
    expect(qibla).toBeLessThan(360);
  });
  it('computes last-third and middle of the night', () => {
    const { sunnah, times } = calculatePrayerTimes(MAKKAH, 'UmmAlQura', 'standard', DATE);
    expect(sunnah.lastThirdOfTheNight > times.maghrib).toBe(true);
    expect(sunnah.middleOfTheNight < sunnah.lastThirdOfTheNight).toBe(true);
  });
  it('nextPrayer selects the first upcoming prayer', () => {
    const result = calculatePrayerTimes(MAKKAH, 'UmmAlQura', 'standard', DATE);
    const next = nextPrayer(result, new Date(result.times.fajr.getTime() - 1000));
    expect(next.name).toBe('fajr');
    expect(next.tomorrow).toBeFalsy();
  });
  it('nextPrayer rolls over to tomorrow fajr after isha', () => {
    const result = calculatePrayerTimes(MAKKAH, 'UmmAlQura', 'standard', DATE);
    const next = nextPrayer(result, new Date(result.times.isha.getTime() + 1000));
    expect(next.name).toBe('fajr');
    expect(next.tomorrow).toBe(true);
  });
  it('countdown clamps to zero in the past', () => {
    expect(countdown(new Date(Date.now() - 5000)).total).toBe(0);
  });
  it('shiftDate moves across day boundaries', () => {
    expect(shiftDate('2026-11-09', 1)).toBe('2026-11-10');
    expect(shiftDate('2026-11-09', -1)).toBe('2026-11-08');
    expect(shiftDate('2026-12-31', 1)).toBe('2027-01-01');
  });
  it('validateLocation enforces coordinate bounds', () => {
    expect(validateLocation(21.4, 39.8)).toBe(true);
    expect(validateLocation(91, 0)).toBe(false);
    expect(validateLocation(0, 181)).toBe(false);
    expect(validateLocation('abc', 0)).toBe(false);
  });
  it('localDate returns an ISO day in the given timezone', () => {
    expect(localDate(DATE, 'UTC')).toBe('2026-11-09');
  });
  it('hijriDate renders an Umm al-Qura year', () => {
    expect(hijriDate(DATE)).toMatch(/AH/);
  });
});