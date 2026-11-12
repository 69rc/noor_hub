import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, Volume2 } from 'lucide-react';
import { useAcademy } from './store';
import { HARAKAT } from '../../../data/learn/harakat';
import { harfiUrl, playClip } from '../../../lib/learn-audio';
import { shuffle } from '../../../lib/learn';
import { Badge, Button, Modal } from '../../../components/ui';
import ExerciseRunner from '../engine/ExerciseRunner';
import Recorder from './Recorder';

const SOUND_OPTIONS = {
  fathah: ['a', 'i', 'u', 'an'], kasrah: ['i', 'a', 'u', 'in'], dammah: ['u', 'a', 'i', 'un'],
  sukoon: ['No vowel', 'a', 'i', 'u'], shaddah: ['Doubled letter', 'a', 'i', 'No vowel'],
  'tanween-fath': ['an', 'a', 'in', 'un'], 'tanween-kasr': ['in', 'an', 'i', 'un'], 'tanween-damm': ['un', 'an', 'u', 'in']
};
function questionsFor(h) {
  const example = h.examples[0];
  const otherWords = shuffle(HARAKAT.filter(x => x.id !== h.id)).slice(0, 2).map(x => x.examples[0]);
  const wordOptions = shuffle([example, ...otherWords]);
  const markIndex = example.ar.indexOf(h.mark);
  const soundOptions = shuffle(SOUND_OPTIONS[h.id]);
  return [
    { type: 'audio', prompt: 'Listen. Which word did you hear?', audio: example.audio, options: wordOptions.map(w => w.ar), arabicOptions: true, answer: wordOptions.indexOf(example), explain: `That was ${example.ar} (${example.tl}) — “${example.meaning}”. The ${h.name} gives the “${h.sound}” sound.` },
    { type: 'fill', prompt: `Which mark completes the word “${example.meaning}”?`, before: example.ar.slice(0, markIndex), after: example.ar.slice(markIndex + 1), options: shuffle([h.mark, ...shuffle(HARAKAT.filter(x => x.id !== h.id)).slice(0, 2).map(x => x.mark)]), answer: h.mark, explain: `${example.ar} (${example.tl}) carries a ${h.name}: ${h.explain}` },
    { type: 'mcq', prompt: `What sound does ${h.name} (${h.mark}) give?`, options: soundOptions, answer: soundOptions.indexOf(SOUND_OPTIONS[h.id][0]), explain: h.explain }
  ];
}
const listeningQuiz = () => shuffle(HARAKAT).map(h => {
  const example = h.examples[0];
  const options = shuffle([example, ...shuffle(HARAKAT.filter(x => x.id !== h.id)).slice(0, 2).map(x => x.examples[0])]);
  return { type: 'audio', prompt: 'Listen. Which word did you hear?', audio: example.audio, options: options.map(w => w.ar), arabicOptions: true, answer: options.indexOf(example), explain: `${example.ar} (${example.tl}) — “${example.meaning}”. Listen for the ${h.name} sound “${h.sound}”.` };
});

export default function Harakat() {
  const { state, completeLesson } = useAcademy();
  const [params] = useSearchParams();
  const deepId = (params.get('lesson') || '').replace(/^harakat-/, '');
  const [open, setOpen] = useState(HARAKAT.find(h => h.id === deepId) || null);
  const [practice, setPractice] = useState(null);
  const [listening, setListening] = useState(false);
  const listeningQs = useMemo(() => (listening ? listeningQuiz() : []), [listening]);
  const voice = state.profile.voice;
  const done = HARAKAT.filter(h => state.lessons[`harakat-${h.id}`]?.status === 'completed').length;
  const finish = ({ score, total }) => { completeLesson(`harakat-${open.id}`, score, total); setPractice(null); };

  return (
    <div className="space-y-6">
      <section className="surface flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <h2 className="section-title">The marks that give letters their voice</h2>
          <p className="muted mt-1 max-w-md text-xs leading-relaxed">Arabic letters are mostly consonants. These small marks — harakat — tell you which short vowel to say. {done}/8 lessons completed.</p>
        </div>
        <Button variant="secondary" onClick={() => setListening(true)}><Volume2 size={15} />Listening quiz</Button>
      </section>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {HARAKAT.map(h => {
          const completed = state.lessons[`harakat-${h.id}`]?.status === 'completed';
          return (
            <button key={h.id} onClick={() => { setOpen(h); playClip(harfiUrl(h.drill, voice)); }} className={`surface relative p-5 text-center transition hover:border-emerald-300 hover:shadow-soft ${completed ? 'border-emerald-400 dark:border-sage-400' : ''}`}>
              {completed && <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white"><Check size={11} /></span>}
              <p className="arabic mb-2 text-5xl leading-tight text-emerald-800 dark:text-sage-200" lang="ar">{'ب' + h.mark}</p>
              <p className="text-xs font-extrabold">{h.name}</p>
              <Badge tone="gold" className="mt-2">“{h.sound}”</Badge>
            </button>
          );
        })}
      </div>

      <section className="rounded-3xl bg-gold-50 p-5 dark:bg-gold-900/20">
        <h3 className="text-sm font-extrabold">How to use these lessons</h3>
        <p className="muted mt-2 text-xs leading-relaxed">Open a mark, listen to its drill and example words, then record yourself and compare. Finish with three quick exercises. Tanween is simply a doubled vowel mark at a word’s end — it adds an “n” sound.</p>
      </section>

      <p className="muted text-[11px] leading-relaxed">Word recordings: Harfi Books book 2 & 3 (readers Asmaa & ArabicKnight). Sound descriptions are approximations for beginners.</p>

      <Modal open={Boolean(open)} onClose={() => { setOpen(null); setPractice(null); }} title={open ? `${open.name} · “${open.sound}”` : ''} wide>
        {open && !practice && (
          <div className="space-y-5">
            <div className="flex items-center gap-5 rounded-3xl bg-emerald-50 p-5 dark:bg-night-soft">
              <p className="arabic text-7xl leading-none text-emerald-800 dark:text-sage-200" lang="ar">{'ب' + open.mark}</p>
              <div className="flex-1">
                <p className="text-xs leading-relaxed">{open.explain}</p>
                <Button variant="secondary" className="mt-3 !min-h-10 !text-xs" onClick={() => playClip(harfiUrl(open.drill, voice))}><Volume2 size={14} />Hear the sound</Button>
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-extrabold">Example words</p>
              <div className="space-y-2">{open.examples.map(ex => (
                <div key={ex.ar} className="soft flex items-center justify-between gap-3 rounded-xl px-4 py-3">
                  <button aria-label={`Play ${ex.tl}`} onClick={() => playClip(harfiUrl(ex.audio, voice))} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white"><Volume2 size={15} /></button>
                  <p className="arabic flex-1 text-right text-2xl text-emerald-800 dark:text-sage-200" lang="ar" dir="rtl">{ex.ar}</p>
                  <div className="w-24 text-right"><p className="text-xs font-bold">{ex.meaning}</p><p className="muted text-[10px] italic">{ex.tl}</p></div>
                </div>
              ))}</div>
            </div>
            <Recorder referenceUrl={harfiUrl(open.examples[0].audio, voice)} label={`a word with ${open.name}`} />
            <div className="flex items-center justify-between gap-3">
              {state.lessons[`harakat-${open.id}`]?.status === 'completed' ? <Badge><Check size={12} />Lesson completed</Badge> : <Badge tone="neutral">3 exercises</Badge>}
              <Button onClick={() => setPractice(questionsFor(open))}>Practise {open.name}</Button>
            </div>
          </div>
        )}
        {open && practice && <ExerciseRunner questions={practice} module="harakat" title={open.name} voice={voice} onFinish={finish} />}
      </Modal>

      <Modal open={listening} onClose={() => setListening(false)} title="Harakat listening quiz" wide>
        {listening && <ExerciseRunner questions={listeningQs} module="harakat" title="Listening" voice={voice} onFinish={() => setListening(false)} />}
      </Modal>
    </div>
  );
}