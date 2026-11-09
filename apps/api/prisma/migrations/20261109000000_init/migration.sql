-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'EDITOR');

-- CreateEnum
CREATE TYPE "Theme" AS ENUM ('SYSTEM', 'LIGHT', 'DARK');

-- CreateEnum
CREATE TYPE "AsrMethod" AS ENUM ('STANDARD', 'HANAFI');

-- CreateEnum
CREATE TYPE "Prayer" AS ENUM ('FAJR', 'DHUHR', 'ASR', 'MAGHRIB', 'ISHA');

-- CreateEnum
CREATE TYPE "PrayerStatus" AS ENUM ('COMPLETED', 'MISSED', 'EXCUSED');

-- CreateEnum
CREATE TYPE "LearningLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "ContentKind" AS ENUM ('QURAN', 'TRANSLATION', 'TAFSIR', 'HADITH', 'COMMENTARY', 'LESSON', 'ARTICLE', 'ADHKAR');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('DRAFT', 'REVIEWED', 'PUBLISHED', 'RETIRED');

-- CreateEnum
CREATE TYPE "TextKind" AS ENUM ('TRANSLATION', 'TRANSLITERATION', 'TAFSIR');

-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "Cadence" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "NotificationKind" AS ENUM ('PRAYER', 'ADHAN', 'PRE_PRAYER', 'MORNING_ADHKAR', 'EVENING_ADHKAR', 'QURAN_GOAL', 'TAHAJJUD', 'LEARNING', 'CUSTOM');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "SyncAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" VARCHAR(80) NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "syncSequence" BIGINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPreferences" (
    "userId" UUID NOT NULL,
    "locale" VARCHAR(12) NOT NULL DEFAULT 'en',
    "theme" "Theme" NOT NULL DEFAULT 'SYSTEM',
    "arabicFont" VARCHAR(40) NOT NULL DEFAULT 'amiri',
    "translationId" VARCHAR(60) NOT NULL DEFAULT 'en.sahih',
    "reciterId" VARCHAR(60) NOT NULL DEFAULT 'ar.alafasy',
    "learningLevel" "LearningLevel" NOT NULL DEFAULT 'BEGINNER',
    "dashboardWidgets" JSONB NOT NULL DEFAULT '["prayer","quran","dhikr","learning","hadith","verse","tahajjud"]',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "UserPreferences_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "LocationPreference" (
    "userId" UUID NOT NULL,
    "label" VARCHAR(120) NOT NULL,
    "country" CHAR(2) NOT NULL,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "timezone" VARCHAR(60) NOT NULL,
    "consentedAt" TIMESTAMPTZ(3),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "LocationPreference_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "PrayerSettings" (
    "userId" UUID NOT NULL,
    "method" VARCHAR(30) NOT NULL DEFAULT 'MWL',
    "asrMethod" "AsrMethod" NOT NULL DEFAULT 'STANDARD',
    "offsets" JSONB NOT NULL DEFAULT '{}',
    "reminders" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "PrayerSettings_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "AuthSession" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "deviceLabel" VARCHAR(160) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "revokedAt" TIMESTAMPTZ(3),

    CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "tokenHash" CHAR(64) NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMPTZ(3),
    "replacedById" UUID,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthChallenge" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "purpose" VARCHAR(40) NOT NULL,
    "tokenHash" CHAR(64) NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "consumedAt" TIMESTAMPTZ(3),

    CONSTRAINT "AuthChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentSource" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "publisher" VARCHAR(160) NOT NULL,
    "canonicalUrl" TEXT NOT NULL,
    "license" TEXT NOT NULL,
    "attribution" TEXT NOT NULL,
    "kind" "ContentKind" NOT NULL,

    CONSTRAINT "ContentSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentVersion" (
    "id" UUID NOT NULL,
    "sourceId" UUID NOT NULL,
    "version" VARCHAR(60) NOT NULL,
    "checksum" CHAR(64) NOT NULL,
    "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'DRAFT',
    "reviewedBy" UUID,
    "publishedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceChunk" (
    "id" UUID NOT NULL,
    "versionId" UUID NOT NULL,
    "locator" VARCHAR(160) NOT NULL,
    "ordinal" INTEGER NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "SourceChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Surah" (
    "number" INTEGER NOT NULL,
    "nameArabic" TEXT NOT NULL,
    "nameEnglish" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,
    "revelation" VARCHAR(20) NOT NULL,
    "ayahCount" INTEGER NOT NULL,
    "versionId" UUID NOT NULL,

    CONSTRAINT "Surah_pkey" PRIMARY KEY ("number")
);

-- CreateTable
CREATE TABLE "Juz" (
    "number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Juz_pkey" PRIMARY KEY ("number")
);

-- CreateTable
CREATE TABLE "Ayah" (
    "id" UUID NOT NULL,
    "surahNumber" INTEGER NOT NULL,
    "number" INTEGER NOT NULL,
    "globalNumber" INTEGER NOT NULL,
    "juzNumber" INTEGER NOT NULL,
    "page" INTEGER NOT NULL,
    "textUthmani" TEXT NOT NULL,
    "versionId" UUID NOT NULL,

    CONSTRAINT "Ayah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AyahText" (
    "id" UUID NOT NULL,
    "ayahId" UUID NOT NULL,
    "kind" "TextKind" NOT NULL,
    "language" VARCHAR(12) NOT NULL,
    "text" TEXT NOT NULL,
    "versionId" UUID NOT NULL,

    CONSTRAINT "AyahText_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuranWord" (
    "id" UUID NOT NULL,
    "ayahId" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "arabic" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "transliteration" TEXT NOT NULL,
    "versionId" UUID NOT NULL,

    CONSTRAINT "QuranWord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reciter" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(60) NOT NULL,
    "name" TEXT NOT NULL,
    "style" TEXT,

    CONSTRAINT "Reciter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "checksum" CHAR(64) NOT NULL,
    "mimeType" VARCHAR(60) NOT NULL,
    "duration" INTEGER,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuranAudio" (
    "id" UUID NOT NULL,
    "reciterId" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "surahNumber" INTEGER,
    "ayahId" UUID,

    CONSTRAINT "QuranAudio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuranBookmark" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "surahNumber" INTEGER,
    "ayahId" UUID,
    "label" VARCHAR(100),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rowVersion" INTEGER NOT NULL DEFAULT 1,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "QuranBookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuranNote" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "ayahId" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "rowVersion" INTEGER NOT NULL DEFAULT 1,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "QuranNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LastRead" (
    "userId" UUID NOT NULL,
    "ayahId" UUID NOT NULL,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "LastRead_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "MemorizationPlan" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "targetDate" DATE,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemorizationPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemorizationItem" (
    "id" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "ayahId" UUID NOT NULL,
    "strength" INTEGER NOT NULL DEFAULT 0,
    "reviewedAt" TIMESTAMPTZ(3),

    CONSTRAINT "MemorizationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HadithCollection" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(60) NOT NULL,
    "name" TEXT NOT NULL,
    "nameArabic" TEXT,

    CONSTRAINT "HadithCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HadithBook" (
    "id" UUID NOT NULL,
    "collectionId" UUID NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "HadithBook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hadith" (
    "id" UUID NOT NULL,
    "bookId" UUID NOT NULL,
    "number" INTEGER NOT NULL,
    "arabicNumber" VARCHAR(30),
    "canonicalReference" TEXT NOT NULL,
    "arabic" TEXT NOT NULL,
    "narrator" TEXT,
    "versionId" UUID NOT NULL,

    CONSTRAINT "Hadith_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HadithTranslation" (
    "id" UUID NOT NULL,
    "hadithId" UUID NOT NULL,
    "language" VARCHAR(12) NOT NULL,
    "text" TEXT NOT NULL,
    "versionId" UUID NOT NULL,

    CONSTRAINT "HadithTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HadithGrading" (
    "id" UUID NOT NULL,
    "hadithId" UUID NOT NULL,
    "scholar" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "citation" TEXT NOT NULL,
    "versionId" UUID NOT NULL,

    CONSTRAINT "HadithGrading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HadithCommentary" (
    "id" UUID NOT NULL,
    "hadithId" UUID NOT NULL,
    "scholar" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "citation" TEXT NOT NULL,
    "versionId" UUID NOT NULL,

    CONSTRAINT "HadithCommentary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HadithBookmark" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "hadithId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HadithBookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadingHistory" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "hadithId" UUID,
    "articleId" UUID,
    "readAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReadingHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "level" "LearningLevel" NOT NULL,
    "ordinal" INTEGER NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "title" TEXT NOT NULL,
    "ordinal" INTEGER NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "versionId" UUID NOT NULL,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonBlock" (
    "id" UUID NOT NULL,
    "lessonId" UUID NOT NULL,
    "ordinal" INTEGER NOT NULL,
    "kind" VARCHAR(30) NOT NULL,
    "body" JSONB NOT NULL,
    "audioId" UUID,

    CONSTRAINT "LessonBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exercise" (
    "id" UUID NOT NULL,
    "lessonId" UUID NOT NULL,
    "prompt" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "ordinal" INTEGER NOT NULL,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseOption" (
    "id" UUID NOT NULL,
    "exerciseId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ExerciseOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quiz" (
    "id" UUID NOT NULL,
    "lessonId" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Quiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizQuestion" (
    "id" UUID NOT NULL,
    "quizId" UUID NOT NULL,
    "ordinal" INTEGER NOT NULL,
    "prompt" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "answerKey" JSONB NOT NULL,

    CONSTRAINT "QuizQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizAttempt" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "quizId" UUID NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "quizVersion" INTEGER NOT NULL,
    "status" "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "score" DECIMAL(5,2),
    "startedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMPTZ(3),

    CONSTRAINT "QuizAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizAnswer" (
    "id" UUID NOT NULL,
    "attemptId" UUID NOT NULL,
    "questionId" UUID NOT NULL,
    "response" JSONB NOT NULL,
    "awardedScore" DECIMAL(5,2) NOT NULL DEFAULT 0,

    CONSTRAINT "QuizAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "userId" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "enrolledAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("userId","courseId")
);

-- CreateTable
CREATE TABLE "LessonProgress" (
    "userId" UUID NOT NULL,
    "lessonId" UUID NOT NULL,
    "completedAt" TIMESTAMPTZ(3),
    "lastPosition" INTEGER NOT NULL DEFAULT 0,
    "rowVersion" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "LessonProgress_pkey" PRIMARY KEY ("userId","lessonId")
);

-- CreateTable
CREATE TABLE "DhikrCollection" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "title" TEXT NOT NULL,
    "period" VARCHAR(40) NOT NULL,

    CONSTRAINT "DhikrCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dhikr" (
    "id" UUID NOT NULL,
    "collectionId" UUID NOT NULL,
    "ordinal" INTEGER NOT NULL,
    "arabic" TEXT NOT NULL,
    "transliteration" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,
    "reference" TEXT,
    "repetitionEvidence" TEXT,
    "recommendedCount" INTEGER,
    "audioId" UUID,
    "versionId" UUID NOT NULL,

    CONSTRAINT "Dhikr_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalDhikrCollection" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "baseCollectionId" UUID,

    CONSTRAINT "PersonalDhikrCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalDhikrItem" (
    "collectionId" UUID NOT NULL,
    "dhikrId" UUID NOT NULL,
    "target" INTEGER NOT NULL,

    CONSTRAINT "PersonalDhikrItem_pkey" PRIMARY KEY ("collectionId","dhikrId")
);

-- CreateTable
CREATE TABLE "DhikrSession" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "dhikrId" UUID,
    "label" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "target" INTEGER NOT NULL DEFAULT 33,
    "startedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMPTZ(3),
    "rowVersion" INTEGER NOT NULL DEFAULT 1,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "DhikrSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrayerLog" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "localDate" DATE NOT NULL,
    "prayer" "Prayer" NOT NULL,
    "timezone" VARCHAR(60) NOT NULL,
    "status" "PrayerStatus" NOT NULL,
    "performedAt" TIMESTAMPTZ(3),
    "rowVersion" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "PrayerLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TahajjudGoal" (
    "userId" UUID NOT NULL,
    "nightsPerWeek" INTEGER NOT NULL DEFAULT 2,
    "rakahTarget" INTEGER NOT NULL DEFAULT 2,
    "reminderAt" VARCHAR(5),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "TahajjudGoal_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "TahajjudRecord" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "nightDate" DATE NOT NULL,
    "startedAt" TIMESTAMPTZ(3) NOT NULL,
    "rakahCount" INTEGER NOT NULL,
    "witrRakahs" INTEGER NOT NULL DEFAULT 0,
    "rowVersion" INTEGER NOT NULL DEFAULT 1,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "TahajjudRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "body" JSONB NOT NULL,
    "scholarlyPositions" JSONB,
    "versionId" UUID NOT NULL,
    "publishedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorshipGoal" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "kind" VARCHAR(40) NOT NULL,
    "cadence" "Cadence" NOT NULL,
    "target" INTEGER NOT NULL,
    "unit" VARCHAR(30) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorshipGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoalProgress" (
    "id" UUID NOT NULL,
    "goalId" UUID NOT NULL,
    "periodStart" DATE NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,
    "rowVersion" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "GoalProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "localDate" DATE NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "body" TEXT NOT NULL,
    "checklist" JSONB NOT NULL DEFAULT '{}',
    "fasting" BOOLEAN,
    "tags" TEXT[],
    "rowVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrayerTimeCache" (
    "id" UUID NOT NULL,
    "localDate" DATE NOT NULL,
    "latitudeBucket" DECIMAL(6,2) NOT NULL,
    "longitudeBucket" DECIMAL(6,2) NOT NULL,
    "method" VARCHAR(30) NOT NULL,
    "asrMethod" "AsrMethod" NOT NULL,
    "timezone" VARCHAR(60) NOT NULL,
    "timings" JSONB NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "PrayerTimeCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "kind" "NotificationKind" NOT NULL,
    "prayer" "Prayer",
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "offsetMinutes" INTEGER NOT NULL DEFAULT 0,
    "customTime" VARCHAR(5),
    "adhanAsset" VARCHAR(160),

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "endpointHash" CHAR(64) NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationDelivery" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "subscriptionId" UUID NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "scheduledAt" TIMESTAMPTZ(3) NOT NULL,
    "sentAt" TIMESTAMPTZ(3),
    "status" VARCHAR(30) NOT NULL,

    CONSTRAINT "NotificationDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIConversation" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "AIConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIMessage" (
    "id" UUID NOT NULL,
    "conversationId" UUID NOT NULL,
    "ordinal" INTEGER NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "model" TEXT,
    "promptVersion" TEXT,
    "status" VARCHAR(30) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AICitation" (
    "id" UUID NOT NULL,
    "messageId" UUID NOT NULL,
    "chunkId" UUID NOT NULL,
    "excerpt" TEXT NOT NULL,
    "locator" TEXT NOT NULL,

    CONSTRAINT "AICitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIRequest" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "requestId" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "status" VARCHAR(30) NOT NULL,
    "usage" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncOperation" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "clientOpId" UUID NOT NULL,
    "sequence" BIGINT NOT NULL,
    "entityType" VARCHAR(60) NOT NULL,
    "entityId" UUID NOT NULL,
    "action" "SyncAction" NOT NULL,
    "payloadHash" CHAR(64) NOT NULL,
    "baseVersion" INTEGER,
    "result" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncOperation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "AuthSession_userId_revokedAt_idx" ON "AuthSession"("userId", "revokedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_replacedById_key" ON "RefreshToken"("replacedById");

-- CreateIndex
CREATE INDEX "RefreshToken_sessionId_expiresAt_idx" ON "RefreshToken"("sessionId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "AuthChallenge_tokenHash_key" ON "AuthChallenge"("tokenHash");

-- CreateIndex
CREATE INDEX "AuthChallenge_userId_purpose_idx" ON "AuthChallenge"("userId", "purpose");

-- CreateIndex
CREATE UNIQUE INDEX "ContentSource_slug_key" ON "ContentSource"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ContentVersion_sourceId_version_key" ON "ContentVersion"("sourceId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "SourceChunk_versionId_locator_key" ON "SourceChunk"("versionId", "locator");

-- CreateIndex
CREATE INDEX "Surah_versionId_idx" ON "Surah"("versionId");

-- CreateIndex
CREATE INDEX "Juz_number_idx" ON "Juz"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Ayah_globalNumber_key" ON "Ayah"("globalNumber");

-- CreateIndex
CREATE INDEX "Ayah_juzNumber_page_idx" ON "Ayah"("juzNumber", "page");

-- CreateIndex
CREATE UNIQUE INDEX "Ayah_surahNumber_number_key" ON "Ayah"("surahNumber", "number");

-- CreateIndex
CREATE UNIQUE INDEX "AyahText_ayahId_kind_versionId_key" ON "AyahText"("ayahId", "kind", "versionId");

-- CreateIndex
CREATE UNIQUE INDEX "QuranWord_ayahId_position_key" ON "QuranWord"("ayahId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "Reciter_slug_key" ON "Reciter"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "QuranAudio_reciterId_surahNumber_key" ON "QuranAudio"("reciterId", "surahNumber");

-- CreateIndex
CREATE UNIQUE INDEX "QuranAudio_reciterId_ayahId_key" ON "QuranAudio"("reciterId", "ayahId");

-- CreateIndex
CREATE INDEX "QuranBookmark_userId_createdAt_idx" ON "QuranBookmark"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "QuranNote_userId_ayahId_idx" ON "QuranNote"("userId", "ayahId");

-- CreateIndex
CREATE INDEX "MemorizationPlan_userId_idx" ON "MemorizationPlan"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MemorizationItem_planId_ayahId_key" ON "MemorizationItem"("planId", "ayahId");

-- CreateIndex
CREATE UNIQUE INDEX "HadithCollection_slug_key" ON "HadithCollection"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "HadithBook_collectionId_number_key" ON "HadithBook"("collectionId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "Hadith_canonicalReference_key" ON "Hadith"("canonicalReference");

-- CreateIndex
CREATE INDEX "Hadith_narrator_idx" ON "Hadith"("narrator");

-- CreateIndex
CREATE UNIQUE INDEX "Hadith_bookId_number_key" ON "Hadith"("bookId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "HadithTranslation_hadithId_versionId_key" ON "HadithTranslation"("hadithId", "versionId");

-- CreateIndex
CREATE UNIQUE INDEX "HadithGrading_hadithId_scholar_versionId_key" ON "HadithGrading"("hadithId", "scholar", "versionId");

-- CreateIndex
CREATE INDEX "HadithCommentary_hadithId_idx" ON "HadithCommentary"("hadithId");

-- CreateIndex
CREATE UNIQUE INDEX "HadithBookmark_userId_hadithId_key" ON "HadithBookmark"("userId", "hadithId");

-- CreateIndex
CREATE INDEX "ReadingHistory_userId_readAt_idx" ON "ReadingHistory"("userId", "readAt");

-- CreateIndex
CREATE UNIQUE INDEX "Course_slug_key" ON "Course"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Lesson_slug_key" ON "Lesson"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Lesson_courseId_ordinal_key" ON "Lesson"("courseId", "ordinal");

-- CreateIndex
CREATE UNIQUE INDEX "LessonBlock_lessonId_ordinal_key" ON "LessonBlock"("lessonId", "ordinal");

-- CreateIndex
CREATE UNIQUE INDEX "Quiz_lessonId_version_key" ON "Quiz"("lessonId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "QuizQuestion_quizId_ordinal_key" ON "QuizQuestion"("quizId", "ordinal");

-- CreateIndex
CREATE UNIQUE INDEX "QuizAttempt_userId_quizId_attemptNumber_key" ON "QuizAttempt"("userId", "quizId", "attemptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "QuizAnswer_attemptId_questionId_key" ON "QuizAnswer"("attemptId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "DhikrCollection_slug_key" ON "DhikrCollection"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Dhikr_collectionId_ordinal_key" ON "Dhikr"("collectionId", "ordinal");

-- CreateIndex
CREATE INDEX "PersonalDhikrCollection_userId_idx" ON "PersonalDhikrCollection"("userId");

-- CreateIndex
CREATE INDEX "DhikrSession_userId_startedAt_idx" ON "DhikrSession"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "PrayerLog_userId_localDate_idx" ON "PrayerLog"("userId", "localDate");

-- CreateIndex
CREATE UNIQUE INDEX "PrayerLog_userId_localDate_prayer_key" ON "PrayerLog"("userId", "localDate", "prayer");

-- CreateIndex
CREATE UNIQUE INDEX "TahajjudRecord_userId_nightDate_key" ON "TahajjudRecord"("userId", "nightDate");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");

-- CreateIndex
CREATE INDEX "WorshipGoal_userId_idx" ON "WorshipGoal"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GoalProgress_goalId_periodStart_key" ON "GoalProgress"("goalId", "periodStart");

-- CreateIndex
CREATE INDEX "JournalEntry_userId_localDate_idx" ON "JournalEntry"("userId", "localDate" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "PrayerTimeCache_localDate_latitudeBucket_longitudeBucket_me_key" ON "PrayerTimeCache"("localDate", "latitudeBucket", "longitudeBucket", "method", "asrMethod", "timezone");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_kind_prayer_key" ON "NotificationPreference"("userId", "kind", "prayer");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpointHash_key" ON "PushSubscription"("endpointHash");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationDelivery_dedupeKey_key" ON "NotificationDelivery"("dedupeKey");

-- CreateIndex
CREATE INDEX "NotificationDelivery_scheduledAt_status_idx" ON "NotificationDelivery"("scheduledAt", "status");

-- CreateIndex
CREATE INDEX "AIConversation_userId_updatedAt_idx" ON "AIConversation"("userId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AIMessage_conversationId_ordinal_key" ON "AIMessage"("conversationId", "ordinal");

-- CreateIndex
CREATE UNIQUE INDEX "AICitation_messageId_chunkId_key" ON "AICitation"("messageId", "chunkId");

-- CreateIndex
CREATE UNIQUE INDEX "AIRequest_requestId_key" ON "AIRequest"("requestId");

-- CreateIndex
CREATE INDEX "AIRequest_userId_createdAt_idx" ON "AIRequest"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SyncOperation_userId_clientOpId_key" ON "SyncOperation"("userId", "clientOpId");

-- CreateIndex
CREATE UNIQUE INDEX "SyncOperation_userId_sequence_key" ON "SyncOperation"("userId", "sequence");

-- AddForeignKey
ALTER TABLE "UserPreferences" ADD CONSTRAINT "UserPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationPreference" ADD CONSTRAINT "LocationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrayerSettings" ADD CONSTRAINT "PrayerSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthSession" ADD CONSTRAINT "AuthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AuthSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_replacedById_fkey" FOREIGN KEY ("replacedById") REFERENCES "RefreshToken"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthChallenge" ADD CONSTRAINT "AuthChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentVersion" ADD CONSTRAINT "ContentVersion_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "ContentSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceChunk" ADD CONSTRAINT "SourceChunk_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "ContentVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Surah" ADD CONSTRAINT "Surah_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "ContentVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ayah" ADD CONSTRAINT "Ayah_surahNumber_fkey" FOREIGN KEY ("surahNumber") REFERENCES "Surah"("number") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ayah" ADD CONSTRAINT "Ayah_juzNumber_fkey" FOREIGN KEY ("juzNumber") REFERENCES "Juz"("number") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ayah" ADD CONSTRAINT "Ayah_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "ContentVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AyahText" ADD CONSTRAINT "AyahText_ayahId_fkey" FOREIGN KEY ("ayahId") REFERENCES "Ayah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AyahText" ADD CONSTRAINT "AyahText_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "ContentVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuranWord" ADD CONSTRAINT "QuranWord_ayahId_fkey" FOREIGN KEY ("ayahId") REFERENCES "Ayah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuranWord" ADD CONSTRAINT "QuranWord_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "ContentVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuranAudio" ADD CONSTRAINT "QuranAudio_reciterId_fkey" FOREIGN KEY ("reciterId") REFERENCES "Reciter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuranAudio" ADD CONSTRAINT "QuranAudio_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuranAudio" ADD CONSTRAINT "QuranAudio_surahNumber_fkey" FOREIGN KEY ("surahNumber") REFERENCES "Surah"("number") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuranAudio" ADD CONSTRAINT "QuranAudio_ayahId_fkey" FOREIGN KEY ("ayahId") REFERENCES "Ayah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuranBookmark" ADD CONSTRAINT "QuranBookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuranBookmark" ADD CONSTRAINT "QuranBookmark_surahNumber_fkey" FOREIGN KEY ("surahNumber") REFERENCES "Surah"("number") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuranBookmark" ADD CONSTRAINT "QuranBookmark_ayahId_fkey" FOREIGN KEY ("ayahId") REFERENCES "Ayah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuranNote" ADD CONSTRAINT "QuranNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuranNote" ADD CONSTRAINT "QuranNote_ayahId_fkey" FOREIGN KEY ("ayahId") REFERENCES "Ayah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LastRead" ADD CONSTRAINT "LastRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LastRead" ADD CONSTRAINT "LastRead_ayahId_fkey" FOREIGN KEY ("ayahId") REFERENCES "Ayah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemorizationPlan" ADD CONSTRAINT "MemorizationPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemorizationItem" ADD CONSTRAINT "MemorizationItem_planId_fkey" FOREIGN KEY ("planId") REFERENCES "MemorizationPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemorizationItem" ADD CONSTRAINT "MemorizationItem_ayahId_fkey" FOREIGN KEY ("ayahId") REFERENCES "Ayah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HadithBook" ADD CONSTRAINT "HadithBook_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "HadithCollection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hadith" ADD CONSTRAINT "Hadith_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "HadithBook"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hadith" ADD CONSTRAINT "Hadith_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "ContentVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HadithTranslation" ADD CONSTRAINT "HadithTranslation_hadithId_fkey" FOREIGN KEY ("hadithId") REFERENCES "Hadith"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HadithTranslation" ADD CONSTRAINT "HadithTranslation_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "ContentVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HadithGrading" ADD CONSTRAINT "HadithGrading_hadithId_fkey" FOREIGN KEY ("hadithId") REFERENCES "Hadith"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HadithGrading" ADD CONSTRAINT "HadithGrading_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "ContentVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HadithCommentary" ADD CONSTRAINT "HadithCommentary_hadithId_fkey" FOREIGN KEY ("hadithId") REFERENCES "Hadith"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HadithCommentary" ADD CONSTRAINT "HadithCommentary_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "ContentVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HadithBookmark" ADD CONSTRAINT "HadithBookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HadithBookmark" ADD CONSTRAINT "HadithBookmark_hadithId_fkey" FOREIGN KEY ("hadithId") REFERENCES "Hadith"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingHistory" ADD CONSTRAINT "ReadingHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingHistory" ADD CONSTRAINT "ReadingHistory_hadithId_fkey" FOREIGN KEY ("hadithId") REFERENCES "Hadith"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingHistory" ADD CONSTRAINT "ReadingHistory_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "ContentVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonBlock" ADD CONSTRAINT "LessonBlock_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonBlock" ADD CONSTRAINT "LessonBlock_audioId_fkey" FOREIGN KEY ("audioId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseOption" ADD CONSTRAINT "ExerciseOption_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizQuestion" ADD CONSTRAINT "QuizQuestion_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAnswer" ADD CONSTRAINT "QuizAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "QuizAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAnswer" ADD CONSTRAINT "QuizAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "QuizQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonProgress" ADD CONSTRAINT "LessonProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonProgress" ADD CONSTRAINT "LessonProgress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dhikr" ADD CONSTRAINT "Dhikr_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "DhikrCollection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dhikr" ADD CONSTRAINT "Dhikr_audioId_fkey" FOREIGN KEY ("audioId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dhikr" ADD CONSTRAINT "Dhikr_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "ContentVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalDhikrCollection" ADD CONSTRAINT "PersonalDhikrCollection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalDhikrCollection" ADD CONSTRAINT "PersonalDhikrCollection_baseCollectionId_fkey" FOREIGN KEY ("baseCollectionId") REFERENCES "DhikrCollection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalDhikrItem" ADD CONSTRAINT "PersonalDhikrItem_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "PersonalDhikrCollection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalDhikrItem" ADD CONSTRAINT "PersonalDhikrItem_dhikrId_fkey" FOREIGN KEY ("dhikrId") REFERENCES "Dhikr"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DhikrSession" ADD CONSTRAINT "DhikrSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DhikrSession" ADD CONSTRAINT "DhikrSession_dhikrId_fkey" FOREIGN KEY ("dhikrId") REFERENCES "Dhikr"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrayerLog" ADD CONSTRAINT "PrayerLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TahajjudGoal" ADD CONSTRAINT "TahajjudGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TahajjudRecord" ADD CONSTRAINT "TahajjudRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "ContentVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorshipGoal" ADD CONSTRAINT "WorshipGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalProgress" ADD CONSTRAINT "GoalProgress_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "WorshipGoal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationDelivery" ADD CONSTRAINT "NotificationDelivery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationDelivery" ADD CONSTRAINT "NotificationDelivery_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "PushSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIConversation" ADD CONSTRAINT "AIConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIMessage" ADD CONSTRAINT "AIMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AIConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AICitation" ADD CONSTRAINT "AICitation_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "AIMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AICitation" ADD CONSTRAINT "AICitation_chunkId_fkey" FOREIGN KEY ("chunkId") REFERENCES "SourceChunk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIRequest" ADD CONSTRAINT "AIRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncOperation" ADD CONSTRAINT "SyncOperation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
