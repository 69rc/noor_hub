import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ChevronRight, LoaderCircle, MessageCircle, Send, ShieldCheck, Sparkles, Trash2 } from 'lucide-react';
import { useAcademy } from './store';
import { useAuth } from '../../../lib/auth';
import { useLocalState } from '../../../lib/hooks';
import { LEVELS } from '../../../lib/learn';
import { Badge, Button, IconButton } from '../../../components/ui';

const SUGGESTIONS = [
  'How is the letter ع pronounced? Give me a simple example.',
  'Explain fathah with one Quranic word.',
  'What does رَحْمَة mean and where does it appear?',
  'Give me one practice question about sukoon.',
  'Help me plan 10 minutes of study today.'
];
const STUDY_TIPS = {
  1: ['Meet seven letters a day. Tap each one in the Alphabet tab, listen, and say it aloud.', 'Use the recorder to compare your voice with the recording — no pressure, just listening.', 'Finish one letter group quiz before moving on.'],
  2: ['Learn one harakat each day and hear it inside real words.', 'Play the syllable drills in Word Builder and repeat them aloud.', 'Hide the transliteration in Reading Practice once a word feels familiar.'],
  3: ['Build five words a day in Word Builder — tap the letters in order.', 'Read one short surah slowly in Reading Practice, tapping any word you don’t know.', 'Save three new words in Vocabulary and review them tomorrow.'],
  4: ['Read one ayah a day with the translation beside it.', 'Start the Tajweed introduction lesson — listen more than you read.', 'Keep a small Hifz range looping while you follow the text.'],
  5: ['Take one Tajweed lesson and listen to every example twice.', 'Record yourself reciting one ayah and compare with the reciter.', 'Review your due vocabulary — spacing is what makes it stay.'],
  6: ['Study one surah in Understanding, layer by layer.', 'Read the attributed tafsir after your own reading, not before.', 'Check word grammar at the Quranic Arabic Corpus when curious.'],
  7: ['Set a small daily Hifz range and repeat it honestly.', 'Mark an ayah memorised only when you can recite it without looking.', 'Clear your due revision queue first — old memorisation is precious.']
};

export default function Assistant() {
  const { state } = useAcademy();
  const { user, authorizedApi } = useAuth();
  const [messages, setMessages] = useLocalState('sakinah.academy-chat', []);
  const [conversationId, setConversationId] = useLocalState('sakinah.academy-chat-conversation', null);
  const [lang, setLang] = useState('en');
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [unavailable, setUnavailable] = useState(false);
  const bottom = useRef(null);
  const level = state.profile.level;

  const send = async text => {
    const message = (text || input).trim();
    if (!message || busy) return;
    setInput(''); setError('');
    setMessages(current => [...current, { id: crypto.randomUUID(), role: 'user', content: message }]);
    if (!user) { setUnavailable(true); return; }
    setBusy(true);
    try {
      const response = await authorizedApi('assistant/messages', { method: 'POST', body: JSON.stringify({ message, mode: 'learn', lang, level, ...(conversationId ? { conversationId } : {}) }) });
      if (response.conversationId) setConversationId(response.conversationId);
      setMessages(current => [...current, { id: crypto.randomUUID(), role: 'assistant', content: response.message.content, citations: response.citations || [], disclaimer: response.disclaimer }]);
    } catch (e) {
      if (e.status === 503 || e.status === 401) setUnavailable(true);
      else setError(e.message || 'The assistant could not respond right now.');
    } finally { setBusy(false); setTimeout(() => bottom.current?.scrollIntoView({ behavior: 'smooth' }), 60); }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <section className="surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-sage-100 p-3 text-sage-800 dark:bg-sage-900/40 dark:text-sage-200"><MessageCircle size={22} /></div>
            <div>
              <h2 className="section-title">Learning Assistant</h2>
              <p className="muted mt-0.5 text-[11px]">Coaching for Level {level} · {LEVELS[level - 1]}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="soft flex rounded-full p-1" role="group" aria-label="Answer language">
              {[['en', 'English'], ['ha', 'Hausa']].map(([value, label]) => <button key={value} onClick={() => setLang(value)} aria-pressed={lang === value} className={`min-h-9 rounded-full px-3 text-[11px] font-extrabold transition ${lang === value ? 'bg-emerald-700 text-white' : 'muted'}`}>{label}</button>)}
            </div>
            {messages.length > 0 && <IconButton label="Clear conversation" className="surface" onClick={() => { setMessages([]); setConversationId(null); }}><Trash2 size={16} /></IconButton>}
          </div>
        </div>
        <div className="mt-4 flex items-start gap-3 rounded-2xl bg-gold-50 p-4 dark:bg-gold-900/20">
          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-gold-600" />
          <p className="text-[11px] leading-relaxed text-gold-800 dark:text-gold-200">Educational coaching, not a fatwa. The assistant cites verified sources, says when it is unsure, and refers personal rulings to qualified scholars. It never invents Quran, Hadith or grades.</p>
        </div>
      </section>

      {messages.length === 0 && !unavailable && (
        <section className="surface p-6">
          <Sparkles size={24} className="mb-3 text-gold-600" />
          <h3 className="text-lg font-extrabold">Ask about letters, words, or your next step</h3>
          <p className="muted mt-1 text-xs leading-relaxed">Answers adapt to your level and end with a small practice question. {lang === 'ha' ? 'Zai iya bayani a cikin Hausa mai sauƙi.' : 'Hausa explanations are one tap away.'}</p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">{SUGGESTIONS.map(s => <button key={s} onClick={() => send(s)} className="soft flex min-h-14 items-center justify-between gap-3 rounded-2xl p-4 text-left text-xs font-bold leading-relaxed transition hover:bg-emerald-50 dark:hover:bg-night-soft">{s}<ArrowUpRight size={15} className="shrink-0 text-emerald-600" /></button>)}</div>
        </section>
      )}

      {messages.length > 0 && (
        <div className="space-y-4">
          {messages.map(m => (
            <article key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[92%] rounded-3xl p-5 ${m.role === 'user' ? 'rounded-br-lg bg-emerald-700 text-white' : 'surface rounded-bl-lg'}`}>
                <p className={`mb-2 text-[9px] font-extrabold uppercase tracking-wider ${m.role === 'user' ? 'text-emerald-100' : 'muted'}`}>{m.role === 'user' ? 'You' : 'Learning assistant'}</p>
                <p className="whitespace-pre-wrap text-sm leading-[1.9]">{m.content}</p>
                {m.citations?.length > 0 && <div className="mt-3 border-t line pt-3"><p className="eyebrow muted mb-1">Retrieved evidence</p>{m.citations.map(c => <p key={c.locator + c.edition} className="muted text-[10px] leading-relaxed">{c.locator} · {c.edition}</p>)}</div>}
                {m.role === 'assistant' && !m.citations?.length && <p className="mt-3 text-[10px] text-gold-600">No retrieved evidence attached — verify any religious claim independently.</p>}
              </div>
            </article>
          ))}
          {busy && <div className="surface flex w-fit items-center gap-3 p-4 text-xs muted"><LoaderCircle size={16} className="animate-spin" />Thinking with your sources…</div>}
          <div ref={bottom} />
        </div>
      )}

      {unavailable && (
        <section className="surface p-6" role="status">
          <Badge tone="gold" className="mb-3">Offline study mode</Badge>
          <h3 className="text-base font-extrabold">{user ? 'The live assistant isn’t connected on this server yet.' : 'Sign in to chat with the live assistant.'}</h3>
          <p className="muted mt-2 text-xs leading-relaxed">{user ? 'The server’s AI service is not configured, so no live answers are generated. Meanwhile, here is a study plan for your level — and the modules below work fully offline.' : 'Basic learning never requires an account. The tips below and every module work without signing in; an account adds the source-grounded conversation.'}</p>
          <ul className="mt-4 space-y-2">{(STUDY_TIPS[level] || STUDY_TIPS[1]).map(tip => <li key={tip} className="soft flex items-start gap-2 rounded-xl p-3 text-xs leading-relaxed"><ChevronRight size={14} className="mt-0.5 shrink-0 text-emerald-600" />{tip}</li>)}</ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/learn?tab=alphabet" className="soft min-h-10 rounded-full px-4 text-xs font-bold leading-10">Alphabet</Link>
            <Link to="/learn?tab=path" className="soft min-h-10 rounded-full px-4 text-xs font-bold leading-10">My path</Link>
            {!user && <Link to="/profile" className="min-h-10 rounded-full bg-emerald-700 px-4 text-xs font-bold leading-10 text-white">Sign in</Link>}
          </div>
        </section>
      )}

      {error && <p role="alert" className="rounded-xl bg-clay-100 p-4 text-xs leading-relaxed text-clay-600">{error}</p>}

      <form onSubmit={e => { e.preventDefault(); send(); }} className="surface flex items-end gap-2 p-3">
        <textarea aria-label="Your learning question" rows={1} maxLength={2000} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder={lang === 'ha' ? 'Yi tambaya game na haruffa, kalmomi, ko karatu…' : 'Ask about a letter, a word, or your learning plan…'} className="max-h-40 min-h-12 flex-1 resize-none bg-transparent px-2 py-3 text-sm outline-none" />
        <Button type="submit" loading={busy} disabled={!input.trim()} aria-label="Send question" className="h-12 w-12 px-0"><Send size={17} /></Button>
      </form>
      <p className="muted text-center text-[10px]">References, not invented evidence. Uncertainty, not overconfidence. Scholarship, not shortcuts.</p>
    </div>
  );
}