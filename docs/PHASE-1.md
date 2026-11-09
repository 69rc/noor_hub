# Phase 1 — Implementation Record

Phase 1 delivers a **fully functional, offline-capable PWA** covering all ten modules (A–J),
a local-first data layer, an optional account/sync backend, and a verified design system. It is
a working application, not a static prototype: every screen reads real content, persists real
worship state, and behaves correctly offline.

Verification for this phase was run on **2026-11-09** against Node 22.17.1.

---

## 1. Completed features by module

### A. Quran (`features/quran`)
- Surah index (114) and juz navigation; reader at `/quran/:surah`.
- **Uthmani Arabic** plus English translation (Sahih International / Pickthall / Yusuf Ali) and
  transliteration, fetched from AlQuran Cloud with per-edition ayah-count cross-checks
  (`502 CONTENT_MISMATCH` on disagreement).
- Recitation audio (5 reciters) via the global `AudioPlayer`, with play/pause and range/repeat
  controls where the platform supports them.
- Bookmarks, notes, and last-read persisted locally; schema supports memorization plans.
- Offline: previously opened surahs are served from IndexedDB / the `public-content` cache.

### B. Hadith (`features/hadith`)
- Collections (Bukhari, Muslim, Abu Dawud, Tirmidhi, Nasaʾi, Ibn Majah) via the
  fawazahmed0/hadith-api, edition-pinned, with Arabic + English fetched together and
  number-matched.
- Canonical reference and **established grades only** (grades come attributed from the source;
  the app never assigns its own). A permanent note reminds users that a collection name is not
  an automatic grading of every report.
- Daily Hadith surface (`DailyContent`); bookmarks and reading history stored locally.

### C. Arabic Academy (`features/learn`, `data/academy.js`)
- Three levels (Beginner → Intermediate → Advanced) across 3 courses and 14 lessons.
- Lessons combine letter/word cards, reading passages, and notes, each ending in a **quiz** with
  explanations. Progress is tracked locally and syncable (`lessonProgress`).
- Sources (Madinah Arabic, Quranic Arabic Corpus) are cited; lessons repeatedly direct learners
  to qualified teachers for pronunciation and to attributed tafsir for meaning — they do not
  overclaim.

### D. Salah Tracker (`features/prayers`, `lib/prayer.js`, `lib/worship.js`)
- Prayer times computed on-device with `adhan` for 11 calculation methods and Standard/Hanafi
  Asr, plus manual offsets.
- Five-prayer check-in (completed/missed/excused) with per-day history and streak/stat summaries.
- Optional per-prayer reminders (see limitations for background behavior).

### E. Tahajjud (`features/worship` — tahajjud tab)
- Night-prayer companion with goals (nights/week, rakah target), **last-third-of-night** timing
  computed from sunset/fajr, and Witr tracked separately from the night rakʿahs.
- Per-night history persisted locally and syncable.

### F. Dhikr & Tasbih (`features/worship` — dhikr/tasbih tab, `data/dhikr.js`)
- Curated collections (general, after-prayer, sleep, waking) with Arabic, transliteration,
  meaning, and an **authentic reference** for every item; evidence-based counts where a count is
  prescribed (e.g. 33/100), and no invented counts.
- Morning/evening adhkar **link to Hisn al-Muslim** rather than reproducing partial text.
- Interactive counter: increment/decrement/reset, custom targets, optional haptics, and saved
  sessions (`DhikrSession`).

### G. Prayer Times & Qibla (`features/prayers`)
- Location via geolocation **or** manual city/country entry; privacy-conscious and never forced.
- Calculation method + Asr selector, Hijri date via `Intl` (`islamic-umalqura`), and **Qibla**
  direction computed from coordinates (0–360°).
- Next-prayer countdown and sunnah windows (last third, middle of night).

### H. Knowledge Library (`features/library`)
- Categories across aqeedah/tawheed, fiqh, seerah, prophets, and history with daily lessons.
- Content model distinguishes **established positions from scholarly disagreement**
  (`Article.scholarlyPositions`) and attributes sources.

### I. Worship Journal (`features/worship/Journal.jsx`)
- Daily checklist, goals (Quran + dhikr targets wired to preferences), reflections, and fasting
  logging, with history and summaries. All entries persist locally and sync idempotently.

### J. AI Assistant (`features/assistant`, `modules/assistant.js`)
- **Grounded** educational assistant: when a question contains a Quran reference (`S:A`), the
  server retrieves the verified ayah and supplies it as evidence; the system prompt forbids
  inventing Quran/Hadith/grades, requires exact citations, separates translation from tafsir,
  flags disagreement, acknowledges uncertainty, and defers personal rulings to a qualified
  scholar. Responses are labeled `GROUNDED` or `UNCITED`, and every reply carries a disclaimer
  that it is educational assistance, **not a fatwa**.
- Requires `AI_*` env + database; otherwise returns `503 AI_NOT_CONFIGURED` with guidance to
  browse sources directly. Retrieved content is treated as data, not instructions
  (prompt-injection guard).

### Cross-cutting
- **Onboarding** (`/welcome`) without forcing account creation.
- **Dashboard** with configurable widgets (prayer, Quran, dhikr, learning, hadith, verse,
  tahajjud).
- **Light/dark/system theme**, full design system, and responsive mobile→desktop layouts.
- **Guest-first local persistence**, offline banner, and “N awaiting sync” status.
- **Reminders** centralized in `components/layout/Reminders.jsx` (15s scheduler) honoring
  `Notification.permission`.
- **Profile**: account, preferences, reminders, and privacy tabs with **data export** and
  **account/device reset**; a dedicated **Sources & privacy** page.

---

## 2. Verification results (2026-11-09)

| Suite | Command | Result |
|-------|---------|--------|
| Production build | `npm run build` | ✅ built in ~3.8s; **52 PWA precache entries** |
| API unit tests | `npm run test -w apps/api` | ✅ **7 passed** |
| Web unit tests | `npm run test -w apps/web` | ✅ **22 passed** (prayer 11, content-integrity 6, preferences 5) |
| Browser QA | `node scripts/qa-browser.mjs` | ✅ **144/144 checks** |
| PWA QA | `node scripts/qa-pwa.mjs` | ✅ **8/8 checks** |

**Total: 29 unit tests + 152 automated browser/PWA checks, all passing.**

### What the browser QA covers
17 routes at **390×844 (mobile, `isMobile`, `hasTouch`, DPR 2)** and **1440×900 (desktop)**,
each asserting: no JS runtime error, no horizontal overflow, no console error, and a rendered
page heading. Plus interaction flows that assert **state actually persists**:

- Prayer check-in toggles and re-renders as completed (this caught and fixed a real bug — see §4).
- Theme toggle switches to dark.
- Tasbih increments, saves a session, and resets.
- Journal reflection saves.
- Profile tab navigation and assistant prompt submission.
- Quran reader renders Arabic.

### What the PWA QA covers
Service worker registers, activates, and **controls** the page; manifest present with 3 icons and
`display: standalone`; Workbox precache populated (47 runtime-visible entries from the 52 built);
and — with the network cut — an offline reload still renders the dashboard heading
(“Salaam, friend.”), the prayer card, and the offline banner, with no JS errors.

Screenshots and JSON reports are written to `/tmp/sakinah-qa`
(`mobile-*.png`, `desktop-*.png`, `flow-*.png`, `report.json`, `pwa-report.json`).

---

## 3. What is verified vs. not

**Verified by execution:**
- The web app builds, renders every route at mobile + desktop, and passes all interaction flows.
- The PWA installs, caches, and works offline.
- Guest-mode API behavior (health flags, `503 DATABASE_UNAVAILABLE`, validation `400`s,
  `404`s) via supertest.
- Prayer/Qibla/Hijri math, content-integrity invariants, and preferences persistence via unit
  tests.

**Implemented and unit-tested at the boundary, but NOT run end-to-end here:**
- **DB-backed auth, sync, account export/delete, and the AI assistant.** No PostgreSQL instance
  was available in this environment, so these paths are exercised only as guest-mode `503`s and
  via code review + the committed migration. To validate them live: `docker compose up -d db`,
  set `DATABASE_URL` + both JWT secrets, `npm run db:migrate`, then register/login and sync.

This distinction is stated plainly so no one assumes account mode was runtime-proven.

---

## 4. Notable fixes during Phase 1

- **Route resolution:** `App.jsx` lives in `src/app/`, so its `./lib`, `./components`,
  `./features` imports were corrected to `../…` (build was failing).
- **AppShell syntax:** a missing paren in `onClose={() => setMore(false)}` broke the build.
- **Guest-mode refresh loop:** first load called `auth/refresh` and logged a `503`. `auth.jsx`
  now gates the initial refresh behind `/api/health`’s `accounts` flag.
- **Prayer status casing (real bug, caught by QA):** `worship.js#forDate` returned uppercase
  `COMPLETED` while the UI compared lowercase `completed`, so a checked-in prayer never showed
  as completed. `forDate` now lowercases the status for UI comparisons while `setPrayer` keeps
  uppercase for sync payloads.
- **Centralized reminders:** removed a duplicate local scheduler in `Prayers.jsx` in favor of the
  app-wide `Reminders` component so reminders work regardless of the active screen.
- **Test setup:** dropped a `@testing-library/jest-dom/vitest` import whose peer
  (`@testing-library/dom`) wasn’t installed; tests use plain Vitest matchers.

---

## 5. Known limitations (honest)

- **No PostgreSQL by default** → accounts, cross-device sync, and AI return `503`. Guest mode is
  complete and is the intended zero-setup experience.
- **Reminders fire only while the app is open.** Background delivery requires Web Push plus a
  push service; browsers do not guarantee exact alarms. The app requests `Notification`
  permission only when the user enables a reminder and explains the limitation.
- **iOS differences:** background audio, notifications, and install are not identical to Android.
  Full-screen install and reliable notifications on iOS need “Add to Home Screen” and HTTPS; the
  UI explains this in-context instead of assuming it works.
- **Morning/evening adhkar** link to Hisn al-Muslim rather than shipping partial content, to
  avoid misquoting.
- **Interface localization** (full UI translation) is out of scope for Phase 1; Arabic content is
  first-class, UI copy is English.
- **Which features need internet** is communicated in-app (Sources & privacy page + offline
  banner), but a per-feature offline matrix is a future refinement.

---

## 6. Suggested next phases

- **Phase 2 — Account mode in production:** stand up PostgreSQL, run the migration, and add
  end-to-end tests for register/login/refresh rotation, idempotent sync (including
  `VERSION_CONFLICT` and `IDEMPOTENCY_CONFLICT` paths), export, and deletion.
- **Phase 3 — Background notifications:** integrate Web Push (VAPID), a push service, and
  server-scheduled adhan/pre-prayer deliveries with `NotificationDelivery` de-duplication;
  document iOS install requirements.
- **Phase 4 — Content depth:** word-by-word Quran UI, tafsir with attributed sources, and
  expanded library articles that encode established-vs-disagreed positions.
- **Phase 5 — Localization & accessibility pass:** UI i18n and a full WCAG audit.
