import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bookmark, BookmarkCheck, Check, Layers, Play, Volume2 } from 'lucide-react';
import { useAcademy } from './store';
import { useResource } from '../../../lib/hooks';
import { directQuranUrl, fetchContent, normalizeReader } from '../../../lib/api';
import { fetchSurahWords, VOCAB_SURAHS } from '../../../lib/wbw';
import { HIFZ_GRADES, todayKey } from '../../../lib/hifz';
import { shuffle } from '../../../lib/learn';
import { Badge, Button, ErrorState, LoadingState, Modal, Tabs } from '../../../components/ui';
import ExerciseRunner from '../engine/ExerciseRunner';

const SURAH_NAMES = { 112: 'Al-Ikhlas', 113: 'Al-Falaq', 114: 'An-Nas', 108: 'Al-Kawthar', 103: 'Al-Asr', 1: 'Al-Fatihah' };
async function loadWords(surah) {
  const content = await fetchContent(`surah:${surah}:en.sahih`, `quran/surahs/${surah}?translation=en.sahih`, directQuranUrl(`surah/${surah}/editions/quran-uthmani,en.sahih,en.transliteration`));
  const reader = normalizeReader(content.data);
  const texts = Object.fromEntries((reader.surah?.ayahs || []).map(a => [a.numberInSurah, a.text]));
  return fetchSurahWords(surah, texts);
}
const dedupe = words => { const seen = new Set(); return words.filter(w => (seen.has(w.ar) ? false : (seen.add(w.ar), true))); };
const playWord = w => { if (w.audio) { const clip = new Audio(w.audio); clip.play().catch(() => {}); } };
function mcqQuestions(words, n = 8) {
  return shuffle(words).slice(0, n).map(w => {
    const others = shuffle(words.filter(x => x.meaning !== w.meaning)).slice(0, 3);
    const options = shuffle([w, ...others]);
    return { type: 'mcq', prompt: `What does this word mean?`, arabic: w.ar, options: options.map(x => x.meaning), answer: options.indexOf(w), explain: `${w.ar} (${w.tl}) — “${w.meaning}” · Quran ${w.ref}.` };
  });
}
const matchQuestions = words => Array.from({ length: Math.min(3, Math.ceil(words.length / 4)) }, (_, i) => ({ type: 'match', prompt: 'Match each word to its meaning.', pairs: shuffle(words).slice(i * 4, i * 4 + 4).map(w => [w.ar, w.meaning]) })).filter(q => q.pairs.length >= 2);

function WordCard({ w, saved, onSave }) {
  return (
    <div className="surface p-4">
      <div className="flex items-start justify-between gap-2">
        <button onClick={() => playWord(w)} className="arabic text-right text-3xl leading-snug text-emerald-800 transition hover:text-emerald-600 dark:text-sage-200" lang="ar" dir="rtl" aria-label={`Play word: ${w.tl}`}>{w.ar}</button>
        <button aria-label={saved ? 'Unsave word' : 'Save word'} onClick={onSave} className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${saved ? 'bg-gold-100 text-gold-600 dark:bg-gold-900/40' : 'soft muted'}`}>{saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}</button>
      </div>
      <p className="mt-1 text-sm font-extrabold">{w.meaning}</p>
      <p className="muted text-[11px] italic">{w.tl}</p>
      <div className="mt-2 flex items-center justify-between">
        <span className="muted text-[9px] font-bold">Quran {w.ref}</span>
        {w.audio && <button onClick={() => playWord(w)} aria-label={`Play audio for ${w.tl}`} className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white"><Volume2 size={13} /></button>}
      </div>
    </div>
  );
}

function SurahVocab({ surah }) {
  const { state, toggleSaved, completeLesson } = useAcademy();
  const resource = useResource(() => loadWords(surah), [surah]);
  const words = useMemo(() => (resource.data ? dedupe(resource.data) : []), [resource.data]);
  const [game, setGame] = useState(null);
  const gameQuestions = useMemo(() => {
    if (!game || !words.length) return [];
    if (game === 'flash') return shuffle(words).slice(0, 10).map(w => ({ type: 'flash', prompt: 'Do you know this word?', front: w.ar, back: w.meaning, tl: w.tl, explain: `Quran ${w.ref}.` }));
    if (game === 'match') return matchQuestions(words);
    return mcqQuestions(words);
  }, [game, words]);
  const finish = ({ score, total }) => { if (game === 'quiz') completeLesson(`vocab-${surah}`, score, total); setGame(null); };
  const learned = words.filter(w => state.vocab[w.key]?.state === 'known').length;

  if (resource.loading) return <LoadingState label="Gathering the words…" rows={2} />;
  if (resource.error) return <ErrorState message={`${resource.error} Vocabulary needs internet the first time; it is cached afterwards.`} onRetry={resource.retry} />;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="muted text-xs">{words.length} unique words · {learned} learned · {state.lessons[`vocab-${surah}`]?.status === 'completed' ? 'quiz completed' : 'quiz not yet taken'}</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" className="!min-h-10 !text-xs" onClick={() => setGame('flash')}><Layers size={14} />Flashcards</Button>
          <Button variant="secondary" className="!min-h-10 !text-xs" onClick={() => setGame('match')}>Matching</Button>
          <Button className="!min-h-10 !text-xs" onClick={() => setGame('quiz')}><Play size={14} />Take the quiz</Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {words.map(w => <WordCard key={w.key} w={w} saved={state.savedWords.includes(w.key)} onSave={() => toggleSaved(w.key)} />)}
      </div>
      <p className="muted text-[11px]">Words, meanings and audio: Quran.com word-by-word. Tap a word or its speaker to hear it. Save words to build your personal deck.</p>
      <Modal open={Boolean(game)} onClose={() => setGame(null)} title={game === 'flash' ? 'Flashcards' : game === 'match' ? 'Word matching' : `Vocabulary quiz · ${SURAH_NAMES[surah]}`} wide>
        {game && gameQuestions.length > 0 && <ExerciseRunner questions={gameQuestions} module="vocab" title={SURAH_NAMES[surah]} onFinish={finish} />}
      </Modal>
    </div>
  );
}

function ReviewQueue({ mode }) {
  const { state, reviewWord, toggleSaved } = useAcademy();
  const today = todayKey();
  const keys = useMemo(() => (mode === 'due' ? Object.keys(state.vocab).filter(k => state.vocab[k].due <= today) : state.savedWords), [mode, state.vocab, state.savedWords, today]);
  const [session, setSession] = useState(null);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(0);
  const activeList = Array.isArray(session) ? session : keys;
  const needed = useMemo(() => [...new Set(activeList.map(k => Number(k.split(':')[0])))], [activeList.join('|')]);
  const resource = useResource(async () => {
    const all = [];
    for (const s of needed) all.push(...await loadWords(s));
    return all;
  }, [needed.join('|')]);
  const byKey = useMemo(() => Object.fromEntries((resource.data || []).map(w => [w.key, w])), [resource.data]);
  const list = activeList;
  const currentKey = list[idx];
  const current = byKey[currentKey];
  const grade = value => { reviewWord(currentKey, value); setDone(d => d + 1); setRevealed(false); if (idx < list.length - 1) setIdx(i => i + 1); else setSession('finished'); };

  if (resource.loading && needed.length) return <LoadingState label="Preparing your deck…" rows={2} />;
  if (resource.error) return <ErrorState message={resource.error} onRetry={resource.retry} />;
  if (session === 'finished') return (
    <div className="surface p-8 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sage-100 text-sage-700 dark:bg-sage-900/40 dark:text-sage-200"><Check size={28} /></div>
      <h2 className="text-xl font-extrabold">{done} word{done === 1 ? '' : 's'} reviewed</h2>
      <p className="muted mt-2 text-sm">+{done * 3} XP. Each word returns when it’s due — that spacing is what makes it stick.</p>
      <Button className="mt-5" onClick={() => { setSession(null); setIdx(0); setDone(0); }}>Back to deck</Button>
    </div>
  );
  if (!list.length) return <div className="surface p-8 text-center"><p className="text-sm font-extrabold">{mode === 'due' ? 'Nothing due right now' : 'No saved words yet'}</p><p className="muted mx-auto mt-2 max-w-sm text-xs leading-relaxed">{mode === 'due' ? 'Review words in the surah decks or flashcards; words you grade return here on schedule.' : 'Tap the bookmark on any word in a surah deck to keep it here.'}</p></div>;
  if (!session) return (
    <div className="space-y-4">
      <div className="surface flex flex-wrap items-center justify-between gap-3 p-5">
        <div><h2 className="section-title">{mode === 'due' ? `${list.length} words due today` : `${list.length} saved words`}</h2><p className="muted mt-1 text-xs">Each review earns 3 XP toward your daily goal. Grade honestly — “Again” is progress, not failure.</p></div>
        <Button onClick={() => { setSession([...list]); setIdx(0); setDone(0); }}><Play size={15} />Start reviewing</Button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{list.map(k => byKey[k] ? <WordCard key={k} w={byKey[k]} saved={state.savedWords.includes(k)} onSave={() => toggleSaved(k)} /> : <div key={k} className="surface p-4"><p className="text-xs font-bold">Quran {k.split(':').slice(0, 2).join(':')}</p><p className="muted mt-1 text-[10px]">Load this surah’s deck once to see the word offline.</p></div>)}</div>
    </div>
  );
  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="flex items-center justify-between"><Badge tone="gold">{mode === 'due' ? 'Spaced review' : 'Saved words'}</Badge><span className="muted text-xs font-bold">{idx + 1} / {list.length}</span></div>
      {current ? (
        <div className="surface p-8 text-center">
          <button onClick={() => playWord(current)} className="arabic text-6xl text-emerald-800 transition hover:text-emerald-600 dark:text-sage-200" lang="ar" dir="rtl" aria-label="Play word audio">{current.ar}</button>
          <p className="muted mt-2 text-[10px]">Quran {current.ref} · tap the word to hear it</p>
          {revealed ? (
            <div className="mt-5 border-t line pt-5">
              <p className="text-lg font-extrabold">{current.meaning}</p>
              <p className="muted mt-1 text-sm italic">{current.tl}</p>
              <div className="mt-6 flex justify-center gap-2">{HIFZ_GRADES.map(g => <Button key={g.value} variant={g.value === 'again' ? 'secondary' : 'primary'} className="!min-h-11 !text-xs" title={g.hint} onClick={() => grade(g.value)}>{g.label}</Button>)}</div>
            </div>
          ) : <Button className="mt-6" onClick={() => setRevealed(true)}>Reveal meaning</Button>}
        </div>
      ) : <div className="surface p-6 text-center"><p className="muted text-xs">This word’s surah isn’t cached yet. Open its surah deck once while online.</p><Button variant="secondary" className="mt-4" onClick={() => grade('good')}>Skip for now</Button></div>}
    </div>
  );
}

export default function Vocabulary() {
  const { state } = useAcademy();
  const [params] = useSearchParams();
  const deepSurah = Number((params.get('lesson') || '').replace(/^vocab-/, ''));
  const [tab, setTab] = useState(VOCAB_SURAHS.includes(deepSurah) ? String(deepSurah) : '112');
  const learned = Object.values(state.vocab).filter(v => v.state === 'known').length;
  const due = Object.values(state.vocab).filter(v => v.due <= todayKey()).length;
  return (
    <div className="space-y-5">
      <section className="surface flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <h2 className="section-title">The words the Quran uses most</h2>
          <p className="muted mt-1 text-xs leading-relaxed">Start with six short surahs. Learn a word, hear it, save it, and let spaced repetition bring it back before you forget.</p>
        </div>
        <div className="flex gap-3 text-center">
          <div className="soft rounded-2xl px-4 py-2"><p className="text-lg font-extrabold text-emerald-700 dark:text-sage-200">{learned}</p><p className="muted text-[9px] font-bold uppercase">Learned</p></div>
          <div className="soft rounded-2xl px-4 py-2"><p className="text-lg font-extrabold text-gold-600">{due}</p><p className="muted text-[9px] font-bold uppercase">Due today</p></div>
        </div>
      </section>
      <Tabs value={tab} onChange={setTab} items={[...VOCAB_SURAHS.map(s => ({ value: String(s), label: SURAH_NAMES[s] })), { value: 'due', label: `Due${due ? ` (${due})` : ''}` }, { value: 'saved', label: 'Saved' }]} />
      <div role="tabpanel">
        {tab === 'due' || tab === 'saved' ? <ReviewQueue key={tab} mode={tab} /> : <SurahVocab key={tab} surah={Number(tab)} />}
      </div>
    </div>
  );
}