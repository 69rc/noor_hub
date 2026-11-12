import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, BookOpen, Check, Download, HardDrive, Headphones, Pause, Play, Trash2, Wifi, X } from 'lucide-react';
import { usePreferences } from '../../lib/preferences';
import { useOnline } from '../../lib/hooks';
import { useToast } from '../../lib/toast';
import { RECITERS, TRANSLATIONS } from '../../lib/constants';
import { formatBytes, storageEstimate } from '../../lib/audio-downloads';
import { QURAN_AYAH_COUNT, QURAN_SURAH_COUNT, bulkSavedBytes, bulkSavedCount, cancelBulk, getBulkState, hisnAudioCount, pauseBulk, removeBulk, resumeBulk, startBulk, subscribeBulk } from '../../lib/bulk-downloads';
import { Badge, Button, Field } from '../../components/ui';

export default function Downloads() {
  const { preferences } = usePreferences(); const online = useOnline(); const notify = useToast();
  const [bulk, setBulk] = useState(getBulkState);
  const [reciter, setReciter] = useState(preferences.reciter);
  const [translation, setTranslation] = useState(preferences.translation);
  const [estimate, setEstimate] = useState(null);
  const [saved, setSaved] = useState({});
  const [starting, setStarting] = useState(false);
  const [armRemove, setArmRemove] = useState(null);

  useEffect(() => subscribeBulk(setBulk), []);
  const refresh = useCallback(() => {
    setSaved({
      'quran-audio': { count: bulkSavedCount('quran-audio', { reciter }), bytes: bulkSavedBytes('quran-audio') },
      'quran-text': { count: bulkSavedCount('quran-text'), bytes: 0 },
      'hisn-audio': { count: bulkSavedCount('hisn-audio'), bytes: bulkSavedBytes('hisn-audio') }
    });
    storageEstimate().then(setEstimate);
  }, [reciter]);
  useEffect(() => { refresh(); }, [refresh, bulk.status, bulk.done]);

  const active = bulk.status === 'running' || bulk.status === 'paused';
  const activeType = bulk.job?.type;
  const optsFor = type => type === 'quran-audio' ? { reciter } : type === 'quran-text' ? { translation } : {};

  const start = async type => {
    setStarting(true); setArmRemove(null);
    try {
      const ok = await startBulk(type, optsFor(type));
      notify(ok ? 'Download started. Keep Noor Hub open while it saves.' : 'Another download is already in progress.');
    } catch (error) { notify(error.message || 'The download could not start. Check your connection.'); }
    finally { setStarting(false); }
  };
  const remove = async type => {
    if (armRemove !== type) { setArmRemove(type); return; }
    setArmRemove(null);
    try { await removeBulk(type, optsFor(type)); refresh(); notify('Removed from this device.'); }
    catch { notify('Could not remove the saved files. Try again.'); }
  };

  const cards = [
    { type: 'quran-audio', icon: Headphones, title: 'Full Quran recitation', desc: `Every ayah of all ${QURAN_SURAH_COUNT} surahs (${QURAN_AYAH_COUNT.toLocaleString()} files) in your chosen voice, for listening with no internet.`, meta: `${QURAN_AYAH_COUNT.toLocaleString()} ayahs · per reciter` },
    { type: 'quran-text', icon: BookOpen, title: 'Full Quran text', desc: `All ${QURAN_SURAH_COUNT} surahs with your chosen translation, for reading offline in the reader.`, meta: `${QURAN_SURAH_COUNT} surahs · per translation` },
    { type: 'hisn-audio', icon: Download, title: 'Hisn al-Muslim audio', desc: `All ${hisnAudioCount()} supplication and chapter recordings from the complete Fortress of the Muslim.`, meta: `${hisnAudioCount()} recordings` }
  ];

  return <div className="page">
    <div className="mb-6 flex items-center justify-between">
      <div><p className="eyebrow muted mb-2">Offline library</p><h1 className="page-title">Downloads</h1><p className="muted mt-2 text-xs">Save once, then read and listen with no internet.</p></div>
      <Link to="/quran" className="icon-button surface" aria-label="Back to Quran"><ArrowLeft size={20} /></Link>
    </div>

    <section className="surface mb-5 p-5">
      <div className="flex items-center justify-between text-xs"><span className="flex items-center gap-2 font-extrabold"><HardDrive size={16} className="text-emerald-600" />On this device</span><span className="font-bold">{formatBytes((saved['quran-audio']?.bytes || 0) + (saved['hisn-audio']?.bytes || 0))} audio</span></div>
      {estimate && <div className="muted mt-3 flex items-center justify-between text-[10px]"><span>Storage used by Noor Hub</span><span>{formatBytes(estimate.usage)} of {formatBytes(estimate.quota)}</span></div>}
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-emerald-100 dark:bg-night-soft"><div className="h-full rounded-full bg-emerald-600" style={{ width: estimate?.quota ? `${Math.min(100, (estimate.usage / estimate.quota) * 100)}%` : '0%' }} /></div>
    </section>

    <div className="space-y-5">
      {cards.map(card => {
        const isThis = activeType === card.type && active;
        const info = saved[card.type] || { count: 0, bytes: 0 };
        const percent = bulk.total ? Math.round((bulk.done / bulk.total) * 100) : 0;
        const Icon = card.icon;
        return <section key={card.type} className="surface p-5">
          <div className="flex items-start gap-3">
            <span className="soft rounded-xl p-2.5 text-emerald-700 dark:text-sage-200"><Icon size={19} /></span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2"><h2 className="text-sm font-extrabold">{card.title}</h2>{info.count > 0 && <Badge tone="green"><Check size={11} />{info.count} saved</Badge>}</div>
              <p className="muted mt-1.5 text-[11px] leading-relaxed">{card.desc}</p>
              <p className="muted mt-1 text-[10px] font-bold">{card.meta}{info.bytes ? ` · ${formatBytes(info.bytes)}` : ''}</p>
            </div>
          </div>

          {card.type === 'quran-audio' && <Field className="mt-4" label="Reciter"><select className="input" value={reciter} disabled={isThis} onChange={e => setReciter(e.target.value)}>{RECITERS.map(r => <option key={r.value} value={r.value}>{r.label} · {r.style}</option>)}</select></Field>}
          {card.type === 'quran-text' && <Field className="mt-4" label="Translation"><select className="input" value={translation} disabled={isThis} onChange={e => setTranslation(e.target.value)}>{TRANSLATIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></Field>}

          {isThis && <div className="mt-4">
            <div className="flex items-center justify-between text-[11px] font-bold"><span>{bulk.status === 'paused' ? 'Paused' : 'Downloading'} · {bulk.done}/{bulk.total}</span><span>{percent}%</span></div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-emerald-100 dark:bg-night-soft"><div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${percent}%` }} /></div>
            {bulk.sub && <p className="muted mt-2 text-[10px]">{bulk.sub.label} · {bulk.sub.done}/{bulk.sub.total} ayahs</p>}
            {!bulk.sub && bulk.current && <p className="muted mt-2 text-[10px]">{bulk.current}</p>}
            {bulk.bytes > 0 && <p className="muted mt-1 text-[10px]">{formatBytes(bulk.bytes)} saved so far</p>}
          </div>}

          {!isThis && bulk.job?.type === card.type && (bulk.status === 'done' || bulk.status === 'cancelled') && <p className={`mt-3 text-[11px] font-bold ${bulk.status === 'done' ? 'text-emerald-700 dark:text-sage-200' : 'muted'}`}>{bulk.status === 'done' ? `Finished · ${bulk.done}/${bulk.total}` : `Stopped · ${bulk.done}/${bulk.total}`}{bulk.failed.length ? ` · ${bulk.failed.length} skipped` : ''}</p>}
          {!isThis && bulk.job?.type === card.type && bulk.failed.length > 0 && <details className="mt-2"><summary className="muted cursor-pointer text-[10px] font-bold">Skipped items ({bulk.failed.length}) — run again to retry</summary><ul className="muted mt-2 max-h-32 space-y-1 overflow-auto text-[10px]">{bulk.failed.slice(0, 40).map(f => <li key={f}>{f}</li>)}</ul></details>}

          <div className="mt-4 flex flex-wrap gap-2">
            {isThis ? <>
              {bulk.status === 'running' ? <Button variant="secondary" onClick={pauseBulk}><Pause size={16} />Pause</Button> : <Button onClick={resumeBulk}><Play size={16} />Resume</Button>}
              <Button variant="secondary" onClick={cancelBulk}><X size={16} />Cancel</Button>
            </> : <>
              <Button loading={starting} disabled={active || !online} onClick={() => start(card.type)}><Download size={16} />{info.count > 0 ? 'Download remaining' : 'Download all'}</Button>
              {info.count > 0 && <Button variant="secondary" disabled={active} onClick={() => remove(card.type)}><Trash2 size={16} />{armRemove === card.type ? 'Tap again to confirm' : 'Remove'}</Button>}
            </>}
          </div>
          {!online && !isThis && <p className="muted mt-2 text-[10px]">You’re offline. Connect to the internet to download; saved files still work offline.</p>}
          {active && !isThis && <p className="muted mt-2 text-[10px]">Finish or cancel the current download to start this one.</p>}
        </section>;
      })}
    </div>

    <section className="mt-5 rounded-3xl bg-gold-50 p-5 dark:bg-gold-900/20">
      <h3 className="flex items-center gap-2 text-sm font-bold text-gold-800 dark:text-gold-200"><AlertTriangle size={17} />Before you download everything</h3>
      <ul className="mt-3 space-y-2 text-xs leading-relaxed text-gold-800/80 dark:text-gold-200/80">
        <li className="flex gap-2"><Wifi size={14} className="mt-0.5 shrink-0" />The full Quran recitation is a large download (hundreds of MB). Use Wi-Fi and keep Noor Hub open until it finishes.</li>
        <li className="flex gap-2"><Pause size={14} className="mt-0.5 shrink-0" />You can pause and resume any time. Already-saved files are skipped, so restarting never re-downloads them.</li>
        <li className="flex gap-2"><HardDrive size={14} className="mt-0.5 shrink-0" />Files stay on this device only and count against your browser storage. Remove them here whenever you need space.</li>
      </ul>
    </section>
  </div>;
}