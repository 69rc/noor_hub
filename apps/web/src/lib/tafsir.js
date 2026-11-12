export const TAFSIR_EDITIONS = [
  { value: 'ibn_kathir', label: 'Ibn Kathir (abridged)', language: 'english', author: 'Hafiz Ibn Kathir' },
  { value: 'muyassar', label: 'Tafsir al-Muyassar', language: 'arabic', author: 'Ministry of Islamic Affairs, Saudi Arabia' }
];

export const tafsirUrl = (edition, surah, ayah) => `https://ummahapi.com/api/tafsir/${edition}/surah/${surah}/ayah/${ayah}`;

export function normalizeTafsir(payload) {
  const source = payload?.data?.tafsir;
  const text = typeof source?.text === 'string' ? source.text.trim() : '';
  if (!payload?.success || !text) return null;
  return { key: source.key || '', name: source.name || 'Commentary', author: source.author || '', language: source.language || '', text };
}

export async function fetchTafsir(edition, surah, ayah) {
  const { getContent, saveContent } = await import('./offline');
  const key = `tafsir:${edition}:${surah}:${ayah}`;
  const cached = await getContent(key);
  if (cached) return { ...cached, offline: true };
  const response = await fetch(tafsirUrl(edition, surah, ayah), { signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error('Commentary could not load. Check your connection.');
  const parsed = normalizeTafsir(await response.json());
  if (!parsed) throw new Error('No commentary text was returned for this verse.');
  await saveContent(key, parsed);
  return parsed;
}
