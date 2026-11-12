import { beforeEach, describe, it, expect, vi } from 'vitest';

vi.mock('../src/lib/offline.js', () => {
  const store = new Map();
  return {
    __store: store,
    getAudio: async key => store.get(key),
    saveAudio: async (key, value) => { store.set(key, value); },
    removeAudio: async key => { store.delete(key); },
    getContent: async () => undefined,
    removeContent: async () => {}
  };
});

import { __store } from '../src/lib/offline.js';
import { createJobRunner, hisnAudioCount, bulkSavedCount } from '../src/lib/bulk-downloads.js';
import { hisnAudioSaved, hisnKey, loadHisnAudioIndex, removeAllHisnAudio, resolveHisnUrl, saveHisnAudio, totalHisnBytes } from '../src/lib/audio-downloads.js';

const state = runner => runner.getState();
const controlled = n => {
  const gates = [];
  const units = Array.from({ length: n }, (_, i) => ({ label: `u${i}`, run: () => new Promise(res => { gates[i] = res; }) }));
  return { units, gates };
};

describe('createJobRunner', () => {
  it('runs every unit and finishes', async () => {
    const runner = createJobRunner({ concurrency: 2 });
    const ran = [];
    runner.start(Array.from({ length: 5 }, (_, i) => ({ label: `u${i}`, run: async () => { ran.push(i); } })));
    await vi.waitFor(() => expect(state(runner).status).toBe('done'));
    expect(ran.sort()).toEqual([0, 1, 2, 3, 4]);
    expect(state(runner).done).toBe(5);
    expect(state(runner).total).toBe(5);
  });

  it('collects failures and keeps going', async () => {
    const runner = createJobRunner({ concurrency: 1 });
    runner.start([
      { label: 'ok1', run: async () => {} },
      { label: 'bad', run: async () => { throw new Error('nope'); } },
      { label: 'ok2', run: async () => {} }
    ]);
    await vi.waitFor(() => expect(state(runner).status).toBe('done'));
    expect(state(runner).failed).toEqual(['bad']);
    expect(state(runner).done).toBe(3);
  });

  it('pauses and resumes without re-running finished units', async () => {
    const runner = createJobRunner({ concurrency: 2 });
    const { units, gates } = controlled(4);
    const ran = [];
    units.forEach((u, i) => { const orig = u.run; u.run = () => { ran.push(i); return orig(); }; });
    runner.start(units);
    await vi.waitFor(() => expect(state(runner).current).toBeTruthy());
    gates[0](); gates[1]();
    await vi.waitFor(() => expect(state(runner).done).toBe(2));
    runner.pause();
    expect(state(runner).status).toBe('paused');
    gates[2](); gates[3]();
    await vi.waitFor(() => expect(state(runner).done).toBe(4));
    expect(state(runner).status).toBe('paused');
    runner.resume();
    await vi.waitFor(() => expect(state(runner).status).toBe('done'));
    expect(ran.sort()).toEqual([0, 1, 2, 3]);
  });

  it('cancels and keeps saved progress', async () => {
    const runner = createJobRunner({ concurrency: 1 });
    const { units, gates } = controlled(3);
    runner.start(units);
    await vi.waitFor(() => expect(state(runner).current).toBeTruthy());
    gates[0]();
    await vi.waitFor(() => expect(state(runner).done).toBe(1));
    runner.cancel();
    gates[1]();
    await vi.waitFor(() => expect(state(runner).done).toBe(2));
    expect(state(runner).status).toBe('cancelled');
    expect(state(runner).done).toBeLessThan(state(runner).total);
  });

  it('refuses to start a second job while one is active', async () => {
    const runner = createJobRunner({ concurrency: 1 });
    const { units, gates } = controlled(2);
    expect(runner.start(units)).toBe(true);
    expect(runner.start([{ label: 'x', run: async () => {} }])).toBe(false);
    runner.cancel(); gates[0]();
  });

  it('reports measured bytes as units finish', async () => {
    let bytes = 0;
    const runner = createJobRunner({ concurrency: 1, measureBytes: () => bytes });
    runner.start([{ label: 'a', run: async () => { bytes = 10; } }, { label: 'b', run: async () => { bytes = 25; } }]);
    await vi.waitFor(() => expect(state(runner).status).toBe('done'));
    expect(state(runner).bytes).toBe(25);
  });
});

describe('hisn offline audio', () => {
  beforeEach(() => { localStorage.clear(); __store.clear(); vi.restoreAllMocks(); });

  it('counts every chapter and supplication recording', () => {
    expect(hisnAudioCount()).toBe(399);
  });

  it('saves a recording once and skips it afterwards', async () => {
    global.fetch = vi.fn(async () => ({ ok: true, blob: async () => new Blob(['abc']) }));
    const first = await saveHisnAudio('item', 75, 'https://example.com/75.mp3');
    expect(first).toBe(3);
    expect(hisnAudioSaved('item', 75)).toBe(true);
    expect(loadHisnAudioIndex()[hisnKey('item', 75)]).toBe(3);
    const second = await saveHisnAudio('item', 75, 'https://example.com/75.mp3');
    expect(second).toBe(0);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(totalHisnBytes()).toBe(3);
  });

  it('resolves to a local object url when saved, remote otherwise', async () => {
    global.URL.createObjectURL = vi.fn(() => 'blob:local');
    global.URL.revokeObjectURL = vi.fn();
    global.fetch = vi.fn(async () => ({ ok: true, blob: async () => new Blob(['x']) }));
    expect(await resolveHisnUrl('item', 1, 'https://example.com/1.mp3')).toBe('https://example.com/1.mp3');
    await saveHisnAudio('item', 1, 'https://example.com/1.mp3');
    expect(await resolveHisnUrl('item', 1, 'https://example.com/1.mp3')).toBe('blob:local');
  });

  it('removes all hisn audio and clears the index', async () => {
    global.fetch = vi.fn(async () => ({ ok: true, blob: async () => new Blob(['x']) }));
    global.URL.createObjectURL = vi.fn(() => 'blob:local');
    global.URL.revokeObjectURL = vi.fn();
    await saveHisnAudio('chapter', 27, 'https://example.com/27.mp3');
    await saveHisnAudio('item', 75, 'https://example.com/75.mp3');
    await removeAllHisnAudio();
    expect(loadHisnAudioIndex()).toEqual({});
    expect(__store.size).toBe(0);
    expect(hisnAudioSaved('chapter', 27)).toBe(false);
  });

  it('reports saved counts from the on-device indexes', () => {
    localStorage.setItem('sakinah.audio-downloads', JSON.stringify({ alafasy: { 1: { ayahs: 7, bytes: 10 }, 2: { ayahs: 286, bytes: 20 } } }));
    localStorage.setItem('sakinah.hisn-audio', JSON.stringify({ 'hisn:item:1': 5 }));
    expect(bulkSavedCount('quran-audio', { reciter: 'alafasy' })).toBe(2);
    expect(bulkSavedCount('hisn-audio')).toBe(1);
  });
});