import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Award, Blocks, BookA, BookOpen, Flame, GraduationCap, Languages, Lightbulb, Minus, PenLine, Plus, Sparkles, Target } from 'lucide-react';
import { useAcademy } from './store';
import { useAuth } from '../../../lib/auth';
import { academyStats, LEVELS, weekActivity } from '../../../lib/learn';
import { LESSON_CATALOG, MODULES, TOTAL_LESSONS, recommendNext } from '../../../data/learn/path';
import { Badge, Button, ProgressRing, SectionHeading } from '../../../components/ui';

const MODULE_ICONS = { alphabet: Languages, harakat: PenLine, builder: Blocks, tajweed: Award, reading: BookOpen, hifz: GraduationCap, vocab: BookA, understanding: Lightbulb };
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function Overview() {
  const { state, setProfile } = useAcademy();
  const { user } = useAuth();
  const [, setParams] = useSearchParams();
  const stats = academyStats(state);
  const week = weekActivity(state.activity);
  const maxXp = Math.max(state.profile.dailyGoal, ...week.map(d => d.xp), 1);
  const next = recommendNext(state);
  const goalPct = Math.min(100, Math.round(stats.todayXp / state.profile.dailyGoal * 100));
  const openLesson = lesson => setParams({ tab: lesson.tab, lesson: lesson.id }, { replace: true });

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-emerald-800 p-6 text-white">
        <div className="geometric absolute inset-0 opacity-60" />
        <div className="relative">
          <p className="eyebrow mb-1 text-sage-200">{user?.displayName ? `Welcome back, ${user.displayName}` : 'Welcome to your academy'}</p>
          <h2 className="text-xl font-extrabold leading-snug">{stats.lessonsCompleted ? 'Look how far you’ve come.' : 'Every journey starts with a letter.'}</h2>
          <div className="mt-5 flex items-center gap-5">
            <ProgressRing value={stats.lessonsCompleted / TOTAL_LESSONS} size={84} stroke={6}>
              <span className="text-lg font-extrabold">{stats.lessonsCompleted}<span className="text-xs text-emerald-200">/{TOTAL_LESSONS}</span></span>
            </ProgressRing>
            <div className="flex-1 space-y-2 text-xs">
              <p className="flex items-center gap-2 font-bold"><GraduationCap size={15} className="text-sage-200" />Level {state.profile.level} · {LEVELS[state.profile.level - 1]}</p>
              <p className="flex items-center gap-2 font-bold"><Flame size={15} className="text-gold-300" />{stats.streak} day{stats.streak === 1 ? '' : 's'} streak</p>
              <p className="flex items-center gap-2 font-bold"><Target size={15} className="text-sage-200" />{stats.todayXp} / {state.profile.dailyGoal} XP today</p>
            </div>
          </div>
          <button onClick={() => openLesson(next)} className="mt-5 flex min-h-12 w-full items-center justify-between rounded-xl bg-sage-100 px-4 text-left text-xs font-extrabold text-emerald-900 transition hover:bg-white">
            <span>{stats.lessonsCompleted ? 'Continue learning' : 'Begin your path'}: {next.title}</span><ArrowRight size={17} className="shrink-0" />
          </button>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Letters mastered', value: `${stats.lettersMastered}/28` },
          { label: 'Words learned', value: stats.wordsLearned },
          { label: 'Lessons completed', value: stats.lessonsCompleted },
          { label: 'Exercises practised', value: stats.exercises }
        ].map(item => (
          <div key={item.label} className="surface p-4 text-center">
            <p className="text-2xl font-extrabold text-emerald-700 dark:text-sage-200">{item.value}</p>
            <p className="muted mt-1 text-[10px] font-bold uppercase tracking-wide">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <section className="surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-title">Daily goal</h2>
            <Badge tone={goalPct >= 100 ? 'green' : 'gold'}>{goalPct >= 100 ? 'Goal reached' : `${goalPct}%`}</Badge>
          </div>
          <div className="mb-3 h-2.5 overflow-hidden rounded-full soft"><div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-gold-400 transition-all duration-500" style={{ width: `${goalPct}%` }} /></div>
          <p className="muted text-xs leading-relaxed">{goalPct >= 100 ? 'You met today’s goal — anything more is a bonus.' : `${Math.max(0, state.profile.dailyGoal - stats.todayXp)} XP to go. Correct answers, lessons and reviews all count.`}</p>
          <div className="mt-4 flex items-center justify-between rounded-xl soft p-3">
            <span className="text-xs font-extrabold">Target: {state.profile.dailyGoal} XP / day</span>
            <div className="flex items-center gap-2">
              <Button variant="secondary" className="!min-h-9 !px-3" aria-label="Lower daily goal" disabled={state.profile.dailyGoal <= 5} onClick={() => setProfile({ dailyGoal: Math.max(5, state.profile.dailyGoal - 5) })}><Minus size={14} /></Button>
              <Button variant="secondary" className="!min-h-9 !px-3" aria-label="Raise daily goal" disabled={state.profile.dailyGoal >= 200} onClick={() => setProfile({ dailyGoal: Math.min(200, state.profile.dailyGoal + 5) })}><Plus size={14} /></Button>
            </div>
          </div>
        </section>

        <section className="surface p-5">
          <h2 className="section-title mb-4">This week</h2>
          <div className="flex h-28 items-end justify-between gap-2" role="img" aria-label={`Weekly activity: ${week.map(d => `${d.day}: ${d.xp} XP`).join(', ')}`}>
            {week.map((d, i) => (
              <div key={d.day} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="text-[9px] font-extrabold text-emerald-700 dark:text-sage-200">{d.xp > 0 ? d.xp : ''}</span>
                <div className={`w-full max-w-8 rounded-t-lg transition-all duration-500 ${i === 6 ? 'bg-emerald-600 dark:bg-sage-300' : d.xp ? 'bg-sage-300 dark:bg-sage-700' : 'soft'}`} style={{ height: `${Math.max(6, d.xp / maxXp * 80)}px` }} />
                <span className={`text-[10px] font-bold ${i === 6 ? 'text-emerald-700 dark:text-sage-200' : 'muted'}`}>{DAY_LABELS[new Date(`${d.day}T12:00:00`).getDay()]}</span>
              </div>
            ))}
          </div>
          <p className="muted mt-3 text-[11px]">A little every day beats a lot once in a while.</p>
        </section>
      </div>

      <section className="rounded-3xl bg-gold-50 p-5 dark:bg-gold-900/20">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-white/70 p-3 text-gold-600 dark:bg-night-soft"><Sparkles size={22} /></div>
          <div className="flex-1">
            <p className="eyebrow mb-1 text-gold-700 dark:text-gold-200">Recommended next</p>
            <h2 className="text-base font-extrabold">{next.title}</h2>
            <p className="muted mt-1 text-xs leading-relaxed">{next.reason}</p>
            <Button className="mt-4" onClick={() => openLesson(next)}>Start this lesson<ArrowRight size={16} /></Button>
          </div>
        </div>
      </section>

      <section>
        <SectionHeading title="Explore the modules" eyebrow="Eight connected steps" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MODULES.map(module => {
            const Icon = MODULE_ICONS[module.id];
            const catalog = LESSON_CATALOG.filter(l => l.tab === module.tab);
            const done = catalog.filter(l => state.lessons[l.id]?.status === 'completed').length;
            return (
              <button key={module.id} onClick={() => setParams({ tab: module.tab }, { replace: true })} className="surface group p-5 text-left transition hover:border-emerald-300 hover:shadow-soft">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-sage-100 text-sage-800 transition group-hover:bg-emerald-600 group-hover:text-white dark:bg-sage-900/40 dark:text-sage-200"><Icon size={22} strokeWidth={1.8} /></div>
                <h3 className="text-sm font-extrabold">{module.title}</h3>
                <p className="muted mt-1 text-[11px] leading-relaxed">{module.blurb}</p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full soft"><div className="h-full rounded-full bg-emerald-600" style={{ width: `${catalog.length ? done / catalog.length * 100 : 0}%` }} /></div>
                <p className="muted mt-2 text-[10px] font-bold">{done}/{catalog.length} lessons</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="surface p-5">
        <h2 className="section-title">Prefer a guided course?</h2>
        <p className="muted mt-2 text-xs leading-relaxed">The original reading courses are still here — short lessons with quizzes on letters, sentence patterns and Quranic language.</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {[['The Arabic alphabet', 'recognize-alif'], ['From letters to meaning', 'nouns-and-pronouns'], ['The language of the Quran', 'quranic-vocabulary']].map(([title, id]) => (
            <Link key={id} to={`/learn/${id}`} className="soft flex min-h-12 items-center justify-between rounded-xl px-4 text-xs font-bold transition hover:bg-emerald-50 dark:hover:bg-night-soft">{title}<ArrowRight size={14} className="shrink-0" /></Link>
          ))}
        </div>
      </section>
    </div>
  );
}