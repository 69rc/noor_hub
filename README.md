# Noor Hub — Islamic Learning & Worship PWA

A peaceful, mobile-first companion for Quran, Hadith, Arabic learning, prayer, and daily
worship. Noor Hub works fully as a **guest on a single device** (nothing to sign up for) and
optionally **syncs across devices** when you connect a PostgreSQL database and create an
account.

Built as an npm-workspaces monorepo: a React + Vite progressive web app (`apps/web`) and a
Node + Express + Prisma API (`apps/api`).

> **Content integrity is a hard constraint.** Noor Hub never fabricates Quran, Hadith,
> references, or authenticity grades. Religious text is fetched from attributed public
> sources and cached; the app distinguishes established teachings from scholarly
> disagreement, acknowledges uncertainty, and does not present itself as a Mufti.

---

## Tech stack

| Layer     | Choice |
|-----------|--------|
| Frontend  | React 19, Vite 7, **JavaScript/JSX only** (no TypeScript), React Router DOM 7, Tailwind CSS 3, Framer Motion 14, Lucide icons |
| PWA       | `vite-plugin-pwa` (injectManifest) + a hand-written Workbox service worker |
| Storage   | Local-first: `localStorage` (preferences, worship records) + IndexedDB via `idb` (content cache, sync outbox, per-reciter audio downloads) |
| Backend   | Node 22, Express 5, Prisma 6, PostgreSQL, Zod validation, JOSE (JWT), Argon2id |
| Content   | AlQuran Cloud (Quran text/translation), everyayah.com (recitation audio, 26 reciters), Quran.com (word-by-word meaning/audio), Harfi Books (letter & harakat recordings), UmmahAPI (attributed tafsir), fawazahmed0/hadith-api (Hadith), `adhan` (prayer times), `Intl` (Hijri) |
| Testing   | Vitest (web jsdom + api node/supertest), Playwright (viewport, PWA and academy QA scripts) |

---

## Quickstart

### 1. Use Node 22

The repo requires Node ≥ 22.12 (`.nvmrc` pins `22.17.1`). If your default Node is older:

```bash
export PATH="$HOME/.nvm/versions/node/v22.17.1/bin:/usr/local/bin:$PATH"
node -v   # should print v22.x
```

### 2. Install dependencies

```bash
npm install --legacy-peer-deps
```

`--legacy-peer-deps` is required because a couple of dev dependencies declare older peer
ranges than the installed React 19 / Vite 7 provide.

### 3. Configure environment

```bash
cp .env.example .env
```

For **guest mode** (single device, no accounts/sync/AI) you can leave `DATABASE_URL` and the
JWT secrets empty — the API starts, reports `accounts: false`, and the web app runs entirely
on-device.

For **account mode**, fill in the secrets and start PostgreSQL:

```bash
docker compose up -d db          # PostgreSQL 17 on :5432 (see compose.yaml)
npm run db:migrate               # applies prisma/migrations
```

| Variable            | Purpose                                              | Required |
|---------------------|------------------------------------------------------|----------|
| `PORT`              | API port (default 4000)                              | no |
| `WEB_ORIGIN`        | Allowed CORS origin (default `http://localhost:5173`)| no |
| `DATABASE_URL`      | PostgreSQL connection string                         | accounts |
| `JWT_ACCESS_SECRET` | ≥ 32 chars; signs 15-minute access tokens            | accounts |
| `JWT_REFRESH_SECRET`| ≥ 32 chars; **must differ** from the access secret   | accounts |
| `AI_API_KEY` / `AI_BASE_URL` / `AI_MODEL` | OpenAI-compatible provider for the assistant | AI |
| `VITE_API_URL`      | API base URL baked into the web build                | no |

In `NODE_ENV=production` the API **refuses to boot** unless `DATABASE_URL` and both JWT
secrets are present and distinct (validated with Zod in `apps/api/src/config/env.js`).

### 4. Run

```bash
npm run dev        # API (:4000) + web (:5173) together
npm run dev:web    # web only
```

Open http://localhost:5173. The dev server proxies `/api` → `:4000`.

### 5. Production build & preview

```bash
npm run build      # emits dist/ + service worker (precache app shell)
npm run preview    # serves dist/ on :4173
```

---

## Scripts

| Command            | What it does |
|--------------------|--------------|
| `npm run dev`      | API + web concurrently |
| `npm run build`    | Production web build + PWA service worker |
| `npm run preview`  | Serve the production build (:4173) |
| `npm start`        | Run the API only |
| `npm test`         | API tests then web tests (Vitest) |
| `npm run db:generate` | Generate the Prisma client |
| `npm run db:migrate`  | Apply committed migrations (`prisma migrate deploy`) |
| `npm run db:push`     | Push schema without a migration (dev only) |
| `npm run assets`      | Regenerate PWA icons from `scripts/generate-assets.mjs` |
| `node scripts/qa-browser.mjs` | Playwright sweep: 17 routes × mobile+desktop + interaction flows |
| `node scripts/qa-academy.mjs` | Playwright academy sweep: 11 Learn tabs × mobile+desktop + end-to-end learning flow |
| `node scripts/qa-pwa.mjs`     | Playwright PWA checks against the preview build |

---

## Guest mode vs. account mode

Noor Hub is **usable without an account**. This is deliberate — basic worship tracking must
never be gated behind sign-up.

- **Guest (no database configured):** everything runs on-device. Prayer times, Quran/Hadith
  reading (cached), Arabic Academy, tasbih, salah & tahajjud tracking, journal, and
  reminders all work and persist in `localStorage`/IndexedDB. The API returns
  `503 DATABASE_UNAVAILABLE` for auth/sync/account routes; the web app detects this via
  `/api/health` (`accounts: false`) and never attempts a token refresh.
- **Account (database + secrets configured):** register/login issues a 15-minute access token
  and a rotating refresh cookie. On-device worship records sync to the server idempotently,
  and you can export or delete your data.

The header shows a live status chip: “Ready for your day”, “N awaiting sync”, or “Offline
mode”, and an offline banner appears when connectivity drops.

The **Downloads** screen (`/downloads`, linked from the Quran header, the reader’s audio sheet
and Profile) saves whole collections in one go: the full Quran recitation for a chosen reciter
(all 6,236 ayahs), the full Quran text for a chosen translation, and every Hisn al-Muslim
recording. Jobs run with limited concurrency, show live progress, and support pause, resume and
cancel; already-saved files are skipped on restart and failed items are listed so a re-run
retries only those. Saved files stay in IndexedDB on the device and can be removed per collection.

---

## Repository layout

```
sakinah/
├─ apps/
│  ├─ web/      React + Vite PWA (see docs/ARCHITECTURE.md for the full tree)
│  └─ api/      Express + Prisma backend
├─ scripts/     asset generation + Playwright QA harnesses
├─ docs/        architecture, design system, database, phase record
├─ compose.yaml local PostgreSQL 17
└─ .env.example environment template
```

Full folder structure, navigation map, data-flow, and caching strategy are in
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## Documentation

1. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system architecture, folder structure,
   navigation map, auth/sync/PWA data flow, security model.
2. [`docs/DESIGN-SYSTEM.md`](docs/DESIGN-SYSTEM.md) — color tokens, typography, components,
   motion, dark mode, accessibility, responsive behavior.
3. [`docs/DATABASE.md`](docs/DATABASE.md) — Prisma schema overview, enums, sync & conflict
   strategy, migrations.
4. [`docs/PHASE-1.md`](docs/PHASE-1.md) — completed features per module, verification results,
   and honest limitations.

---

## Content sources

All religious content is attributed and fetched from public, licensed sources — never
invented. See the in-app **Profile → Content sources & privacy** page
(`apps/web/src/features/profile/Sources.jsx`) and `docs/PHASE-1.md` for the full list,
including AlQuran Cloud, the fawazahmed0 Hadith API, and the complete **Hisn al-Muslim**
(Fortress of the Muslim) bundled in-app with attributed Arabic text and references.

Recitation audio streams from **everyayah.com** (26 reciters, murattal and mujawwad styles) and
can be downloaded per surah or as the **entire Quran in one go** from the Downloads screen, per
reciter, into IndexedDB for fully offline playback with pause/resume/cancel; switching
reciter never discards a saved download, and the Islamic Network CDN is an automatic one-time
fallback if a stream fails. While a surah recites, the verse being played stays at full opacity
(other verses recede) and the exact word being recited right now is marked with a gold
highlighter that moves word by word with the audio position. The **Hifz** tab tracks memorized ayahs per surah and brings them back for self-graded review on a spaced schedule (1, 3, 7, 14, 30, 60 days); verses are marked from the reader's graduation-cap button. The reader's **Study this verse** opens in-app,
per-verse tafsir quoted from attributed editions — Ibn Kathir (abridged, English) or Tafsir
al-Muyassar (Arabic) via UmmahAPI — shown with its named author and cached on the device after
first load; commentary is presented as scholarly explanation, distinct from the Quran text and
from translations.

---

## Quran Learning Academy

The **Learn** section (`/learn`) is an interactive academy built on the existing app shell —
dashboard, navigation, auth and routing are unchanged. It opens on a personalized overview
(level, streak, daily XP goal, weekly activity, completed lessons and a recommended next step)
and carries eight connected modules:

1. **Arabic Alphabet** — 28 letter cards with two recorded voices, articulation hints,
   isolated/initial/medial/final forms, tap-to-hear audio, recognition & matching exercises.
2. **Harakat** — fathah, kasrah, dammah, sukoon, shaddah and the three tanween marks with
   drills, example words, sound-recognition and fill-the-mark practice.
3. **Word Builder** — tap-to-join letter arrangement across beginner/elementary/intermediate
   decks, with syllable warm-ups and a star rating per word.
4. **Tajweed** — eight lessons (makharij, sifat, noon sakinah & tanween, meem sakinah, madd,
   qalqalah, stopping/starting) with verified Arabic examples played as full recorded ayahs.
5. **Quran Reading** — word-by-word Arabic, toggleable transliteration, Sahih International
   translation, per-word audio/meaning/grammar links, bookmarks and saved reading position.
6. **Hifz** — ayah-range repetition (5/10/20/unlimited), hide/reveal self-testing, manual
   memorisation states and a shared spaced-revision queue (1/3/7/14/30/60 days).
7. **Vocabulary** — Quranic word cards with flashcards, matching, quizzes, saved words and
   spaced repetition.
8. **Understanding** — clearly separated Arabic / transliteration / translation / word meanings /
   attributed tafsir layers, plus Nahw & Sarf primers and a referenced hadith on learning.

A reusable exercise engine powers MCQ, true/false, audio identification, matching, ordering,
fill-the-blank and flashcards with immediate feedback, explanations, attempt recording and
retry. A placement quiz sets one of seven levels; the daily goal is adjustable. Progress is
local-first (`sakinah.academy`) and syncs per user through `GET /api/v1/learn/state` and
`POST /api/v1/learn/sync` when an account is connected. Deep links use `?tab=` and `?lesson=`;
the legacy courses remain at `/learn/:lesson`.

Pronunciation practice uses `MediaRecorder` only after an explicit Record tap: clips stay in
memory on the device, are never uploaded, and are **not** automatically scored. Memorisation is
marked only by the learner — listening alone never marks an ayah memorised. Letter/harakat
audio comes from Harfi Books, word data from Quran.com, grammar links from the Quranic Arabic
Corpus, and tafsir from UmmahAPI (Ibn Kathir, abridged), all attributed in-app.

---

## Hisn al-Muslim (Fortress of the Muslim)

The **complete book** is bundled in-app under **Worship → Hisn al-Muslim** — all 132 chapters,
274 supplications — compiled by Saʿīd ibn ʿAlī ibn Wahf al-Qaḥṭānī.

- **Chapter index** with live search (English/Arabic title or number) and a gentle daily
  progress ring; **chapter reader** with prev/next navigation and deep links
  (`/worship?tab=hisn&chapter=27`).
- Each entry shows the **Arabic text**, optional **transliteration** and **English translation**
  (toggleable), the **repetition count**, and its **attributed hadith reference(s)**. A private
  per-item tap counter tracks repetitions for the day and marks the chapter done when all are
  counted — a personal aid, never a religious requirement or a scorecard.
- **Audio**: per-entry recitation from hisnmuslim.com and full-chapter recitation courtesy
  of Islamway (Doors), played through the global player. Text works fully offline; audio streams
  online, or plays offline once saved in bulk from the Downloads screen.
- **Honest sourcing**: Arabic text and references come from the al-Qaḥṭānī edition
  (`asellam/HisnElMuslim`); English/transliteration from `hisnmuslim.com`, matched by normalized
  Arabic text (never by position). Every entry carries a reference; the 9 entries with no matching
  translation are shown in Arabic only and labelled. Morning and evening adhkar are combined in
  chapter 27, and the Adhkar tab cross-links there.

Data lives in `apps/web/src/data/hisn.json` (lazy-loaded, precached); pure helpers in
`apps/web/src/lib/hisn.js`; UI in `apps/web/src/features/worship/HisnBook.jsx`.

---

## Known limitations (stated honestly)

- **No PostgreSQL by default**, so accounts, cross-device sync, and the AI assistant return
  `503` until a database and secrets are configured. Guest mode is fully functional.
- **In-app reminders fire only while the app is open.** True background delivery needs Web
  Push + a push service; exact alarms are not guaranteed by browsers.
- **iOS background audio, notifications, and install** behave differently from Android.
  Full-screen install and reliable notifications on iOS require “Add to Home Screen” and
  HTTPS; the app explains this in-context rather than assuming it works.
- **Hisn al-Muslim audio needs a connection.** All 132 chapters' text, references and counts
  are bundled offline; recitation audio streams online. A few entries (9) have no matching
  English translation in the cited edition and are shown in Arabic only, labelled honestly.
- **DB-backed auth/sync** is implemented and unit-tested at the HTTP boundary (guest-mode
  responses), but has not been exercised end-to-end against a live PostgreSQL instance in
  this environment.
- **Pronunciation is never auto-scored.** The recorder is a listen-and-compare aid; accurate
  articulation and tajweed correction belong with a qualified teacher.
- **Hifz states are self-reported.** Listening or revealing text does not mark an ayah
  memorised; the learner chooses the state and grades their own revision.
- **Academy audio and word-by-word data need a first online load.** Lessons and quizzes are
  bundled, but Harfi Books recordings and Quran.com word data are fetched and cached on use.

These constraints are surfaced in the UI so users are never misled about what works offline,
in the background, or without an account.

---

## Deploy (Vercel)

The web app is a static Vite build and deploys to Vercel unchanged; the Express API is optional
(accounts, sync and the learning assistant only).

1. Import this repository on Vercel and set: framework preset **Vite**, build command
   `npm run build -w apps/web`, output directory `apps/web/dist`, install command
   `npm ci --legacy-peer-deps`.
2. The root `vercel.json` rewrites unknown routes to `index.html`, so deep links such as
   `/quran/2` resolve instead of 404ing.
3. No environment variables are required: without `VITE_API_URL` the app runs in guest mode and
   every local-first feature works. Point `VITE_API_URL` at an API hosted on an always-on server
   (Railway, Render, Fly…) with Neon or Supabase Postgres to enable accounts and the assistant.
4. The API is not serverless-ready as written — it expects a long-lived process and a direct
   Postgres connection — so keep it off Vercel unless it is refactored into functions.
5. **Installed PWAs self-update — no reinstall.** The service worker uses `autoUpdate` with
   `skipWaiting` + `clientsClaim`, and the page reloads once when a new worker takes control.
   `vercel.json` serves `sw.js`, `index.html` and the manifest with `no-cache` so iOS/Android
   always revalidate the worker on launch. After a deploy, users simply reopen the home-screen
   app (or it refreshes itself) to get the new version; their saved data is untouched.

---

## Security & privacy

- Secrets live only in server environment variables; **no API keys ship to the frontend**.
- Passwords hashed with **Argon2id**; refresh tokens stored as SHA-256 hashes and **rotated**
  on every use, with **reuse detection** that revokes the whole session family.
- Access tokens are short-lived (15 min) JOSE JWTs; the refresh cookie is `httpOnly`,
  `sameSite=lax`, and scoped to `/api/v1/auth`.
- `helmet`, CORS locked to `WEB_ORIGIN`, JSON body limit `256kb`, and rate limiting on
  `/api` (180/min) and auth (30/15 min) and the assistant (10/min).
- Location is **privacy-conscious**: prayer times follow the device location after the
  browser's one-time permission prompt; coordinates stay on-device, are coarse-bucketed
  if ever cached server-side, and manual entry is always available.
- Users can **export** all their data as JSON and **delete** their account (confirmation
  string required). Guests can clear local data from the device without an account.
- Tone is non-judgmental: no shame or guilt-based messaging anywhere in the product.
