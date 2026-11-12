import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Check, ChevronLeft, ChevronRight, Headphones, Play, RotateCcw, Search, Volume2 } from 'lucide-react';
import book from '../../data/hisn.json';
import { useLocalState, useOnline } from '../../lib/hooks';
import { usePreferences } from '../../lib/preferences';
import { useAudio } from '../../lib/audio-context';
import { useToast } from '../../lib/toast';
import { HISN_STATE_KEY, todayKey, searchChapters, chapterProgress, incrementCounter, resetChapterCounters, markChapterComplete, unmarkChapterComplete, defaultHisnState, cleanArabic, cleanTranslit } from '../../lib/hisn';
import { Badge, Button, IconButton, ProgressRing, Toggle } from '../../components/ui';

const ALBUM = 'Noor Hub · Hisn al-Muslim';

export default function HisnBook() {
  const [params, setParams] = useSearchParams();
  const [state, setState] = useLocalState(HISN_STATE_KEY, defaultHisnState);
  const [query, setQuery] = useState('');
  const { preferences } = usePreferences();
  const player = useAudio();
  const notify = useToast();
  const online = useOnline();
  const date = todayKey(preferences.location.timezone);
  const chapterId = Number(params.get('chapter')) || 0;
  const chapter = book.chapters.find(c => c.id === chapterId) || null;
  const counters = state.counters?.[date] || {};
  const completedToday = state.completed?.[date] || [];
  const prefs = { ...defaultHisnState().prefs, ...state.prefs };

  const setPrefs = patch => setState(s => ({ ...s, prefs: { ...defaultHisnState().prefs, ...s.prefs, ...patch } }));
  const openChapter = id => { setParams({ tab: 'hisn', chapter: String(id) }); setQuery(''); };
  const closeChapter = () => setParams({ tab: 'hisn' });

  const playChapter = c => {
    if (!online) { notify('Chapter audio needs an internet connection. The text is fully available offline.'); return; }
    player.play([{ url: c.audio, title: `${c.id}. ${c.titleEn}`, reciter: 'Hisn al-Muslim', album: ALBUM }], 0, 'off');
  };
  const playItem = (c, item) => {
    if (!online) { notify('Audio needs an internet connection. The text is fully available offline.'); return; }
    if (!item.audio) { playChapter(c); return; }
    player.play([{ url: item.audio, title: `${c.titleEn} · ${item.id}`, reciter: 'Hisn al-Muslim', album: ALBUM }], 0, 'off');
  };

  const tap = (c, item) => {
    setState(s => {
      const next = incrementCounter(s, date, item.id, item.repeat);
      const progress = chapterProgress(c.items, next.counters?.[date] || {});
      if (progress.complete) return markChapterComplete(next, date, c.id);
      return next;
    });
    if (preferences.haptics && navigator.vibrate) navigator.vibrate(10);
  };
  const resetChapter = c => {
    setState(s => unmarkChapterComplete(resetChapterCounters(s, date, c.items), date, c.id));
    notify('Counters reset for this chapter.');
  };

  if (chapter) {
    return <ChapterReader chapter={chapter} counters={counters} prefs={prefs} setPrefs={setPrefs} completed={completedToday.includes(chapter.id)} online={online} player={player} onBack={closeChapter} onOpen={openChapter} onPlayChapter={playChapter} onPlayItem={playItem} onTap={tap} onReset={resetChapter} />;
  }
  return <ChapterIndex query={query} setQuery={setQuery} completedToday={completedToday} counters={counters} onOpen={openChapter} online={online} />;
}

function ChapterIndex({ query, setQuery, completedToday, counters, onOpen, online }) {
  const results = useMemo(() => searchChapters(book.chapters, query), [query]);
  const totalDone = completedToday.length;
  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-3xl bg-emerald-900 p-6 text-white dark:bg-emerald-950">
        <div className="geometric absolute inset-0 opacity-20" aria-hidden="true" />
        <div className="relative">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-extrabold text-emerald-100"><BookOpen size={12} />The complete book</span>
          <h2 className="mt-4 text-2xl font-extrabold leading-tight">Ḥiṣn al-Muslim</h2>
          <p className="mt-1 text-sm font-bold text-emerald-200">Fortress of the Muslim</p>
          <p className="mt-3 text-xs leading-relaxed text-emerald-100/90">Compiled by Saʿīd ibn ʿAlī ibn Wahf al-Qaḥṭānī. All {book.chapters.length} chapters with Arabic text, attributed references, repetition counts, and recitation audio.</p>
          <div className="mt-5 flex items-center gap-4">
            <ProgressRing value={totalDone / book.chapters.length} size={64} stroke={5} className="text-gold-300"><span className="text-xs font-extrabold text-white">{totalDone}</span></ProgressRing>
            <div>
              <p className="text-sm font-extrabold">{totalDone} of {book.chapters.length} chapters today</p>
              <p className="mt-1 text-[11px] text-emerald-200">Your personal pace — no obligation, no blame.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="surface flex items-center gap-3 px-4 py-3">
        <Search size={17} className="muted shrink-0" />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search chapters by title or number…" className="min-h-10 w-full bg-transparent text-sm font-bold outline-none placeholder:muted" aria-label="Search Hisn al-Muslim chapters" />
        {query && <button onClick={() => setQuery('')} className="muted text-xs font-bold">Clear</button>}
      </div>

      {!online && <p className="soft rounded-xl px-4 py-3 text-[11px] leading-relaxed muted">You’re offline. All chapter text and references are available; audio requires a connection.</p>}

      <div className="grid gap-3 md:grid-cols-2">
        {results.map(c => {
          const done = completedToday.includes(c.id);
          const progress = chapterProgress(c.items, counters);
          return (
            <button key={c.id} onClick={() => onOpen(c.id)} className={`surface flex items-start gap-4 p-4 text-left transition hover:border-emerald-300 dark:hover:border-emerald-700 ${done ? 'border-emerald-300 dark:border-emerald-800' : ''}`}>
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold ${done ? 'bg-emerald-700 text-white' : 'soft text-emerald-700 dark:text-sage-200'}`}>{done ? <Check size={18} /> : c.id}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-extrabold">{c.titleEn}</span>
                <span className="arabic mt-1 block truncate text-base text-emerald-700 dark:text-sage-300" lang="ar" dir="rtl">{c.titleAr}</span>
                <span className="muted mt-1.5 block text-[10px] font-bold">{c.items.length} supplications{progress.done > 0 && !done ? ` · ${progress.done}/${progress.total} counted` : ''}</span>
              </span>
              <ChevronRight size={16} className="muted mt-1 shrink-0" />
            </button>
          );
        })}
      </div>
      {!results.length && <p className="muted py-8 text-center text-sm">No chapters match “{query}”.</p>}

      <section className="surface p-5">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-emerald-700 dark:text-sage-300">Sources & attribution</h3>
        <p className="muted mt-3 text-[11px] leading-relaxed">Arabic text and hadith references from the al-Qaḥṭānī edition (via <a className="font-bold text-emerald-600 underline" href={book.sources.arabic} target="_blank" rel="noreferrer">HisnElMuslim</a>). English translation and transliteration from <a className="font-bold text-emerald-600 underline" href={book.sources.english} target="_blank" rel="noreferrer">hisnmuslim.com</a>. Chapter recitation courtesy of Islamway (Doors). Entries without a matching English translation are shown in Arabic only and labelled honestly. References are reproduced as cited; consult qualified scholars for personal practice.</p>
      </section>
    </div>
  );
}

function ChapterReader({ chapter, counters, prefs, setPrefs, completed, online, player, onBack, onOpen, onPlayChapter, onPlayItem, onTap, onReset }) {
  const progress = chapterProgress(chapter.items, counters);
  const prev = book.chapters.find(c => c.id === chapter.id - 1);
  const next = book.chapters.find(c => c.id === chapter.id + 1);
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <Button variant="secondary" onClick={onBack} className="!min-h-10 !px-3"><ArrowLeft size={16} />All chapters</Button>
        <div className="flex items-center gap-2">
          <IconButton label="Previous chapter" disabled={!prev} onClick={() => prev && onOpen(prev.id)}><ChevronLeft size={18} /></IconButton>
          <span className="muted text-xs font-extrabold tabular-nums">{chapter.id} / {book.chapters.length}</span>
          <IconButton label="Next chapter" disabled={!next} onClick={() => next && onOpen(next.id)}><ChevronRight size={18} /></IconButton>
        </div>
      </div>

      <section className="surface overflow-hidden">
        <div className="border-b line bg-emerald-50/60 px-5 py-4 dark:bg-night-soft/50">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="eyebrow muted mb-1">Chapter {chapter.id}</p>
              <h2 className="text-lg font-extrabold leading-snug">{chapter.titleEn}</h2>
              <p className="arabic mt-2 text-xl text-emerald-700 dark:text-sage-300" lang="ar" dir="rtl">{chapter.titleAr}</p>
            </div>
            {completed && <Badge tone="green"><Check size={12} />Done today</Badge>}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button onClick={() => onPlayChapter(chapter)} className="!min-h-10"><Headphones size={15} />Play chapter</Button>
            <div className="flex items-center gap-2">
              <ProgressRing value={progress.total ? progress.done / progress.total : 0} size={40} stroke={4}><span className="text-[9px] font-extrabold">{progress.done}/{progress.total}</span></ProgressRing>
              <span className="muted text-[10px] font-bold">counted</span>
            </div>
            <IconButton label="Reset chapter counters" onClick={() => onReset(chapter)} className="ml-auto"><RotateCcw size={16} /></IconButton>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 px-5 py-3">
          <label className="flex items-center gap-2 text-[11px] font-bold"><Toggle label="Show transliteration" checked={prefs.translit} onChange={v => setPrefs({ translit: v })} />Translit</label>
          <label className="flex items-center gap-2 text-[11px] font-bold"><Toggle label="Show English translation" checked={prefs.translation} onChange={v => setPrefs({ translation: v })} />English</label>
          <label className="flex items-center gap-2 text-[11px] font-bold"><span className="muted">Size</span><input type="range" min={20} max={48} value={prefs.fontSize} onChange={e => setPrefs({ fontSize: Number(e.target.value) })} className="w-24 accent-emerald-600" aria-label="Arabic font size" /></label>
        </div>
      </section>

      {!online && <p className="soft rounded-xl px-4 py-3 text-[11px] leading-relaxed muted">Offline — text and references are fully available. Audio needs a connection.</p>}

      <div className="space-y-4">
        {chapter.items.map((item, idx) => (
          <DhikrCard key={item.id} item={item} index={idx} chapter={chapter} count={counters[item.id] || 0} prefs={prefs} online={online} player={player} onTap={onTap} onPlay={onPlayItem} />
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button variant="secondary" disabled={!prev} onClick={() => prev && onOpen(prev.id)} className="!min-h-11"><ChevronLeft size={16} />{prev ? prev.titleEn.slice(0, 28) : 'Start'}</Button>
        <Button variant="secondary" disabled={!next} onClick={() => next && onOpen(next.id)} className="!min-h-11">{next ? next.titleEn.slice(0, 28) : 'End'}<ChevronRight size={16} /></Button>
      </div>
    </div>
  );
}

function DhikrCard({ item, index, chapter, count, prefs, online, player, onTap, onPlay }) {
  const done = count >= item.repeat;
  const ar = cleanArabic(item.ar);
  const tl = cleanTranslit(item.tl);
  const isPlaying = player.playing && player.title === `${chapter.titleEn} · ${item.id}`;
  return (
    <article className={`surface overflow-hidden transition ${done ? 'border-emerald-300 dark:border-emerald-800' : ''}`}>
      <div className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="muted text-[10px] font-extrabold tabular-nums">{index + 1}</span>
          <div className="flex items-center gap-2">
            {item.repeat > 1 && <Badge tone={done ? 'green' : 'gold'}>{done ? <Check size={11} /> : null}{count}/{item.repeat}×</Badge>}
            {item.audio && <IconButton label={isPlaying ? 'Pause audio' : `Play supplication ${index + 1}`} onClick={() => onPlay(chapter, item)} className="h-8 w-8">{isPlaying ? <Volume2 size={15} className="text-emerald-600" /> : <Play size={15} />}</IconButton>}
          </div>
        </div>
        <p className="arabic text-right leading-[2.1] text-emerald-900 dark:text-sage-100" lang="ar" dir="rtl" style={{ fontSize: prefs.fontSize }}>{ar}</p>
        {prefs.translit && tl && <p className="mt-3 text-xs font-bold italic leading-relaxed muted">{tl}</p>}
        {prefs.translation && item.en && <p className="mt-3 text-sm leading-relaxed">{cleanTranslit(item.en)}</p>}
        {prefs.translation && !item.en && <p className="muted mt-3 text-[11px] italic">English translation not available for this entry in the cited edition — Arabic text shown as attributed.</p>}
        {item.refs.length > 0 && (
          <div className="soft mt-4 rounded-xl px-3 py-2.5">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-sage-300">Reference</p>
            {item.refs.map((r, i) => <p key={i} className="muted mt-1 text-[11px] leading-relaxed">{r}</p>)}
          </div>
        )}
      </div>
      <button onClick={() => onTap(chapter, item)} aria-label={`Count supplication ${index + 1}, ${count} of ${item.repeat}`} className={`flex min-h-12 w-full items-center justify-center gap-2 border-t line text-xs font-extrabold transition ${done ? 'bg-emerald-700 text-white' : 'soft text-emerald-700 hover:bg-emerald-50 dark:text-sage-200 dark:hover:bg-night-soft'}`}>
        {done ? <><Check size={15} />Completed · {item.repeat}×</> : <><span className="text-lg tabular-nums">{count}</span><span className="muted">/ {item.repeat}</span><span className="ml-1">Tap to count</span></>}
      </button>
    </article>
  );
}