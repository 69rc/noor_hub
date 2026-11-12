import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { useAutoLocation, deviceTimezone } from '../src/lib/geolocation.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const mounted = [];
function renderHook(cb) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  const Wrapper = () => { cb(); return null; };
  act(() => { root.render(createElement(Wrapper)); });
  mounted.push({ root, container });
}

function mockGeo({ state = 'prompt', position = null, error = null } = {}) {
  const getCurrentPosition = vi.fn((success, fail) => {
    if (position) success(position);
    else if (error) fail(error);
  });
  Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition }, configurable: true });
  Object.defineProperty(navigator, 'permissions', { value: { query: vi.fn(async () => ({ state })) }, configurable: true });
  return getCurrentPosition;
}

const flush = () => act(async () => { await new Promise(r => setTimeout(r, 0)); });
const baseLocation = { label: 'Makkah, Saudi Arabia', country: 'SA', latitude: 21.4225, longitude: 39.8262, timezone: 'Asia/Riyadh', manual: false };

describe('useAutoLocation', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    for (const { root, container } of mounted.splice(0)) { act(() => root.unmount()); container.remove(); }
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('applies device coordinates, timezone and label when granted', async () => {
    const getCurrentPosition = mockGeo({ state: 'granted', position: { coords: { latitude: 51.50741, longitude: -0.12781 } } });
    const update = vi.fn();
    renderHook(() => useAutoLocation(baseLocation, update));
    await flush();
    expect(getCurrentPosition).toHaveBeenCalled();
    expect(update).toHaveBeenCalledTimes(1);
    const next = update.mock.calls[0][0]({ location: baseLocation });
    expect(next.location.latitude).toBe(51.5074);
    expect(next.location.longitude).toBe(-0.1278);
    expect(next.location.label).toBe('My location');
    expect(next.location.manual).toBe(false);
    expect(next.location.timezone).toBe(deviceTimezone());
  });

  it('does not request location when a place is pinned', async () => {
    const getCurrentPosition = mockGeo({ state: 'granted', position: { coords: { latitude: 1, longitude: 2 } } });
    const update = vi.fn();
    renderHook(() => useAutoLocation({ ...baseLocation, manual: true }, update));
    await flush();
    expect(getCurrentPosition).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it('respects an already-denied permission', async () => {
    const getCurrentPosition = mockGeo({ state: 'denied' });
    const update = vi.fn();
    renderHook(() => useAutoLocation(baseLocation, update));
    await flush();
    expect(getCurrentPosition).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it('remembers a denial and keeps the fallback location', async () => {
    const getCurrentPosition = mockGeo({ state: 'prompt', error: { code: 1 } });
    const update = vi.fn();
    renderHook(() => useAutoLocation(baseLocation, update));
    await flush();
    expect(getCurrentPosition).toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
    expect(localStorage.getItem('sakinah.geo-denied')).toBe('1');
  });

  it('does not re-prompt after a remembered denial', async () => {
    localStorage.setItem('sakinah.geo-denied', '1');
    const getCurrentPosition = mockGeo({ state: 'prompt', position: { coords: { latitude: 1, longitude: 2 } } });
    const update = vi.fn();
    renderHook(() => useAutoLocation(baseLocation, update));
    await flush();
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });

  it('is a safe no-op when geolocation is unavailable', async () => {
    Object.defineProperty(navigator, 'geolocation', { value: undefined, configurable: true });
    const update = vi.fn();
    renderHook(() => useAutoLocation(baseLocation, update));
    await flush();
    expect(update).not.toHaveBeenCalled();
  });
});