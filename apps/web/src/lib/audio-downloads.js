import { getAudio, removeAudio, saveAudio } from './offline';
import { audioKey, loadAudioIndex, saveAudioIndex, streamUrl, surahDownload } from './audio-sources';

export { audioKey, fallbackUrl, formatBytes, loadAudioIndex, streamUrl, surahDownload, totalAudioBytes } from './audio-sources';

const objectUrls = new Map();

export async function resolveAudioUrl(reciter, surah, ayah) {
  const key = audioKey(reciter, surah, ayah);
  if (objectUrls.has(key)) return objectUrls.get(key);
  const blob = await getAudio(key);
  if (!blob) return streamUrl(reciter, surah, ayah);
  const url = URL.createObjectURL(blob);
  objectUrls.set(key, url);
  return url;
}

export async function downloadSurahAudio({ reciter, surah, ayahCount, onProgress }) {
  let bytes = surahDownload(loadAudioIndex(), reciter, surah)?.bytes || 0;
  for (let ayah = 1; ayah <= ayahCount; ayah++) {
    const key = audioKey(reciter, surah, ayah);
    const existing = await getAudio(key);
    if (existing) bytes += existing.size;
    else {
      const response = await fetch(streamUrl(reciter, surah, ayah));
      if (!response.ok) throw new Error(`Ayah ${ayah} could not be downloaded right now.`);
      const blob = await response.blob();
      await saveAudio(key, blob);
      bytes += blob.size;
    }
    onProgress?.(ayah, ayahCount);
  }
  const next = loadAudioIndex();
  next[reciter] = { ...(next[reciter] || {}), [surah]: { ayahs: ayahCount, bytes, at: Date.now() } };
  saveAudioIndex(next);
  return { ayahs: ayahCount, bytes };
}

export async function removeSurahAudio(reciter, surah, ayahCount) {
  for (let ayah = 1; ayah <= ayahCount; ayah++) {
    const key = audioKey(reciter, surah, ayah);
    const url = objectUrls.get(key);
    if (url) URL.revokeObjectURL(url);
    objectUrls.delete(key);
    await removeAudio(key);
  }
  const index = loadAudioIndex();
  if (index[reciter]) { delete index[reciter][surah]; if (!Object.keys(index[reciter]).length) delete index[reciter]; saveAudioIndex(index); }
}

export async function storageEstimate() { if (!navigator.storage?.estimate) return null; const estimate = await navigator.storage.estimate(); return { usage: estimate.usage || 0, quota: estimate.quota || 0 }; }

const HISN_INDEX_KEY = 'sakinah.hisn-audio';
const hisnUrls = new Map();
export const hisnKey = (kind, id) => `hisn:${kind}:${id}`;
export function loadHisnAudioIndex() { try { return JSON.parse(localStorage.getItem(HISN_INDEX_KEY) || '{}'); } catch { return {}; } }
export function saveHisnAudioIndex(index) { try { localStorage.setItem(HISN_INDEX_KEY, JSON.stringify(index)); } catch { /* blobs stay authoritative */ } }
export const totalHisnBytes = (index = loadHisnAudioIndex()) => Object.values(index).reduce((sum, bytes) => sum + (bytes || 0), 0);
export const hisnAudioSaved = (kind, id) => Boolean(loadHisnAudioIndex()[hisnKey(kind, id)]);
export async function resolveHisnUrl(kind, id, url) {
  const key = hisnKey(kind, id);
  if (hisnUrls.has(key)) return hisnUrls.get(key);
  const blob = await getAudio(key);
  if (!blob) return url;
  const objectUrl = URL.createObjectURL(blob);
  hisnUrls.set(key, objectUrl);
  return objectUrl;
}
export async function saveHisnAudio(kind, id, url) {
  const key = hisnKey(kind, id);
  if (await getAudio(key)) return 0;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Supplication audio could not be downloaded right now.');
  const blob = await response.blob();
  await saveAudio(key, blob);
  const index = loadHisnAudioIndex();
  index[key] = blob.size;
  saveHisnAudioIndex(index);
  return blob.size;
}
export async function removeAllHisnAudio() {
  const index = loadHisnAudioIndex();
  for (const key of Object.keys(index)) {
    const url = hisnUrls.get(key);
    if (url) URL.revokeObjectURL(url);
    hisnUrls.delete(key);
    await removeAudio(key);
  }
  saveHisnAudioIndex({});
}
