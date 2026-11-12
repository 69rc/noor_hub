import { beforeEach, describe, it, expect } from 'vitest';
import { DEFAULT_PREFERENCES, loadPreferences, PRAYERS, WIDGETS } from '../src/lib/constants.js';

describe('guest preferences', () => {
  beforeEach(() => localStorage.clear());
  it('falls back to defaults when nothing is saved', () => {
    const prefs = loadPreferences();
    expect(prefs.onboarded).toBe(false);
    expect(prefs.location.label).toBe(DEFAULT_PREFERENCES.location.label);
    expect(prefs.theme).toBe('light');
  });
  it('merges partial saved preferences over defaults', () => {
    localStorage.setItem('sakinah.preferences', JSON.stringify({ name: 'Amina', notifications: { fajr: true } }));
    const prefs = loadPreferences();
    expect(prefs.name).toBe('Amina');
    expect(prefs.notifications.fajr).toBe(true);
    expect(prefs.notifications.dhuhr).toBe(false);
    expect(prefs.method).toBe(DEFAULT_PREFERENCES.method);
  });
  it('recovers gracefully from corrupt storage', () => {
    localStorage.setItem('sakinah.preferences', '{not-json');
    expect(loadPreferences().onboarded).toBe(false);
  });
  it('default dashboard widgets are all valid widget ids', () => {
    for (const id of DEFAULT_PREFERENCES.widgets) expect(WIDGETS.some(w => w.id === id)).toBe(true);
  });
  it('tracks exactly five obligatory prayers', () => {
    expect(PRAYERS).toEqual(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']);
  });
});

describe('location auto-detection', () => {
  beforeEach(() => localStorage.clear());
  it('defaults to following the device location', () => {
    expect(DEFAULT_PREFERENCES.location.manual).toBe(false);
    expect(loadPreferences().location.manual).toBe(false);
  });
  it('migrates the old Makkah placeholder so existing users auto-detect', () => {
    localStorage.setItem('sakinah.preferences', JSON.stringify({ location: { label: 'Makkah, Saudi Arabia', latitude: 21.4225, longitude: 39.8262, timezone: 'Asia/Riyadh', manual: true } }));
    expect(loadPreferences().location.manual).toBe(false);
  });
  it('preserves a genuine manual pin', () => {
    localStorage.setItem('sakinah.preferences', JSON.stringify({ location: { label: 'London', latitude: 51.5074, longitude: -0.1278, timezone: 'Europe/London', manual: true } }));
    const loc = loadPreferences().location;
    expect(loc.manual).toBe(true);
    expect(loc.latitude).toBe(51.5074);
  });
});