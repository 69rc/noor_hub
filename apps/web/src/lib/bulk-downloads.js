import { getContent, removeContent } from './offline';
import { directQuranUrl, fetchContent, normalizeSurah } from './api';
import { TRANSLATIONS } from './constants';
import book from '../data/hisn.json';
import { downloadSurahAudio, loadAudioIndex, loadHisnAudioIndex, removeAllHisnAudio, removeSurahAudio, saveHisnAudio, surahDownload, totalAudioBytes, totalHisnBytes } from './audio-downloads';

export const QURAN_SURAH_COUNT = 114;
export const QURAN_AYAH_COUNT = 6236;
export const hisnAudioCount = () => book.chapters.reduce((sum, c) => sum + (c.audio ? 1 : 0) + c.items.filter(i => i.audio).length, 0);

const CONCURRENCY = { 'quran-audio': 2, 'quran-text': 3, 'hisn-audio': 3 };
const MEASURE = { 'quran-audio': () => totalAudioBytes(), 'hisn-audio': () => totalHisnBytes(), 'quran-text': null };

export function createJobRunner({ concurrency = 3, measureBytes = null } = {}) {
  let state = { status: 'idle', done: 0, total: 0, bytes: 0, failed: [], current: '', sub: null };
  let units = [];
  let cursor = 0;
  let inFlight = 0;
  let generation = 0;
  const listeners = new Set();
  const emit = () => listeners.forEach(fn => fn({ ...state, failed: [...state.failed] }));
  const set = patch => { state = { ...state, ...patch }; emit(); };
  const maybeFinish = gen => {
    if (gen !== generation || state.status !== 'running') return;
    if (cursor >= units.length && inFlight === 0) set({ status: 'done', current: '', sub: null });
  };
  async function worker(gen) {
    while (gen === generation && state.status === 'running') {
      const index = cursor++;
      if (index >= units.length) break;
      const unit = units[index];
      inFlight++;
      set({ current: unit.label, sub: null });
      try {
        await unit.run((done, total) => { if (gen === generation) set({ sub: { label: unit.label, done, total } }); });
      } catch {
        state.failed = [...state.failed, unit.label];
      }
      inFlight--;
      set({ done: state.done + 1, bytes: measureBytes ? measureBytes() : state.bytes, sub: null });
      maybeFinish(gen);
    }
    maybeFinish(gen);
  }
  const spawn = () => { const gen = generation; for (let i = 0; i < concurrency; i++) worker(gen); };
  return {
    getState: () => ({ ...state, failed: [...state.failed] }),
    subscribe(fn) { listeners.add(fn); fn({ ...state, failed: [...state.failed] }); return () => listeners.delete(fn); },
    start(nextUnits) {
      if (state.status === 'running' || state.status === 'paused') return false;
      units = nextUnits; cursor = 0; inFlight = 0; generation++;
      state = { status: 'running', done: 0, total: units.length, bytes: measureBytes ? measureBytes() : 0, failed: [], current: '', sub: null };
      emit(); spawn(); return true;
    },
    pause() { if (state.status !== 'running') return; generation++; set({ status: 'paused', current: '', sub: null }); },
    resume() { if (state.status !== 'paused') return; generation++; set({ status: 'running' }); spawn(); },
    cancel() { if (state.status !== 'running' && state.status !== 'paused') return; generation++; set({ status: 'cancelled', current: '', sub: null }); }
  };
}

async function surahIndex() {
  const cached = await getContent('surah-index');
  if (cached) return normalizeSurah(cached) || [];
  const { data } = await fetchContent('surah-index', 'quran/surahs', directQuranUrl('surah'));
  return normalizeSurah(data) || [];
}

function readDownloaded() { try { return JSON.parse(localStorage.getItem('sakinah.downloads') || '[]'); } catch { return []; } }
function writeDownloaded(list) { try { localStorage.setItem('sakinah.downloads', JSON.stringify(list)); } catch { /* cache */ } }

async function buildUnits(type, opts) {
  if (type === 'quran-audio') {
    const surahs = await surahIndex();
    if (!surahs.length) throw new Error('The surah list could not be loaded. Connect to the internet once and try again.');
    return surahs.map(s => ({
      label: `${s.number}. ${s.englishName}`,
      run: async onProgress => {
        const entry = surahDownload(loadAudioIndex(), opts.reciter, s.number);
        if (entry && entry.ayahs >= s.numberOfAyahs) return;
        await downloadSurahAudio({ reciter: opts.reciter, surah: s.number, ayahCount: s.numberOfAyahs, onProgress });
      }
    }));
  }
  if (type === 'quran-text') {
    const surahs = await surahIndex();
    if (!surahs.length) throw new Error('The surah list could not be loaded. Connect to the internet once and try again.');
    return surahs.map(s => ({
      label: `${s.number}. ${s.englishName}`,
      run: async () => {
        const key = `surah:${s.number}:${opts.translation}`;
        if (!(await getContent(key))) await fetchContent(key, `quran/surahs/${s.number}?translation=${opts.translation}`, directQuranUrl(`surah/${s.number}/editions/quran-uthmani,${opts.translation},en.transliteration`));
        writeDownloaded([...new Set([...readDownloaded(), s.number])]);
      }
    }));
  }
  if (type === 'hisn-audio') {
    const units = [];
    for (const chapter of book.chapters) {
      for (const item of chapter.items) if (item.audio) units.push({ label: `Supplication ${item.id}`, run: () => saveHisnAudio('item', item.id, item.audio) });
      if (chapter.audio) units.push({ label: `Chapter ${chapter.id} · ${chapter.titleEn}`, run: () => saveHisnAudio('chapter', chapter.id, chapter.audio) });
    }
    return units;
  }
  throw new Error('Unknown download type.');
}

let runner = null;
let detach = null;
let snapshot = { job: null, status: 'idle', done: 0, total: 0, bytes: 0, failed: [], current: '', sub: null };
const listeners = new Set();
const publish = () => listeners.forEach(fn => fn(snapshot));

export function getBulkState() { return snapshot; }
export function subscribeBulk(fn) { listeners.add(fn); fn(snapshot); return () => listeners.delete(fn); }

export async function startBulk(type, opts = {}) {
  if (snapshot.status === 'running' || snapshot.status === 'paused') return false;
  const units = await buildUnits(type, opts);
  detach?.();
  runner = createJobRunner({ concurrency: CONCURRENCY[type], measureBytes: MEASURE[type] });
  detach = runner.subscribe(state => { snapshot = { ...snapshot, ...state }; publish(); });
  snapshot = { ...snapshot, job: { type, ...opts } };
  publish();
  runner.start(units);
  return true;
}
export function pauseBulk() { runner?.pause(); }
export function resumeBulk() { runner?.resume(); }
export function cancelBulk() { runner?.cancel(); }

export async function removeBulk(type, opts = {}) {
  if (type === 'quran-audio') {
    const bySurah = loadAudioIndex()[opts.reciter] || {};
    for (const [surah, entry] of Object.entries(bySurah)) await removeSurahAudio(opts.reciter, Number(surah), entry.ayahs);
    return;
  }
  if (type === 'quran-text') {
    for (const surah of readDownloaded()) {
      await removeContent(`surah:${surah}:${opts.translation}`);
      const stillCached = await Promise.all(TRANSLATIONS.map(t => getContent(`surah:${surah}:${t.value}`)));
      if (!stillCached.some(Boolean)) writeDownloaded(readDownloaded().filter(n => n !== surah));
    }
    return;
  }
  if (type === 'hisn-audio') { await removeAllHisnAudio(); return; }
  throw new Error('Unknown download type.');
}

export function bulkSavedBytes(type) {
  if (type === 'quran-audio') return totalAudioBytes();
  if (type === 'hisn-audio') return totalHisnBytes();
  return 0;
}
export function bulkSavedCount(type, opts = {}) {
  if (type === 'quran-audio') return Object.keys(loadAudioIndex()[opts.reciter] || {}).length;
  if (type === 'quran-text') return readDownloaded().length;
  if (type === 'hisn-audio') return Object.keys(loadHisnAudioIndex()).length;
  return 0;
}