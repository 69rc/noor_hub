import { chromium } from '@playwright/test';
import fs from 'node:fs';
const BASE = process.env.QA_BASE || 'http://localhost:4173';
const OUT = '/tmp/sakinah-qa';
fs.mkdirSync(OUT, { recursive: true });
const results = [];
const check = (name, ok, detail = '') => results.push({ name, ok, detail });

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await context.newPage();
const pageErrors = [];
page.on('pageerror', e => pageErrors.push(String(e).slice(0, 160)));

await page.goto(BASE + '/', { waitUntil: 'load' });
await page.waitForTimeout(1500);

const sw = await page.evaluate(async () => {
  if (!('serviceWorker' in navigator)) return { supported: false };
  const reg = await navigator.serviceWorker.ready;
  return { supported: true, scope: reg.scope, active: Boolean(reg.active), controlled: Boolean(navigator.serviceWorker.controller) };
});
check('service worker registers and activates', sw.supported && sw.active, JSON.stringify(sw));
check('service worker controls the page', sw.controlled === true, JSON.stringify(sw));

const manifest = await page.evaluate(async () => {
  const link = document.querySelector('link[rel="manifest"]');
  if (!link) return { present: false };
  const res = await fetch(link.href);
  const json = await res.json();
  return { present: true, name: json.name, display: json.display, icons: (json.icons || []).length, start_url: json.start_url };
});
check('web manifest present with icons and standalone display', manifest.present && manifest.icons >= 2 && manifest.display === 'standalone', JSON.stringify(manifest));

const cachesKeys = await page.evaluate(() => caches.keys());
check('workbox precache populated', cachesKeys.some(k => /precache/.test(k)), cachesKeys.join(','));

const precacheCount = await page.evaluate(async () => {
  const key = (await caches.keys()).find(k => /precache/.test(k));
  if (!key) return 0;
  return (await (await caches.open(key)).keys()).length;
});
check('precache holds the app shell', precacheCount > 10, `entries=${precacheCount}`);

await page.screenshot({ path: `${OUT}/pwa-online.png` });

await context.setOffline(true);
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1800);
const offlineState = await page.evaluate(() => ({
  heading: document.querySelector('h1')?.innerText || '(none)',
  offlineBanner: document.body.innerText.includes('Offline'),
  prayerCard: document.body.innerText.includes('Today’s prayers')
}));
check('app shell loads offline from precache', offlineState.heading !== '(none)' && offlineState.prayerCard, JSON.stringify(offlineState));
check('offline banner communicates connectivity', offlineState.offlineBanner === true, JSON.stringify(offlineState));
await page.screenshot({ path: `${OUT}/pwa-offline.png` });

await context.setOffline(false);
await page.waitForTimeout(800);
check('no JS runtime errors during PWA lifecycle', pageErrors.length === 0, pageErrors.join(' | '));

await browser.close();
const failures = results.filter(r => !r.ok);
console.log(`\n==== PWA SUMMARY: ${results.length - failures.length}/${results.length} passed ====`);
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.name}${r.detail ? ' :: ' + r.detail : ''}`);
fs.writeFileSync(`${OUT}/pwa-report.json`, JSON.stringify(results, null, 2));
process.exit(failures.length ? 1 : 0);