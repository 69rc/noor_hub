import { vi } from 'vitest';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn()
  }))
});

window.scrollTo = vi.fn();
window.HTMLElement.prototype.scrollIntoView = vi.fn();

class ObserverStub { observe() {} unobserve() {} disconnect() {} }
window.ResizeObserver = ObserverStub;
window.IntersectionObserver = ObserverStub;

if (!window.crypto) window.crypto = {};
if (!window.crypto.randomUUID) {
  window.crypto.randomUUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

if (!window.Notification) {
  window.Notification = class { static permission = 'default'; static requestPermission = vi.fn().mockResolvedValue('default'); };
}