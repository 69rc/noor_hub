import { Coordinates, CalculationMethod, PrayerTimes, Madhab, Qibla, SunnahTimes } from 'adhan';
import { PRAYERS } from './constants';
export function localDate(date = new Date(), timezone = Intl.DateTimeFormat().resolvedOptions().timeZone) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  return `${parts.find(p => p.type === 'year').value}-${parts.find(p => p.type === 'month').value}-${parts.find(p => p.type === 'day').value}`;
}
export function dateFromKey(key) { const [year, month, day] = key.split('-').map(Number); return new Date(year, month - 1, day, 12); }
export function shiftDate(key, amount) { const date = dateFromKey(key); date.setDate(date.getDate() + amount); return localDate(date, 'UTC'); }
export function calculatePrayerTimes(location, method, asr, date = new Date()) {
  const coordinates = new Coordinates(Number(location.latitude), Number(location.longitude));
  const factory = CalculationMethod[method] || CalculationMethod.MuslimWorldLeague;
  const params = factory();
  params.madhab = asr === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;
  const times = new PrayerTimes(coordinates, date, params);
  const sunnah = new SunnahTimes(times);
  return { times, sunnah, qibla: Qibla(coordinates), fajrTomorrow: new PrayerTimes(coordinates, new Date(date.getTime() + 86400000), params).fajr };
}
export function nextPrayer(result, now = new Date()) {
  const entries = [...PRAYERS.map(name => ({ name, time: result.times[name] })), { name: 'fajr', time: result.fajrTomorrow, tomorrow: true }];
  return entries.find(entry => entry.time > now) || entries[entries.length - 1];
}
export function formatTime(date, timezone, hour12 = true) { return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12, timeZone: timezone }).format(date); }
export function countdown(target, now = new Date()) {
  const seconds = Math.max(0, Math.floor((target - now) / 1000));
  return { hours: Math.floor(seconds / 3600), minutes: Math.floor(seconds % 3600 / 60), seconds: seconds % 60, total: seconds };
}
export function hijriDate(date = new Date(), offset = 0) {
  const adjusted = new Date(date.getTime() + offset * 86400000);
  return new Intl.DateTimeFormat('en-GB-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(adjusted.getFullYear(), adjusted.getMonth(), adjusted.getDate(), 12)));
}
export function prayerTimeLabel(date, timezone) { return date ? formatTime(date, timezone) : '—'; }
export function validateLocation(latitude, longitude) { const lat = Number(latitude), lng = Number(longitude); return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180; }