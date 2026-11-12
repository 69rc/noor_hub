import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Check, RotateCcw, Timer, Trophy, Volume2, X } from 'lucide-react';
import { Badge, Button } from '../../../components/ui';
import { useAcademy } from '../academy/store';
import { PRAISE, ENCOURAGE, stripMarks } from '../../../lib/learn';
import { harfiUrl, playClip } from '../../../lib/learn-audio';
const shuffle = arr => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
function AudioButton({ file, url, voice, label = 'Play sound' }) {
  return <Button variant="secondary" onClick={() => playClip(url || harfiUrl(file, voice))}><Volume2 size={16} />{label}</Button>;
}
function ChoiceQuestion({ q, phase, onSubmit, voice }) {
  const [selected, setSelected] = useState(null);
  const options = q.type === 'tf' ? ['True', 'False'] : q.options;
  const answer = q.type === 'tf' ? (q.answer ? 0 : 1) : q.answer;
  return <div>
    {q.type === 'audio' && <div className="mb-5"><AudioButton file={q.audio} url={q.audioUrl} voice={voice} label="Listen carefully" /></div>}
    {q.arabic && <p className="arabic mb-5 rounded-2xl bg-emerald-50 p-5 text-center text-4xl text-emerald-800 dark:bg-night-soft dark:text-sage-200" lang="ar" dir="rtl">{q.arabic}</p>}
    <div className="space-y-3">{options.map((option, i) => {
      const state = phase !== 'answer' && i === answer ? 'correct' : phase !== 'answer' && selected === i ? 'wrong' : selected === i ? 'selected' : '';
      return <button key={i} disabled={phase !== 'answer'} onClick={() => { setSelected(i); onSubmit(i === answer); }} className={`flex min-h-14 w-full items-center gap-3 rounded-2xl border p-4 text-left text-sm font-bold transition ${state === 'correct' ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200' : state === 'wrong' ? 'border-clay-400 bg-clay-100 text-clay-600' : state === 'selected' ? 'border-emerald-500 bg-emerald-50 dark:bg-night-soft' : 'line hover:border-emerald-300'}`}>
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[10px] ${state === 'correct' ? 'border-emerald-500 bg-emerald-600 text-white' : 'line'}`}>{state === 'correct' ? <Check size={14} /> : state === 'wrong' ? <X size={14} /> : String.fromCharCode(65 + i)}</span>
        <span className={q.arabicOptions ? 'arabic text-2xl' : ''} lang={q.arabicOptions ? 'ar' : undefined}>{option}</span>
      </button>;
    })}</div>
  </div>;
}
function MatchQuestion({ q, phase, onSubmit }) {
  const pairsKey = q.pairs.flat().join('|');
  const lefts = useMemo(() => shuffle(q.pairs.map((p, i) => ({ id: i, text: p[0], ar: /[\u0600-\u06FF]/.test(p[0]) }))), [pairsKey]);
  const rights = useMemo(() => shuffle(q.pairs.map((p, i) => ({ id: i, text: p[1], ar: /[\u0600-\u06FF]/.test(p[1]) }))), [pairsKey]);
  const [left, setLeft] = useState(null);
  const [matched, setMatched] = useState([]);
  const [wrong, setWrong] = useState(null);
  const pickRight = id => {
    if (left === null || phase !== 'answer') return;
    if (left === id) { const next = [...matched, id]; setMatched(next); setLeft(null); if (next.length === q.pairs.length) onSubmit(true); }
    else { setWrong(id); setTimeout(() => setWrong(null), 450); }
  };
  const cell = (side, item) => {
    const done = matched.includes(item.id);
    const active = side === 'left' && left === item.id;
    return <button key={`${side}${item.id}`} disabled={done || phase !== 'answer'} onClick={() => (side === 'left' ? setLeft(item.id) : pickRight(item.id))} className={`min-h-12 rounded-xl border px-3 py-2 text-sm font-bold transition ${done ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200' : wrong === item.id && side === 'right' ? 'border-clay-400 bg-clay-100' : active ? 'border-emerald-500 bg-emerald-50 dark:bg-night-soft' : 'line hover:border-emerald-300'} ${item.ar ? 'arabic text-xl' : ''}`} lang={item.ar ? 'ar' : undefined}>{item.text}</button>;
  };
  return <div>
    <p className="muted mb-4 text-xs">Tap a card on the left, then its pair on the right.</p>
    <div className="grid grid-cols-2 gap-3"><div className="space-y-2">{lefts.map(item => cell('left', item))}</div><div className="space-y-2">{rights.map(item => cell('right', item))}</div></div>
    {wrong !== null && <p role="status" className="mt-3 text-xs font-bold text-clay-600">Not a pair — listen to the sounds again and retry.</p>}
  </div>;
}
function OrderQuestion({ q, phase, onSubmit }) {
  const piecesKey = q.pieces.join('|');
  const pool = useMemo(() => shuffle(q.pieces.map((p, i) => ({ id: i, ch: p }))), [piecesKey]);
  const [placed, setPlaced] = useState([]);
  const remaining = pool.filter(p => !placed.includes(p.id));
  const joined = placed.map(id => pool.find(p => p.id === id).ch).join('');
  return <div>
    <p className="muted mb-3 text-xs">Tap the letters in order to build the word. Tap a placed letter to remove it.</p>
    <div dir="rtl" className="mb-4 flex min-h-16 flex-row-reverse flex-wrap items-center justify-center gap-2 rounded-2xl border-2 border-dashed line p-3">{placed.length ? placed.map(id => <button key={id} disabled={phase !== 'answer'} onClick={() => setPlaced(placed.filter(x => x !== id))} className="arabic rounded-xl bg-emerald-600 px-3 py-1 text-3xl text-white">{pool.find(p => p.id === id).ch}</button>) : <span className="muted text-xs">Your word appears here</span>}</div>
    <p className="arabic mb-4 text-center text-2xl text-emerald-700 dark:text-sage-200" lang="ar" dir="rtl">{joined || '—'}</p>
    <div dir="rtl" className="flex flex-wrap justify-center gap-2">{remaining.map(p => <button key={p.id} disabled={phase !== 'answer'} onClick={() => setPlaced([...placed, p.id])} className="arabic soft min-h-12 min-w-12 rounded-xl px-3 text-3xl transition hover:bg-emerald-50">{p.ch}</button>)}</div>
    <Button className="mt-5 w-full" disabled={placed.length !== q.pieces.length || phase !== 'answer'} onClick={() => onSubmit(joined === stripMarks(q.target) || joined === q.target)}>Check word<ArrowRight size={16} /></Button>
  </div>;
}
function FillQuestion({ q, phase, onSubmit }) {
  const [selected, setSelected] = useState(null);
  return <div>
    <p className="arabic mb-6 rounded-2xl bg-emerald-50 p-6 text-center text-5xl text-emerald-800 dark:bg-night-soft dark:text-sage-200" lang="ar" dir="rtl">{q.before}{selected || ''}{q.after}</p>
    <div className="flex justify-center gap-3">{q.options.map(mark => <button key={mark} disabled={phase !== 'answer'} onClick={() => { setSelected(mark); onSubmit(mark === q.answer); }} className={`arabic flex h-16 w-16 items-center justify-center rounded-2xl border text-4xl transition ${phase !== 'answer' && mark === q.answer ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : phase !== 'answer' && selected === mark ? 'border-clay-400 bg-clay-100' : 'line hover:border-emerald-300'}`} lang="ar">{'ب' + mark}</button>)}</div>
    <p className="muted mt-3 text-center text-[11px]">Choose the mark that completes the word.</p>
  </div>;
}
function FlashQuestion({ q, phase, onSubmit }) {
  const [revealed, setRevealed] = useState(false);
  return <div className="text-center">
    <div className="soft mx-auto mb-5 flex min-h-40 max-w-sm flex-col items-center justify-center rounded-3xl p-6">
      <p className="arabic text-5xl text-emerald-800 dark:text-sage-200" lang="ar" dir="rtl">{q.front}</p>
      {revealed && <div className="mt-4 border-t line pt-4"><p className="text-sm font-extrabold">{q.back}</p>{q.tl && <p className="muted mt-1 text-xs italic">{q.tl}</p>}</div>}
    </div>
    {!revealed ? <Button onClick={() => setRevealed(true)}>Reveal meaning</Button> : phase === 'answer' && <div className="flex justify-center gap-3"><Button onClick={() => onSubmit(true)}><Check size={16} />I knew it</Button><Button variant="secondary" onClick={() => onSubmit(false)}>Still learning</Button></div>}
  </div>;
}
export default function ExerciseRunner({ questions, module, title, onFinish, timedSeconds = 0, voice = 'female-Asmaa' }) {
  const { attempt } = useAcademy();
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState('answer');
  const [results, setResults] = useState([]);
  const [last, setLast] = useState(null);
  const [timeLeft, setTimeLeft] = useState(timedSeconds);
  const [run, setRun] = useState(0);
  const q = questions[idx];
  const score = results.filter(Boolean).length;
  useEffect(() => {
    if (!timedSeconds || phase === 'done') return undefined;
    const timer = setInterval(() => setTimeLeft(t => { if (t <= 1) { setPhase('done'); return 0; } return t - 1; }), 1000);
    return () => clearInterval(timer);
  }, [timedSeconds, phase, run]);
  const submit = correct => {
    if (phase !== 'answer') return;
    setLast(correct); setResults(r => [...r, correct]); setPhase('feedback');
    attempt({ module, kind: q.type, prompt: q.prompt, correct });
  };
  const next = () => { if (idx < questions.length - 1) { setIdx(i => i + 1); setPhase('answer'); setLast(null); } else setPhase('done'); };
  const retry = () => { setIdx(0); setPhase('answer'); setResults([]); setLast(null); setTimeLeft(timedSeconds); setRun(r => r + 1); };
  if (phase === 'done') {
    const total = results.length || questions.length;
    return <section className="surface p-8 text-center">
      <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-sage-100 text-sage-700 dark:bg-sage-900/40 dark:text-sage-200"><Trophy size={36} strokeWidth={1.5} /></div>
      <h2 className="text-2xl font-extrabold">{score === total ? 'Flawless. Well done.' : score > total / 2 ? 'Strong practice.' : 'Every attempt counts.'}</h2>
      <p className="muted mt-3 text-sm">{score} of {total} correct · +{score * 2} XP<br />Mistakes are part of the path — retry any time.</p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row"><Button variant="secondary" onClick={retry}><RotateCcw size={16} />Practice again</Button><Button onClick={() => onFinish?.({ score, total })}>Continue<ArrowRight size={16} /></Button></div>
    </section>;
  }
  const correctText = q.type === 'tf' ? (q.answer ? 'True' : 'False') : q.type === 'fill' ? `ب${q.answer}` : q.type === 'order' ? q.target : q.type === 'match' ? 'All pairs matched.' : q.options?.[q.answer];
  return <section className="surface p-6" key={`${run}-${idx}`}>
    <div className="mb-5 flex items-center justify-between gap-3">
      <Badge tone="gold">{title || 'Practice'}</Badge>
      <div className="flex items-center gap-3">{timedSeconds > 0 && <span className={`flex items-center gap-1 text-xs font-extrabold ${timeLeft < 10 ? 'text-clay-600' : 'muted'}`}><Timer size={13} />{timeLeft}s</span>}<span className="muted text-xs font-bold">{idx + 1} / {questions.length}</span></div>
    </div>
    <div className="mb-6 h-1.5 overflow-hidden rounded-full soft"><div className="h-full rounded-full bg-gold-400 transition-all" style={{ width: `${(idx + (phase === 'feedback' ? 1 : 0)) / questions.length * 100}%` }} /></div>
    <h2 className="mb-6 text-lg font-extrabold leading-relaxed">{q.prompt}</h2>
    {q.type === 'match' ? <MatchQuestion q={q} phase={phase} onSubmit={submit} /> : q.type === 'order' ? <OrderQuestion q={q} phase={phase} onSubmit={submit} /> : q.type === 'fill' ? <FillQuestion q={q} phase={phase} onSubmit={submit} /> : q.type === 'flash' ? <FlashQuestion q={q} phase={phase} onSubmit={submit} /> : <ChoiceQuestion q={q} phase={phase} onSubmit={submit} voice={voice} />}
    {phase === 'feedback' && <div role="status" className={`mt-6 rounded-2xl p-4 text-sm leading-relaxed ${last ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200' : 'bg-gold-50 text-gold-800 dark:bg-gold-900/20 dark:text-gold-200'}`}>
      <p className="mb-1 font-extrabold">{last ? PRAISE[idx % PRAISE.length] : ENCOURAGE[idx % ENCOURAGE.length]}</p>
      {!last && correctText && <p className="mb-1 font-bold">Correct answer: <span className={q.type === 'fill' || q.type === 'order' ? 'arabic text-lg' : ''}>{correctText}</span></p>}
      {q.explain}
      <Button className="mt-4 w-full" onClick={next}>{idx < questions.length - 1 ? 'Next' : 'See results'}<ArrowRight size={16} /></Button>
    </div>}
  </section>;
}