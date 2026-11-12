import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowUpRight, Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, Play, Volume2 } from 'lucide-react';
import { useAcademy } from './store';
import { useAudio } from '../../../lib/audio-context';
import { usePreferences } from '../../../lib/preferences';
import { useResource } from '../../../lib/hooks';
import { directQuranUrl, fetchContent, normalizeReader, normalizeSurah } from '../../../lib/api';
import { fetchAyahWords } from '../../../lib/wbw';
import { resolveAudioUrl } from '../../../lib/audio-downloads';
import { fallbackUrl } from '../../../lib/audio-sources';
import { reciterById } from '../../../lib/constants';
import { Badge, Button, ErrorState, LoadingState, Tabs } from '../../../components/ui';

export default function Reading() {
  const { state, setReading, toggleBookmark, completeLesson } = useAcademy();
  const player = useAudio();
  const { preferences } = usePreferences();
  const [params] = useSearchParams();
  const deepSurah = Number((params.get('lesson') || '').replace(/^reading-/, ''));
  const [surah, setSurah] = useState(Number.isInteger(deepSurah) && deepSurah >= 1 && deepSurah <= 114 ? deepSurah : state.reading.surah);
  const [ayah, setAyah] = useState(deepSurah ? 1 : state.reading.ayah);
  const [word, setWord] = useState(null);
  const [peek, setPeek] = useState(false);
  const wordPanel = useRef(null);
  const reciter = reciterById(preferences.reciter);

  const index = useResource(() => fetchContent('surah-index', 'quran/surahs', directQuranUrl('surah')), []);
  const surahs = useMemo(() => (index.data ? normalizeSurah(index.data) || [] : []), [index.data]);
  const content = useResource(() => fetchContent(`surah:${surah}:en.sahih`, `quran/surahs/${surah}?translation=en.sahih`, directQuranUrl(`surah/${surah}/editions/quran-uthmani,en.sahih,en.transliteration`)), [surah]);
  const reader = useMemo(() => (content.data ? normalizeReader(content.data) : null), [content.data]);
  const ayahs = reader?.surah?.ayahs || [];
  const current = ayahs[ayah - 1];
  const words = useResource(() => (current ? fetchAyahWords(surah, ayah, current.text) : Promise.resolve([])), [surah, ayah, current?.text]);

  useEffect(() => { setReading({ surah, ayah }); setWord(null); setPeek(false); }, [surah, ayah]);
  useEffect(() => { if (ayahs.length && ayah > ayahs.length) setAyah(ayahs.length); }, [ayahs.length, ayah]);
  useEffect(() => { if (word) wordPanel.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, [word]);

  const meta = surahs.find(s => s.number === surah);
  const ref = `${surah}:${ayah}`;
  const bookmarked = state.bookmarks.includes(ref);
  const finished = state.lessons[`reading-${surah}`]?.status === 'completed';
  const buildItems = () => ayahs.map(a => ({ title: `${reader.surah.englishName} · Ayah ${a.numberInSurah}`, url: () => resolveAudioUrl(reciter.value, surah, a.numberInSurah), fallbackUrl: fallbackUrl(reciter.value, a.number), surah, ayah: a.numberInSurah, reciter: reciter.label }));
  const playAyah = () => player.play([buildItems()[ayah - 1]], 0, 'off');
  const playSurah = () => player.play(buildItems(), ayah - 1, 'off');
  const translit = reader?.transliteration?.ayahs?.[ayah - 1]?.text;
  const translation = reader?.translation?.ayahs?.[ayah - 1]?.text;
  const translitMode = state.reading.translit;

  return (
    <div className="space-y-5">
      <section className="surface p-5">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex-1 basis-52">
            <span className="sr-only">Choose surah</span>
            <select value={surah} onChange={e => { setSurah(Number(e.target.value)); setAyah(1); }} className="input min-h-11 w-full">
              {(surahs.length ? surahs : Array.from({ length: 114 }, (_, i) => ({ number: i + 1, name: `Surah ${i + 1}`, englishName: '' }))).map(s => <option key={s.number} value={s.number}>{s.number}. {s.englishName || s.name}{s.numberOfAyahs ? ` · ${s.numberOfAyahs} ayahs` : ''}</option>)}
            </select>
          </label>
          <div className="flex items-center gap-2">
            <Button variant="secondary" className="!min-h-11 !px-3" aria-label="Previous ayah" disabled={ayah <= 1} onClick={() => setAyah(a => a - 1)}><ChevronLeft size={17} /></Button>
            <span className="min-w-16 text-center text-xs font-extrabold">{ayah} / {ayahs.length || '…'}</span>
            <Button variant="secondary" className="!min-h-11 !px-3" aria-label="Next ayah" disabled={!ayahs.length || ayah >= ayahs.length} onClick={() => setAyah(a => a + 1)}><ChevronRight size={17} /></Button>
          </div>
          <Button variant="secondary" className="!min-h-11 !px-3" aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark this ayah'} onClick={() => toggleBookmark(ref)}>{bookmarked ? <BookmarkCheck size={17} className="text-emerald-600" /> : <Bookmark size={17} />}</Button>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <Tabs className="!border-b-0" value={translitMode} onChange={value => setReading({ translit: value })} items={[{ value: 'full', label: 'Translit on' }, { value: 'fade', label: 'Fading' }, { value: 'off', label: 'Translit off' }]} />
          <label className="flex items-center gap-2 text-[11px] font-bold"><span className="muted">Text size</span><input type="range" min={20} max={52} value={state.reading.fontSize} onChange={e => setReading({ fontSize: Number(e.target.value) })} className="w-28 accent-emerald-600" /></label>
        </div>
        {meta && <p className="muted mt-3 text-[11px]">{meta.englishName} · {meta.englishNameTranslation} · {meta.revelationType?.toLowerCase() === 'meccan' ? 'Meccan' : 'Medinan'}{content.offline && <Badge tone="neutral" className="ml-2">Offline copy</Badge>}</p>}
      </section>

      {content.loading && <LoadingState label="Opening the surah…" rows={2} />}
      {content.error && <ErrorState message={content.error} onRetry={content.retry} />}

      {current && (
        <section className="surface overflow-hidden">
          <div className="border-b line bg-emerald-50/50 px-5 py-3 dark:bg-night-soft/50">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 dark:text-sage-300">1 · Arabic — tap any word</p>
          </div>
          <div className="p-6">
            {words.loading && <p className="arabic text-right leading-loose text-emerald-900 dark:text-sage-100" lang="ar" dir="rtl" style={{ fontSize: state.reading.fontSize }}>{current.text} <span className="text-gold-500">﴿{ayah}﴾</span></p>}
            {!words.loading && words.data?.length > 0 && (
              <p className="text-right leading-loose text-emerald-900 dark:text-sage-100" lang="ar" dir="rtl" style={{ fontSize: state.reading.fontSize }}>
                {words.data.map(w => (
                  <button key={w.position} onClick={() => { setWord(word?.position === w.position ? null : w); if (w.audio) { const clip = new Audio(w.audio); clip.play().catch(() => {}); } }} className={`arabic rounded-lg px-0.5 transition ${word?.position === w.position ? 'bg-gold-100 text-emerald-900 dark:bg-gold-900/50 dark:text-sage-100' : 'hover:bg-emerald-50 dark:hover:bg-night-soft'}`}>{w.ar}</button>
                ))} <span className="text-gold-500">﴿{ayah}﴾</span>
              </p>
            )}
            {!words.loading && (!words.data || words.data.length === 0) && <p className="arabic text-right leading-loose text-emerald-900 dark:text-sage-100" lang="ar" dir="rtl" style={{ fontSize: state.reading.fontSize }}>{current.text} <span className="text-gold-500">﴿{ayah}﴾</span></p>}
            {words.error && <p className="muted mt-3 text-[11px]">Word-by-word support needs internet (or a previously cached verse). The Arabic text above is still fully readable. <button className="font-bold text-emerald-600 underline" onClick={words.retry}>Retry</button></p>}
          </div>

          {word && (
            <div ref={wordPanel} className="mx-5 mb-5 rounded-2xl bg-gold-50 p-4 dark:bg-gold-900/20" role="region" aria-label="Word details">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="arabic text-3xl text-emerald-800 dark:text-sage-200" lang="ar" dir="rtl">{word.ar}</p>
                  <p className="mt-1 text-xs font-bold italic">{word.tl}</p>
                  <p className="mt-1 text-sm font-extrabold">“{word.meaning}”</p>
                  <p className="muted mt-2 text-[10px]">Quran {word.ref || ref} · word {word.position} · meaning from Quran.com word-by-word</p>
                </div>
                <div className="flex flex-col gap-2">
                  {word.audio && <Button variant="secondary" className="!min-h-9 !text-[11px]" onClick={() => { const clip = new Audio(word.audio); clip.play().catch(() => {}); }}><Volume2 size={13} />Word audio</Button>}
                  <a href={`https://corpus.quran.com/wordbyword.jsp?chapter=${surah}&verse=${ayah}`} target="_blank" rel="noreferrer" className="soft flex min-h-9 items-center gap-1 rounded-xl px-3 text-[11px] font-bold">Verified grammar<ArrowUpRight size={12} /></a>
                </div>
              </div>
            </div>
          )}

          {translitMode !== 'off' && translit && (
            <div className="border-t line px-6 py-4">
              <p className="mb-1 text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 dark:text-sage-300">2 · Transliteration{translitMode === 'fade' ? ' — fading; tap to peek' : ''}</p>
              <button onClick={() => translitMode === 'fade' && setPeek(p => !p)} className={`w-full text-left text-sm italic leading-relaxed transition-opacity ${translitMode === 'fade' && !peek ? 'opacity-30' : ''}`}>{translit}</button>
            </div>
          )}
          {translation && (
            <div className="border-t line px-6 py-4">
              <p className="mb-1 text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 dark:text-sage-300">3 · Translation — Sahih International</p>
              <p className="text-sm leading-relaxed">{translation}</p>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2 border-t line px-5 py-4">
            <Button className="!min-h-10 !text-xs" onClick={playAyah}><Play size={14} />Play ayah</Button>
            <Button variant="secondary" className="!min-h-10 !text-xs" onClick={playSurah}><Volume2 size={14} />Recite from here</Button>
            <span className="muted text-[10px]">{reciter.label} · audio needs internet unless downloaded</span>
            {ayah === ayahs.length && !finished && <Button variant="secondary" className="!min-h-10 !text-xs" onClick={() => completeLesson(`reading-${surah}`, 1, 1)}>Mark surah as read</Button>}
            {finished && <Badge className="ml-auto"><BookmarkCheck size={11} />Surah completed</Badge>}
          </div>
        </section>
      )}

      {state.bookmarks.length > 0 && (
        <section className="surface p-5">
          <h2 className="section-title mb-3">Your bookmarks</h2>
          <div className="flex flex-wrap gap-2">{state.bookmarks.map(b => { const [s, a] = b.split(':').map(Number); return <button key={b} onClick={() => { setSurah(s); setAyah(a); }} className="soft min-h-10 rounded-full px-4 text-xs font-bold transition hover:bg-emerald-50 dark:hover:bg-night-soft">Quran {b}</button>; })}</div>
        </section>
      )}

      <p className="muted text-[11px] leading-relaxed">Arabic: Uthmani text via AlQuran Cloud. Word meanings & transliteration: Quran.com. Recitation: everyayah.com. Keep practising — hide the transliteration gradually as the letters become familiar.</p>
    </div>
  );
}