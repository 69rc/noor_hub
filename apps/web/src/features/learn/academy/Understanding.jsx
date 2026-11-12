import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowUpRight, BookOpen, Check, ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react';
import { useAcademy } from './store';
import { useResource } from '../../../lib/hooks';
import { directQuranUrl, fetchContent, normalizeReader } from '../../../lib/api';
import { fetchAyahWords } from '../../../lib/wbw';
import { fetchTafsir } from '../../../lib/tafsir';
import { READING_SURAHS } from '../../../data/learn/path';
import { Badge, Button, ErrorState, LoadingState, Modal } from '../../../components/ui';
import ExerciseRunner from '../engine/ExerciseRunner';

const SURAH_NAMES = { 112: 'Al-Ikhlas', 113: 'Al-Falaq', 114: 'An-Nas', 108: 'Al-Kawthar', 103: 'Al-Asr', 1: 'Al-Fatihah' };
const PRIMERS = {
  nahw: {
    title: 'First steps in Nahw',
    intro: ['Nahw is the science of how words relate inside a sentence. In Arabic, a word’s ending often signals its role: who is doing, who is receiving, and what follows a preposition.', 'This is an introductory map, not the full rule set. Exceptions (diptotes, indeclinable words) are covered in later study.'],
    points: [
      { title: 'Three common cases', text: 'Rafʿ (ـُ / ـٌ) often marks the subject; naṣb (ـَ / ـً) often marks the object; jarr (ـِ / ـٍ) follows prepositions and possession.' },
      { title: 'The nominal sentence', text: 'A sentence can begin with a noun: اَلْبَيْتُ كَبِيرٌ — “the house is big”. Subject (mubtadaʾ) first, predicate (khabar) after; no separate word for “is” is needed in this pattern.' },
      { title: 'Possession', text: 'كِتَابُ زَيْدٍ — “Zayd’s book”. The second term takes the genitive (jarr) case.' }
    ],
    quiz: [
      { type: 'mcq', prompt: 'Which case commonly follows a preposition?', options: ['Jarr (genitive)', 'Rafʿ (nominative)', 'Naṣb (accusative)'], answer: 0, explain: 'A noun governed by a preposition takes the genitive case, e.g. فِى الْبَيْتِ.' },
      { type: 'mcq', prompt: 'In اَلْبَيْتُ كَبِيرٌ, what is كَبِيرٌ?', options: ['The predicate (khabar)', 'The subject (mubtadaʾ)', 'A preposition'], answer: 0, explain: 'Al-baytu is the subject; kabīrun tells us about it — the predicate.' },
      { type: 'tf', prompt: 'Nahw studies how words relate within a sentence.', answer: true, explain: 'Nahw is syntax; Sarf (the next primer) is word morphology.' }
    ]
  },
  sarf: {
    title: 'First steps in Sarf',
    intro: ['Sarf is the science of word forms: how a small set of root letters grows into a family of related words. Most Arabic roots carry three consonants and a broad field of meaning.', 'The pattern (wazn) shapes the root into a particular word. Not every word follows a three-letter root — but the most common ones do.'],
    points: [
      { title: 'The root k–t–b (writing)', text: 'كَتَبَ kataba “he wrote” · كِتَاب kitāb “book” · كَاتِب kātib “writer” · مَكْتَب maktab “desk/office”. Same root, different patterns.' },
      { title: 'Spot the pattern', text: 'A kātib-style word (فَاعِل) often names the one who does the action. A mafʿūl-style word (مَفْعُول) often names what the action falls upon.' },
      { title: 'Why it helps', text: 'Recognising a root lets you guess a word’s family before you meet it — then confirm the exact sense from a lexicon and context.' }
    ],
    quiz: [
      { type: 'mcq', prompt: 'Which word from k–t–b means “writer”?', options: ['كَاتِب', 'كِتَاب', 'مَكْتَب'], answer: 0, explain: 'Kātib is the doer pattern (fāʿil): the one who writes.' },
      { type: 'mcq', prompt: 'What does Sarf primarily study?', options: ['Word forms and derivation', 'Sentence punctuation', 'Recitation melody'], answer: 0, explain: 'Sarf is morphology — how words are built from roots and patterns.' },
      { type: 'tf', prompt: 'Every Arabic word follows a three-consonant root.', answer: false, explain: 'Most common words do, but there are four-letter roots, borrowed words and particles outside the pattern.' }
    ]
  }
};

export default function Understanding() {
  const { state, completeLesson } = useAcademy();
  const [params] = useSearchParams();
  const deep = params.get('lesson') || '';
  const deepSurah = Number(deep.replace(/^understanding-/, ''));
  const [surah, setSurah] = useState(READING_SURAHS.includes(deepSurah) ? deepSurah : 112);
  const [ayah, setAyah] = useState(1);
  const [primer, setPrimer] = useState(deep === 'understanding-nahw' ? 'nahw' : deep === 'understanding-sarf' ? 'sarf' : null);
  const [quizzing, setQuizzing] = useState(false);

  const content = useResource(() => fetchContent(`surah:${surah}:en.sahih`, `quran/surahs/${surah}?translation=en.sahih`, directQuranUrl(`surah/${surah}/editions/quran-uthmani,en.sahih,en.transliteration`)), [surah]);
  const reader = useMemo(() => (content.data ? normalizeReader(content.data) : null), [content.data]);
  const ayahs = reader?.surah?.ayahs || [];
  const current = ayahs[ayah - 1];
  const words = useResource(() => (current ? fetchAyahWords(surah, ayah, current.text) : Promise.resolve([])), [surah, ayah, current?.text]);
  const tafsir = useResource(() => (current ? fetchTafsir('ibn_kathir', surah, ayah) : Promise.resolve(null)), [surah, ayah, Boolean(current)]);
  const hadith = useResource(async () => {
    const [arabic, english] = await Promise.all([
      fetchContent('hadith:ara:bukhari:5027', 'hadith/bukhari/5027', 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-bukhari/5027.json'),
      fetchContent('hadith:eng:bukhari:5027', 'hadith/bukhari/5027', 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-bukhari/5027.json')
    ]);
    const a = arabic.data.hadiths?.[0] || arabic.data; const e = english.data.hadiths?.[0] || english.data;
    return { arabic: a.arabic || a.text, english: e.english || e.text, reference: a.reference, grades: e.grades || [] };
  }, []);
  const finishPrimer = ({ score, total }) => { completeLesson(`understanding-${primer}`, score, total); setQuizzing(false); };

  return (
    <div className="space-y-6">
      <section className="surface p-5">
        <h2 className="section-title">Meaning, layer by layer</h2>
        <p className="muted mt-2 max-w-lg text-xs leading-relaxed">Arabic, transliteration, translation, word meanings and attributed commentary are kept clearly separate — so you always know what you are reading and who said it.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {Object.entries(PRIMERS).map(([id, p]) => {
            const done = state.lessons[`understanding-${id}`]?.status === 'completed';
            return (
              <button key={id} onClick={() => { setPrimer(id); setQuizzing(false); }} className="soft flex items-center justify-between gap-3 rounded-2xl p-4 text-left transition hover:bg-emerald-50 dark:hover:bg-night-soft">
                <div className="flex items-center gap-3"><Lightbulb size={20} className="shrink-0 text-gold-600" /><div><p className="text-xs font-extrabold">{p.title}</p><p className="muted mt-0.5 text-[10px]">Grammar primer · 3 questions</p></div></div>
                {done ? <Badge><Check size={11} />Done</Badge> : <ChevronRight size={15} className="muted shrink-0" />}
              </button>
            );
          })}
        </div>
      </section>

      <section className="surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-xs font-extrabold">Study a surah
            <select value={surah} onChange={e => { setSurah(Number(e.target.value)); setAyah(1); }} className="input !min-h-10 !w-auto">{READING_SURAHS.map(s => <option key={s} value={s}>{s}. {SURAH_NAMES[s]}</option>)}</select>
          </label>
          <div className="flex items-center gap-2">
            <Button variant="secondary" className="!min-h-10 !px-3" aria-label="Previous ayah" disabled={ayah <= 1} onClick={() => setAyah(a => a - 1)}><ChevronLeft size={16} /></Button>
            <span className="text-xs font-extrabold">Ayah {ayah}/{ayahs.length || '…'}</span>
            <Button variant="secondary" className="!min-h-10 !px-3" aria-label="Next ayah" disabled={!ayahs.length || ayah >= ayahs.length} onClick={() => setAyah(a => a + 1)}><ChevronRight size={16} /></Button>
          </div>
        </div>
      </section>

      {content.loading && <LoadingState label="Opening the layers…" rows={3} />}
      {content.error && <ErrorState message={content.error} onRetry={content.retry} />}

      {current && (
        <div className="space-y-4">
          <section className="surface overflow-hidden">
            <p className="border-b line bg-emerald-50/50 px-5 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 dark:bg-night-soft/50 dark:text-sage-300">1 · Arabic — Uthmani text</p>
            <p className="arabic p-6 text-right text-3xl leading-loose text-emerald-900 dark:text-sage-100" lang="ar" dir="rtl">{current.text} <span className="text-gold-500">﴿{ayah}﴾</span></p>
          </section>
          <section className="surface overflow-hidden">
            <p className="border-b line px-5 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 dark:text-sage-300">2 · Transliteration — a reading aid, not the Quran itself</p>
            <p className="p-5 text-sm italic leading-relaxed">{reader.transliteration?.ayahs?.[ayah - 1]?.text}</p>
          </section>
          <section className="surface overflow-hidden">
            <p className="border-b line px-5 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 dark:text-sage-300">3 · Translation — Sahih International</p>
            <p className="p-5 text-sm leading-[1.9]">{reader.translation?.ayahs?.[ayah - 1]?.text}</p>
          </section>
          <section className="surface overflow-hidden">
            <p className="border-b line px-5 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 dark:text-sage-300">4 · Word meanings — Quran.com word-by-word</p>
            {words.loading && <div className="p-5"><LoadingState rows={1} /></div>}
            {words.error && <p className="muted p-5 text-xs">Word meanings need internet (or a cached verse). <button className="font-bold text-emerald-600 underline" onClick={words.retry}>Retry</button></p>}
            {!words.loading && words.data?.length > 0 && (
              <div className="grid gap-2 p-5 sm:grid-cols-2">{words.data.map(w => (
                <div key={w.position} className="soft flex items-center justify-between gap-3 rounded-xl px-4 py-2.5">
                  <p className="arabic text-xl text-emerald-800 dark:text-sage-200" lang="ar" dir="rtl">{w.ar}</p>
                  <div className="text-right"><p className="text-[11px] font-bold">{w.meaning}</p><p className="muted text-[9px] italic">{w.tl}</p></div>
                </div>
              ))}</div>
            )}
            <div className="border-t line px-5 py-3">
              <a href={`https://corpus.quran.com/wordbyword.jsp?chapter=${surah}&verse=${ayah}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-sage-200">Verified word-by-word grammar at the Quranic Arabic Corpus<ArrowUpRight size={12} /></a>
            </div>
          </section>
          <section className="surface overflow-hidden">
            <p className="border-b line px-5 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 dark:text-sage-300">5 · Tafsir — Ibn Kathir (abridged), attributed commentary</p>
            {tafsir.loading && <div className="p-5"><LoadingState rows={2} /></div>}
            {tafsir.error && <div className="p-5"><p className="muted text-xs leading-relaxed">Commentary is not cached for this verse yet. Connect to the internet to load it — we never substitute invented commentary. <button className="font-bold text-emerald-600 underline" onClick={tafsir.retry}>Retry</button></p></div>}
            {tafsir.data && (
              <div className="p-5">
                <p className="text-sm leading-[1.9]">{tafsir.data.text}</p>
                <p className="muted mt-3 text-[10px]">{tafsir.data.name} · {tafsir.data.author} · via UmmahAPI{tafsir.data.offline ? ' · offline copy' : ''}. Occasions of revelation are presented only as this source states them.</p>
              </div>
            )}
          </section>
          <div className="flex flex-wrap items-center gap-3">
            {state.lessons[`understanding-${surah}`]?.status === 'completed'
              ? <Badge><Check size={12} />Surah studied</Badge>
              : <Button variant="secondary" onClick={() => completeLesson(`understanding-${surah}`, 1, 1)}>Mark this surah studied</Button>}
            <span className="muted text-[10px]">Study all {ayahs.length} ayahs at your own pace.</span>
          </div>
        </div>
      )}

      <section className="surface p-5">
        <div className="mb-3 flex items-center gap-2"><BookOpen size={18} className="text-gold-600" /><h2 className="section-title">Why learning matters — a verified narration</h2></div>
        {hadith.loading && <LoadingState rows={1} />}
        {hadith.error && <p className="muted text-xs">The narration could not load right now. <button className="font-bold text-emerald-600 underline" onClick={hadith.retry}>Retry</button></p>}
        {hadith.data && (
          <div>
            <p className="arabic border-b line pb-4 text-xl leading-loose text-emerald-800 dark:text-sage-100" lang="ar" dir="rtl">{hadith.data.arabic}</p>
            <p className="mt-4 text-sm leading-[1.9]">{hadith.data.english}</p>
            <div className="soft mt-4 rounded-xl p-3 text-[11px] leading-relaxed">
              <p className="font-extrabold">Sahih al-Bukhari 5027{hadith.data.reference?.book !== undefined ? ` · Book ${hadith.data.reference.book}, Hadith ${hadith.data.reference.hadith}` : ''}</p>
              <p className="muted mt-1">{hadith.data.grades.length ? hadith.data.grades.map((g, i) => <span key={i} className="block">{g.name}: {g.grade}</span>) : 'No scholar-attributed grade is supplied by this source; none is invented here.'}</p>
            </div>
            <a href="https://sunnah.com/bukhari:5027" target="_blank" rel="noreferrer" className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-sage-200">Verify on Sunnah.com<ArrowUpRight size={12} /></a>
          </div>
        )}
      </section>

      <Modal open={Boolean(primer)} onClose={() => { setPrimer(null); setQuizzing(false); }} title={primer ? PRIMERS[primer].title : ''} wide>
        {primer && !quizzing && (
          <div className="space-y-5">
            {PRIMERS[primer].intro.map(p => <p key={p.slice(0, 24)} className="text-sm leading-[1.9]">{p}</p>)}
            <div className="space-y-3">{PRIMERS[primer].points.map(point => (
              <div key={point.title} className="soft rounded-2xl p-4"><p className="text-xs font-extrabold text-emerald-700 dark:text-sage-200">{point.title}</p><p className="muted mt-1 text-xs leading-relaxed">{point.text}</p></div>
            ))}</div>
            <p className="muted text-[10px]">Introductory summaries following standard Arabic grammar teaching. Confirm details with a qualified teacher and reliable primers.</p>
            <Button onClick={() => setQuizzing(true)}>Check understanding</Button>
          </div>
        )}
        {primer && quizzing && <ExerciseRunner questions={PRIMERS[primer].quiz} module="understanding" title={PRIMERS[primer].title} onFinish={finishPrimer} />}
      </Modal>
    </div>
  );
}