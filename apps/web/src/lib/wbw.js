const API = 'https://api.quran.com/api/v4';
export const wordAudioUrl = audio => `https://verses.quran.com/${audio}`;
export async function fetchAyahWords(surah, ayah, arabicText) {
  const { getContent, saveContent } = await import('./offline');
  const key = `wbw:${surah}:${ayah}`;
  let payload;
  try {
    const response = await fetch(`${API}/verses/by_key/${surah}:${ayah}?words=true`, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error('Word-by-word data is unavailable right now.');
    payload = await response.json();
    await saveContent(key, payload).catch(() => {});
  } catch (error) {
    payload = await getContent(key);
    if (!payload) throw error;
  }
  const verse = payload.verses?.[0] || payload.verse;
  if (!verse?.words) throw new Error('No word-by-word data was returned for this verse.');
  const arabicWords = (arabicText || '').split(/\s+/).filter(Boolean);
  return verse.words.filter(w => w.char_type_name === 'word').map((w, i) => ({
    position: w.position,
    ar: arabicWords[i] || w.text,
    tl: w.transliteration?.text || '',
    meaning: w.translation?.text || '',
    audio: w.audio_url ? wordAudioUrl(w.audio_url) : ''
  }));
}
export async function fetchSurahWords(surah, ayahTexts = {}) {
  const { getContent, saveContent } = await import('./offline');
  const key = `wbw-surah:${surah}`;
  let payload;
  try {
    const response = await fetch(`${API}/verses/by_chapter/${surah}?words=true&per_page=300`, { signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error('Word-by-word data is unavailable right now.');
    payload = await response.json();
    await saveContent(key, payload).catch(() => {});
  } catch (error) {
    payload = await getContent(key);
    if (!payload) throw error;
  }
  const words = [];
  for (const verse of payload.verses || []) {
    const arabicWords = (ayahTexts[verse.verse_number] || '').split(/\s+/).filter(Boolean);
    let i = 0;
    for (const w of verse.words || []) {
      if (w.char_type_name !== 'word') continue;
      words.push({ key: `${surah}:${verse.verse_number}:${w.position}`, ar: arabicWords[i] || w.text, tl: w.transliteration?.text || '', meaning: w.translation?.text || '', audio: w.audio_url ? wordAudioUrl(w.audio_url) : '', ref: `${surah}:${verse.verse_number}` });
      i++;
    }
  }
  return words;
}
export const VOCAB_SURAHS = [112, 113, 114, 108, 103, 1];