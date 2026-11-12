import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowRight, Check, ChevronRight, Compass, Lock, Sparkles } from 'lucide-react';
import { useAcademy } from './store';
import { academyStats, LEVELS } from '../../../lib/learn';
import { ASSESSMENT, LESSON_CATALOG, levelFromAssessment, suggestedLevel } from '../../../data/learn/path';
import { Badge, Button, Modal, SectionHeading } from '../../../components/ui';
import ExerciseRunner from '../engine/ExerciseRunner';

const LEVEL_FOCUS = [
  { text: 'Start with shapes and sounds. No prior knowledge needed.', modules: ['alphabet'] },
  { text: 'You know some letters. Meet all 28 and learn the vowel marks.', modules: ['alphabet', 'harakat'] },
  { text: 'Letters and vowels are familiar. Join them into real words.', modules: ['harakat', 'builder'] },
  { text: 'Read short surahs with support under every word.', modules: ['builder', 'reading'] },
  { text: 'Refine how each letter is pronounced, rule by rule.', modules: ['reading', 'tajweed'] },
  { text: 'Grow the words you recognise and understand what you read.', modules: ['vocab', 'understanding'] },
  { text: 'Build a lasting memorisation and revision routine.', modules: ['hifz', 'reading'] }
];

export default function Path() {
  const { state, setProfile } = useAcademy();
  const [, setParams] = useSearchParams();
  const [assessing, setAssessing] = useState(false);
  const stats = academyStats(state);
  const suggested = suggestedLevel(stats);
  const harakatDone = LESSON_CATALOG.filter(l => l.tab === 'harakat' && state.lessons[l.id]?.status === 'completed').length;
  const finishAssessment = ({ score }) => { setProfile({ level: levelFromAssessment(score), assessmentDone: true }); setAssessing(false); };

  return (
    <div className="space-y-6">
      <section className="surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow muted mb-1">Your current level</p>
            <h2 className="text-xl font-extrabold">Level {state.profile.level} · {LEVELS[state.profile.level - 1]}</h2>
            <p className="muted mt-2 max-w-md text-xs leading-relaxed">{LEVEL_FOCUS[state.profile.level - 1].text}</p>
          </div>
          <Button onClick={() => setAssessing(true)}><Compass size={16} />{state.profile.assessmentDone ? 'Retake placement' : 'Take placement quiz'}</Button>
        </div>
        {!state.profile.assessmentDone && <p className="mt-4 rounded-xl bg-gold-50 p-3 text-[11px] leading-relaxed text-gold-800 dark:bg-gold-900/20 dark:text-gold-200">Six gentle questions place you where you’ll learn best. There’s no pass or fail — only a starting point.</p>}
        {state.profile.assessmentDone && suggested > state.profile.level && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-emerald-50 p-3 dark:bg-emerald-900/30">
            <p className="text-[11px] font-bold text-emerald-800 dark:text-emerald-200">Your practice suggests you’re ready for Level {suggested} · {LEVELS[suggested - 1]}.</p>
            <Button variant="secondary" className="!min-h-9 !text-[11px]" onClick={() => setProfile({ level: suggested })}>Move up<ArrowRight size={13} /></Button>
          </div>
        )}
      </section>

      <section>
        <SectionHeading title="The seven levels" eyebrow="One gentle ladder" />
        <ol className="space-y-3">
          {LEVELS.map((name, i) => {
            const level = i + 1;
            const reached = state.profile.level >= level;
            const current = state.profile.level === level;
            return (
              <li key={name} className={`surface flex items-center gap-4 p-4 ${current ? 'border-emerald-400 dark:border-sage-400' : ''}`}>
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${reached ? 'bg-emerald-600 text-white' : 'soft muted'}`}>{reached && !current ? <Check size={17} /> : level}</span>
                <div className="flex-1">
                  <p className="text-sm font-extrabold">{name}{current && <Badge className="ml-2">You are here</Badge>}</p>
                  <p className="muted mt-1 text-[11px] leading-relaxed">{LEVEL_FOCUS[i].text}</p>
                </div>
                {!reached && <Lock size={15} className="muted shrink-0" />}
              </li>
            );
          })}
        </ol>
      </section>

      <section className="surface p-5">
        <h2 className="section-title">All lessons</h2>
        <p className="muted mt-1 text-xs">Work through them in order, or jump to whatever calls to you. Prerequisites are suggestions, not walls.</p>
        {harakatDone < 4 && <p className="mt-3 rounded-xl bg-gold-50 p-3 text-[11px] leading-relaxed text-gold-800 dark:bg-gold-900/20 dark:text-gold-200"><Sparkles size={12} className="mr-1 inline" />Tip: finish at least four Harakat lessons before the Tajweed assessments — the vowel marks make the rules much easier to hear.</p>}
        <div className="mt-4 divide-y divide-[var(--line)]">
          {LESSON_CATALOG.map(lesson => {
            const entry = state.lessons[lesson.id];
            const done = entry?.status === 'completed';
            const started = entry?.status === 'in-progress';
            return (
              <button key={lesson.id} onClick={() => setParams({ tab: lesson.tab, lesson: lesson.id }, { replace: true })} className="group flex min-h-14 w-full items-center gap-3 py-3 text-left">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold ${done ? 'bg-emerald-600 text-white' : started ? 'bg-gold-100 text-gold-700 dark:bg-gold-900/40 dark:text-gold-200' : 'soft muted'}`}>{done ? <Check size={13} /> : started ? '…' : ''}</span>
                <div className="flex-1">
                  <p className="text-xs font-bold">{lesson.title}</p>
                  <p className="muted mt-0.5 text-[10px]">{done ? `Completed · best ${entry.bestScore}/${entry.total}` : started ? 'In progress — resume where you left off' : 'Not started'}</p>
                </div>
                <ChevronRight size={15} className="muted transition group-hover:translate-x-1" />
              </button>
            );
          })}
        </div>
      </section>

      <Modal open={assessing} onClose={() => setAssessing(false)} title="Find your starting point" wide>
        <ExerciseRunner questions={ASSESSMENT} module="path" title="Placement" voice={state.profile.voice} onFinish={finishAssessment} />
      </Modal>
    </div>
  );
}