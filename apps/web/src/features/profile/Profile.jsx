import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, Bell, BookOpen, Check, ChevronRight, Cloud, Compass, Download, ExternalLink, Eye, EyeOff, GraduationCap, Headphones, Heart, Info, KeyRound, LayoutGrid, LocateFixed, Lock, LogOut, Mail, MapPin, Monitor, Moon, Palette, RefreshCw, ShieldCheck, Smartphone, Sparkles, Sun, Target, Trash2, UserRound, Vibrate, Waves } from 'lucide-react';
import { usePreferences } from '../../lib/preferences';
import { useAuth } from '../../lib/auth';
import { useToast } from '../../lib/toast';
import { useOnline } from '../../lib/hooks';
import { COUNTRIES, METHODS, PRAYERS, PRAYER_NAMES, RECITERS, TRANSLATIONS, WIDGETS } from '../../lib/constants';
import { validateLocation } from '../../lib/prayer';
import { clearLocalData, contentKeys, removeContent } from '../../lib/offline';
import { Badge, Button, Field, IconButton, Modal, SectionHeading, Tabs, Toggle } from '../../components/ui';

const TABS = [{ value: 'account', label: 'Account' }, { value: 'preferences', label: 'Preferences' }, { value: 'notifications', label: 'Reminders' }, { value: 'privacy', label: 'Privacy' }];
const LEVELS = [{ value: 'beginner', label: 'Beginner · letters & first words' }, { value: 'intermediate', label: 'Intermediate · vocabulary & grammar' }, { value: 'advanced', label: 'Advanced · Quranic structure' }];

function downloadJSON(value, filename) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = filename; anchor.click();
  URL.revokeObjectURL(url);
}

export default function Profile() {
  const { preferences, update, dark, reset } = usePreferences();
  const { user, ready, logout, authorizedApi, sync, pending, syncError } = useAuth();
  const notify = useToast(); const online = useOnline(); const navigate = useNavigate();
  const [tab, setTab] = useState('account');
  const [authMode, setAuthMode] = useState(null);
  const [locationOpen, setLocationOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [nameDraft, setNameDraft] = useState(preferences.name);
  const [permission, setPermission] = useState(() => ('Notification' in window ? Notification.permission : 'unsupported'));
  const [busy, setBusy] = useState('');

  const exportAccount = async () => {
    setBusy('export');
    try { const data = await authorizedApi('account/export'); downloadJSON(data, 'noor-hub-account-data.json'); notify('Your account data was exported.'); }
    catch (error) { notify(error.message || 'Export is unavailable right now.'); }
    finally { setBusy(''); }
  };
  const deleteAccount = async () => {
    setBusy('delete');
    try { await authorizedApi('account', { method: 'DELETE', body: JSON.stringify({ confirmation: 'DELETE' }) }); await logout(); setConfirm(null); notify('Your account and server data were permanently deleted.'); }
    catch (error) { notify(error.message || 'Could not delete your account.'); }
    finally { setBusy(''); }
  };
  const exportDevice = () => {
    const device = {};
    for (let i = 0; i < localStorage.length; i++) { const key = localStorage.key(i); if (key && key.startsWith('sakinah.')) { try { device[key] = JSON.parse(localStorage.getItem(key)); } catch { device[key] = localStorage.getItem(key); } } }
    downloadJSON({ exportedAt: new Date().toISOString(), scope: 'this-device', device }, 'noor-hub-device-data.json');
    notify('Your device data was exported.');
  };
  const clearDownloads = async () => {
    setBusy('downloads');
    try { const keys = await contentKeys(); await Promise.all(keys.map(key => removeContent(key))); notify(`${keys.length} downloaded item${keys.length === 1 ? '' : 's'} cleared. Your worship records are untouched.`); }
    catch { notify('Could not clear downloads.'); }
    finally { setBusy(''); }
  };
  const resetDevice = async () => {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) { const key = localStorage.key(i); if (key && key.startsWith('sakinah.')) keys.push(key); }
    keys.forEach(key => localStorage.removeItem(key));
    await clearLocalData().catch(() => {});
    reset(); setNameDraft(''); setConfirm(null);
    notify('This device was reset. A fresh beginning.');
  };
  const toggleReminder = async (name, label) => {
    const enabled = !preferences.notifications[name];
    if (enabled) {
      if (!('Notification' in window)) { notify('This browser does not support notifications. Your timetable is always available.'); return; }
      const result = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
      setPermission(result);
      if (result !== 'granted') { notify('Allow notifications in your browser settings to enable reminders.'); return; }
    }
    update({ notifications: { ...preferences.notifications, [name]: enabled } });
    notify(`${label} reminder ${enabled ? 'enabled while Noor Hub is open' : 'turned off'}.`);
  };
  const enableNotifications = async () => {
    if (!('Notification' in window)) { notify('This browser does not support notifications.'); return; }
    const result = await Notification.requestPermission(); setPermission(result);
    notify(result === 'granted' ? 'Notifications allowed. Choose your reminders below.' : 'Notifications were not allowed. You can change this in browser settings.');
  };

  return <div className="page">
    <div className="mb-6 flex items-center gap-4">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-sage-100 text-2xl font-extrabold text-sage-800 dark:bg-night-soft dark:text-sage-200">{(user?.displayName || preferences.name || 'S').slice(0, 1).toUpperCase()}</div>
      <div className="min-w-0">
        <p className="eyebrow muted mb-1">Your quiet corner</p>
        <h1 className="page-title truncate">{user?.displayName || preferences.name || 'Guest'}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {user ? <Badge tone="green"><Cloud size={11} />{user.email}</Badge> : <Badge tone="sage"><Smartphone size={11} />Guest · saved on this device</Badge>}
          {user && pending > 0 && <Badge tone="gold">{pending} awaiting sync</Badge>}
        </div>
      </div>
    </div>

    <Tabs items={TABS} value={tab} onChange={setTab} className="mb-6" />

    {tab === 'account' && <div className="grid gap-5 lg:grid-cols-2">
      <section className="surface p-6">
        <SectionHeading title={user ? 'Your account' : 'Sync across devices'} eyebrow={user ? 'Signed in' : 'Optional'} />
        {user ? <>
          <p className="muted text-sm leading-relaxed">Your worship records can sync securely across devices. Guest data on this device stays available either way.</p>
          <div className="soft mt-5 space-y-3 rounded-2xl p-4 text-xs">
            <div className="flex items-center justify-between"><span className="muted">Email</span><span className="font-bold">{user.email}</span></div>
            <div className="flex items-center justify-between"><span className="muted">Connection</span><span className="font-bold">{online ? 'Online' : 'Offline · queued locally'}</span></div>
            <div className="flex items-center justify-between"><span className="muted">Pending changes</span><span className="font-bold">{pending}</span></div>
          </div>
          {syncError && <p role="alert" className="mt-4 rounded-xl bg-gold-50 p-3 text-xs leading-relaxed text-gold-800 dark:bg-gold-900/30 dark:text-gold-200">{syncError}</p>}
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Button variant="secondary" onClick={() => { sync(); notify('Syncing your latest changes…'); }} disabled={!online}><RefreshCw size={16} />Sync now</Button>
            <Button variant="secondary" onClick={exportAccount} loading={busy === 'export'}><Download size={16} />Export account data</Button>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Button variant="secondary" onClick={async () => { await logout(); notify('Signed out. Your device data is still here.'); }}><LogOut size={16} />Sign out</Button>
            <button onClick={() => setConfirm({ kind: 'delete-account' })} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-clay-300 px-5 text-sm font-bold text-clay-600 transition hover:bg-clay-100 dark:border-clay-600/40 dark:hover:bg-clay-600/15"><Trash2 size={16} />Delete account</button>
          </div>
        </> : <>
          <p className="muted text-sm leading-relaxed">No account is needed to use Noor Hub. Prayers, Quran reading, dhikr, lessons and your journal all work as a guest and stay on this device.</p>
          <ul className="mt-5 space-y-3">{['Back up and sync across devices', 'Export or delete your account data anytime', 'Keep your local guest space if you prefer'].map(item => <li key={item} className="flex items-start gap-3 text-xs leading-relaxed"><Check size={16} className="mt-0.5 shrink-0 text-emerald-600" /><span>{item}</span></li>)}</ul>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Button onClick={() => setAuthMode('register')} disabled={!ready}><UserRound size={16} />Create account</Button>
            <Button variant="secondary" onClick={() => setAuthMode('login')} disabled={!ready}><KeyRound size={16} />Sign in</Button>
          </div>
          <p className="muted mt-4 flex items-start gap-2 text-[11px] leading-relaxed"><Info size={14} className="mt-0.5 shrink-0" />Account services need a configured Noor Hub server. If unavailable, you can continue as a guest with full local features.</p>
        </>}
      </section>
      <section className="surface p-6">
        <SectionHeading title="What stays private" eyebrow="By design" />
        <div className="space-y-4">{[
          { icon: ShieldCheck, title: 'Guest-first', body: 'Basic usage never requires an account or an email address.' },
          { icon: MapPin, title: 'Your location', body: 'Coordinates stay on this device unless you choose to sync an account. Geolocation is always opt-in.' },
          { icon: Lock, title: 'No secrets in the browser', body: 'API keys live only on the server. Recitation and scripture use public, attributed sources.' },
          { icon: Bell, title: 'Permission-respecting', body: 'Reminders ask for browser permission and never pressure you. Guilt-free, always.' }
        ].map(({ icon: Icon, title, body }) => <div key={title} className="flex items-start gap-3"><span className="soft rounded-xl p-2.5 text-emerald-700 dark:text-sage-200"><Icon size={18} /></span><div><p className="text-xs font-extrabold">{title}</p><p className="muted mt-1 text-[11px] leading-relaxed">{body}</p></div></div>)}</div>
        <Link to="/profile/sources" className="btn-secondary mt-6 w-full">Content sources & privacy<ExternalLink size={15} /></Link>
      </section>
    </div>}

    {tab === 'preferences' && <div className="grid gap-5 lg:grid-cols-2">
      <section className="surface p-6">
        <SectionHeading title="Appearance" eyebrow="Make it yours" />
        <Field label="Theme">
          <div className="grid grid-cols-3 gap-2">{[{ value: 'light', label: 'Light', icon: Sun }, { value: 'dark', label: 'Dark', icon: Moon }, { value: 'system', label: 'System', icon: Monitor }].map(({ value, label, icon: Icon }) => <button key={value} onClick={() => update({ theme: value })} className={`flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-xl border text-xs font-bold transition ${preferences.theme === value ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-night-soft dark:text-sage-200' : 'line muted hover:border-emerald-300'}`}><Icon size={18} />{label}</button>)}</div>
        </Field>
        <div className="mt-5 flex items-center justify-between gap-4"><div className="flex items-center gap-3"><Vibrate size={18} className="muted" /><div><p className="text-xs font-extrabold">Haptic feedback</p><p className="muted mt-0.5 text-[11px]">Gentle vibration on tasbih taps, where supported.</p></div></div><Toggle label="Haptic feedback" checked={preferences.haptics} onChange={checked => update({ haptics: checked })} /></div>
      </section>

      <section className="surface p-6">
        <SectionHeading title="Personal" eyebrow="Your reading & learning" />
        <div className="space-y-4">
          <Field label="Name on this device"><input className="input" value={nameDraft} maxLength={40} placeholder="Your first name" autoComplete="given-name" onChange={e => setNameDraft(e.target.value)} onBlur={() => update({ name: nameDraft.trim() })} /></Field>
          <Field label="Arabic learning level"><select className="input" value={preferences.learningLevel} onChange={e => update({ learningLevel: e.target.value })}>{LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}</select></Field>
          <Field label="Quran translation"><select className="input" value={preferences.translation} onChange={e => update({ translation: e.target.value })}>{TRANSLATIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></Field>
          <Field label="Preferred reciter"><select className="input" value={preferences.reciter} onChange={e => update({ reciter: e.target.value })}>{RECITERS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}</select></Field>
        </div>
      </section>

      <section className="surface p-6">
        <SectionHeading title="Location & calculation" eyebrow="Prayer times" action={<button onClick={() => setLocationOpen(true)} className="muted text-[10px] font-bold">Edit location</button>} />
        <div className="soft flex items-center gap-3 rounded-2xl p-4"><MapPin size={18} className="shrink-0 text-emerald-600" /><div className="min-w-0"><p className="truncate text-xs font-extrabold">{preferences.location.label}</p><p className="muted mt-1 text-[10px]">{preferences.location.latitude.toFixed(3)}, {preferences.location.longitude.toFixed(3)} · {preferences.location.timezone}</p></div></div>
        <div className="mt-4 space-y-4">
          <Field label="Calculation method"><select className="input" value={preferences.method} onChange={e => update({ method: e.target.value })}>{METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}</select></Field>
          <Field label="Asr jurisprudence"><select className="input" value={preferences.asr} onChange={e => update({ asr: e.target.value })}><option value="standard">Standard · Shafi‘i, Maliki, Hanbali</option><option value="hanafi">Hanafi · later Asr</option></select></Field>
        </div>
        <Link to="/prayers" className="btn-secondary mt-5 w-full"><Compass size={16} />View timetable & Qibla</Link>
      </section>

      <section className="surface p-6">
        <SectionHeading title="Daily goals" eyebrow="At your own pace" />
        <div className="space-y-4">
          <Field label="Quran ayahs per day" hint="Used on your dashboard and journal."><div className="flex items-center gap-3"><Target size={18} className="muted" /><input className="input" type="number" min="1" max="286" value={preferences.quranGoal} onChange={e => update({ quranGoal: Math.max(1, Math.min(286, Number(e.target.value) || 1)) })} /></div></Field>
          <Field label="Dhikr target per day"><div className="flex items-center gap-3"><Waves size={18} className="muted" /><input className="input" type="number" min="1" max="100000" value={preferences.dhikrGoal} onChange={e => update({ dhikrGoal: Math.max(1, Math.min(100000, Number(e.target.value) || 1)) })} /></div></Field>
        </div>
        <p className="muted mt-4 text-[11px] leading-relaxed">Small, sustainable intentions. There is no race and no shame — every day is a fresh beginning.</p>
      </section>

      <section className="surface p-6 lg:col-span-2">
        <SectionHeading title="Dashboard companions" eyebrow="Choose what appears on Today" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{WIDGETS.map(widget => { const active = preferences.widgets.includes(widget.id); return <label key={widget.id} className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${active ? 'border-emerald-300 bg-emerald-50/60 dark:border-emerald-700 dark:bg-night-soft' : 'line soft'}`}><input type="checkbox" className="mt-0.5 h-5 w-5 accent-emerald-700" checked={active} onChange={e => update({ widgets: e.target.checked ? [...preferences.widgets, widget.id] : preferences.widgets.filter(id => id !== widget.id) })} /><div><p className="text-xs font-extrabold">{widget.label}</p><p className="muted mt-1 text-[11px] leading-relaxed">{widget.description}</p></div></label>; })}</div>
      </section>
    </div>}

    {tab === 'notifications' && <div className="grid gap-5 lg:grid-cols-2">
      <section className="surface p-6">
        <SectionHeading title="Prayer reminders" eyebrow="While Noor Hub is open" />
        <div className={`mb-5 flex items-center gap-3 rounded-2xl p-4 ${permission === 'granted' ? 'bg-emerald-50 dark:bg-night-soft' : 'bg-gold-50 dark:bg-gold-900/25'}`}>
          <Bell size={18} className={permission === 'granted' ? 'text-emerald-600' : 'text-gold-600'} />
          <div className="flex-1"><p className="text-xs font-extrabold">{permission === 'granted' ? 'Notifications allowed' : permission === 'denied' ? 'Notifications blocked' : permission === 'unsupported' ? 'Not supported here' : 'Permission not requested'}</p><p className="muted mt-0.5 text-[11px]">{permission === 'granted' ? 'Choose your reminders below.' : permission === 'denied' ? 'Enable them in your browser site settings.' : 'Allow notifications to receive gentle reminders.'}</p></div>
          {permission !== 'granted' && permission !== 'unsupported' && permission !== 'denied' && <Button variant="secondary" className="min-h-10 px-4 text-xs" onClick={enableNotifications}>Allow</Button>}
        </div>
        <div className="divide-y divide-[var(--line)]">{PRAYERS.map(name => <div key={name} className="flex min-h-14 items-center justify-between gap-4"><span className="flex items-center gap-2.5 text-sm font-bold">{name === 'fajr' || name === 'isha' ? <Moon size={15} className="muted" /> : <Sun size={15} className="muted" />}{PRAYER_NAMES[name]}</span><Toggle label={`${PRAYER_NAMES[name]} reminder`} checked={preferences.notifications[name]} onChange={() => toggleReminder(name, PRAYER_NAMES[name])} /></div>)}</div>
        <Field label="Remind me before" className="mt-5"><select className="input" value={preferences.notifications.lead} onChange={e => update({ notifications: { ...preferences.notifications, lead: Number(e.target.value) } })}>{[0, 5, 10, 15, 20, 30].map(m => <option key={m} value={m}>{m === 0 ? 'At prayer time' : `${m} minutes before`}</option>)}</select></Field>
      </section>
      <div className="space-y-5">
        <section className="surface p-6">
          <SectionHeading title="Night prayer" eyebrow="Tahajjud" />
          <div className="flex items-center justify-between gap-4"><div className="flex items-start gap-3"><Moon size={18} className="mt-0.5 muted" /><div><p className="text-xs font-extrabold">Last-third reminder</p><p className="muted mt-1 text-[11px] leading-relaxed">A gentle nudge at the start of the last third of the night, calculated for your location.</p></div></div><Toggle label="Tahajjud reminder" checked={preferences.notifications.tahajjud} onChange={() => toggleReminder('tahajjud', 'Tahajjud')} /></div>
        </section>
        <section className="rounded-3xl bg-gold-50 p-5 dark:bg-gold-900/20">
          <h3 className="flex items-center gap-2 text-sm font-bold text-gold-800 dark:text-gold-200"><Info size={17} />How reminders behave</h3>
          <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-gold-800/85 dark:text-gold-200/85">
            <li className="flex gap-2"><span>·</span>In-app reminders fire while Noor Hub is open. Browsers cannot guarantee exact alarms or delivery when the app is fully closed.</li>
            <li className="flex gap-2"><span>·</span>On iPhone, add Noor Hub to your Home Screen first. Timed Web Push requires a configured server and is part of a later phase.</li>
            <li className="flex gap-2"><span>·</span>Morning/evening adhkar, Quran and learning companions already appear on your dashboard each day.</li>
            <li className="flex gap-2"><span>·</span>Always keep your local mosque’s timetable as the reference.</li>
          </ul>
        </section>
      </div>
    </div>}

    {tab === 'privacy' && <div className="grid gap-5 lg:grid-cols-2">
      <section className="surface p-6">
        <SectionHeading title="Your data, your control" eyebrow="Export & manage" />
        <div className="space-y-3">
          <Button variant="secondary" className="w-full justify-between" onClick={exportDevice}><span className="flex items-center gap-2"><Download size={16} />Export this device’s data</span><ChevronRight size={16} /></Button>
          {user && <Button variant="secondary" className="w-full justify-between" onClick={exportAccount} loading={busy === 'export'}><span className="flex items-center gap-2"><Cloud size={16} />Export account data</span><ChevronRight size={16} /></Button>}
          <Link to="/downloads" className="btn-secondary w-full justify-between"><span className="flex items-center gap-2"><Download size={16} />Manage offline downloads</span><ChevronRight size={16} /></Link>
          <Button variant="secondary" className="w-full justify-between" onClick={clearDownloads} loading={busy === 'downloads'}><span className="flex items-center gap-2"><BookOpen size={16} />Clear downloaded content</span><ChevronRight size={16} /></Button>
          <button onClick={() => setConfirm({ kind: 'reset-device' })} className="flex min-h-12 w-full items-center justify-between rounded-xl border border-clay-300 px-5 text-sm font-bold text-clay-600 transition hover:bg-clay-100 dark:border-clay-600/40 dark:hover:bg-clay-600/15"><span className="flex items-center gap-2"><Trash2 size={16} />Reset all local data</span><ChevronRight size={16} /></button>
        </div>
        <p className="muted mt-4 text-[11px] leading-relaxed">Exports are JSON files saved to your device. Clearing downloads removes cached scripture and audio, not your worship records. Resetting erases everything on this device and cannot be undone.</p>
      </section>
      <section className="surface p-6">
        <SectionHeading title="Transparency" eyebrow="Sources & principles" />
        <div className="space-y-3">
          <Link to="/profile/sources" className="soft flex items-center justify-between gap-3 rounded-2xl p-4 transition hover:bg-emerald-50 dark:hover:bg-night-soft"><span className="flex items-center gap-3 text-xs font-extrabold"><ShieldCheck size={18} className="text-emerald-600" />Content sources & religious integrity</span><ChevronRight size={16} className="muted" /></Link>
          <button onClick={() => { update({ onboarded: false }); navigate('/welcome'); }} className="soft flex w-full items-center justify-between gap-3 rounded-2xl p-4 text-left transition hover:bg-emerald-50 dark:hover:bg-night-soft"><span className="flex items-center gap-3 text-xs font-extrabold"><Sparkles size={18} className="text-emerald-600" />Replay the welcome guide</span><ChevronRight size={16} className="muted" /></button>
          <a href="https://alquran.cloud/api" target="_blank" rel="noreferrer" className="soft flex items-center justify-between gap-3 rounded-2xl p-4 transition hover:bg-emerald-50 dark:hover:bg-night-soft"><span className="flex items-center gap-3 text-xs font-extrabold"><BookOpen size={18} className="text-emerald-600" />Quran content provider</span><ExternalLink size={15} className="muted" /></a>
        </div>
        <div className="mt-5 rounded-2xl bg-emerald-50 p-4 dark:bg-night-soft"><p className="flex items-center gap-2 text-xs font-extrabold"><Heart size={15} className="text-emerald-600" />A gentler approach</p><p className="muted mt-2 text-[11px] leading-relaxed">Noor Hub never shames or pressures. Missed prayers are recorded honestly, without guilt. Progress is yours to define, and every day begins again.</p></div>
        <p className="muted mt-5 text-center text-[10px]">Noor Hub · Phase 1 · v1.0.0</p>
      </section>
    </div>}

    {authMode && <AuthDialog mode={authMode} onClose={() => setAuthMode(null)} />}
    {locationOpen && <LocationDialog onClose={() => setLocationOpen(false)} />}
    {confirm?.kind === 'delete-account' && <ConfirmDialog title="Delete your account?" description="This permanently deletes your account and all synced server data. Your local guest data on this device is kept. This cannot be undone." confirmLabel="Delete account" danger requireText="DELETE" busy={busy === 'delete'} onClose={() => setConfirm(null)} onConfirm={deleteAccount} />}
    {confirm?.kind === 'reset-device' && <ConfirmDialog title="Reset this device?" description="This erases all local preferences, worship records, journal entries, bookmarks, downloads and queued changes on this device. Export first if you want a copy. This cannot be undone." confirmLabel="Reset everything" danger requireText="RESET" onClose={() => setConfirm(null)} onConfirm={resetDevice} />}
  </div>;
}

function AuthDialog({ mode, onClose }) {
  const { login, register } = useAuth(); const notify = useToast();
  const [form, setForm] = useState({ email: '', password: '', displayName: '' });
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [show, setShow] = useState(false);
  const submit = async event => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      if (mode === 'register') await register({ email: form.email, password: form.password, displayName: form.displayName.trim() });
      else await login({ email: form.email, password: form.password });
      notify(mode === 'register' ? 'Account created. Your space can now sync.' : 'Welcome back.');
      onClose();
    } catch (err) { setError(err.message || 'Something went wrong. Please try again.'); }
    finally { setBusy(false); }
  };
  return <Modal open onClose={onClose} title={mode === 'register' ? 'Create your account' : 'Sign in'}>
    <form onSubmit={submit} className="space-y-4">
      <p className="muted -mt-1 text-xs leading-relaxed">{mode === 'register' ? 'An account is optional. It lets you sync across devices and export or delete your data anytime.' : 'Sign in to sync your worship across devices.'}</p>
      {mode === 'register' && <Field label="Display name"><input className="input" value={form.displayName} maxLength={80} required autoComplete="name" placeholder="What should we call you?" onChange={e => setForm({ ...form, displayName: e.target.value })} /></Field>}
      <Field label="Email"><div className="relative"><Mail size={16} className="muted absolute left-4 top-4" /><input className="input pl-11" type="email" value={form.email} required maxLength={320} autoComplete="email" placeholder="you@example.com" onChange={e => setForm({ ...form, email: e.target.value })} /></div></Field>
      <Field label="Password" hint="At least 10 characters."><div className="relative"><Lock size={16} className="muted absolute left-4 top-4" /><input className="input pl-11 pr-12" type={show ? 'text' : 'password'} value={form.password} required minLength={10} maxLength={128} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} placeholder="••••••••••" onChange={e => setForm({ ...form, password: e.target.value })} /><IconButton label={show ? 'Hide password' : 'Show password'} type="button" className="absolute right-1 top-1 h-10 w-10" onClick={() => setShow(!show)}>{show ? <EyeOff size={17} /> : <Eye size={17} />}</IconButton></div></Field>
      {error && <p role="alert" className="rounded-xl bg-clay-100 p-3 text-xs leading-relaxed text-clay-700 dark:bg-clay-600/20 dark:text-clay-300">{error}</p>}
      <Button type="submit" className="w-full" loading={busy}>{mode === 'register' ? 'Create account' : 'Sign in'}</Button>
      <p className="muted text-center text-[10px] leading-relaxed">By continuing you agree to mindful, honest use. Religious content is attributed to verified sources; Noor Hub is not a Mufti.</p>
    </form>
  </Modal>;
}

function LocationDialog({ onClose }) {
  const { preferences, update } = usePreferences(); const notify = useToast();
  const [draft, setDraft] = useState(preferences); const [locating, setLocating] = useState(false); const [error, setError] = useState('');
  const set = patch => setDraft(current => ({ ...current, ...patch }));
  const setLocation = patch => setDraft(current => ({ ...current, location: { ...current.location, ...patch } }));
  const locate = () => {
    if (!navigator.geolocation) { setError('Geolocation is unavailable. Enter coordinates manually.'); return; }
    setLocating(true); setError('');
    navigator.geolocation.getCurrentPosition(position => { setLocation({ latitude: Number(position.coords.latitude.toFixed(4)), longitude: Number(position.coords.longitude.toFixed(4)), label: 'My current location', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, manual: false }); setLocating(false); }, err => { setError(err.code === 1 ? 'Permission not granted. You can enter coordinates manually.' : 'Location unavailable. Please enter coordinates manually.'); setLocating(false); }, { timeout: 12000, maximumAge: 300000 });
  };
  const save = () => {
    if (!validateLocation(draft.location.latitude, draft.location.longitude) || !draft.location.label.trim()) { setError('Enter a location name and valid coordinates.'); return; }
    try { new Intl.DateTimeFormat('en', { timeZone: draft.location.timezone }); } catch { setError('Use a valid IANA timezone, such as Europe/London.'); return; }
    update({ location: { ...draft.location, latitude: Number(draft.location.latitude), longitude: Number(draft.location.longitude) }, method: draft.method, asr: draft.asr });
    onClose(); notify('Location saved. Prayer times updated.');
  };
  return <Modal open onClose={onClose} title="Your location">
    <div className="space-y-4">
      <Field label="Country"><select className="input" value={draft.location.country} onChange={e => setLocation({ country: e.target.value })}>{COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}</select></Field>
      <Field label="Location name"><input className="input" value={draft.location.label} maxLength={120} onChange={e => setLocation({ label: e.target.value })} placeholder="City, country" /></Field>
      <Button variant="secondary" className="w-full" onClick={locate} loading={locating}><LocateFixed size={17} />Use my current location</Button>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Latitude"><input className="input" type="number" step="any" min="-90" max="90" value={draft.location.latitude} onChange={e => setLocation({ latitude: e.target.value, manual: true })} /></Field>
        <Field label="Longitude"><input className="input" type="number" step="any" min="-180" max="180" value={draft.location.longitude} onChange={e => setLocation({ longitude: e.target.value, manual: true })} /></Field>
      </div>
      <Field label="IANA timezone" hint="Prayer times display in this timezone."><input className="input" value={draft.location.timezone} onChange={e => setLocation({ timezone: e.target.value })} /></Field>
      <Field label="Calculation method"><select className="input" value={draft.method} onChange={e => set({ method: e.target.value })}>{METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}</select></Field>
      <Field label="Asr jurisprudence"><select className="input" value={draft.asr} onChange={e => set({ asr: e.target.value })}><option value="standard">Standard · Shafi‘i, Maliki, Hanbali</option><option value="hanafi">Hanafi</option></select></Field>
      {error && <p role="alert" className="text-xs text-red-600 dark:text-red-300">{error}</p>}
      <Button className="w-full" onClick={save}>Save location</Button>
      <p className="muted text-[10px] leading-relaxed">Your coordinates stay on this device unless you sync an account. Geolocation is opt-in and never required.</p>
    </div>
  </Modal>;
}

function ConfirmDialog({ title, description, confirmLabel, danger, requireText, busy, onClose, onConfirm }) {
  const [text, setText] = useState('');
  const ready = !requireText || text === requireText;
  return <Modal open onClose={onClose} title={title}>
    <div className="space-y-4">
      <div className={`flex items-start gap-3 rounded-2xl p-4 ${danger ? 'bg-clay-100 dark:bg-clay-600/20' : 'soft'}`}><AlertTriangle size={20} className={danger ? 'shrink-0 text-clay-600' : 'shrink-0 text-gold-600'} /><p className="text-xs leading-relaxed">{description}</p></div>
      {requireText && <Field label={`Type ${requireText} to confirm`}><input className="input" value={text} onChange={e => setText(e.target.value)} placeholder={requireText} autoComplete="off" /></Field>}
      <div className="grid gap-3 sm:grid-cols-2">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <button onClick={onConfirm} disabled={!ready || busy} className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold text-white transition active:scale-[.98] disabled:opacity-50 ${danger ? 'bg-clay-600 hover:bg-clay-500' : 'bg-emerald-700 hover:bg-emerald-600'}`}>{busy && <RefreshCw size={16} className="animate-spin" />}{confirmLabel}</button>
      </div>
    </div>
  </Modal>;
}