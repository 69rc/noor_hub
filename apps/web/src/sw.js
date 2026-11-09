import { clientsClaim } from 'workbox-core';
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
self.skipWaiting();
clientsClaim();
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html'), { denylist: [/^\/api\//] }));
registerRoute(({ url, request }) => request.method === 'GET' && !url.pathname.startsWith('/api/') && ['https://api.alquran.cloud', 'https://api.aladhan.com'].includes(url.hostname), new NetworkFirst({ cacheName: 'public-content', networkTimeoutSeconds: 8, plugins: [new CacheableResponsePlugin({ statuses: [200] }), new ExpirationPlugin({ maxEntries: 160, maxAgeSeconds: 30 * 86400 })] }));
registerRoute(({ url, request }) => request.method === 'GET' && url.hostname === 'cdn.jsdelivr.net' && url.pathname.includes('hadith-api'), new StaleWhileRevalidate({ cacheName: 'hadith-content', plugins: [new CacheableResponsePlugin({ statuses: [200] }), new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 30 * 86400 })] }));
registerRoute(({ url, request }) => request.method === 'GET' && ['cdn.islamic.network', 'everyayah.com'].includes(url.hostname), new CacheFirst({ cacheName: 'recitation-downloads', plugins: [new CacheableResponsePlugin({ statuses: [200] }), new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 90 * 86400 })] }));
self.addEventListener('message', event => { if (event.data?.type === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('push', event => {
  if (!event.data) return;
  let data; try { data = event.data.json(); } catch { return; }
  if (typeof data.title !== 'string' || typeof data.body !== 'string') return;
  event.waitUntil(self.registration.showNotification(data.title.slice(0, 100), { body: data.body.slice(0, 240), icon: '/icons/icon-192.png', badge: '/icons/icon-192.png', tag: data.tag || 'sakinah', data: { url: '/' } }));
});
self.addEventListener('notificationclick', event => { event.notification.close(); event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => clients[0]?.focus() || self.clients.openWindow('/'))); });