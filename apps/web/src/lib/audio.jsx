import { useCallback, useEffect, useRef, useState } from 'react';
export function useRecitation() {
  const audioRef = useRef(null);
  const queueRef = useRef([]);
  const repeatRef = useRef({ mode: 'off', remaining: 0, start: 0, end: 0 });
  const indexRef = useRef(0);
  const triedFallbackRef = useRef(new Set());
  const [state, setState] = useState({ playing: false, loading: false, title: '', surah: null, ayah: null, index: 0, total: 0, progress: 0, duration: 0, speed: 1, repeat: 'off', error: '', offlineSource: false });
  const getAudio = useCallback(() => {
    if (audioRef.current) return audioRef.current;
    const audio = new Audio(); audio.preload = 'metadata'; audioRef.current = audio;
    audio.addEventListener('timeupdate', () => setState(s => ({ ...s, progress: audio.currentTime })));
    audio.addEventListener('loadedmetadata', () => setState(s => ({ ...s, duration: audio.duration || 0 })));
    audio.addEventListener('playing', () => setState(s => ({ ...s, playing: true, loading: false, error: '' })));
    audio.addEventListener('pause', () => setState(s => ({ ...s, playing: false })));
    audio.addEventListener('waiting', () => setState(s => ({ ...s, loading: true })));
    audio.addEventListener('error', () => {
      const item = queueRef.current[indexRef.current];
      if (item?.fallbackUrl && !triedFallbackRef.current.has(indexRef.current)) {
        triedFallbackRef.current.add(indexRef.current);
        audio.src = item.fallbackUrl;
        audio.play().catch(() => {});
        return;
      }
      setState(s => ({ ...s, playing: false, loading: false, error: 'Recitation could not load. Check your connection, or download this surah to listen offline.' }));
    });
    audio.addEventListener('ended', () => {
      const repeat = repeatRef.current;
      if (repeat.mode === 'ayah' && repeat.remaining !== 0) { if (repeat.remaining > 0) repeat.remaining--; audio.currentTime = 0; audio.play().catch(() => {}); return; }
      if (repeat.mode === 'range' && repeat.remaining !== 0) { if (repeat.remaining > 0) repeat.remaining--; playItem(repeat.start); return; }
      const nextIndex = indexRef.current + 1;
      if (nextIndex < queueRef.current.length) playItem(nextIndex);
      else if (repeat.mode === 'surah' && queueRef.current.length) playItem(0);
      else setState(s => ({ ...s, playing: false, progress: 0 }));
    });
    return audio;
  }, []);
  const stateRef = useRef(state); stateRef.current = state;
  const playItem = useCallback(async index => {
    const item = queueRef.current[index]; if (!item) return;
    const audio = getAudio();
    const source = typeof item.url === 'function' ? await item.url() : item.url;
    if (queueRef.current[index] !== item) return;
    indexRef.current = index;
    audio.src = source; audio.playbackRate = stateRef.current.speed;
    setState(s => ({ ...s, title: item.title, surah: item.surah, ayah: item.ayah, index, total: queueRef.current.length, progress: 0, duration: 0, loading: true, error: '', offlineSource: source.startsWith('blob:') }));
    audio.play().catch(() => setState(s => ({ ...s, loading: false, playing: false, error: 'Playback was blocked. Tap play to try again.' })));
    if ('mediaSession' in navigator) { navigator.mediaSession.metadata = new MediaMetadata({ title: item.title, artist: item.reciter, album: 'Noor Hub · Quran' }); navigator.mediaSession.setActionHandler('play', () => audio.play()); navigator.mediaSession.setActionHandler('pause', () => audio.pause()); }
  }, [getAudio]);
  const play = useCallback((items, start = 0, repeat = 'off', range = null) => {
    queueRef.current = items;
    triedFallbackRef.current = new Set();
    repeatRef.current = { mode: repeat, remaining: repeat === 'off' ? 0 : -1, start: range?.start ?? start, end: range?.end ?? items.length - 1 };
    setState(s => ({ ...s, repeat })); playItem(start);
  }, [playItem]);
  const toggle = useCallback(() => { const audio = getAudio(); if (audio.paused) audio.play().catch(() => setState(s => ({ ...s, error: 'Tap a verse to start recitation.' }))); else audio.pause(); }, [getAudio]);
  const stop = useCallback(() => { audioRef.current?.pause(); if (audioRef.current) audioRef.current.removeAttribute('src'); queueRef.current = []; setState(s => ({ ...s, playing: false, title: '', surah: null, total: 0 })); }, []);
  const setSpeed = useCallback(speed => { if (audioRef.current) audioRef.current.playbackRate = speed; setState(s => ({ ...s, speed })); }, []);
  const seek = useCallback(progress => { if (audioRef.current && Number.isFinite(audioRef.current.duration)) audioRef.current.currentTime = progress; }, []);
  const setRepeat = useCallback((repeat, count = -1) => { repeatRef.current = { ...repeatRef.current, mode: repeat, remaining: count }; setState(s => ({ ...s, repeat })); }, []);
  const next = useCallback(() => playItem(Math.min(indexRef.current + 1, queueRef.current.length - 1)), [playItem]);
  const previous = useCallback(() => playItem(Math.max(indexRef.current - 1, 0)), [playItem]);
  useEffect(() => () => { audioRef.current?.pause(); if ('mediaSession' in navigator) { navigator.mediaSession.setActionHandler('play', null); navigator.mediaSession.setActionHandler('pause', null); } }, []);
  const element = useCallback(() => audioRef.current, []);
  return { ...state, play, toggle, stop, setSpeed, seek, setRepeat, next, previous, element };
}