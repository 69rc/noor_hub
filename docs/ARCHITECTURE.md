# Architecture

Noor Hub is an npm-workspaces monorepo with two applications and shared QA tooling.

```
sakinah/
├─ apps/
│  ├─ web/                         # React + Vite PWA (JavaScript/JSX only)
│  └─ api/                         # Node + Express + Prisma backend
├─ scripts/                        # asset + QA tooling
├─ docs/                           # this documentation
├─ compose.yaml                    # local PostgreSQL 17
├─ package.json                    # workspaces root + orchestration scripts
├─ .env.example
├─ .nvmrc                          # Node 22.17.1
└─ .editorconfig
```

---

## 1. System overview

```
┌─────────────────────────────┐        ┌──────────────────────────────┐
│  Browser (PWA)              │        │  Express API (:4000)         │
│  React 19 + Vite            │        │                              │
│                             │  HTTP  │  /api/health                 │
│  localStorage  ── prefs,    │◄──────►│  /api/v1/auth    (accounts)  │
│  worship records            │ /api   │  /api/v1/account (export/del)│
│                             │        │  /api/v1/sync    (idempotent)│
│  IndexedDB(idb)── content   │        │  /api/v1/content (proxy)     │
│  cache + sync outbox        │        │  /api/v1/assistant (AI)      │
│                             │        │                              │
│  Service Worker (Workbox)   │        │  Prisma ──► PostgreSQL       │
│  precache + runtime caches  │        │  (optional; guest mode = none)│
└─────────────┬───────────────┘        └───────────────┬──────────────┘
              │                                         │
              ▼                                         ▼
   Public content APIs                     AlQuran Cloud · fawazahmed0/hadith-api
   (Quran, Hadith, recitation)             (server-side cached, attributed)
```

Two operating modes:

- **Guest mode** — no `DATABASE_URL`/secrets. `apps/api` boots with `prisma = null` and
  `databaseEnabled = false`. Auth/sync/account routes return `503 DATABASE_UNAVAILABLE`;
  content routes still proxy public APIs. The web app reads `/api/health`
  (`accounts: false`) and never calls `auth/refresh`. All worship tracking is local.
- **Account mode** — database + secrets present. Registration/login, rotating refresh
  sessions, idempotent sync, data export/deletion, and the AI assistant become available.

---

## 2. Frontend structure (`apps/web`)

```
apps/web/
├─ index.html                      # app mount + PWA meta
├─ vite.config.js                  # React, VitePWA(injectManifest), dev/preview proxy, vitest
├─ tailwind.config.js              # design tokens (colors, fonts, shadows, keyframes)
├─ postcss.config.js
├─ public/
│  ├─ favicon.svg
│  ├─ icons/                       # 192, 512, maskable-512
│  └─ images/mosque.svg
├─ src/
│  ├─ main.jsx                     # React root
│  ├─ sw.js                        # hand-written Workbox service worker
│  ├─ app/App.jsx                  # providers + router + lazy routes + ErrorBoundary
│  ├─ styles/index.css             # CSS variables, base layer, component classes
│  ├─ components/
│  │  ├─ layout/AppShell.jsx       # header, desktop sidebar, mobile bottom nav, offline banner
│  │  ├─ layout/AudioPlayer.jsx    # global recitation player
│  │  ├─ layout/Reminders.jsx      # app-wide reminder scheduler (15s tick)
│  │  └─ ui/index.jsx              # Card, Button, Modal, Tabs, LoadingState, ErrorState, …
│  ├─ features/                    # one folder per module (route-level screens)
│  │  ├─ onboarding/Onboarding.jsx
│  │  ├─ dashboard/Dashboard.jsx
│  │  ├─ prayers/Prayers.jsx       # times, qibla, methods, check-in, reminders
│  │  ├─ quran/Quran.jsx           # surah/juz index
│  │  ├─ quran/SurahReader.jsx     # reader: arabic, translation, transliteration, audio
│  │  ├─ hadith/Hadith.jsx         # collections + reader
│  │  ├─ hadith/DailyContent.jsx   # daily hadith/verse
│  │  ├─ learn/Learn.jsx           # Arabic Academy course list
│  │  ├─ learn/Lesson.jsx          # lesson blocks + quiz
│  │  ├─ worship/Worship.jsx       # dhikr/tasbih + tahajjud tabs
│  │  ├─ worship/Journal.jsx       # checklist, goals, reflections, fasting
│  │  ├─ library/Knowledge.jsx     # aqeedah/fiqh/seerah library
│  │  ├─ assistant/Assistant.jsx   # grounded AI learning assistant
│  │  ├─ profile/Profile.jsx       # account, preferences, reminders, privacy
│  │  └─ profile/Sources.jsx       # content provenance + privacy principles
│  ├─ lib/                         # framework-agnostic logic + React contexts
│  │  ├─ api.js                    # fetch wrappers (health, authorizedApi, content)
│  │  ├─ auth.jsx                  # AuthProvider: session, refresh gating, pending sync count
│  │  ├─ preferences.jsx           # PreferencesProvider: theme, location, goals, widgets
│  │  ├─ prayer.js                 # adhan-based times, qibla, hijri, next-prayer, sunnah windows
│  │  ├─ worship.js                # salah/tahajjud record store (localStorage, sync payloads)
│  │  ├─ offline.js                # IndexedDB content cache + sync outbox
│  │  ├─ audio.jsx / audio-context.jsx  # recitation playback + range/repeat/speed
│  │  ├─ toast.jsx                 # ToastProvider
│  │  ├─ hooks.js                  # useOnline and small shared hooks
│  │  └─ constants.js              # DEFAULT_PREFERENCES, PRAYERS, METHODS, RECITERS, …
│  └─ data/                        # curated, attributed static content
│     ├─ academy.js                # courses + lessons + quizzes (with sources)
│     └─ dhikr.js                  # dhikr collections (arabic, meaning, reference, count)
└─ tests/                          # vitest: prayer, content-integrity, preferences, setup
```

### Provider composition

`App.jsx` nests providers in a fixed order so each layer can depend on the ones outside it:

```
BrowserRouter
└─ MotionConfig (reducedMotion="user")
   └─ PreferencesProvider      # theme/location/goals/widgets (localStorage-backed)
      └─ ToastProvider
         └─ AuthProvider       # session + health-gated refresh + pending-sync count
            └─ AudioProvider   # global recitation state
               └─ ErrorBoundary
                  └─ Suspense → Routes
```

### Routing / code splitting

All feature screens except the Dashboard are `React.lazy`-loaded, so the initial bundle stays
small and each module is fetched on demand. A top-level `ErrorBoundary` renders a calm recovery
state instead of a blank screen if a route throws.

---

## 3. Navigation map

### Route table (`apps/web/src/app/App.jsx`)

| Path                | Screen          | Module | Notes |
|---------------------|-----------------|--------|-------|
| `/welcome`          | Onboarding      | —      | Outside `AppShell`; first-run only |
| `/` (index)         | Dashboard       | Home   | Eager-loaded, widget-driven |
| `/prayers`          | Prayers         | D/G    | Times, qibla, methods, check-in |
| `/quran`            | Quran           | A      | Surah/juz index |
| `/quran/:surah`     | SurahReader     | A      | Reader + audio |
| `/learn`            | Learn           | C      | Arabic Academy courses |
| `/learn/:lesson`    | Lesson          | C      | Blocks + quiz |
| `/hadith`           | Hadith          | B      | Collections + reader |
| `/worship`          | Worship         | E/F/H  | Dhikr/tasbih + tahajjud tabs |
| `/journal`          | Journal         | I      | Checklist, goals, reflections |
| `/library`          | Knowledge       | H      | Aqeedah/fiqh/seerah |
| `/assistant`        | Assistant       | J      | Grounded AI helper |
| `/profile`          | Profile         | —      | Account, prefs, reminders, privacy |
| `/profile/sources`  | Sources         | —      | Provenance + privacy |
| `*`                 | 404             | —      | Gentle “return to your day” |

### Persistent navigation (`AppShell.jsx`)

- **Mobile / tablet (< `lg`):** a fixed bottom tab bar with five primary destinations —
  **Today `/`, Prayers `/prayers`, Quran `/quran`, Learn `/learn`, You `/profile`** — plus a
  header with theme toggle, assistant shortcut, and a “More” sheet that grids every feature.
- **Desktop (≥ `lg`):** a left sidebar with the same five primary links, a secondary
  “Your companions” group (Worship, Hadith, Knowledge, Journal), an install button, and a
  footer link to sources & privacy.
- **Header (all sizes):** brand, live status chip (ready / N awaiting sync / offline),
  theme toggle, assistant shortcut, “More”, and profile avatar.
- **Offline banner:** a gold strip appears under the header whenever `useOnline()` is false.

Navigation respects the platform: iOS/Android install is explained in-context, and the app
never forces account creation to reach a feature.

---

## 4. Backend structure (`apps/api`)

```
apps/api/
├─ package.json                    # express, prisma, jose, argon2, zod, helmet, cors…
├─ prisma/
│  ├─ schema.prisma                # full domain model (see docs/DATABASE.md)
│  └─ migrations/
│     ├─ 20261109000000_init/migration.sql   # generated from schema (1299 lines)
│     └─ migration_lock.toml                 # provider = postgresql
├─ src/
│  ├─ server.js                    # bootstrap: load env, listen
│  ├─ app.js                       # createApp(): middleware + route mounting + health
│  ├─ config/
│  │  ├─ env.js                    # Zod-validated, frozen config; databaseEnabled/aiEnabled
│  │  └─ database.js               # PrismaClient or null (guest mode)
│  ├─ middleware/
│  │  ├─ errors.js                 # ApiError + asyncRoute + errorHandler
│  │  └─ auth.js                   # signAccessToken, authenticate, requireRole
│  ├─ integrations/content.js      # cached fetch to AlQuran Cloud + hadith-api
│  └─ modules/
│     ├─ auth.js                   # register/login/refresh/logout/me (rotating tokens)
│     ├─ account.js                # export (JSON) + delete (confirmation)
│     ├─ sync.js                   # idempotent, version-checked upserts
│     ├─ content.js                # quran surahs/verse + hadith by collection/number
│     └─ assistant.js              # grounded AI messages with citations + disclaimer
└─ tests/app.test.js               # supertest: health, guest-mode 503s, validation 400/404
```

### Request pipeline (`app.js`)

```
request-id → helmet → cors(WEB_ORIGIN, credentials) → express.json(256kb)
→ cookie-parser → rate-limit(/api, 180/min)
→ GET /api/health
→ /api/v1/auth | /account | /sync | /content | /assistant
→ 404 fallback → errorHandler
```

`/api/health` reports `{ status, version, database, accounts, ai }`, where `accounts` and
`ai` are booleans derived from env, and `database` is `not_configured` / `connected` /
`unavailable`. The frontend uses `accounts` to decide whether to attempt a token refresh.

---

## 5. Data flow

### Local-first writes

Worship state (prayer check-ins, tahajjud, journal, tasbih sessions, lesson progress,
preferences) is written to `localStorage`/IndexedDB **first**, so the UI is always responsive
and works offline. `apps/web/src/lib/worship.js` keys records by `YYYY-MM-DD:prayer` and
normalizes status to lowercase for UI comparisons while storing uppercase for sync payloads.

### Sync (account mode)

1. A local change produces an operation with a stable `clientOpId` (UUID) and a `baseVersion`
   (the `rowVersion` the client last saw).
2. Operations queue in the IndexedDB `outbox` while offline.
3. On reconnect, the client `POST /api/v1/sync` with up to 50 operations.
4. The server, per operation and inside a transaction:
   - **Idempotency:** looks up `(userId, clientOpId)`. A match with the same `payloadHash`
     replays the stored result; a different hash → `409 IDEMPOTENCY_CONFLICT`.
   - **Optimistic concurrency:** if `baseVersion` is supplied and differs from the stored
     `rowVersion` → `409 VERSION_CONFLICT`.
   - **Upserts** the entity (`prayerLog`, `journalEntry`, `dhikrSession`, `lessonProgress`),
     incrementing `rowVersion`; `DELETE` sets `deletedAt` (soft delete).
   - Bumps `user.syncSequence` and records a `SyncOperation` with the outcome.
5. The client removes acknowledged ops from the outbox and updates local `rowVersion`s.

The header’s “N awaiting sync” chip reflects the outbox depth (`useAuth().pending`).

### Authentication

- `POST /auth/register|login` → creates an `AuthSession` + `RefreshToken`, sets the
  `sakinah_refresh` httpOnly cookie (scoped to `/api/v1/auth`), returns a 15-min access token.
- `POST /auth/refresh` → **rotates** the refresh token: the presented token is revoked and
  replaced; if a token that was already revoked/replaced is reused, the whole session is
  revoked (`401 SESSION_REUSED`). A module-level lock serializes concurrent refreshes.
- `authenticate` middleware verifies the JOSE access token, loads the user, and — critically —
  returns `503 DATABASE_UNAVAILABLE` **before** token checks when `prisma` is null (guest mode).

### Content fetching

`apps/api/src/integrations/content.js` wraps upstream calls in an in-memory TTL cache
(24h for Quran/Hadith) with request de-duplication and stale-on-error fallback. The content
module **cross-checks editions** (e.g. Uthmani vs. translation ayah counts, Arabic vs. English
hadith numbers) and returns `502 CONTENT_MISMATCH` rather than serving inconsistent text.
Every response carries its `source` URL and an integrity `note`.

---

## 6. PWA & caching strategy

`src/sw.js` (Workbox, `injectManifest`) defines:

| Route match                         | Strategy              | Cache name             | Policy |
|-------------------------------------|-----------------------|------------------------|--------|
| Navigation (non-`/api/`)            | `NavigationRoute`     | precache → `/index.html`| app shell fallback |
| Precached build assets              | precache              | `workbox-precache-v2-*`| 52 entries |
| `api.alquran.cloud`, `api.aladhan.com` | `NetworkFirst` (8s) | `public-content`       | 160 entries / 30 days |
| `cdn.jsdelivr.net/…hadith-api`      | `StaleWhileRevalidate`| `hadith-content`       | 100 entries / 30 days |
| `cdn.islamic.network`, `everyayah.com`| `CacheFirst`         | `recitation-downloads` | 200 entries / 90 days |

Plus `skipWaiting`/`clientsClaim`, a `SKIP_WAITING` message handler, and `push` /
`notificationclick` listeners. `cleanupOutdatedCaches()` drops stale precaches after a deploy.

Manifest (`vite.config.js`): `display: standalone`, `start_url: /`, three icons (192, 512,
maskable-512), theme `#174b3a`, background `#faf9f4`.

Offline behavior verified by `scripts/qa-pwa.mjs`: with the network cut, a reload still renders
the dashboard heading, the prayer card, and the offline banner — entirely from precache.

---

## 7. Security model

See the README “Security & privacy” section for the summary. Architecturally:

- **No secrets in the client.** AI/provider keys and JWT secrets are server-only; the web app
  talks to `/api/v1/*` and public content endpoints only.
- **Defense in depth at the edge:** helmet, locked CORS, JSON size cap, layered rate limits.
- **Token hygiene:** Argon2id password hashes; SHA-256-hashed, rotating refresh tokens with
  reuse detection; short-lived access JWTs; cookie scoped to the auth path.
- **Least-privilege data:** location is coarse-bucketed if cached; soft deletes preserve
  referential integrity; account deletion cascades.
- **Prompt-injection guard:** the assistant system prompt treats all retrieved content as data,
  forbids inventing evidence, and requires citations for religious claims.

---

## 8. Testing & QA

- **Unit (Vitest):** `apps/web/tests` (prayer math, content integrity, preferences) and
  `apps/api/tests` (HTTP boundary in guest mode). 29 tests.
- **Browser QA (`scripts/qa-browser.mjs`, Playwright):** 17 routes at 390×844 (mobile, touch,
  DPR 2) and 1440×900 (desktop), asserting no runtime errors, no horizontal overflow, no
  console errors, and a page heading; plus interaction flows (prayer check-in persistence,
  theme toggle, tasbih increment/save/reset, journal reflection, profile tabs, assistant
  prompt, Quran reader Arabic). 144 checks.
- **PWA QA (`scripts/qa-pwa.mjs`, Playwright):** service-worker lifecycle, manifest, precache
  population, and offline reload. 8 checks.
