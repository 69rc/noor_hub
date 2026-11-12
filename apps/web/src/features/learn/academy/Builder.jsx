import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, Star, Volume2 } from 'lucide-react';
import { useAcademy } from './store';
import { BUILDER_LEVELS, SYLLABLE_DRILLS } from '../../../data/learn/builder';
import { harfiUrl, playClip } from '../../../lib/learn-audio';
import { stripMarks } from '../../../lib/learn';
import { Badge, Button, Modal, Tabs } from '../../../components/ui';
import ExerciseRunner from '../engine/ExerciseRunner';

export default function Builder() {
  const { state, setBuilder, completeLesson } = useAcademy();
  const [params] = useSearchParams();
  const deepLevel = (params.get('lesson') || '').replace(/^builder-/, '');
  const [levelId, setLevelId] = useState(BUILDER_LEVELS.some(l => l.id === deepLevel) ? deepLevel : 'beginner');
  const [building, setBuilding] = useState(null);
  const voice = state.profile.voice;
  const level = BUILDER_LEVELS.find(l => l.id === levelId);
  const builtCount = level.items.filter(item => state.builder[item.id]?.stars > 0).length;

  const finishBuild = ({ score, total }) => {
    const stars = score === total ? 3 : score > 0 ? 2 : 1;
    setBuilder(building.id, stars);
    const nextBuilt = { ...state.builder, [building.id]: { stars } };
    if (level.items.every(item => nextBuilt[item.id]?.stars > 0)) {
      const totalStars = level.items.reduce((sum, item) => sum + (nextBuilt[item.id]?.stars || 0), 0);
      completeLesson(`builder-${level.id}`, totalStars, level.items.length * 3);
    }
    setBuilding(null);
  };

  return (
    <div className="space-y-6">
      <section className="surface p-5">
        <h2 className="section-title">Syllable warm-up</h2>
        <p className="muted mt-1 text-xs leading-relaxed">One letter, three short vowels. Tap a row, listen, and say it along with the recording.</p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {SYLLABLE_DRILLS.map(drill => (
            <button key={drill.ar} onClick={() => playClip(harfiUrl(drill.audio, voice))} className="soft flex items-center justify-between gap-2 rounded-xl px-4 py-3 transition hover:bg-emerald-50 dark:hover:bg-night-soft">
              <span className="arabic text-xl text-emerald-800 dark:text-sage-200" lang="ar" dir="rtl">{drill.ar}</span>
              <span className="muted text-[10px] italic">{drill.tl}</span>
              <Volume2 size={14} className="shrink-0 text-emerald-600" />
            </button>
          ))}
        </div>
      </section>

      <Tabs value={levelId} onChange={setLevelId} items={BUILDER_LEVELS.map(l => ({ value: l.id, label: l.label }))} />
      <div role="tabpanel" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="muted text-xs">{level.note}</p>
          <Badge tone={builtCount === level.items.length ? 'green' : 'neutral'}>{builtCount}/{level.items.length} words built</Badge>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {level.items.map(item => {
            const stars = state.builder[item.id]?.stars || 0;
            return (
              <div key={item.id} className="surface p-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="arabic text-4xl text-emerald-800 dark:text-sage-200" lang="ar" dir="rtl">{item.ar}</p>
                  <button aria-label={`Play ${item.tl}`} onClick={() => playClip(harfiUrl(item.audio, voice))} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white transition hover:bg-emerald-700"><Volume2 size={17} /></button>
                </div>
                <p className="mt-2 text-sm font-extrabold">{item.meaning}</p>
                <p className="muted text-[11px] italic">{item.tl}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="flex gap-0.5" aria-label={`${stars} of 3 stars`}>{[1, 2, 3].map(n => <Star key={n} size={14} className={n <= stars ? 'fill-gold-400 text-gold-400' : 'muted'} />)}</span>
                  <Button variant="secondary" className="!min-h-9 !text-[11px]" onClick={() => setBuilding(item)}>{stars ? 'Build again' : 'Build this word'}</Button>
                </div>
              </div>
            );
          })}
        </div>
        {builtCount === level.items.length && <p className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200"><Check size={15} />Every word in this level built — lesson complete. Try the next level when you’re ready.</p>}
      </div>

      <section className="rounded-3xl bg-gold-50 p-5 dark:bg-gold-900/20">
        <h3 className="text-sm font-extrabold">How joining works</h3>
        <p className="muted mt-2 text-xs leading-relaxed">Most letters connect to the letter before them, and change shape a little. Six letters — ا د ذ ر ز و — never join forward, so they create a natural break. In the builder, tap the letters in order and watch them join.</p>
      </section>

      <p className="muted text-[11px]">Words and recordings: Harfi Books book 2 & 3 (readers Asmaa & ArabicKnight).</p>

      <Modal open={Boolean(building)} onClose={() => setBuilding(null)} title={building ? `Build: ${building.meaning}` : ''} wide>
        {building && (
          <div className="space-y-4">
            <div className="soft flex items-center justify-between rounded-xl px-4 py-3">
              <div><p className="text-xs font-bold">Target: {building.meaning}</p><p className="muted text-[10px] italic">{building.tl}</p></div>
              <Button variant="secondary" className="!min-h-9 !text-[11px]" onClick={() => playClip(harfiUrl(building.audio, voice))}><Volume2 size={13} />Hear it</Button>
            </div>
            <ExerciseRunner questions={[{ type: 'order', prompt: `Arrange the letters to write “${building.meaning}” (${building.tl}).`, pieces: stripMarks(building.ar).split(''), target: building.ar, explain: `${building.ar} joins from these letters. Read it right to left: ${building.tl}.` }]} module="builder" title={level.label} voice={voice} onFinish={finishBuild} />
          </div>
        )}
      </Modal>
    </div>
  );
}