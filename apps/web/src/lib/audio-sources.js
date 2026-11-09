import { reciterById } from './constants';

const INDEX_KEY = 'sakinah.audio-downloads';
const pad3 = n => String(n).padStart(3, '0');

export const audioKey = (reciter, surah, ayah) => `${reciter}:${surah}:${ayah}`;
export function streamUrl(reciter, surah, ayah) { return `https://everyayah.com/data/${reciterById(reciter).folder}/${pad3(surah)}${pad3(ayah)}.mp3`; }
export function fallbackUrl(reciter, globalAyah) { const reciterEntry = reciterById(reciter); return reciterEntry.fallback ? `https://cdn.islamic.network/quran/audio/${reciterEntry.fallback.bitrate}/${reciterEntry.fallback.edition}/${globalAyah}.mp3` : ''; }

export function loadAudioIndex() { try { return JSON.parse(localStorage.getItem(INDEX_KEY) || '{}'); } catch { return {}; } }
export function saveAudioIndex(index) { try { localStorage.setItem(INDEX_KEY, JSON.stringify(index)); } catch { /* index is a cache; the blobs in IndexedDB stay authoritative */ } }
export const surahDownload = (index, reciter, surah) => index[reciter]?.[String(surah)] || index[reciter]?.[surah] || null;
export const totalAudioBytes = (index = loadAudioIndex()) => Object.values(index).reduce((sum, bySurah) => sum + Object.values(bySurah).reduce((inner, entry) => inner + (entry.bytes || 0), 0), 0);
export function formatBytes(bytes) { const mb = bytes / 1048576; if (!bytes) return '0 MB'; return mb >= 100 ? `${Math.round(mb)} MB` : `${mb.toFixed(1)} MB`; }
