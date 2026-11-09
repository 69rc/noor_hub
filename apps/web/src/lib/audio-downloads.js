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
