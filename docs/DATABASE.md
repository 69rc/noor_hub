# Database

PostgreSQL via **Prisma 6**. The schema is the single source of truth in
`apps/api/prisma/schema.prisma`; the initial migration is committed at
`apps/api/prisma/migrations/20261109000000_init/migration.sql` (generated with
`prisma migrate diff --from-empty --to-schema-datamodel`, `provider = postgresql`).

The database is **optional at runtime**. When `DATABASE_URL` is absent, `config/database.js`
exports `prisma = null` and the API runs in guest mode (auth/sync/account return
`503 DATABASE_UNAVAILABLE`). Nothing in the schema is required for on-device worship tracking.

---

## 1. Design goals

- **Content is versioned and attributed.** Every Quran ayah, hadith, lesson, and article points
  at a `ContentVersion` → `ContentSource` carrying publisher, canonical URL, license, and
  attribution, with a review workflow (`DRAFT → REVIEWED → PUBLISHED → RETIRED`). This is how
  the app guarantees it never serves unattributed or fabricated religious text.
- **User worship data is private, soft-deletable, and syncable.** Personal records use
  `rowVersion` for optimistic concurrency and `deletedAt` for soft deletes, and every change is
  logged in `SyncOperation` for idempotent replay.
- **Referential integrity for content, cascade for user data.** Content rows use
  `onDelete: Restrict` (you cannot orphan an ayah by deleting a version), while a user’s own
  records `onDelete: Cascade` so account deletion fully removes personal data.

---

## 2. Enums

| Enum | Values | Used by |
|------|--------|---------|
| `Role` | USER, ADMIN, EDITOR | `User.role` |
| `Theme` | SYSTEM, LIGHT, DARK | `UserPreferences.theme` |
| `AsrMethod` | STANDARD, HANAFI | `PrayerSettings`, `PrayerTimeCache` |
| `Prayer` | FAJR, DHUHR, ASR, MAGHRIB, ISHA | `PrayerLog`, notifications |
| `PrayerStatus` | COMPLETED, MISSED, EXCUSED | `PrayerLog.status` |
| `LearningLevel` | BEGINNER, INTERMEDIATE, ADVANCED | preferences, courses |
| `ContentKind` | QURAN, TRANSLATION, TAFSIR, HADITH, COMMENTARY, LESSON, ARTICLE, ADHKAR | `ContentSource.kind` |
| `ReviewStatus` | DRAFT, REVIEWED, PUBLISHED, RETIRED | `ContentVersion` |
| `TextKind` | TRANSLATION, TRANSLITERATION, TAFSIR | `AyahText.kind` |
| `AttemptStatus` | IN_PROGRESS, SUBMITTED, ABANDONED | `QuizAttempt` |
| `Cadence` | DAILY, WEEKLY, MONTHLY, CUSTOM | `WorshipGoal` |
| `NotificationKind` | PRAYER, ADHAN, PRE_PRAYER, MORNING_ADHKAR, EVENING_ADHKAR, QURAN_GOAL, TAHAJJUD, LEARNING, CUSTOM | `NotificationPreference` |
| `MessageRole` | USER, ASSISTANT, SYSTEM | `AIMessage` |
| `SyncAction` | CREATE, UPDATE, DELETE | `SyncOperation` |

---

## 3. Model groups

### Identity & auth
`User`, `UserPreferences`, `LocationPreference`, `PrayerSettings`, `AuthSession`,
`RefreshToken`, `AuthChallenge`.

- `User` has a `syncSequence BigInt` (monotonic per-user operation counter) and `deletedAt`.
- `RefreshToken` stores only a SHA-256 `tokenHash` (`Char(64)`), an expiry, and a self-relation
  `TokenRotation` (`replacedById`) that models rotation and enables **reuse detection**.
- `AuthSession` groups tokens per device and can be revoked wholesale.
- `LocationPreference` stores lat/long as `Decimal(9,6)` and records `consentedAt`.

### Content provenance & versioning
`ContentSource`, `ContentVersion`, `SourceChunk`.

- `ContentVersion` is `@@unique([sourceId, version])` with a `checksum Char(64)` and
  `reviewStatus`; nearly every content table references it with `onDelete: Restrict`.
- `SourceChunk` holds citation-able text spans (`@@unique([versionId, locator])`) used to ground
  AI answers (`AICitation`).

### Quran
`Surah` (PK `number`), `Juz` (PK `number`), `Ayah` (`@@unique([surahNumber, number])`,
`globalNumber` unique), `AyahText` (translation/transliteration/tafsir per ayah+version),
`QuranWord` (word-by-word, `@@unique([ayahId, position])`), `Reciter`, `MediaAsset`,
`QuranAudio` (per-surah and per-ayah, both unique per reciter).

### Quran user data
`QuranBookmark`, `QuranNote`, `LastRead` (one per user), `MemorizationPlan` →
`MemorizationItem` (`strength`, `reviewedAt`). Bookmarks/notes carry `rowVersion` + `deletedAt`.

### Hadith
`HadithCollection` → `HadithBook` (`@@unique([collectionId, number])`) → `Hadith`
(`canonicalReference` unique, `@@unique([bookId, number])`), with `HadithTranslation`,
`HadithGrading` (`@@unique([hadithId, scholar, versionId])` — grades are always attributed to a
scholar + version, never bare), and `HadithCommentary`. User side: `HadithBookmark`
(`@@unique([userId, hadithId])`), `ReadingHistory`.

### Learning (Arabic Academy)
`Course` → `Lesson` (`@@unique([courseId, ordinal])`) → `LessonBlock` (ordered JSON blocks,
optional audio), `Exercise` → `ExerciseOption`, `Quiz` (`@@unique([lessonId, version])`) →
`QuizQuestion` → answers. User side: `Enrollment` (composite PK), `LessonProgress`
(composite PK, `rowVersion`), `QuizAttempt` (`@@unique([userId, quizId, attemptNumber])`) →
`QuizAnswer`.

### Dhikr & tasbih
`DhikrCollection` → `Dhikr` (arabic, transliteration, meaning, `reference`,
`repetitionEvidence`, `recommendedCount`, `@@unique([collectionId, ordinal])`). User side:
`PersonalDhikrCollection` → `PersonalDhikrItem` (custom targets), and `DhikrSession`
(saved counter sessions with `rowVersion` + `deletedAt`).

### Prayer & tahajjud
`PrayerLog` (`@@unique([userId, localDate, prayer])`, `localDate` as `@db.Date`, timezone,
status, `rowVersion`, `deletedAt`), `TahajjudGoal` (one per user: nights/week, rakah target,
reminder time), `TahajjudRecord` (`@@unique([userId, nightDate])`, rakah + separate
`witrRakahs`). `PrayerTimeCache` stores bucketed coordinates
(`Decimal(6,2)` lat/long buckets) so precise location is not retained server-side.

### Knowledge library
`Category` → `Article` (`body Json`, optional `scholarlyPositions Json` to record established
views vs. disagreement), versioned.

### Worship journal & goals
`WorshipGoal` (`cadence`, `target`, `unit`) → `GoalProgress` (`@@unique([goalId, periodStart])`),
`JournalEntry` (`localDate`, `checklist Json`, `fasting`, `tags String[]`, `rowVersion`,
`deletedAt`, indexed by `[userId, localDate(desc)]`).

### Notifications & push
`NotificationPreference` (`@@unique([userId, kind, prayer])`, `offsetMinutes`, `adhanAsset`),
`PushSubscription` (`endpointHash` unique), `NotificationDelivery` (`dedupeKey` unique,
scheduled/sent/status).

### AI assistant
`AIConversation` → `AIMessage` (`role`, `model`, `promptVersion`, `status` =
GROUNDED/UNCITED/COMPLETE) → `AICitation` (links a message to a `SourceChunk` with excerpt +
locator), plus `AIRequest` (provider, usage, `requestId` unique for idempotency).

### Sync ledger
`SyncOperation` — the backbone of idempotent sync:
`@@unique([userId, clientOpId])` (idempotency) and `@@unique([userId, sequence])` (ordering),
with `entityType`, `entityId`, `action`, `payloadHash Char(64)`, `baseVersion`, and `result Json`.

---

## 4. Sync & conflict strategy

Sync is **idempotent** and **optimistically concurrent**, implemented in
`apps/api/src/modules/sync.js`:

1. **Idempotency by `clientOpId`.** Each client operation carries a UUID. On receipt the server
   looks up `(userId, clientOpId)`:
   - Found **and** `payloadHash` matches → replay the stored `result` (`replayed: true`).
   - Found **but** hash differs → `409 IDEMPOTENCY_CONFLICT` (an op ID was reused for new
     content — a client bug, surfaced rather than silently accepted).
   - Not found → process normally.
2. **Optimistic concurrency by `rowVersion`.** If the client sends `baseVersion` and it does not
   match the stored `rowVersion` (or the row belongs to another user) → `409 VERSION_CONFLICT`,
   telling the client the server has a newer version. The client must reconcile before retrying.
3. **Upsert + increment.** Entities are upserted by their natural key
   (`prayerLog` by `[userId, localDate, prayer]`, `lessonProgress` by `[userId, lessonId]`,
   others by `id`), each write doing `rowVersion: { increment: 1 }`. `CREATE` starts at
   `rowVersion: 1`; `DELETE` sets `deletedAt` (soft delete) rather than removing the row.
4. **Ordering.** `user.syncSequence` is incremented per accepted operation and stored on the
   `SyncOperation`, giving a total order per user.
5. **Validation.** Each entity type has a dedicated Zod payload schema (e.g. `prayerPayload`
   validates the IANA timezone with `Intl.DateTimeFormat`, `localDate` with a regex, status
   against the enum). Invalid payloads are rejected before any write.

Supported entity types: `prayerLog`, `journalEntry`, `dhikrSession`, `lessonProgress`.

### Client side

Operations queue in an IndexedDB `outbox` (`apps/web/src/lib/offline.js`) while offline and are
flushed on reconnect. `useAuth().pending` exposes the outbox depth for the header’s
“N awaiting sync” chip. Acknowledged operations are removed and local `rowVersion`s updated.

---

## 5. Soft deletes & data lifecycle

- Personal records (`PrayerLog`, `JournalEntry`, `DhikrSession`, `QuranBookmark`, `QuranNote`,
  `TahajjudRecord`, `AIConversation`) use `deletedAt` so history is recoverable and referential
  integrity holds; queries filter `deletedAt: null`.
- `User.deletedAt` supports account soft-deletion; `authenticate` ignores deleted users.
- **Export:** `GET /api/v1/account/export` assembles all of a user’s rows into a downloadable
  JSON (`Content-Disposition: attachment`).
- **Delete:** `DELETE /api/v1/account` requires a body `{ confirmation: "DELETE" }` and cascades
  through the user’s data, then clears the refresh cookie.
- Guests can wipe device data locally without any server round-trip (Profile → Privacy).

---

## 6. Migrations & local setup

```bash
docker compose up -d db                 # PostgreSQL 17 (user/pass/db: sakinah/sakinah_local/sakinah)
npm run db:generate                     # prisma generate
npm run db:migrate                      # prisma migrate deploy (applies the committed init migration)
```

`compose.yaml` includes a `pg_isready` healthcheck. To iterate on the schema in development
without writing a migration, use `npm run db:push`. To create a new migration after editing
`schema.prisma`, use `prisma migrate dev` inside `apps/api`.

---

## 7. Privacy notes in the schema

- **Location** is stored only if the user consents (`LocationPreference.consentedAt`) and, for
  prayer-time caching, is **bucketed** to `Decimal(6,2)` (~1km) rather than stored at full
  precision — coarse enough for timings, not a precise trace.
- **Refresh tokens** are never stored in plaintext (only `tokenHash`).
- **Push endpoints** are de-duplicated by `endpointHash`, and deliveries carry a `dedupeKey` to
  avoid double-notifying.
- **AI** conversations separate the user’s message from retrieved evidence, and citations link
  to `SourceChunk` locators so answers are auditable rather than free-floating claims.
