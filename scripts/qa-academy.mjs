import { chromium } from '@playwright/test';
import fs from 'node:fs';
import { LETTERS } from '../apps/web/src/data/learn/letters.js';

const BASE = process.env.QA_BASE || 'http://localhost:5173';
const OUT = '/tmp/sakinah-qa';
fs.mkdirSync(OUT, { recursive: true });
const report = [];
const pass = (view, check) => report.push({ view, check, ok: true });
const fail = (view, check, detail) => report.push({ view, check, ok: false, detail });

const TABS = ['overview', 'path', 'alphabet', 'harakat', 'builder', 'tajweed', 'reading', 'hifz', 'vocab', 'understanding', 'assistant'];

async function sweep() {
  const browser = await chromium.launch();
  for (const [view, opts] of [['academy-desktop', { viewport: { width: 1280, height: 900 } }], ['academy-mobile', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }]]) {
    const page = await browser.newPage(opts);
    const errors = [];
    page.on('pageerror', e => errors.push(String(e).slice(0, 180)));
    for (const tab of TABS) {
      errors.length = 0;
      await page.goto(`${BASE}/learn?tab=${tab}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1600);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      await page.screenshot({ path: `${OUT}/${view}-${tab}.png` });
      if (errors.length) fail(view, `${tab}: no-js-error`, errors.join(' | ')); else pass(view, `${tab}: no-js-error`);
      if (overflow > 2) fail(view, `${tab}: no-overflow`, `${overflow}px`); else pass(view, `${tab}: no-overflow`);
      const nav = await page.getByRole('navigation', { name: 'Academy sections' }).count();
      if (nav === 1) pass(view, `${tab}: shell-nav-present`); else fail(view, `${tab}: shell-nav-present`, 'missing');
    }
    await page.close();
  }
  await browser.close();
}

async function flow() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e).slice(0, 180)));
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const step = async (name, fn) => {
    try { await fn(); pass('academy-flow', name); }
    catch (e) {
      fail('academy-flow', name, String(e).slice(0, 220));
      try { await page.goto(BASE + '/learn', { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(500); } catch { /* keep remaining steps independent */ }
    }
  };
  const dialog = () => page.getByRole('dialog');
  const choice = async text => { await dialog().getByRole('button', { name: new RegExp(`^[A-D]\\s*${esc(text)}$`) }).click(); await page.waitForTimeout(150); };
  const next = async () => { const btn = dialog().getByRole('button', { name: /Next|See results/ }); await btn.click(); await page.waitForTimeout(150); };
  const finishRunner = async () => { await dialog().getByRole('button', { name: /Continue/ }).click(); await page.waitForTimeout(250); };
  const academy = () => page.evaluate(() => JSON.parse(localStorage.getItem('sakinah.academy') || '{}'));

  await page.goto(BASE + '/learn', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1400);

  await step('overview shows stats, modules and goal stepper', async () => {
    await page.getByText('Letters mastered').waitFor();
    await page.getByText('Explore the modules').waitFor();
    const before = (await academy()).profile.dailyGoal;
    await page.getByRole('button', { name: 'Raise daily goal' }).click();
    const after = (await academy()).profile.dailyGoal;
    if (after !== before + 5) throw new Error(`goal ${before} -> ${after}`);
    await page.screenshot({ path: `${OUT}/flow-academy-overview.png` });
  });

  await step('alphabet letter card opens with forms and audio', async () => {
    await page.getByRole('button', { name: 'Arabic Alphabet', exact: true }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /^Baa,/ }).click();
    await dialog().getByText('How it joins').waitFor();
    await dialog().getByText('In real words').waitFor();
    await page.screenshot({ path: `${OUT}/flow-academy-letter.png` });
    await page.getByRole('button', { name: 'Close dialog' }).click();
  });

  await step('letter group quiz completes and persists', async () => {
    await page.locator('button').filter({ hasText: 'Group 1 ·' }).click();
    await dialog().waitFor();
    const names = LETTERS.slice(0, 7).map(l => l.name);
    for (const name of names) { await choice(name); await next(); }
    const lefts = await dialog().locator('div.grid.grid-cols-2 > div:first-child button').allTextContents();
    for (const ch of lefts) {
      const letter = LETTERS.find(l => l.ch === ch.trim());
      await dialog().locator('div.grid.grid-cols-2 > div:first-child button').filter({ hasText: ch.trim() }).click();
      await dialog().locator('div.grid.grid-cols-2 > div:last-child button').filter({ hasText: letter.name }).click();
      await page.waitForTimeout(120);
    }
    await next();
    await finishRunner();
    const state = await academy();
    if (state.lessons['letters-1']?.status !== 'completed') throw new Error('letters-1 not completed');
    if (!state.attempts.length) throw new Error('no attempts recorded');
  });

  await step('harakat lesson completes and persists', async () => {
    await page.getByRole('button', { name: 'Harakat', exact: true }).click();
    await page.waitForTimeout(400);
    await page.locator('button').filter({ hasText: 'Fathah' }).first().click();
    await dialog().getByText('Example words').waitFor();
    await dialog().getByRole('button', { name: /Practise Fathah/ }).click();
    await choice('كَتَبَ'); await next();
    await dialog().locator('button.arabic').filter({ hasText: 'َ' }).first().click(); await page.waitForTimeout(150); await next();
    await choice('a'); await next();
    await finishRunner();
    await page.getByRole('button', { name: 'Close dialog' }).click();
    const state = await academy();
    if (state.lessons['harakat-fathah']?.status !== 'completed') throw new Error('harakat-fathah not completed');
  });

  await step('word builder joins letters and awards stars', async () => {
    await page.getByRole('button', { name: 'Word Builder', exact: true }).click();
    await page.waitForTimeout(400);
    await page.getByRole('button', { name: 'Build this word' }).first().click();
    await dialog().waitFor();
    for (const ch of ['ك', 'ت', 'ب']) { await dialog().locator('button.soft.arabic').filter({ hasText: ch }).click(); await page.waitForTimeout(100); }
    await dialog().getByRole('button', { name: /Check word/ }).click();
    await page.waitForTimeout(200);
    await next();
    await finishRunner();
    const state = await academy();
    if (!(state.builder.kataba?.stars > 0)) throw new Error('no stars for kataba');
  });

  await step('reading practice loads words and bookmarks', async () => {
    await page.getByRole('button', { name: 'Quran Reading', exact: true }).click();
    await page.waitForTimeout(400);
    await page.locator('button.arabic.rounded-lg').first().waitFor({ timeout: 25000 });
    await page.locator('button.arabic.rounded-lg').first().click();
    await page.getByRole('region', { name: 'Word details' }).waitFor();
    await page.screenshot({ path: `${OUT}/flow-academy-reading.png` });
    await page.getByRole('button', { name: 'Bookmark this ayah' }).click();
    const state = await academy();
    if (!state.bookmarks.includes('112:1')) throw new Error('bookmark missing');
    await page.getByRole('button', { name: 'Next ayah' }).click();
    await page.waitForTimeout(600);
    if ((await academy()).reading.ayah !== 2) throw new Error('reading position not saved');
  });

  await step('hifz manual marking feeds revision schedule', async () => {
    await page.getByRole('button', { name: 'Hifz', exact: true }).click();
    await page.waitForTimeout(2500);
    await page.getByRole('button', { name: 'Hide text' }).click();
    await page.getByText('Text hidden — tap to reveal').first().waitFor();
    await page.locator('label:has-text("Mark as") select').first().selectOption('memorised');
    const state = await academy();
    if (state.hifzStatus['112:1']?.status !== 'memorised') throw new Error('hifz status missing');
    const hifz = await page.evaluate(() => JSON.parse(localStorage.getItem('sakinah.hifz') || '{}'));
    if (!hifz['112:1']?.due) throw new Error('shared revision schedule not updated');
    await page.screenshot({ path: `${OUT}/flow-academy-hifz.png` });
  });

  await step('vocabulary saves words and shows due queue', async () => {
    await page.getByRole('button', { name: 'Vocabulary', exact: true }).click();
    await page.getByRole('button', { name: 'Save word' }).first().waitFor({ timeout: 25000 });
    await page.getByRole('button', { name: 'Save word' }).first().click();
    if (!(await academy()).savedWords.length) throw new Error('word not saved');
    await page.getByRole('tab', { name: 'Saved', exact: true }).click();
    await page.waitForTimeout(2500);
    await page.getByText('saved words', { exact: false }).first().waitFor();
  });

  await step('understanding layers and nahw primer complete', async () => {
    await page.getByRole('button', { name: 'Understanding', exact: true }).click();
    await page.getByText('1 · Arabic — Uthmani text').waitFor({ timeout: 25000 });
    await page.getByText('3 · Translation — Sahih International').waitFor();
    await page.locator('button').filter({ hasText: 'First steps in Nahw' }).click();
    await dialog().getByRole('button', { name: 'Check understanding' }).click();
    await choice('Jarr (genitive)'); await next();
    await choice('The predicate (khabar)'); await next();
    await choice('True'); await next();
    await finishRunner();
    await page.getByRole('button', { name: 'Close dialog' }).click();
    if ((await academy()).lessons['understanding-nahw']?.status !== 'completed') throw new Error('nahw not completed');
  });

  await step('assistant guest mode shows labelled offline study plan', async () => {
    await page.getByRole('button', { name: 'Learning Assistant', exact: true }).click();
    await page.waitForTimeout(400);
    await page.getByRole('textbox', { name: 'Your learning question' }).fill('How do I start learning the letters?');
    await page.getByRole('button', { name: 'Send question' }).click();
    await page.getByText('Offline study mode').waitFor();
    await page.getByText('Sign in to chat with the live assistant.').waitFor();
  });

  await step('placement quiz sets level and persists', async () => {
    await page.getByRole('button', { name: 'My Learning Path', exact: true }).click();
    await page.waitForTimeout(400);
    await page.getByRole('button', { name: /Take placement quiz/ }).click();
    await dialog().waitFor();
    await choice('ب'); await next();
    await choice('Baa'); await next();
    await choice('a'); await next();
    await choice('kataba'); await next();
    await choice('False'); await next();
    await choice('Say'); await next();
    await finishRunner();
    const state = await academy();
    if (!state.profile.assessmentDone) throw new Error('assessment not recorded');
    if (state.profile.level < 1 || state.profile.level > 7) throw new Error('invalid level');
    await page.screenshot({ path: `${OUT}/flow-academy-path.png` });
  });

  await step('progress survives a full reload', async () => {
    await page.goto(BASE + '/learn', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
    const state = await academy();
    for (const id of ['letters-1', 'harakat-fathah', 'understanding-nahw']) {
      if (state.lessons?.[id]?.status !== 'completed') throw new Error(`${id} did not persist`);
    }
    if (!(state.builder?.kataba?.stars > 0)) throw new Error('builder stars did not persist');
    if (!state.bookmarks?.includes('112:1')) throw new Error('bookmark did not persist');
    await page.getByText('Lessons completed').waitFor();
    await page.screenshot({ path: `${OUT}/flow-academy-progress.png` });
  });

  await step('no runtime errors across the whole flow', async () => {
    if (pageErrors.length) throw new Error(pageErrors.join(' | '));
  });

  await browser.close();
}

await sweep();
await flow();
const passed = report.filter(r => r.ok).length;
console.log(`\n==== ACADEMY QA: ${passed}/${report.length} checks passed ====`);
for (const r of report.filter(r => !r.ok)) console.log(`FAIL [${r.view}] ${r.check}: ${r.detail}`);
fs.writeFileSync(`${OUT}/academy-report.json`, JSON.stringify(report, null, 2));
if (passed !== report.length) process.exit(1);
console.log('Screenshots + report:', OUT);