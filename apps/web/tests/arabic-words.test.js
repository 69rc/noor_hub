import { describe, expect, it } from 'vitest';
import { wordCount, wordTokens } from '../src/lib/arabic-words';

const joined = text => wordTokens(text).map(token => token.t).join('');

describe('arabic word tokens', () => {
  it('preserves the text exactly', () => {
    const text = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';
    expect(joined(text)).toBe(text);
  });
  it('groups letters and marks into words', () => {
    const letters = wordTokens('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ').filter(token => token.t !== ' ');
    expect([...new Set(letters.map(token => token.word))]).toEqual([0, 1, 2]);
    expect(letters.filter(token => token.word === 0).map(token => token.t).join('')).toBe('بِسْمِ');
  });
  it('counts words for playback-position highlighting', () => {
    expect(wordCount(wordTokens('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ'))).toBe(4);
    expect(wordCount(wordTokens('قُلْ هُوَ ٱللَّهُ أَحَدٌ'))).toBe(4);
    expect(wordCount(wordTokens(''))).toBe(0);
  });
  it('keeps spaces out of word indices', () => {
    expect(wordTokens('a b').filter(token => token.t === ' ').every(token => token.word === -1)).toBe(true);
  });
});
