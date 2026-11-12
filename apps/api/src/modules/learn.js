import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { asyncRoute } from '../middleware/errors.js';
export const learnRouter = Router();
learnRouter.use(authenticate);
const stamp = z.number().int().min(0).max(9e15);
const lesson = z.object({ status: z.enum(['in-progress', 'completed']), score: z.number().int().min(0).max(100), total: z.number().int().min(0).max(100), bestScore: z.number().int().min(0).max(100).optional(), position: z.number().int().min(0).max(1000).optional(), completedAt: stamp.optional(), updatedAt: stamp });
const word = z.object({ interval: z.number().int().min(1).max(60), due: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), reviews: z.number().int().min(0).max(10000), state: z.enum(['learning', 'known']), updatedAt: stamp });
const snapshot = z.object({
  profile: z.object({ level: z.number().int().min(1).max(7), dailyGoal: z.number().int().min(5).max(200), assessmentDone: z.boolean(), voice: z.enum(['female-Asmaa', 'male-ArabicKnight']), updatedAt: stamp }),
  reading: z.object({ surah: z.number().int().min(1).max(114), ayah: z.number().int().min(1).max(286), translit: z.enum(['full', 'fade', 'off']), fontSize: z.number().int().min(16).max(60), updatedAt: stamp }),
  lessons: z.record(z.string().max(80), lesson).refine(r => Object.keys(r).length <= 300),
  letters: z.record(z.string().max(20), z.object({ mastered: z.boolean(), updatedAt: stamp })).refine(r => Object.keys(r).length <= 40),
  vocab: z.record(z.string().max(40), word).refine(r => Object.keys(r).length <= 4000),
  activity: z.record(z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.object({ xp: z.number().int().min(0).max(100000), lessons: z.number().int().min(0).max(1000), exercises: z.number().int().min(0).max(10000), updatedAt: stamp })).refine(r => Object.keys(r).length <= 400),
  attempts: z.array(z.object({ id: z.string().uuid(), at: stamp, module: z.string().max(40), kind: z.string().max(20), prompt: z.string().max(300), correct: z.boolean() })).max(500),
  savedWords: z.array(z.string().max(40)).max(4000),
  bookmarks: z.array(z.string().max(20)).max(1000),
  hifzStatus: z.record(z.string().max(20), z.object({ status: z.enum(['not-started', 'learning', 'memorising', 'memorised', 'needs-revision']), updatedAt: stamp })).refine(r => Object.keys(r).length <= 1000),
  builder: z.record(z.string().max(40), z.object({ stars: z.number().int().min(0).max(3), updatedAt: stamp })).refine(r => Object.keys(r).length <= 200)
});
const ms = value => new Date(value);
async function readState(userId) {
  const [profile, lessons, letters, words, activity, attempts, bookmarks, hifz] = await Promise.all([
    prisma.learningProfile.findUnique({ where: { userId } }),
    prisma.learningLessonState.findMany({ where: { userId } }),
    prisma.learningLetterState.findMany({ where: { userId } }),
    prisma.learningWordState.findMany({ where: { userId } }),
    prisma.learningActivity.findMany({ where: { userId } }),
    prisma.learningAttempt.findMany({ where: { userId }, orderBy: { createdAt: 'asc' }, take: 500 }),
    prisma.learningBookmark.findMany({ where: { userId } }),
    prisma.learningHifzState.findMany({ where: { userId } })
  ]);
  return {
    profile: profile ? { level: profile.level, dailyGoal: profile.dailyGoal, assessmentDone: profile.assessmentDone, voice: profile.voice, updatedAt: profile.updatedAt.getTime() } : null,
    reading: profile?.reading || null,
    lessons: Object.fromEntries(lessons.map(l => [l.lessonId, { status: l.status, score: l.score, total: l.total, bestScore: l.bestScore, position: l.position, completedAt: l.completedAt?.getTime(), updatedAt: l.updatedAt.getTime() }])),
    letters: Object.fromEntries(letters.map(l => [l.letterId, { mastered: l.mastered, updatedAt: l.updatedAt.getTime() }])),
    vocab: Object.fromEntries(words.map(w => [w.wordKey, { interval: w.interval, due: w.due, reviews: w.reviews, state: w.state, updatedAt: w.updatedAt.getTime() }])),
    savedWords: words.filter(w => w.saved).map(w => w.wordKey),
    activity: Object.fromEntries(activity.map(a => [a.day, { xp: a.xp, lessons: a.lessons, exercises: a.exercises, updatedAt: a.updatedAt.getTime() }])),
    attempts: attempts.map(a => ({ id: a.id, at: a.createdAt.getTime(), module: a.module, kind: a.kind, prompt: a.prompt, correct: a.correct })),
    bookmarks: bookmarks.map(b => b.ref),
    hifzStatus: Object.fromEntries(hifz.map(h => [h.ref, { status: h.status, updatedAt: h.updatedAt.getTime() }])),
    builder: profile?.builder || {}
  };
}
learnRouter.get('/state', asyncRoute(async (req, res) => { res.json({ state: await readState(req.user.id) }); }));
learnRouter.post('/sync', asyncRoute(async (req, res) => {
  const { state } = z.object({ state: snapshot }).parse(req.body);
  const userId = req.user.id;
  await prisma.$transaction(async tx => {
    await tx.learningProfile.upsert({
      where: { userId },
      create: { userId, level: state.profile.level, dailyGoal: state.profile.dailyGoal, assessmentDone: state.profile.assessmentDone, voice: state.profile.voice, reading: state.reading, builder: state.builder },
      update: { level: state.profile.level, dailyGoal: state.profile.dailyGoal, assessmentDone: state.profile.assessmentDone, voice: state.profile.voice, reading: state.reading, builder: state.builder }
    });
    for (const [lessonId, l] of Object.entries(state.lessons)) {
      const prior = await tx.learningLessonState.findUnique({ where: { userId_lessonId: { userId, lessonId } } });
      if (prior && prior.updatedAt.getTime() > l.updatedAt) continue;
      const data = { status: l.status, score: l.score, total: l.total, bestScore: l.bestScore || 0, position: l.position || 0, completedAt: l.completedAt ? ms(l.completedAt) : null, updatedAt: ms(l.updatedAt) };
      await tx.learningLessonState.upsert({ where: { userId_lessonId: { userId, lessonId } }, create: { userId, lessonId, ...data }, update: data });
    }
    for (const [letterId, l] of Object.entries(state.letters)) {
      const prior = await tx.learningLetterState.findUnique({ where: { userId_letterId: { userId, letterId } } });
      if (prior && prior.updatedAt.getTime() > l.updatedAt) continue;
      await tx.learningLetterState.upsert({ where: { userId_letterId: { userId, letterId } }, create: { userId, letterId, mastered: l.mastered, updatedAt: ms(l.updatedAt) }, update: { mastered: l.mastered, updatedAt: ms(l.updatedAt) } });
    }
    const saved = new Set(state.savedWords);
    for (const [wordKey, w] of Object.entries(state.vocab)) {
      const prior = await tx.learningWordState.findUnique({ where: { userId_wordKey: { userId, wordKey } } });
      if (prior && prior.updatedAt.getTime() > w.updatedAt) continue;
      const data = { interval: w.interval, due: w.due, reviews: w.reviews, state: w.state, saved: saved.has(wordKey), updatedAt: ms(w.updatedAt) };
      await tx.learningWordState.upsert({ where: { userId_wordKey: { userId, wordKey } }, create: { userId, wordKey, ...data }, update: data });
    }
    for (const key of saved) {
      if (state.vocab[key]) continue;
      await tx.learningWordState.upsert({ where: { userId_wordKey: { userId, wordKey: key } }, create: { userId, wordKey: key, due: '1970-01-01', saved: true, updatedAt: ms(Date.now()) }, update: { saved: true } });
    }
    for (const [day, a] of Object.entries(state.activity)) {
      const prior = await tx.learningActivity.findUnique({ where: { userId_day: { userId, day } } });
      if (prior && prior.updatedAt.getTime() > a.updatedAt) continue;
      const data = { xp: a.xp, lessons: a.lessons, exercises: a.exercises, updatedAt: ms(a.updatedAt) };
      await tx.learningActivity.upsert({ where: { userId_day: { userId, day } }, create: { userId, day, ...data }, update: data });
    }
    if (state.attempts.length) await tx.learningAttempt.createMany({ data: state.attempts.map(a => ({ id: a.id, userId, module: a.module, kind: a.kind, prompt: a.prompt, correct: a.correct, createdAt: ms(a.at) })), skipDuplicates: true });
    for (const ref of state.bookmarks) await tx.learningBookmark.upsert({ where: { userId_ref: { userId, ref } }, create: { userId, ref }, update: {} });
    for (const [ref, h] of Object.entries(state.hifzStatus)) {
      const prior = await tx.learningHifzState.findUnique({ where: { userId_ref: { userId, ref } } });
      if (prior && prior.updatedAt.getTime() > h.updatedAt) continue;
      await tx.learningHifzState.upsert({ where: { userId_ref: { userId, ref } }, create: { userId, ref, status: h.status, updatedAt: ms(h.updatedAt) }, update: { status: h.status, updatedAt: ms(h.updatedAt) } });
    }
  }, { timeout: 30000 });
  res.json({ ok: true });
}));