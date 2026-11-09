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
| Content   | AlQuran Cloud (Quran text/translation), everyayah.com (recitation audio, 26 reciters), fawazahmed0/hadith-api (Hadith), `adhan` (prayer times), `Intl` (Hijri) |
| Testing   | Vitest (web jsdom + api node/supertest), Playwright (viewport + PWA QA scripts) |

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
npm run build      # emits dist/ + service worker (52 precache entries)
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
including AlQuran Cloud, the fawazahmed0 Hadith API, and Hisn al-Muslim for morning/evening
adhkar (linked rather than partially reproduced, to avoid misquoting).

Recitation audio streams from **everyayah.com** (26 reciters, murattal and mujawwad styles) and
can be downloaded per surah, per reciter, into IndexedDB for fully offline playback; switching
reciter never discards a saved download, and the Islamic Network CDN is an automatic one-time
fallback if a stream fails. On-screen **tajweed colours** mark madd, ghunnah, ikhfa, idgham,
iqlab, izhar, qalqalah and the lam of ال on the individual letters while you read or listen.
They are toggleable in the reader and are presented as a study aid following common conventions
— not a certified mushaf. While a surah recites, the verse being played is indicated with an
animated glow that sweeps across its tajweed letters (other verses recede), and the exact word
being recited right now is marked with a gold highlighter that moves word by word with the audio
position; the colours and the animation are independent toggles, and the animation is disabled
automatically under `prefers-reduced-motion`.

---

## Known limitations (stated honestly)

- **No PostgreSQL by default**, so accounts, cross-device sync, and the AI assistant return
  `503` until a database and secrets are configured. Guest mode is fully functional.
- **In-app reminders fire only while the app is open.** True background delivery needs Web
  Push + a push service; exact alarms are not guaranteed by browsers.
- **iOS background audio, notifications, and install** behave differently from Android.
  Full-screen install and reliable notifications on iOS require “Add to Home Screen” and
  HTTPS; the app explains this in-context rather than assuming it works.
- **Morning/evening adhkar** link out to Hisn al-Muslim instead of shipping partial text.
- **DB-backed auth/sync** is implemented and unit-tested at the HTTP boundary (guest-mode
  responses), but has not been exercised end-to-end against a live PostgreSQL instance in
  this environment.

These constraints are surfaced in the UI so users are never misled about what works offline,
in the background, or without an account.

---

## Security & privacy

- Secrets live only in server environment variables; **no API keys ship to the frontend**.
- Passwords hashed with **Argon2id**; refresh tokens stored as SHA-256 hashes and **rotated**
  on every use, with **reuse detection** that revokes the whole session family.
- Access tokens are short-lived (15 min) JOSE JWTs; the refresh cookie is `httpOnly`,
  `sameSite=lax`, and scoped to `/api/v1/auth`.
- `helmet`, CORS locked to `WEB_ORIGIN`, JSON body limit `256kb`, and rate limiting on
  `/api` (180/min) and auth (30/15 min) and the assistant (10/min).
- Location is **privacy-conscious**: handled on-device, coarse-bucketed if ever cached
  server-side, and never required.
- Users can **export** all their data as JSON and **delete** their account (confirmation
  string required). Guests can clear local data from the device without an account.
- Tone is non-judgmental: no shame or guilt-based messaging anywhere in the product.
