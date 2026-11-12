import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, Timer, Trophy, Volume2 } from 'lucide-react';
import { useAcademy } from './store';
import { LETTERS, LETTER_GROUPS } from '../../../data/learn/letters';
import { harfiUrl, playClip } from '../../../lib/learn-audio';
import { shuffle } from '../../../lib/learn';
import { Badge, Button, Modal, ProgressRing, SectionHeading } from '../../../components/ui';
import ExerciseRunner from '../engine/ExerciseRunner';
import Recorder from './Recorder';

const distractors = (letter, n = 3) => shuffle(LETTERS.filter(l => l.id !== letter.id)).slice(0, n);
function audioQuestion(letter) {
  const options = shuffle([letter, ...distractors(letter)]);
  return { type: 'audio', prompt: 'Listen. Which letter did you hear?', audio: letter.audio, options: options.map(l => l.name), answer: options.findIndex(l => l.id === letter.id), explain: `The recording is the letter name “${letter.name}” — ${letter.ch}.` };
}
function nameQuestion(letter) {
  const options = shuffle([letter, ...distractors(letter)]);
  return { type: 'mcq', prompt: 'What is the name of this letter?', arabic: letter.ch, options: options.map(l => l.name), answer: options.findIndex(l => l.id === letter.id), explain: `${letter.ch} is ${letter.name} (${letter.tl}). ${letter.hint}` };
}
function formQuestion(letter) {
  const pool = LETTERS.filter(l => l.forms[2]);
  const target = pool.includes(letter) ? letter : shuffle(pool)[0];
  const options = shuffle([target, ...distractors(target)]);
  return { type: 'mcq', prompt: 'Which letter is this, joined at the end of a word?', arabic: target.forms[2], options: options.map(l => l.ch), arabicOptions: true, answer: options.findIndex(l => l.id === target.id), explain: `This is the final form of ${target.name} (${target.ch}). Letters change shape depending on where they sit in a word.` };
}
const groupQuestions = group => [...group.map((l, i) => (i % 2 ? nameQuestion(l) : audioQuestion(l))), { type: 'match', prompt: 'Match each letter to its name.', pairs: shuffle(group).slice(0, 4).map(l => [l.ch, l.name]) }];

export default function Alphabet() {
  const { state, setLetter, setProfile, completeLesson } = useAcademy();
  const [params] = useSearchParams();
  const deepGroup = /^letters-([1-4])$/.exec(params.get('lesson') || '');
  const [letter, setLetterOpen] = useState(null);
  const [practice, setPractice] = useState(null);
  const [groupQuiz, setGroupQuiz] = useState(deepGroup ? Number(deepGroup[1]) - 1 : null);
  const [sprint, setSprint] = useState(false);
  const [matching, setMatching] = useState(false);
  const voice = state.profile.voice;
  const mastered = Object.values(state.letters).filter(l => l.mastered).length;
  const sprintQuestions = useMemo(() => shuffle(LETTERS).slice(0, 12).map(l => nameQuestion(l)), [sprint]);
  const matchQuestions = useMemo(() => Array.from({ length: 3 }, () => ({ type: 'match', prompt: 'Match each letter to its name.', pairs: shuffle(LETTERS).slice(0, 5).map(l => [l.ch, l.name]) })), [matching]);
  const groupQs = useMemo(() => (groupQuiz !== null ? groupQuestions(LETTER_GROUPS[groupQuiz]) : []), [groupQuiz]);

  const finishLetterPractice = ({ score, total }) => { if (score >= Math.ceil(total * 0.66)) setLetter(letter.id, true); setPractice(null); };
  const finishGroup = ({ score, total }) => { completeLesson(`letters-${groupQuiz + 1}`, score, total); setGroupQuiz(null); };

  return (
    <div className="space-y-6">
      <section className="surface flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-4">
          <ProgressRing value={mastered / 28} size={62} stroke={5}><span className="text-sm font-extrabold">{mastered}<span className="muted text-[10px]">/28</span></span></ProgressRing>
          <div><h2 className="section-title">The 28 letters</h2><p className="muted mt-1 text-xs">Tap a letter to hear it, see its forms and practise it.</p></div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="soft flex rounded-full p-1" role="group" aria-label="Recording voice">
            {[['female-Asmaa', 'Voice 1'], ['male-ArabicKnight', 'Voice 2']].map(([value, label]) => (
              <button key={value} onClick={() => setProfile({ voice: value })} aria-pressed={voice === value} className={`min-h-9 rounded-full px-3 text-[11px] font-extrabold transition ${voice === value ? 'bg-emerald-700 text-white' : 'muted'}`}>{label}</button>
            ))}
          </div>
          <Button variant="secondary" className="!min-h-10 !text-xs" onClick={() => setMatching(true)}><Trophy size={14} />Matching game</Button>
          <Button variant="secondary" className="!min-h-10 !text-xs" onClick={() => setSprint(true)}><Timer size={14} />60s sprint</Button>
        </div>
      </section>

      <div className="grid grid-cols-4 gap-3 sm:grid-cols-7">
        {LETTERS.map(l => (
          <button key={l.id} onClick={() => { setLetterOpen(l); playClip(harfiUrl(l.audio, voice)); }} className={`surface relative flex flex-col items-center gap-1 p-3 transition hover:border-emerald-300 hover:shadow-soft ${state.letters[l.id]?.mastered ? 'border-emerald-400 dark:border-sage-400' : ''}`} aria-label={`${l.name}, ${state.letters[l.id]?.mastered ? 'mastered' : 'not yet mastered'}`}>
            {state.letters[l.id]?.mastered && <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-white"><Check size={10} /></span>}
            <span className="arabic text-4xl leading-none text-emerald-800 dark:text-sage-200" lang="ar">{l.ch}</span>
            <span className="muted text-[9px] font-bold">{l.name}</span>
          </button>
        ))}
      </div>

      <section>
        <SectionHeading title="Group practice" eyebrow="Four groups of seven" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {LETTER_GROUPS.map((group, i) => {
            const done = state.lessons[`letters-${i + 1}`]?.status === 'completed';
            return (
              <button key={i} onClick={() => setGroupQuiz(i)} className="surface p-5 text-left transition hover:border-emerald-300">
                <p className="arabic mb-2 text-2xl text-emerald-700 dark:text-sage-200" lang="ar" dir="rtl">{group.map(l => l.ch).join(' ')}</p>
                <p className="text-xs font-extrabold">Group {i + 1} · {group[0].name} to {group[6].name}</p>
                <p className="muted mt-1 text-[10px]">{done ? `Completed · best ${state.lessons[`letters-${i + 1}`].bestScore}/${state.lessons[`letters-${i + 1}`].total}` : '8 exercises · listening, recognition & matching'}</p>
                {done && <Badge className="mt-2"><Check size={11} />Done</Badge>}
              </button>
            );
          })}
        </div>
      </section>

      <p className="muted text-[11px] leading-relaxed">Letter recordings: Harfi Books (readers Asmaa & ArabicKnight). Articulation hints are approximations — precise pronunciation is learned with a qualified teacher.</p>

      <Modal open={Boolean(letter)} onClose={() => { setLetterOpen(null); setPractice(null); }} title={letter ? `${letter.name} · ${letter.tl}` : ''} wide>
        {letter && !practice && (
          <div className="space-y-5">
            <div className="flex items-center justify-center gap-6 rounded-3xl bg-emerald-50 p-6 dark:bg-night-soft">
              <p className="arabic text-8xl leading-none text-emerald-800 dark:text-sage-200" lang="ar">{letter.ch}</p>
              <div className="space-y-2">
                <Button onClick={() => playClip(harfiUrl(letter.audio, voice))}><Volume2 size={16} />Hear “{letter.letterName}”</Button>
                <p className="muted max-w-40 text-[11px] leading-relaxed">{letter.hint}</p>
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-extrabold">How it joins</p>
              <div className="grid grid-cols-4 gap-2 text-center">
                {[['Alone', letter.ch], ['Start', letter.forms[0]], ['Middle', letter.forms[1]], ['End', letter.forms[2]]].map(([label, form]) => (
                  <div key={label} className="soft rounded-xl p-3">
                    <p className="arabic text-3xl text-emerald-800 dark:text-sage-200" lang="ar" dir="rtl">{form || '—'}</p>
                    <p className="muted mt-1 text-[9px] font-bold">{form ? label : `${label}: no join`}</p>
                  </div>
                ))}
              </div>
              {!letter.forms[0] && <p className="muted mt-2 text-[10px]">This letter never joins to the letter after it — it always creates a small break.</p>}
            </div>
            <div>
              <p className="mb-2 text-xs font-extrabold">In real words</p>
              <div className="space-y-2">{letter.examples.map(ex => (
                <div key={ex.ar} className="soft flex items-center justify-between gap-3 rounded-xl px-4 py-3">
                  <p className="arabic text-2xl text-emerald-800 dark:text-sage-200" lang="ar" dir="rtl">{ex.ar}</p>
                  <div className="text-right"><p className="text-xs font-bold">{ex.meaning}</p><p className="muted text-[10px] italic">{ex.tl}</p></div>
                </div>
              ))}</div>
            </div>
            <Recorder referenceUrl={harfiUrl(letter.audio, voice)} label={`the letter ${letter.name}`} />
            <div className="flex items-center justify-between gap-3">
              {state.letters[letter.id]?.mastered ? <Badge><Check size={12} />Mastered</Badge> : <Badge tone="neutral">Not mastered yet</Badge>}
              <Button onClick={() => setPractice([audioQuestion(letter), nameQuestion(letter), formQuestion(letter)])}>Practise this letter</Button>
            </div>
          </div>
        )}
        {letter && practice && <ExerciseRunner questions={practice} module="alphabet" title={letter.name} voice={voice} onFinish={finishLetterPractice} />}
      </Modal>

      <Modal open={groupQuiz !== null} onClose={() => setGroupQuiz(null)} title={`Letter group ${groupQuiz !== null ? groupQuiz + 1 : ''} practice`} wide>
        {groupQuiz !== null && <ExerciseRunner questions={groupQs} module="alphabet" title={`Group ${groupQuiz + 1}`} voice={voice} onFinish={finishGroup} />}
      </Modal>

      <Modal open={matching} onClose={() => setMatching(false)} title="Letter matching" wide>
        {matching && <ExerciseRunner questions={matchQuestions} module="alphabet" title="Matching" voice={voice} onFinish={() => setMatching(false)} />}
      </Modal>

      <Modal open={sprint} onClose={() => setSprint(false)} title="60-second letter sprint" wide>
        {sprint && <ExerciseRunner questions={sprintQuestions} module="alphabet" title="Sprint" timedSeconds={60} voice={voice} onFinish={() => setSprint(false)} />}
      </Modal>
    </div>
  );
}