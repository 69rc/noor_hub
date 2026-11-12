import { useEffect, useRef, useState } from 'react';
import { Mic, Play, RotateCcw, Square, Volume2 } from 'lucide-react';
import { Button } from '../../../components/ui';
import { playClip } from '../../../lib/learn-audio';

export default function Recorder({ referenceUrl, label = 'this sound' }) {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [url, setUrl] = useState('');
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const ownRef = useRef(null);

  useEffect(() => () => {
    recorderRef.current?.state === 'recording' && recorderRef.current.stop();
    streamRef.current?.getTracks().forEach(t => t.stop());
    if (url) URL.revokeObjectURL(url);
  }, [url]);

  const start = async () => {
    setError('');
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') { setError('Recording is not supported in this browser. You can still listen and repeat aloud.'); return; }
    setStatus('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = e => { if (e.data.size) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        setUrl(previous => { if (previous) URL.revokeObjectURL(previous); return URL.createObjectURL(blob); });
        setStatus('recorded');
      };
      recorder.start();
      setStatus('recording');
    } catch {
      setStatus('idle');
      setError('Microphone access was denied. You can enable it in your browser settings, or simply listen and repeat aloud — no recording needed.');
    }
  };
  const stop = () => recorderRef.current?.state === 'recording' && recorderRef.current.stop();
  const replay = () => { if (!ownRef.current) ownRef.current = new Audio(); ownRef.current.src = url; ownRef.current.play().catch(() => {}); };
  const compare = () => {
    if (!referenceUrl || !url) return;
    const reference = new Audio(referenceUrl);
    reference.onended = () => setTimeout(replay, 350);
    reference.play().catch(() => replay());
  };
  const reset = () => { if (url) URL.revokeObjectURL(url); setUrl(''); setStatus('idle'); };

  return (
    <div className="rounded-2xl border border-dashed line p-4">
      <p className="mb-3 text-xs font-extrabold">Listen · Record · Compare</p>
      <div className="flex flex-wrap gap-2">
        {referenceUrl && <Button variant="secondary" className="!min-h-10 !text-xs" onClick={() => playClip(referenceUrl)}><Volume2 size={14} />Listen</Button>}
        {status !== 'recording'
          ? <Button className="!min-h-10 !text-xs" loading={status === 'requesting'} onClick={start}><Mic size={14} />{status === 'recorded' ? 'Record again' : 'Record yourself'}</Button>
          : <Button className="!min-h-10 !bg-clay-500 !text-xs" onClick={stop}><Square size={14} />Stop</Button>}
        {status === 'recorded' && <>
          <Button variant="secondary" className="!min-h-10 !text-xs" onClick={replay}><Play size={14} />Replay mine</Button>
          {referenceUrl && <Button variant="secondary" className="!min-h-10 !text-xs" onClick={compare}><Volume2 size={14} />Compare</Button>}
          <Button variant="secondary" className="!min-h-10 !text-xs" onClick={reset}><RotateCcw size={14} />Clear</Button>
        </>}
      </div>
      {status === 'recording' && <p role="status" className="mt-3 flex items-center gap-2 text-xs font-bold text-clay-600"><span className="h-2 w-2 animate-pulse rounded-full bg-clay-500" />Recording {label}… tap Stop when done.</p>}
      {error && <p role="alert" className="mt-3 text-[11px] leading-relaxed text-clay-600">{error}</p>}
      <p className="muted mt-3 text-[10px] leading-relaxed">Your recording stays on this device — nothing is uploaded. This tool doesn’t score pronunciation; listen, compare, and practise with a teacher when you can.</p>
    </div>
  );
}