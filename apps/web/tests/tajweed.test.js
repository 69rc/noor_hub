import { describe, expect, it } from 'vitest';
import { TAJWEED_RULES, tajweedTokens } from '../src/lib/tajweed';

const rulesOf = text => tajweedTokens(text).filter(token => token.rule).map(token => token.rule);
const joined = text => tajweedTokens(text).map(token => token.t).join('');

describe('tajweed annotation', () => {
  it('preserves the text exactly', () => {
    const text = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';
    expect(joined(text)).toBe(text);
  });
  it('marks natural madd', () => {
    expect(rulesOf('قَالَ')).toContain('madd');
  });
  it('marks madd muttasil on the madd letter and the hamza', () => {
    expect(tajweedTokens('جَآءَ').filter(token => token.rule === 'madd').length).toBeGreaterThanOrEqual(2);
  });
  it('marks madd badal on a leading alif with madda', () => {
    expect(rulesOf('آمَنُوا')).toContain('madd');
  });
  it('marks the superscript-alif madd', () => {
    expect(rulesOf('ٱلرَّحْمَٰنِ')).toContain('madd');
  });
  it('marks ghunnah on a doubled noon', () => {
    expect(rulesOf('إِنَّ')).toContain('ghunnah');
  });
  it('marks izhar before throat letters', () => {
    expect(rulesOf('أَنْعَمْتَ')).toContain('izhar');
  });
  it('marks idgham with and without an explicit sukun', () => {
    expect(rulesOf('مِنْ رَّبِّ')).toContain('idgham');
    expect(rulesOf('مِن رَّبِّ')).toContain('idgham');
  });
  it('marks iqlab before ب', () => {
    expect(rulesOf('مِنْ بَعْدِ')).toContain('iqlab');
    expect(rulesOf('مِنۢ بَعْدِ')).toContain('iqlab');
  });
  it('marks ikhfa before hidden letters', () => {
    expect(rulesOf('مِنْ قَبْلُ')).toContain('ikhfa');
  });
  it('marks qalqalah on a stopped qalqalah letter', () => {
    expect(rulesOf('قَبْلُ')).toContain('qalqalah');
  });
  it('marks the lam for both sun and moon letters', () => {
    expect(rulesOf('وَٱلشَّمْسِ')).toContain('lam');
    expect(rulesOf('ٱلْحَمْدُ')).toContain('lam');
  });
  it('leaves plain text uncoloured', () => {
    expect(rulesOf('بِسْمِ')).toEqual([]);
  });
  it('groups letters into words so the reciting word can be highlighted', () => {
    const text = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ';
    const letters = tajweedTokens(text).filter(token => token.t !== ' ');
    expect([...new Set(letters.map(token => token.word))]).toEqual([0, 1, 2]);
    expect(letters.filter(token => token.word === 0).map(token => token.t).join('')).toBe('بِسْمِ');
  });
  it('exposes a legend entry for every rule id used', () => {
    const ids = TAJWEED_RULES.map(rule => rule.id);
    expect(ids).toEqual(expect.arrayContaining(['madd', 'ghunnah', 'ikhfa', 'idgham', 'iqlab', 'izhar', 'qalqalah', 'lam']));
  });
});
