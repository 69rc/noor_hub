import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, BookMarked, Compass, ExternalLink, GraduationCap, Heart, Info, Lock, MapPin, ScrollText, ShieldCheck, Sparkles, Waves, Wifi, WifiOff } from 'lucide-react';
import { Badge, SectionHeading } from '../../components/ui';

const SOURCES = [
  { id: 'quran', icon: BookOpen, title: 'Quran text, translation & audio', tone: 'green', requires: 'Internet to load · offline after download', body: 'Uthmani Arabic script, attributed English translations and transliteration are retrieved from the AlQuran Cloud API. Recitation audio streams per ayah from everyayah.com, with the Islamic Network CDN as an automatic fallback, and can be downloaded to your device for fully offline listening. Each surah view links back to its source.', links: [{ label: 'AlQuran Cloud API', url: 'https://alquran.cloud/api' }, { label: 'everyayah recitation archive', url: 'https://everyayah.com' }, { label: 'Islamic Network audio CDN', url: 'https://cdn.islamic.network/quran/audio/' }, { label: 'Sahih International translation', url: 'https://quran.com' }], note: 'Translations are human interpretations of meaning, not the Quran itself. Arabic text is presented in the Uthmani script as provided by the source.' },
  { id: 'tafsir', icon: ScrollText, title: 'Tafsir (verse commentary)', tone: 'sage', requires: 'Internet on first read · offline after saving', body: 'Per-verse commentary is quoted from UmmahAPI: Ibn Kathir (abridged, English) and Tafsir al-Muyassar (Arabic, Ministry of Islamic Affairs, Saudi Arabia). Each excerpt is shown with its named author and is saved on your device after the first load.', links: [{ label: 'UmmahAPI tafsir service', url: 'https://ummahapi.com/tafsir-api' }, { label: 'Tafsir index on Quran.com', url: 'https://quran.com/2:255/tafsirs' }], note: 'Commentary is scholarly explanation of the Quran, not the Quran itself. Abridged editions omit passages; for depth consult the full printed work or a qualified teacher. Attribution is never invented.' },
  { id: 'hadith', icon: BookMarked, title: 'Hadith collections', tone: 'sage', requires: 'Internet to load · offline after saving', body: 'Hadith are retrieved by exact collection and number from the fawazahmed0 Hadith API, a public, edition-pinned CDN. References are shown as supplied by the source.', links: [{ label: 'fawazahmed0 Hadith API', url: 'https://github.com/fawazahmed0/hadith-api' }, { label: 'Sunnah.com reference index', url: 'https://sunnah.com' }], note: 'Noor Hub never fabricates a Hadith, reference or authenticity grade. A grading is displayed only when the source supplies one; otherwise none is shown. Verify numbering against a printed or scholarly edition before acting.' },
  { id: 'prayer', icon: Compass, title: 'Prayer times, Hijri & Qibla', tone: 'gold', requires: 'Works offline · calculated on device', body: 'Prayer times are computed locally with the open-source Adhan library using your chosen method and Asr setting. The Hijri date uses the Umm al-Qura calendar via the browser Intl API. Qibla bearing is calculated from your coordinates toward the Kaaba.', links: [{ label: 'Adhan prayer calculation library', url: 'https://github.com/batoulapps/adhan-js' }, { label: 'Aladhan API (reference)', url: 'https://aladhan.com/prayer-times-api' }], note: 'Calculated times are an aid, not a substitute for your local mosque. At extreme latitudes, review times with a qualified scholar. Compass sensors vary; verify with a reliable compass.' },
  { id: 'dhikr', icon: Waves, title: 'Dhikr & Hisn al-Muslim', tone: 'green', requires: 'Bundled offline · audio online', body: 'The complete Ḥiṣn al-Muslim (Fortress of the Muslim) compiled by Saʿīd ibn ʿAlī ibn Wahf al-Qaḥṭānī is bundled in full — all 132 chapters with Arabic text, attributed hadith references, repetition counts, English translation and transliteration where verifiably matched, and recitation audio. Everyday dhikr collections include Arabic, transliteration, meaning and an authentic reference. Per-item repetition counters are tracked privately on your device each day.', links: [{ label: 'Hisn al-Muslim Arabic & references', url: 'https://github.com/asellam/HisnElMuslim' }, { label: 'English translation & audio (hisnmuslim.com)', url: 'https://www.hisnmuslim.com' }, { label: 'Sahih al-Bukhari reference', url: 'https://sunnah.com/bukhari' }], note: 'Arabic text and references are reproduced from the cited al-Qaḥṭānī edition; English and transliteration from hisnmuslim.com; chapter recitation courtesy of Islamway. Entries without a matching translation are shown in Arabic only and labelled honestly. No reference, grade or repetition count is invented. Counters are a personal aid, not a religious requirement.' },
  { id: 'academy', icon: GraduationCap, title: 'Arabic Academy & Quran Learning', tone: 'sage', requires: 'Bundled lessons · audio & word data online', body: 'The interactive academy (alphabet, harakat, word builder, tajweed, reading, hifz, vocabulary and understanding) bundles original beginner lessons and quizzes alongside the legacy Madinah-style courses. Letter, harakat and word-builder recordings come from Harfi Books; word-by-word meaning, transliteration and audio come from Quran.com; grammar links point to the Quranic Arabic Corpus. Tajweed examples play the full recorded ayah, and the understanding layers quote Ibn Kathir (abridged) via UmmahAPI.', links: [{ label: 'Harfi Books recordings', url: 'https://github.com/alaneas/harfibooks' }, { label: 'Quranic Arabic Corpus grammar', url: 'https://corpus.quran.com/wordbyword.jsp?chapter=1&verse=1' }, { label: 'Madinah Arabic books', url: 'https://madinaharabic.com' }], note: 'Tajweed rules follow standard published teaching and are never invented. Practice recordings stay on this device, are never uploaded, and are not automatically scored. Memorisation is marked only by the learner — listening alone never marks an ayah memorised. Precise pronunciation and personal rulings belong with a qualified teacher.' },
  { id: 'library', icon: BookOpen, title: 'Knowledge library', tone: 'gold', requires: 'Bundled offline · sources online', body: 'Introductory guides to Aqeedah, Tawheed, Fiqh, Seerah, the Prophets and history, each pointing to attributed scholarship and primary texts.', links: [{ label: 'SeekersGuidance courses', url: 'https://seekersguidance.org/courses/' }, { label: 'Quran.com', url: 'https://quran.com' }], note: 'These are starting points, not fatwas. Established teachings and valid scholarly disagreements are distinguished; personal rulings should be brought to a qualified local scholar.' },
  { id: 'assistant', icon: Sparkles, title: 'Learning assistant', tone: 'green', requires: 'Offline study plan · live AI needs server', body: 'Without an account, the academy assistant offers a level-appropriate offline study plan and source links instead of inventing answers. Signed-in users can reach a server-side, source-grounded learning assistant that adapts to their level and language (English or Hausa).', links: [{ label: 'Quran evidence retrieval', url: 'https://alquran.cloud/api' }], note: 'The assistant provides references for religious claims, distinguishes established rulings from scholarly differences, acknowledges uncertainty, never invents evidence, and does not present itself as a qualified Mufti. The AI key lives only on the server.' }
];

const PRIVACY = [
  { icon: Heart, title: 'Guest-first, always', body: 'Every core feature works without an account. Your prayers, reading, dhikr, lessons and journal are saved on this device.' },
  { icon: MapPin, title: 'Location is opt-in', body: 'Geolocation is requested only when you ask. Coordinates stay on your device unless you choose to sync an account. Manual entry works just as well.' },
  { icon: Lock, title: 'Recordings stay local', body: 'Pronunciation practice asks for the microphone only when you press Record. Clips stay in memory on this device, are never uploaded, and are not automatically scored.' },
  { icon: Lock, title: 'No secrets in the frontend', body: 'Private API keys and AI credentials are kept server-side in secure environment variables and never shipped to the browser.' },
  { icon: ShieldCheck, title: 'Export & deletion', body: 'Export your device data or account data as JSON anytime. Delete your account and its server data permanently from your profile.' },
  { icon: Info, title: 'Permission-respecting reminders', body: 'Notifications ask for browser permission and are never forced. In-app reminders work while open; exact alarms and closed-app push are not guaranteed and differ between iOS and Android.' }
];

const toneClass = { green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200', sage: 'bg-sage-100 text-sage-700 dark:bg-sage-900/40 dark:text-sage-200', gold: 'bg-gold-50 text-gold-600 dark:bg-gold-900/30 dark:text-gold-200' };

export default function Sources() {
  return <div className="page">
    <Link to="/profile" className="muted mb-5 inline-flex min-h-10 items-center gap-2 text-xs font-bold"><ArrowLeft size={16} />Back to your profile</Link>
    <div className="mb-8">
      <p className="eyebrow muted mb-2">Integrity & transparency</p>
      <h1 className="page-title">Sources & privacy</h1>
      <p className="muted mt-3 max-w-2xl text-sm leading-relaxed">Noor Hub is built on attributed, verifiable content. This page records where every piece of religious material comes from, what needs internet access, and how your data is handled.</p>
    </div>

    <section className="mb-8 rounded-3xl bg-emerald-800 p-6 text-white shadow-soft">
      <div className="geometric absolute inset-0 opacity-40" />
      <div className="relative">
        <Badge className="bg-white/10 text-sage-100"><ShieldCheck size={12} />Our commitment</Badge>
        <h2 className="mt-4 text-xl font-extrabold tracking-tight">Never fabricate. Always attribute.</h2>
        <ul className="mt-4 grid gap-3 text-xs leading-relaxed text-emerald-50 sm:grid-cols-2">
          {['No invented Hadith, references or authenticity grades.', 'No fake data presented as real religious content.', 'Established rulings distinguished from scholarly differences.', 'Uncertainty acknowledged; no claim to be a qualified Mufti.', 'No shame, guilt or pressure — ever.', 'Private keys secured server-side, never in the frontend.'].map(item => <li key={item} className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sage-200" />{item}</li>)}
        </ul>
      </div>
    </section>

    <SectionHeading title="Where content comes from" eyebrow="Provenance" />
    <div className="grid gap-5 lg:grid-cols-2">
      {SOURCES.map(source => <section key={source.id} className="surface overflow-hidden">
        <div className={`flex items-center gap-3 px-6 py-5 ${toneClass[source.tone]}`}><source.icon size={26} strokeWidth={1.4} /><div><h3 className="text-sm font-extrabold">{source.title}</h3><p className="mt-1 flex items-center gap-1.5 text-[10px] font-bold opacity-80">{source.requires.startsWith('Works offline') || source.requires.startsWith('Bundled') ? <WifiOff size={11} /> : <Wifi size={11} />}{source.requires}</p></div></div>
        <div className="p-6">
          <p className="muted text-xs leading-[1.8]">{source.body}</p>
          <div className="mt-4 flex flex-wrap gap-2">{source.links.map(link => <a key={link.url} href={link.url} target="_blank" rel="noreferrer" className="soft inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-[10px] font-bold text-emerald-700 transition hover:bg-emerald-100 dark:text-sage-200 dark:hover:bg-night-soft">{link.label}<ExternalLink size={11} /></a>)}</div>
          <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-gold-50 p-3.5 dark:bg-gold-900/20"><Info size={15} className="mt-0.5 shrink-0 text-gold-600" /><p className="text-[11px] leading-relaxed text-gold-800 dark:text-gold-200">{source.note}</p></div>
        </div>
      </section>)}
    </div>

    <div className="mt-10">
      <SectionHeading title="How your data is handled" eyebrow="Privacy by design" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{PRIVACY.map(({ icon: Icon, title, body }) => <div key={title} className="surface p-5"><span className="soft mb-3 inline-flex rounded-xl p-2.5 text-emerald-700 dark:text-sage-200"><Icon size={19} /></span><h3 className="text-xs font-extrabold">{title}</h3><p className="muted mt-2 text-[11px] leading-relaxed">{body}</p></div>)}</div>
    </div>

    <section className="mt-8 rounded-3xl bg-sage-100 p-6 dark:bg-sage-900/40">
      <h2 className="flex items-center gap-2 text-sm font-extrabold text-sage-900 dark:text-sage-100"><Wifi size={17} />What needs internet</h2>
      <div className="mt-4 grid gap-4 text-xs leading-relaxed text-sage-900/85 dark:text-sage-100/85 sm:grid-cols-2">
        <div><p className="font-extrabold">Available offline</p><p className="mt-1.5">Prayer calculation, Hijri date, Qibla bearing, your worship records, journal, dhikr counter, bundled lessons, and any Quran surah or Hadith you have downloaded or saved.</p></div>
        <div><p className="font-extrabold">Requires a connection</p><p className="mt-1.5">Loading new Quran surahs, translations and recitation audio, looking up new Hadith, account sign-in and sync, and the live source-grounded assistant. Downloaded content remains usable offline afterward.</p></div>
      </div>
    </section>

    <p className="muted mt-8 text-center text-[10px] leading-relaxed">Noor Hub · Phase 1 · Content retrieved from public, attributed sources.<br />For personal religious rulings, always consult a qualified scholar.</p>
  </div>;
}