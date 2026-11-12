import { lazy, Suspense, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Award, Blocks, BookA, BookOpen, GraduationCap, Languages, LayoutGrid, Lightbulb, Map, MessageCircle, PenLine } from 'lucide-react';
import { AcademyProvider } from './academy/store';
import { LoadingState } from '../../components/ui';

const Overview = lazy(() => import('./academy/Overview'));
const Path = lazy(() => import('./academy/Path'));
const Alphabet = lazy(() => import('./academy/Alphabet'));
const Harakat = lazy(() => import('./academy/Harakat'));
const Builder = lazy(() => import('./academy/Builder'));
const Tajweed = lazy(() => import('./academy/Tajweed'));
const Reading = lazy(() => import('./academy/Reading'));
const HifzTrainer = lazy(() => import('./academy/HifzTrainer'));
const Vocabulary = lazy(() => import('./academy/Vocabulary'));
const Understanding = lazy(() => import('./academy/Understanding'));
const Assistant = lazy(() => import('./academy/Assistant'));

export const ACADEMY_TABS = [
  { value: 'overview', label: 'Overview', icon: LayoutGrid, view: Overview },
  { value: 'path', label: 'My Learning Path', icon: Map, view: Path },
  { value: 'alphabet', label: 'Arabic Alphabet', icon: Languages, view: Alphabet },
  { value: 'harakat', label: 'Harakat', icon: PenLine, view: Harakat },
  { value: 'builder', label: 'Word Builder', icon: Blocks, view: Builder },
  { value: 'tajweed', label: 'Tajweed', icon: Award, view: Tajweed },
  { value: 'reading', label: 'Quran Reading', icon: BookOpen, view: Reading },
  { value: 'hifz', label: 'Hifz', icon: GraduationCap, view: HifzTrainer },
  { value: 'vocab', label: 'Vocabulary', icon: BookA, view: Vocabulary },
  { value: 'understanding', label: 'Understanding', icon: Lightbulb, view: Understanding },
  { value: 'assistant', label: 'Learning Assistant', icon: MessageCircle, view: Assistant },
];

function Shell() {
  const [params, setParams] = useSearchParams();
  const navRef = useRef(null);
  const current = ACADEMY_TABS.some(t => t.value === params.get('tab')) ? params.get('tab') : 'overview';
  const View = ACADEMY_TABS.find(t => t.value === current).view;
  useEffect(() => { navRef.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }); }, [current]);
  return (
    <div className="page">
      <div className="mb-5">
        <p className="eyebrow muted mb-2">Quran Learning Academy</p>
        <h1 className="page-title">From your first letter<br />to independent reading.</h1>
        <p className="muted mt-3 max-w-md text-sm leading-relaxed">Eight connected modules, one gentle path. Your progress saves itself — keep going at your own pace.</p>
      </div>
      <nav ref={navRef} aria-label="Academy sections" className="-mx-1 mb-6 flex gap-2 overflow-x-auto px-1 pb-2">
        {ACADEMY_TABS.map(tab => (
          <button key={tab.value} onClick={() => setParams({ tab: tab.value }, { replace: true })} aria-current={current === tab.value ? 'page' : undefined}
            className={`flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-xs font-extrabold transition ${current === tab.value ? 'bg-emerald-800 text-white shadow-soft dark:bg-emerald-700' : 'soft muted hover:text-emerald-700'}`}>
            <tab.icon size={15} strokeWidth={2.2} />{tab.label}
          </button>
        ))}
      </nav>
      <Suspense fallback={<LoadingState label="Preparing this module…" />}>
        <View />
      </Suspense>
    </div>
  );
}

export default function Learn() {
  return <AcademyProvider><Shell /></AcademyProvider>;
}
