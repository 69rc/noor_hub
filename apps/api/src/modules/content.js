import { Router } from 'express';
import { z } from 'zod';
import { asyncRoute, ApiError } from '../middleware/errors.js';
import { quranApi, hadithApi } from '../integrations/content.js';
export const contentRouter = Router();
const reference = z.object({ surah: z.coerce.number().int().min(1).max(114), ayah: z.coerce.number().int().min(1).max(286) });
contentRouter.get('/quran/surahs', asyncRoute(async (req, res) => {
  const data = await quranApi('surah');
  res.json({ source: 'AlQuran Cloud', edition: 'Uthmani', surahs: data.data });
}));
contentRouter.get('/quran/surahs/:surah', asyncRoute(async (req, res) => {
  const { surah } = z.object({ surah: z.coerce.number().int().min(1).max(114) }).parse(req.params);
  const translation = z.enum(['en.sahih', 'en.pickthall', 'en.yusufali']).parse(req.query.translation || 'en.sahih');
  const data = await quranApi(`surah/${surah}/editions/quran-uthmani,${translation},en.transliteration`);
  if (data.data?.[0]?.numberOfAyahs !== data.data?.[1]?.numberOfAyahs) throw new ApiError(502, 'CONTENT_MISMATCH', 'Source editions do not match.');
  res.json({ source: 'https://alquran.cloud/api', editions: data.data.map(edition => edition.edition), surah: data.data[0], translation: data.data[1], transliteration: data.data[2] });
}));
contentRouter.get('/quran/verse', asyncRoute(async (req, res) => {
  const { surah, ayah } = reference.parse(req.query);
  const data = await quranApi(`ayah/${surah}:${ayah}/editions/quran-uthmani,en.sahih`);
  const verse = data.data?.[0];
  if (!verse || verse.numberInSurah !== ayah || verse.surah?.number !== surah) throw new ApiError(404, 'VERSE_NOT_FOUND', 'Verse not found.');
  res.json({ source: 'https://alquran.cloud/api', arabic: verse, translation: data.data[1] });
}));
const collections = { bukhari: 'Sahih al-Bukhari', muslim: 'Sahih Muslim', abudawud: 'Sunan Abi Dawud', tirmidhi: 'Jami at-Tirmidhi', nasai: "Sunan an-Nasa'i", ibnmajah: 'Sunan Ibn Majah' };
contentRouter.get('/hadith/:collection/:number', asyncRoute(async (req, res) => {
  const { collection, number } = z.object({ collection: z.enum(Object.keys(collections)), number: z.coerce.number().int().min(1).max(10000) }).parse(req.params);
  const [arabic, english] = await Promise.all([hadithApi(`ara-${collection}`, number), hadithApi(`eng-${collection}`, number)]);
  const a = arabic.hadiths?.[0], e = english.hadiths?.[0];
  if (!a || !e || a.hadithnumber !== e.hadithnumber) throw new ApiError(502, 'CONTENT_MISMATCH', 'Hadith editions do not match.');
  res.json({ collection: collections[collection], number: a.hadithnumber, reference: a.reference, arabic: a.text, english: e.text, grades: e.grades || [], source: 'https://github.com/fawazahmed0/hadith-api', note: 'Numbering follows the cited edition. A collection name is not an automatic grading of every report.' });
}));