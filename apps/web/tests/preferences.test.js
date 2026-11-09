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