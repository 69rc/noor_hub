import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Clock3, Droplets, Moon, Smartphone, X } from 'lucide-react';
import { Modal, Button } from '../ui';
import { useTahajjud } from '../../lib/tahajjud-context';
import { usePreferences } from '../../lib/preferences';
import { useToast } from '../../lib/toast';
import { formatTime } from '../../lib/prayer';
import { WUDU_STEPS } from '../../data/tahajjud';

const detectIOS = () => typeof navigator !== 'undefined' && (/iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
const detectStandalone = () => typeof window !== 'undefined' && (window.matchMedia('(display-mode: standalone)').matches || Boolean(window.navigator.standalone));

// App-wide tahajjud prompt. Appears the moment the last third of the night begins (while the app
// is open), guides the user to make wudu, and records the night with one tap. Fully local.
export function TahajjudPrompt() {
  const { promptVisible, previewing, displayWindow, goal, markPrayed, snoozePrompt, dismissPrompt, closePreview, removeRecord } = useTahajjud();
  const { preferences } = usePreferences();
  const notify = useToast();
  const navigate = useNavigate();
  const [device, setDevice] = useState({ ios: false, standalone: true });
  useEffect(() => { setDevice({ ios: detectIOS(), standalone: detectStandalone() }); }, [promptVisible]);

  if (!promptVisible) return null;
  const tz = preferences.location.timezone;
  const start = displayWindow?.start;
  const end = displayWindow?.end;

  const handleClose = () => { if (previewing) { closePreview(); return; } snoozePrompt(10); notify('Snoozed. We’ll gently remind you in 10 minutes.'); };
  const handlePray = () => {
    const record = markPrayed(goal.rakahs || 2);
    if (!previewing) navigate('/worship?tab=tahajjud');
    else closePreview();
    notify(`Tahajjud recorded — ${record.rakahs} rak‘ahs. May it bring you peace.`, { label: 'Undo', onClick: () => removeRecord(record.id) });
  };
  const handleSnooze = () => { snoozePrompt(15); notify('We’ll remind you again in 15 minutes.'); };
  const handleDismiss = () => { dismissPrompt(); notify('Dismissed for tonight. Rest well — there is no blame.'); };

  return (
    <Modal open onClose={handleClose} title="Tahajjud time">
      <div className="pb-[env(safe-area-inset-bottom)]">
        <div className="relative overflow-hidden rounded-3xl bg-[#20394a] p-5 text-white">
          <div className="geometric absolute inset-0 opacity-25" aria-hidden="true" />
          <div className="relative flex items-start gap-4">
            <span className="rounded-2xl bg-white/10 p-3"><Moon size={24} className="text-gold-300" /></span>
            <div>
              <p className="text-lg font-extrabold leading-snug">The last third of the night has begun.</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-200">A quiet moment awaits. Begin with wudu, then stand in prayer.</p>
              {start && <p className="mt-3 text-xs font-bold text-slate-200">{formatTime(start, tz)} – {formatTime(end, tz)} · {preferences.location.label}</p>}
            </div>
          </div>
        </div>

        <div className="soft mt-5 rounded-2xl p-4">
          <p className="flex items-center gap-2 text-xs font-extrabold"><Droplets size={15} className="text-emerald-600 dark:text-sage-300" />First, make wudu</p>
          <ol className="mt-3 space-y-1.5">
            {WUDU_STEPS.map((step, index) => (
              <li key={index} className="flex gap-2 text-[11px] leading-relaxed text-[var(--text)]"><span className="muted font-bold">{index + 1}.</span><span>{step}</span></li>
            ))}
          </ol>
        </div>

        {previewing && <p className="muted mt-4 rounded-xl bg-gold-50 p-3 text-[11px] font-bold text-gold-800 dark:bg-gold-900/30 dark:text-gold-200">Preview — this is how tonight’s prompt will look when the last third begins.</p>}

        <Button className="mt-5 w-full min-h-14 text-base" onClick={handlePray}><Check size={20} />I’ve prayed — record tonight</Button>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Button variant="secondary" className="min-h-12" onClick={handleSnooze}><Clock3 size={16} />Remind me in 15 min</Button>
          <Button variant="secondary" className="min-h-12" onClick={handleDismiss}><X size={16} />Not tonight</Button>
        </div>

        {device.ios && !device.standalone && (
          <p className="muted mt-4 flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-[11px] leading-relaxed dark:bg-night-soft">
            <Smartphone size={15} className="mt-0.5 shrink-0 text-emerald-600 dark:text-sage-300" />
            <span><strong className="font-extrabold">On iPhone:</strong> tap Share, then “Add to Home Screen” so this can reach you at night. It always appears while Noor Hub is open.</span>
          </p>
        )}

        <p className="muted mt-4 text-[10px] leading-relaxed">Two rak‘ahs are a complete night prayer; end with Witr. Voluntary, never obligatory — no blame on nights you rest.</p>
      </div>
    </Modal>
  );
}
