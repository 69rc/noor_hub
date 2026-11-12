import { chromium } from '@playwright/test';
import fs from 'node:fs';

const BASE = process.env.QA_BASE || 'http://localhost:5173';
const OUT = '/tmp/sakinah-qa';
fs.mkdirSync(OUT, { recursive: true });

const ROUTES = ['/', '/prayers', '/prayers?view=qibla', '/quran', '/quran/1', '/learn', '/hadith', '/worship', '/worship?tab=tasbih', '/worship?tab=adhkar', '/worship?tab=hisn', '/worship?tab=hisn&chapter=27', '/worship?tab=tahajjud', '/journal', '/library', '/assistant', '/profile', '/profile/sources', '/welcome'];
const report = [];
const fail = (view, route, check, detail) => report.push({ view, route, check, ok: false, detail });
const pass = (view, route, check) => report.push({ view, route, check, ok: true });

async function sweep(view, contextOptions) {
  const browser = await chromium.launch();
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  let consoleErrors = [];
  let pageErrors = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 180)); });
  page.on('pageerror', e => pageErrors.push(String(e).slice(0, 180)));
  for (const route of ROUTES) {
    consoleErrors = []; pageErrors = [];
    await page.goto(BASE + route, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1400);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    const heading = await page.evaluate(() => document.querySelector('h1')?.innerText || '(no h1)');
    const slug = route.replace(/[^a-z0-9]/gi, '_') || 'root';
    await page.screenshot({ path: `${OUT}/${view}-${slug}.png` });
    if (pageErrors.length) fail(view, route, 'no-js-runtime-error', pageErrors.join(' | ')); else pass(view, route, 'no-js-runtime-error');
    if (overflow > 2) fail(view, route, 'no-horizontal-overflow', `overflow=${overflow}px`); else pass(view, route, 'no-horizontal-overflow');
    if (consoleErrors.length) fail(view, route, 'no-console-error', consoleErrors.join(' | ')); else pass(view, route, 'no-console-error');
    if (heading === '(no h1)') fail(view, route, 'page-has-heading', ''); else pass(view, route, 'page-has-heading');
  }
  await browser.close();
}

async function interactions() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e).slice(0, 180)));
  const step = async (name, fn) => { try { await fn(); pass('mobile-flow', '-', name); } catch (e) { fail('mobile-flow', '-', name, String(e).slice(0, 200)); } };

  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);

  await step('prayer check-in toggles and persists', async () => {
    await page.getByRole('button', { name: 'Record Fajr prayer' }).click();
    await page.getByRole('button', { name: 'Clear Fajr prayer' }).waitFor();
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('sakinah.prayers') || '{}'));
    if (!Object.values(stored).some(v => v.status === 'COMPLETED')) throw new Error('prayer not persisted');
    await page.getByRole('button', { name: 'Clear Fajr prayer' }).click();
    await page.getByRole('button', { name: 'Record Fajr prayer' }).waitFor();
  });

  await step('theme toggle switches dark mode', async () => {
    await page.getByRole('button', { name: 'Switch to dark mode' }).click();
    await page.waitForTimeout(200);
    if (!(await page.evaluate(() => document.documentElement.classList.contains('dark')))) throw new Error('dark class missing');
    await page.screenshot({ path: `${OUT}/flow-dark-dashboard.png` });
    await page.getByRole('button', { name: 'Switch to light mode' }).click();
  });

  await step('tasbih increments, saves session, resets', async () => {
    await page.goto(BASE + '/worship?tab=tasbih', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);
    const inc = page.getByRole('button', { name: 'Increment tasbih' });
    for (let i = 0; i < 3; i++) await inc.click();
    const text = await inc.innerText();
    if (!/\b3\b/.test(text)) throw new Error(`count not 3: ${text}`);
    await page.getByRole('button', { name: 'Save session' }).click();
    await page.waitForTimeout(300);
    const sessions = await page.evaluate(() => JSON.parse(localStorage.getItem('sakinah.dhikr') || '[]'));
    if (sessions.length !== 1 || sessions[0].count !== 3) throw new Error('session not saved');
    await page.screenshot({ path: `${OUT}/flow-tasbih.png` });
  });

  await step('journal reflection saves and displays', async () => {
    await page.goto(BASE + '/journal', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);
    await page.getByRole('button', { name: /Add reflection/ }).click();
    await page.getByPlaceholder('What are you grateful for? What did you learn?').fill('Grateful for a quiet morning and a clear mind.');
    await page.getByRole('button', { name: 'Save reflection' }).click();
    await page.waitForTimeout(300);
    await page.getByText('Grateful for a quiet morning and a clear mind.').first().waitFor();
    await page.screenshot({ path: `${OUT}/flow-journal.png` });
  });

  await step('profile tabs render all sections', async () => {
    await page.goto(BASE + '/profile', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);
    await page.getByRole('tab', { name: 'Preferences' }).click();
    await page.getByText('Appearance', { exact: true }).waitFor();
    await page.getByRole('tab', { name: 'Reminders' }).click();
    await page.getByText('Prayer reminders', { exact: true }).waitFor();
    await page.getByRole('tab', { name: 'Privacy' }).click();
    await page.getByText('Your data, your control').waitFor();
    await page.screenshot({ path: `${OUT}/flow-profile-privacy.png` });
    await page.getByRole('tab', { name: 'Account' }).click();
    await page.getByRole('heading', { name: 'Sync across devices' }).waitFor();
  });

  await step('assistant offline companion answers a prompt', async () => {
    await page.goto(BASE + '/assistant', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);
    await page.getByRole('button', { name: /Explain Quran 112:1/ }).click();
    await page.getByText('Offline study companion').first().waitFor();
    await page.screenshot({ path: `${OUT}/flow-assistant.png` });
  });

  await step('quran reader shows arabic and translation', async () => {
    await page.goto(BASE + '/quran/1', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1800);
    const arabic = await page.locator('.arabic').count();
    if (arabic < 1) throw new Error('no arabic text rendered');
    await page.screenshot({ path: `${OUT}/flow-quran-reader.png` });
  });

  await step('tahajjud guidelines expand with attributed references', async () => {
    await page.goto(BASE + '/worship?tab=tahajjud', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(700);
    await page.getByRole('button', { name: 'How to pray Tahajjud' }).click();
    await page.getByText('Wake in the last third of the night').waitFor();
    await page.getByText('Sahih Muslim 1163').first().waitFor();
    await page.screenshot({ path: `${OUT}/flow-tahajjud-guidelines.png` });
  });

  await step('tahajjud night prompt previews, records, and updates the streak', async () => {
    await page.getByRole('button', { name: /Preview tonight.s prompt/ }).click();
    await page.getByText('First, make wudu').waitFor();
    await page.screenshot({ path: `${OUT}/flow-tahajjud-prompt.png` });
    await page.getByRole('button', { name: /ve prayed/ }).click();
    await page.waitForTimeout(500);
    const records = await page.evaluate(() => JSON.parse(localStorage.getItem('sakinah.tahajjud') || '[]'));
    if (records.length !== 1 || records[0].rakahs < 2) throw new Error('tahajjud night not recorded');
    await page.getByText(/1 night in a row/).waitFor();
  });

  await step('quran reader is plain arabic without tajweed marks', async () => {
    await page.goto(BASE + '/quran/1', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1800);
    if ((await page.locator('[class*="taj-"]').count()) !== 0) throw new Error('tajweed classes still rendered');
    if ((await page.getByRole('button', { name: 'Tajweed', exact: true }).count()) !== 0) throw new Error('tajweed toggle still present');
    await page.screenshot({ path: `${OUT}/flow-quran-plain.png` });
  });

  await step('hifz marking, tracker and spaced review', async () => {
    await page.getByRole('button', { name: 'Mark ayah 1 as memorized' }).click();
    await page.getByRole('button', { name: 'Remove ayah 1 from memorization' }).waitFor();
    const entry = await page.evaluate(() => JSON.parse(localStorage.getItem('sakinah.hifz') || '{}')['1:1']);
    if (!entry || entry.interval !== 1) throw new Error('hifz entry not created with interval 1');
    await page.goto(BASE + '/quran', { waitUntil: 'domcontentloaded' });
    await page.getByRole('tab', { name: 'Hifz' }).click();
    await page.getByText('Memorized ayahs').waitFor();
    await page.evaluate(() => {
      const state = JSON.parse(localStorage.getItem('sakinah.hifz') || '{}');
      const d = new Date();
      state['1:1'].due = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      localStorage.setItem('sakinah.hifz', JSON.stringify(state));
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.getByRole('tab', { name: 'Hifz' }).click();
    await page.getByRole('button', { name: 'Start review' }).click();
    await page.getByText('Review 1 of 1').waitFor();
    await page.getByRole('button', { name: 'Recite from memory, then reveal' }).click();
    await page.getByRole('button', { name: /Good/ }).click();
    await page.waitForTimeout(400);
    const graded = await page.evaluate(() => JSON.parse(localStorage.getItem('sakinah.hifz') || '{}')['1:1']);
    if (graded.interval !== 3 || graded.reviews !== 1) throw new Error(`review not graded: ${JSON.stringify(graded)}`);
    await page.screenshot({ path: `${OUT}/flow-hifz.png` });
    await page.goto(BASE + '/quran/1', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
  });

  await step('reciter change persists and updates the reader', async () => {
    await page.getByRole('button', { name: 'Reader settings' }).click();
    await page.getByText('Reading, your way').waitFor();
    await page.getByLabel('Reciter').selectOption('abdulbasit-murattal');
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: 'Close dialog' }).click();
    await page.waitForTimeout(300);
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('sakinah.preferences') || '{}').reciter);
    if (stored !== 'abdulbasit-murattal') throw new Error(`reciter not persisted: ${stored}`);
    await page.getByText('Abdul Basit Abdus-Samad').first().waitFor();
    await page.screenshot({ path: `${OUT}/flow-reciter.png` });
  });

  await step('recitation download stores audio blobs in IndexedDB', async () => {
    const activeReciter = await page.evaluate(() => JSON.parse(localStorage.getItem('sakinah.preferences') || '{}').reciter || 'alafasy');
    await page.route('https://everyayah.com/**', route => route.fulfill({ status: 200, contentType: 'audio/mpeg', body: Buffer.from('ID3-sakinah-qa-fake-recitation-bytes') }));
    try {
      await page.getByRole('button', { name: 'Audio', exact: true }).click();
      await page.getByText('Recitation on this device').waitFor();
      await page.screenshot({ path: `${OUT}/flow-audio-sheet.png` });
      await page.getByRole('button', { name: 'Download recitation for offline' }).click();
      await page.getByText(/Saved ·/).waitFor({ timeout: 30000 });
      const keys = await page.evaluate(() => new Promise((resolve, reject) => {
        const req = indexedDB.open('sakinah-offline');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const db = req.result;
          const all = db.transaction('audio', 'readonly').objectStore('audio').getAllKeys();
          all.onsuccess = () => { db.close(); resolve(all.result); };
          all.onerror = () => { db.close(); reject(all.error); };
        };
      }));
      if (keys.length < 7) throw new Error(`expected 7 stored ayahs, found ${keys.length}`);
      const index = await page.evaluate(() => JSON.parse(localStorage.getItem('sakinah.audio-downloads') || '{}'));
      if (!index[activeReciter]?.['1'] || index[activeReciter]['1'].ayahs !== 7) throw new Error('download index not updated for surah 1');
      await page.screenshot({ path: `${OUT}/flow-audio-saved.png` });
    } finally {
      await page.unroute('https://everyayah.com/**');
    }
  });

  await step('study modal quotes attributed tafsir and caches it', async () => {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    await page.route('https://ummahapi.com/**', route => {
      const arabic = route.request().url().includes('/muyassar/');
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, service: 'tafsir-ayah', data: { verse_key: '1:1', tafsir: arabic ? { key: 'muyassar', name: 'Tafsir Muyassar', language: 'arabic', author: 'Ministry of Islamic Affairs, Saudi Arabia', text: 'QA-TAFSIR Arabic commentary.' } : { key: 'ibn_kathir', name: 'Ibn Kathir (Abridged)', language: 'english', author: 'Hafiz Ibn Kathir', text: 'QA-TAFSIR English commentary.' } } })
      });
    });
    try {
      await page.getByRole('button', { name: /Study this verse/ }).first().click();
      await page.getByText('QA-TAFSIR English commentary.').waitFor({ timeout: 15000 });
      await page.getByText('Ibn Kathir (Abridged) · Hafiz Ibn Kathir').waitFor();
      await page.screenshot({ path: `${OUT}/flow-study-tafsir.png` });
      await page.getByLabel('Commentary edition').selectOption('muyassar');
      await page.getByText('QA-TAFSIR Arabic commentary.').waitFor({ timeout: 15000 });
      const stored = await page.evaluate(() => new Promise((resolve, reject) => {
        const req = indexedDB.open('sakinah-offline');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const db = req.result;
          const get = db.transaction('content', 'readonly').objectStore('content').get('tafsir:muyassar:1:1');
          get.onsuccess = () => { db.close(); resolve(get.result?.value?.text || ''); };
          get.onerror = () => { db.close(); reject(get.error); };
        };
      }));
      if (!stored.includes('QA-TAFSIR Arabic')) throw new Error('tafsir not cached in IndexedDB');
    } finally {
      await page.unroute('https://ummahapi.com/**');
    }
  });

  if (pageErrors.length) fail('mobile-flow', '-', 'no-js-runtime-error', pageErrors.join(' | ')); else pass('mobile-flow', '-', 'no-js-runtime-error');
  await browser.close();
}

await sweep('mobile', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await sweep('desktop', { viewport: { width: 1440, height: 900 } });
await interactions();

const failures = report.filter(r => !r.ok);
fs.writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 2));
console.log(`\n==== QA SUMMARY: ${report.length - failures.length}/${report.length} checks passed ====`);
for (const f of failures) console.log(`FAIL [${f.view}] ${f.route} :: ${f.check} :: ${f.detail}`);
if (!failures.length) console.log('All checks passed.');
console.log(`Screenshots + report: ${OUT}`);
process.exit(failures.length ? 1 : 0);