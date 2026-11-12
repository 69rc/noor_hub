import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, GraduationCap } from 'lucide-react';
import { useLocalState, useResource } from '../../lib/hooks';
import { directQuranUrl, fetchContent, normalizeReader } from '../../lib/api';
import { usePreferences } from '../../lib/preferences';
import { HIFZ_GRADES, TOTAL_AYAHS, dueKeys, gradeReview, surahProgress, todayKey } from '../../lib/hifz';
import { Badge, Button, EmptyState, ErrorState, LoadingState, Modal } from '../../components/ui';

export default function Hifz({ surahs }) {
  const [hifz, setHifz] = useLocalState('sakinah.hifz', {});
  const { preferences } = usePreferences();
  const today = todayKey();
  const due = useMemo(() => dueKeys(hifz, today), [hifz, today]);
  const [session, setSession] = useState(null);
  const [pos, setPos] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const memorized = Object.keys(hifz).length;
  const tracked = useMemo(() => surahs.map(surah => ({ ...surah, count: surahProgress(hifz, surah.number) })).filter(surah => surah.count > 0), [surahs, hifz]);
  const completed = tracked.filter(surah => surah.count >= surah.numberOfAyahs).length;
  const currentKey = session?.[pos] || null;
  const currentSurah = currentKey ? Number(currentKey.split(':')[0]) : null;
  const currentAyah = currentKey ? Number(currentKey.split(':')[1]) : null;
  const verse = useResource(() => (currentSurah ? fetchContent(`surah:${currentSurah}:${preferences.translation}`, `quran/surahs/${currentSurah}?translation=${preferences.translation}`, directQuranUrl(`surah/${currentSurah}/editions/quran-uthmani,${preferences.translation}`)) : Promise.resolve(null)), [currentSurah, preferences.translation]);
  const reader = useMemo(() => verse.data ? normalizeReader(verse.data) : null, [verse.data]);
  const ayah = reader?.surah?.ayahs?.find(item => item.numberInSurah === currentAyah);
  const translation = reader?.translation?.ayahs?.find(item => item.numberInSurah === currentAyah);
  const grade = value => {
    setHifz(current => ({ ...current, [currentKey]: gradeReview(current[currentKey], value, today) }));
    if (pos + 1 < session.length) { setPos(pos + 1); setRevealed(false); } else setSession(null);
  };
  return <div>
    <div className="mb-5 grid grid-cols-3 gap-3">{[{ label: 'Memorized ayahs', value: `${memorized}`, sub: `of ${TOTAL_AYAHS}` }, { label: 'Due today', value: `${due.length}`, sub: 'ready to review' }, { label: 'Surahs complete', value: `${completed}`, sub: 'of 114' }].map(card => <div key={card.label} className="surface p-4 text-center"><p className="text-2xl font-extrabold text-emerald-700 dark:text-sage-200">{card.value}</p><p className="mt-1 text-[10px] font-extrabold">{card.label}</p><p className="muted mt-0.5 text-[9px]">{card.sub}</p></div>)}</div>
    {due.length > 0 && <div className="surface mb-5 p-5"><div className="flex items-center justify-between gap-3"><div><h2 className="text-sm font-extrabold">Today’s review</h2><p className="muted mt-1 text-xs">{due.length} verse{due.length === 1 ? '' : 's'} came back on schedule. Recite from memory, then check yourself.</p></div><Button onClick={() => { setSession(due.slice(0, 20)); setPos(0); setRevealed(false); }}>Start review</Button></div><div className="mt-4 flex flex-wrap gap-2">{due.slice(0, 8).map(key => <Badge key={key} tone="gold">{key}</Badge>)}{due.length > 8 && <Badge tone="neutral">+{due.length - 8} more</Badge>}</div></div>}
    {memorized === 0 ? <div className="surface"><EmptyState icon={GraduationCap} title="Begin your hifz" description="Open any surah and tap the graduation cap beside an ayah to mark it memorized. Each verse then returns for review on a spaced schedule — 1, 3, 7, 14, 30 and 60 days." action={<Link to="/quran/1" className="btn-primary mt-5">Start with Al-Fatihah</Link>} /></div> : <div className="surface divide-y divide-[var(--line)] overflow-hidden">{tracked.map(surah => { const surahDue = due.filter(key => key.startsWith(`${surah.number}:`)).length; return <div key={surah.number} className="flex items-center gap-4 px-5 py-4"><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h3 className="text-sm font-extrabold">{surah.englishName}</h3>{surah.count >= surah.numberOfAyahs && <Badge tone="sage">Complete</Badge>}{surahDue > 0 && <Badge tone="gold">{surahDue} due</Badge>}</div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-emerald-100 dark:bg-night-soft"><div className="h-full rounded-full bg-emerald-600 dark:bg-sage-300" style={{ width: `${Math.min(100, (surah.count / surah.numberOfAyahs) * 100)}%` }} /></div><p className="muted mt-1.5 text-[10px] font-bold">{surah.count} of {surah.numberOfAyahs} ayahs memorized</p></div><Link to={`/quran/${surah.number}`} aria-label={`Open ${surah.englishName} in the reader`} className="icon-button surface"><ChevronRight size={17} /></Link></div>; })}</div>}
    <p className="muted mt-5 text-center text-[10px] leading-relaxed">Your hifz progress stays on this device. Review grades move the next date: Again returns a verse to 1 day, Good takes the next step, Easy skips a step.</p>
    <Modal open={Boolean(session)} onClose={() => setSession(null)} title={`Review ${Math.min(pos + 1, session?.length || 1)} of ${session?.length || 0}`}>
      {currentKey && <div><div className="flex items-center gap-2"><Badge tone="neutral">{currentKey}</Badge><span className="muted text-[10px] font-bold">{surahs.find(surah => surah.number === currentSurah)?.englishName || `Surah ${currentSurah}`}</span></div>
        {verse.loading ? <div className="mt-4"><LoadingState rows={2} /></div> : verse.error ? <div className="mt-4"><ErrorState message={verse.error} onRetry={verse.retry} /></div> : <div className="mt-4"><p className="muted text-sm leading-relaxed">{translation?.text || 'Recite this verse from memory.'}</p>{revealed ? <><p className="arabic mt-4 rounded-2xl bg-emerald-50 p-4 text-right text-2xl leading-[2.1] dark:bg-night-soft" lang="ar" dir="rtl">{ayah?.text}</p><div className="mt-4 grid grid-cols-3 gap-2">{HIFZ_GRADES.map(item => <Button key={item.value} variant={item.value === 'good' ? 'primary' : 'secondary'} onClick={() => grade(item.value)}>{item.label}<span className="ml-1 text-[9px] font-medium opacity-70">{item.hint}</span></Button>)}</div></> : <Button className="mt-4 w-full" onClick={() => setRevealed(true)}>Recite from memory, then reveal</Button>}</div>}
        <p className="muted mt-4 text-[10px] leading-relaxed">Be honest with yourself — the schedule only helps if the grade reflects what you actually recalled.</p></div>}
    </Modal>
  </div>;
}
