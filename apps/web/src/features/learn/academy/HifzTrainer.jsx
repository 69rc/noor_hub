import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, GraduationCap, Play, Repeat } from 'lucide-react';
import { useAcademy } from './store';
import { useAudio } from '../../../lib/audio-context';
import { usePreferences } from '../../../lib/preferences';
import { useLocalState, useResource } from '../../../lib/hooks';
import { directQuranUrl, fetchContent, normalizeReader, normalizeSurah } from '../../../lib/api';
import { resolveAudioUrl } from '../../../lib/audio-downloads';
import { fallbackUrl } from '../../../lib/audio-sources';
import { reciterById } from '../../../lib/constants';
import { HIFZ_GRADES, dueKeys, gradeReview, markMemorized, todayKey } from '../../../lib/hifz';
import { Badge, Button, ErrorState, LoadingState } from '../../../components/ui';

const STATUSES = [
  { value: 'not-started', label: 'Not started' },
  { value: 'learning', label: 'Learning' },
  { value: 'memorising', label: 'Memorising' },
  { value: 'memorised', label: 'Memorised' },
  { value: 'needs-revision', label: 'Needs revision' }
];
const STATUS_TONES = { 'not-started': 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-200', learning: 'bg-gold-100 text-gold-700 dark:bg-gold-900/40 dark:text-gold-200', memorising: 'bg-sage-100 text-sage-800 dark:bg-sage-900/40 dark:text-sage-200', memorised: 'bg-emerald-600 text-white', 'needs-revision': 'bg-clay-100 text-clay-600' };

export default function HifzTrainer() {
  const { state, setHifzStatus } = useAcademy();
  const player = useAudio();
  const { preferences } = usePreferences();
  const [params] = useSearchParams();
  const [hifz, setHifz] = useLocalState('sakinah.hifz', {});
  const [surah, setSurah] = useState(state.reading.surah || 112);
  const [from, setFrom] = useState(1);
  const [to, setTo] = useState(3);
  const [count, setCount] = useState(5);
  const [hidden, setHidden] = useState(false);
  const [revealed, setRevealed] = useState({});
  const reciter = reciterById(preferences.reciter);
  const today = todayKey();

  const index = useResource(() => fetchContent('surah-index', 'quran/surahs', directQuranUrl('surah')), []);
  const surahs = useMemo(() => (index.data ? normalizeSurah(index.data) || [] : []), [index.data]);
  const content = useResource(() => fetchContent(`surah:${surah}:en.sahih`, `quran/surahs/${surah}?translation=en.sahih`, directQuranUrl(`surah/${surah}/editions/quran-uthmani,en.sahih,en.transliteration`)), [surah]);
  const reader = useMemo(() => (content.data ? normalizeReader(content.data) : null), [content.data]);
  const ayahs = reader?.surah?.ayahs || [];
  const chooseSurah = n => { setSurah(n); setFrom(1); setTo(3); setRevealed({}); };

  const due = useMemo(() => dueKeys(hifz, today), [hifz, today]);
  const memorisedRefs = Object.entries(state.hifzStatus).filter(([, v]) => v.status === 'memorised').map(([k]) => k);
  const bySurah = useMemo(() => { const map = {}; for (const ref of memorisedRefs) { const s = ref.split(':')[0]; (map[s] ||= []).push(ref); } return map; }, [memorisedRefs.join('|')]);

  const startRepeat = () => {
    if (!ayahs.length) return;
    const start = Math.max(1, Math.min(from, to)) - 1;
    const end = Math.min(ayahs.length, Math.max(from, to)) - 1;
    const items = ayahs.slice(start, end + 1).map(a => ({ title: `${reader.surah.englishName} · Ayah ${a.numberInSurah}`, url: () => resolveAudioUrl(reciter.value, surah, a.numberInSurah), fallbackUrl: fallbackUrl(reciter.value, a.number), surah, ayah: a.numberInSurah, reciter: reciter.label }));
    player.play(items, 0, 'range', { start: 0, end: items.length - 1 });
    player.setRepeat('range', count === 0 ? -1 : count - 1);
  };
  const mark = (ref, status) => {
    setHifzStatus(ref, status);
    if (status === 'memorised') setHifz(current => ({ ...current, [ref]: markMemorized(current[ref], today) }));
  };
  const review = (ref, grade) => setHifz(current => ({ ...current, [ref]: gradeReview(current[ref], grade, today) }));
  const jumpTo = ref => { const [s, a] = ref.split(':').map(Number); setSurah(s); setFrom(a); setTo(a); setHidden(true); };

  return (
    <div className="space-y-6">
      <section className="surface p-5">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-sage-100 p-3 text-sage-800 dark:bg-sage-900/40 dark:text-sage-200"><GraduationCap size={24} /></div>
          <div className="flex-1">
            <h2 className="section-title">Repeat until it stays</h2>
            <p className="muted mt-1 text-xs leading-relaxed">Choose a passage, loop the recitation, hide the text and test yourself. Marking is always manual — listening alone never marks an ayah memorised.</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block"><span className="mb-1 block text-[10px] font-extrabold uppercase tracking-wide muted">Surah</span>
            <select value={surah} onChange={e => chooseSurah(Number(e.target.value))} className="input min-h-11">
              {(surahs.length ? surahs : Array.from({ length: 114 }, (_, i) => ({ number: i + 1, englishName: `Surah ${i + 1}` }))).map(s => <option key={s.number} value={s.number}>{s.number}. {s.englishName}</option>)}
            </select>
          </label>
          <label className="block"><span className="mb-1 block text-[10px] font-extrabold uppercase tracking-wide muted">From ayah</span><input type="number" min={1} max={ayahs.length || 286} value={from} onChange={e => setFrom(Math.max(1, Number(e.target.value) || 1))} className="input min-h-11" /></label>
          <label className="block"><span className="mb-1 block text-[10px] font-extrabold uppercase tracking-wide muted">To ayah</span><input type="number" min={1} max={ayahs.length || 286} value={to} onChange={e => setTo(Math.max(1, Number(e.target.value) || 1))} className="input min-h-11" /></label>
          <label className="block"><span className="mb-1 block text-[10px] font-extrabold uppercase tracking-wide muted">Repeat each cycle</span>
            <select value={count} onChange={e => setCount(Number(e.target.value))} className="input min-h-11">{[5, 10, 20, 0].map(n => <option key={n} value={n}>{n === 0 ? 'Unlimited' : `${n} times`}</option>)}</select>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button onClick={startRepeat} disabled={!ayahs.length}><Play size={15} />Start repetition</Button>
          <Button variant="secondary" onClick={() => setHidden(h => !h)}>{hidden ? <Eye size={15} /> : <EyeOff size={15} />}{hidden ? 'Show text' : 'Hide text'}</Button>
          {player.playing && <Badge tone="gold"><Repeat size={11} />Looping · ayah {player.ayah}</Badge>}
          <span className="muted text-[10px]">{reciter.label}</span>
        </div>
      </section>

      {content.loading && <LoadingState label="Loading the passage…" rows={2} />}
      {content.error && <ErrorState message={content.error} onRetry={content.retry} />}

      {ayahs.length > 0 && (
        <section className="space-y-3">
          {ayahs.slice(Math.max(0, Math.min(from, to) - 1), Math.min(ayahs.length, Math.max(from, to))).map(a => {
            const ref = `${surah}:${a.numberInSurah}`;
            const status = state.hifzStatus[ref]?.status || 'not-started';
            const visible = !hidden || revealed[ref];
            return (
              <div key={ref} className={`surface p-5 ${player.playing && player.surah === surah && player.ayah === a.numberInSurah ? 'border-emerald-400 dark:border-sage-400' : ''}`}>
                <div className="flex items-center justify-between gap-3">
                  <Badge tone="neutral">Ayah {a.numberInSurah}</Badge>
                  <span className={`rounded-full px-2.5 py-1 text-[9px] font-extrabold ${STATUS_TONES[status]}`}>{STATUSES.find(s => s.value === status)?.label}</span>
                </div>
                {visible
                  ? <p className="arabic mt-3 text-right text-3xl leading-loose text-emerald-900 dark:text-sage-100" lang="ar" dir="rtl">{a.text} <span className="text-gold-500">﴿{a.numberInSurah}﴾</span></p>
                  : <button onClick={() => setRevealed(r => ({ ...r, [ref]: true }))} className="mt-3 flex min-h-20 w-full items-center justify-center rounded-2xl border-2 border-dashed line text-xs font-bold muted">Text hidden — tap to reveal and check yourself</button>}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-2 text-[10px] font-bold muted">Mark as
                    <select value={status} onChange={e => mark(ref, e.target.value)} className="input !min-h-9 !w-auto !px-3 !text-[11px]">{STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
                  </label>
                  {hidden && visible && <Button variant="secondary" className="!min-h-9 !text-[11px]" onClick={() => setRevealed(r => ({ ...r, [ref]: false }))}><EyeOff size={12} />Hide again</Button>}
                </div>
              </div>
            );
          })}
        </section>
      )}

      <section className="surface p-5">
        <div className="mb-3 flex items-center justify-between"><h2 className="section-title">Today’s revision</h2><Badge tone={due.length ? 'gold' : 'green'}>{due.length ? `${due.length} due` : 'All caught up'}</Badge></div>
        {due.length === 0 && <p className="muted text-xs leading-relaxed">Nothing due today. Memorised ayahs return on a growing schedule: 1, 3, 7, 14, 30, then 60 days.</p>}
        <div className="space-y-2">{due.slice(0, 12).map(ref => (
          <div key={ref} className="soft flex flex-wrap items-center justify-between gap-2 rounded-xl px-4 py-3">
            <button onClick={() => jumpTo(ref)} className="text-xs font-extrabold text-emerald-700 underline-offset-2 hover:underline dark:text-sage-200">Quran {ref}</button>
            <div className="flex gap-1.5">{HIFZ_GRADES.map(g => <Button key={g.value} variant="secondary" className="!min-h-8 !px-2.5 !text-[10px]" title={g.hint} onClick={() => review(ref, g.value)}>{g.label}</Button>)}</div>
          </div>
        ))}</div>
      </section>

      <section className="surface p-5">
        <h2 className="section-title mb-3">Memorised so far</h2>
        {memorisedRefs.length === 0 && <p className="muted text-xs">Nothing marked memorised yet. When you can recite a passage without looking, mark it above — honestly, at your own pace.</p>}
        <div className="flex flex-wrap gap-2">{Object.entries(bySurah).map(([s, refs]) => <Badge key={s} tone="sage">Surah {s} · {refs.length} ayah{refs.length === 1 ? '' : 's'}</Badge>)}</div>
        <p className="muted mt-3 text-[10px]">Revision schedule shared with the Hifz tab in the Quran section.</p>
      </section>
    </div>
  );
}