import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, Clock3, Volume2 } from 'lucide-react';
import { useAcademy } from './store';
import { TAJWEED_LESSONS } from '../../../data/learn/tajweed';
import { LESSON_CATALOG } from '../../../data/learn/path';
import { usePreferences } from '../../../lib/preferences';
import { reciterById } from '../../../lib/constants';
import { streamUrl } from '../../../lib/audio-sources';
import { playClip } from '../../../lib/learn-audio';
import { Badge, Button, Modal } from '../../../components/ui';
import ExerciseRunner from '../engine/ExerciseRunner';

export default function Tajweed() {
  const { state, completeLesson } = useAcademy();
  const { preferences } = usePreferences();
  const [params] = useSearchParams();
  const deepId = (params.get('lesson') || '').replace(/^tajweed-/, '');
  const [open, setOpen] = useState(TAJWEED_LESSONS.find(t => t.id === deepId) || null);
  const [quizzing, setQuizzing] = useState(false);
  const reciter = reciterById(preferences.reciter);
  const harakatDone = LESSON_CATALOG.filter(l => l.tab === 'harakat' && state.lessons[l.id]?.status === 'completed').length;
  const finish = ({ score, total }) => { completeLesson(`tajweed-${open.id}`, score, total); setQuizzing(false); };
  const playExample = ref => { const m = /Quran (\d+):(\d+)/.exec(ref); if (m) playClip(streamUrl(reciter.value, Number(m[1]), Number(m[2]))); };

  return (
    <div className="space-y-6">
      <section className="surface p-5">
        <h2 className="section-title">The rules of beautiful recitation</h2>
        <p className="muted mt-2 max-w-lg text-xs leading-relaxed">Eight lessons in the order they are usually taught. Each one explains the rule, shows verified Quranic examples you can hear, and ends with a short assessment. Tajweed is received orally — these lessons introduce; a teacher perfects.</p>
        {harakatDone < 4 && <p className="mt-3 rounded-xl bg-gold-50 p-3 text-[11px] leading-relaxed text-gold-800 dark:bg-gold-900/20 dark:text-gold-200">A gentle suggestion: complete at least four Harakat lessons first. Hearing the vowel marks makes these rules much clearer.</p>}
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        {TAJWEED_LESSONS.map((lesson, i) => {
          const entry = state.lessons[`tajweed-${lesson.id}`];
          const done = entry?.status === 'completed';
          return (
            <button key={lesson.id} onClick={() => setOpen(lesson)} className={`surface p-5 text-left transition hover:border-emerald-300 hover:shadow-soft ${done ? 'border-emerald-400 dark:border-sage-400' : ''}`}>
              <div className="flex items-center justify-between gap-3">
                <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-extrabold ${done ? 'bg-emerald-600 text-white' : 'soft muted'}`}>{done ? <Check size={15} /> : i + 1}</span>
                <span className="muted flex items-center gap-1 text-[10px] font-bold"><Clock3 size={11} />{lesson.minutes} min</span>
              </div>
              <h3 className="mt-3 text-sm font-extrabold">{lesson.title}</h3>
              <p className="muted mt-1 line-clamp-2 text-[11px] leading-relaxed">{lesson.intro[0]}</p>
              {done && <Badge className="mt-3"><Check size={11} />Assessed · {entry.bestScore}/{entry.total}</Badge>}
            </button>
          );
        })}
      </div>

      <p className="muted text-[11px] leading-relaxed">Rule summaries follow standard beginner tajweed teaching (as in classical primers such as al-Jazari’s Muqaddimah). Examples are quoted from the Uthmani text with exact references; audio plays the full ayah from everyayah.com ({reciter.label}).</p>

      <Modal open={Boolean(open)} onClose={() => { setOpen(null); setQuizzing(false); }} title={open?.title || ''} wide>
        {open && !quizzing && (
          <div className="space-y-5">
            {open.intro.map(paragraph => <p key={paragraph.slice(0, 24)} className="text-sm leading-[1.9]">{paragraph}</p>)}
            <div className="space-y-3">{open.points.map(point => (
              <div key={point.title} className="soft rounded-2xl p-4">
                <p className="text-xs font-extrabold text-emerald-700 dark:text-sage-200">{point.title}</p>
                <p className="muted mt-1 text-xs leading-relaxed">{point.text}</p>
              </div>
            ))}</div>
            <div>
              <p className="mb-2 text-xs font-extrabold">Verified examples — listen to the full ayah</p>
              <div className="space-y-2">{open.examples.map(ex => (
                <div key={ex.ref + ex.ar} className="rounded-2xl border line p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="arabic flex-1 text-right text-2xl leading-loose text-emerald-800 dark:text-sage-200" lang="ar" dir="rtl">{ex.ar}</p>
                    <button aria-label={`Play ${ex.ref}`} onClick={() => playExample(ex.ref)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white"><Volume2 size={16} /></button>
                  </div>
                  <p className="mt-2 text-[11px] font-extrabold text-gold-700 dark:text-gold-200">{ex.ref}</p>
                  <p className="muted mt-1 text-[11px] leading-relaxed">{ex.note}</p>
                </div>
              ))}</div>
            </div>
            <div className="flex items-center justify-between gap-3">
              {state.lessons[`tajweed-${open.id}`]?.status === 'completed' ? <Badge><Check size={12} />Completed</Badge> : <Badge tone="neutral">{open.quiz.length} assessment questions</Badge>}
              <Button onClick={() => setQuizzing(true)}>Take the assessment</Button>
            </div>
          </div>
        )}
        {open && quizzing && <ExerciseRunner questions={open.quiz} module="tajweed" title={open.title} voice={state.profile.voice} onFinish={finish} />}
      </Modal>
    </div>
  );
}