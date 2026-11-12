import { describe, expect, it } from 'vitest';
import { TAFSIR_EDITIONS, normalizeTafsir, tafsirUrl } from '../src/lib/tafsir';

describe('tafsir sources', () => {
  it('builds a per-ayah ummahapi url', () => {
    expect(tafsirUrl('ibn_kathir', 2, 255)).toBe('https://ummahapi.com/api/tafsir/ibn_kathir/surah/2/ayah/255');
  });
  it('offers attributed english and arabic editions', () => {
    expect(TAFSIR_EDITIONS.map(edition => edition.value)).toEqual(['ibn_kathir', 'muyassar']);
    for (const edition of TAFSIR_EDITIONS) {
      expect(edition.author).toBeTruthy();
      expect(edition.language).toBeTruthy();
    }
  });
  it('normalizes a successful payload', () => {
    const parsed = normalizeTafsir({ success: true, data: { tafsir: { key: 'ibn_kathir', name: 'Ibn Kathir (Abridged)', author: 'Hafiz Ibn Kathir', language: 'english', text: '  commentary  ' } } });
    expect(parsed).toMatchObject({ key: 'ibn_kathir', name: 'Ibn Kathir (Abridged)', author: 'Hafiz Ibn Kathir', language: 'english', text: 'commentary' });
  });
  it('rejects failed, empty or malformed payloads', () => {
    expect(normalizeTafsir({ success: false, data: { tafsir: { text: 'x' } } })).toBeNull();
    expect(normalizeTafsir({ success: true, data: { tafsir: { text: '   ' } } })).toBeNull();
    expect(normalizeTafsir({ success: true, data: {} })).toBeNull();
    expect(normalizeTafsir(null)).toBeNull();
  });
});
