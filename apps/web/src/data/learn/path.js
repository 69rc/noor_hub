import { HARAKAT } from './harakat';
import { BUILDER_LEVELS } from './builder';
import { TAJWEED_LESSONS } from './tajweed';
import { VOCAB_SURAHS } from '../../lib/wbw';
export const READING_SURAHS = [112, 113, 114, 108, 103, 1];
export const MODULES = [
  { id: 'alphabet', title: 'Arabic Alphabet', blurb: '28 letters, their forms and sounds.', tab: 'alphabet' },
  { id: 'harakat', title: 'Harakat & Vowels', blurb: 'The marks that give letters their voice.', tab: 'harakat' },
  { id: 'builder', title: 'Word Builder', blurb: 'From letters to syllables to words.', tab: 'builder' },
  { id: 'tajweed', title: 'Tajweed Academy', blurb: 'The rules of beautiful recitation.', tab: 'tajweed' },
  { id: 'reading', title: 'Quran Reading', blurb: 'Read with word-by-word support.', tab: 'reading' },
  { id: 'hifz', title: 'Hifz Trainer', blurb: 'Repeat, hide, reveal, memorise.', tab: 'hifz' },
  { id: 'vocab', title: 'Quranic Vocabulary', blurb: 'The words the Quran uses most.', tab: 'vocab' },
  { id: 'understanding', title: 'Understanding', blurb: 'Meaning, grammar and tafsir.', tab: 'understanding' }
];
export const LESSON_CATALOG = [
  ...[1, 2, 3, 4].map(n => ({ id: `letters-${n}`, tab: 'alphabet', title: `Letter group ${n} of 4` })),
  ...HARAKAT.map(h => ({ id: `harakat-${h.id}`, tab: 'harakat', title: h.name })),
  ...BUILDER_LEVELS.map(l => ({ id: `builder-${l.id}`, tab: 'builder', title: `Word builder · ${l.label}` })),
  ...READING_SURAHS.map(s => ({ id: `reading-${s}`, tab: 'reading', title: `Reading practice · Surah ${s}` })),
  ...TAJWEED_LESSONS.map(t => ({ id: `tajweed-${t.id}`, tab: 'tajweed', title: t.title })),
  ...VOCAB_SURAHS.map(s => ({ id: `vocab-${s}`, tab: 'vocab', title: `Vocabulary · Surah ${s}` })),
  { id: 'understanding-nahw', tab: 'understanding', title: 'First steps in Nahw' },
  { id: 'understanding-sarf', tab: 'understanding', title: 'First steps in Sarf' },
  ...READING_SURAHS.map(s => ({ id: `understanding-${s}`, tab: 'understanding', title: `Understanding · Surah ${s}` }))
];
export const TOTAL_LESSONS = LESSON_CATALOG.length;
export function recommendNext(state) {
  const done = id => state.lessons[id]?.status === 'completed';
  const order = ['letters-1', 'letters-2', 'letters-3', 'letters-4', ...HARAKAT.map(h => `harakat-${h.id}`), ...BUILDER_LEVELS.map(l => `builder-${l.id}`), ...READING_SURAHS.map(s => `reading-${s}`), ...TAJWEED_LESSONS.map(t => `tajweed-${t.id}`), ...VOCAB_SURAHS.map(s => `vocab-${s}`), 'understanding-nahw', 'understanding-sarf'];
  const id = order.find(l => !done(l)) || order[order.length - 1];
  const lesson = LESSON_CATALOG.find(l => l.id === id);
  const reasons = { alphabet: 'Start with the letters — everything else builds on them.', harakat: 'The vowels are the voice of the letters.', builder: 'You know the letters; now join them into words.', reading: 'Read real Quran with support under every word.', tajweed: 'Your reading is ready for the rules of recitation.', vocab: 'Grow the words you recognise on the page.', understanding: 'Go deeper into what the verses mean.' };
  return { ...lesson, reason: reasons[lesson.tab] };
}
export function suggestedLevel(stats) {
  if (stats.lettersMastered >= 28 && stats.wordsLearned >= 20) return 6;
  if (stats.lettersMastered >= 28) return 4;
  if (stats.lettersMastered >= 14) return 3;
  if (stats.lettersMastered >= 7) return 2;
  return 1;
}
export const ASSESSMENT = [
  { type: 'mcq', prompt: 'Which one is the letter “ba”?', options: ['ب', 'ن', 'ي', 'ت'], answer: 0, explain: 'ب has one dot below; ن has one dot above, ي has two below, ت has two above.' },
  { type: 'audio', prompt: 'Listen. Which letter did you hear?', audio: '02-Baa.mp3', options: ['Alif', 'Baa', 'Taa', 'Thaa'], answer: 1, explain: 'The recording is the letter name “baa” — ب.' },
  { type: 'mcq', prompt: 'The mark َ (fathah) makes which sound?', options: ['a', 'i', 'u', 'no sound'], answer: 0, explain: 'Fathah is the short “a” sound.' },
  { type: 'mcq', prompt: 'How do you read كَتَبَ?', options: ['kataba', 'kutiba', 'katibu', 'kitab'], answer: 0, explain: 'Three fathahs: ka-ta-ba.' },
  { type: 'tf', prompt: 'Sukoon (ْ) means the letter has a long vowel.', answer: false, explain: 'Sukoon means no vowel at all — rest on the consonant.' },
  { type: 'mcq', prompt: 'What does قُلْ mean?', options: ['Say', 'Read', 'Write', 'Listen'], answer: 0, explain: 'قُلْ is the command “say” — as in Surah al-Ikhlas.' }
];
export function levelFromAssessment(score) { return score <= 2 ? 1 : score <= 4 ? 2 : 3; }