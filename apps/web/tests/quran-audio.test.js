import { afterEach, describe, expect, it } from 'vitest';
import { audioKey, fallbackUrl, formatBytes, streamUrl, surahDownload, totalAudioBytes } from '../src/lib/audio-sources';
import { RECITERS, loadPreferences, reciterById } from '../src/lib/constants';

describe('reciter catalogue', () => {
  it('ships a wide catalogue of famous reciters with unique ids', () => {
    expect(RECITERS.length).toBeGreaterThanOrEqual(20);
    expect(new Set(RECITERS.map(r => r.value)).size).toBe(RECITERS.length);
  });
  it('gives every reciter a stream folder and bitrate', () => {
    for (const reciter of RECITERS) {
      expect(reciter.folder, reciter.value).toBeTruthy();
      expect(reciter.kbps, reciter.value).toBeGreaterThan(0);
      expect(reciter.style, reciter.value).toMatch(/Murattal|Mujawwad/);
    }
  });
  it('resolves legacy reciter ids and unknown ids safely', () => {
    expect(reciterById('ar.alafasy').value).toBe('alafasy');
    expect(reciterById('ar.husary').value).toBe('husary-murattal');
    expect(reciterById('not-a-reciter').value).toBe('alafasy');
    expect(reciterById('minshawi-mujawwad').style).toBe('Mujawwad');
  });
  it('migrates a saved legacy preference on load', () => {
    localStorage.setItem('sakinah.preferences', JSON.stringify({ reciter: 'ar.abdulbasitmurattal' }));
    expect(loadPreferences().reciter).toBe('abdulbasit-murattal');
    localStorage.setItem('sakinah.preferences', JSON.stringify({ reciter: 'dossari' }));
    expect(loadPreferences().reciter).toBe('dossari');
  });
  afterEach(() => localStorage.removeItem('sakinah.preferences'));
});

describe('recitation urls', () => {
  it('builds padded per-ayah stream urls', () => {
    expect(streamUrl('alafasy', 1, 2)).toBe('https://everyayah.com/data/Alafasy_128kbps/001002.mp3');
    expect(streamUrl('minshawi-mujawwad', 114, 6)).toBe('https://everyayah.com/data/Minshawy_Mujawwad_192kbps/114006.mp3');
  });
  it('offers a CDN fallback only where one is verified', () => {
    expect(fallbackUrl('alafasy', 1)).toBe('https://cdn.islamic.network/quran/audio/128/ar.alafasy/1.mp3');
    expect(fallbackUrl('dossari', 1)).toBe('');
  });
  it('keys stored audio by reciter, surah and ayah', () => {
    expect(audioKey('alafasy', 2, 3)).toBe('alafasy:2:3');
  });
});

describe('download index helpers', () => {
  it('reads entries by numeric or string surah key', () => {
    const index = { alafasy: { 2: { bytes: 3 } }, husary: { '18': { bytes: 9 } } };
    expect(surahDownload(index, 'alafasy', 2).bytes).toBe(3);
    expect(surahDownload(index, 'husary', 18).bytes).toBe(9);
    expect(surahDownload(index, 'alafasy', 5)).toBeNull();
  });
  it('sums bytes across reciters and formats them', () => {
    expect(totalAudioBytes({ a: { 1: { bytes: 10 }, 2: { bytes: 5 } }, b: { 3: { bytes: 1 } } })).toBe(16);
    expect(totalAudioBytes({})).toBe(0);
    expect(formatBytes(0)).toBe('0 MB');
    expect(formatBytes(1048576)).toBe('1.0 MB');
    expect(formatBytes(150 * 1048576)).toBe('150 MB');
  });
});
