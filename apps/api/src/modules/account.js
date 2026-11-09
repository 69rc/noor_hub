import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { asyncRoute, ApiError } from '../middleware/errors.js';
export const accountRouter = Router();
accountRouter.use(authenticate);
accountRouter.get('/export', asyncRoute(async (req, res) => {
  const userId = req.user.id;
  const [preferences, location, prayerSettings, prayers, bookmarks, notes, lastRead, dhikr, tahajjud, journal, goals, lessonProgress, quizAttempts, hadithBookmarks] = await Promise.all([
    prisma.userPreferences.findUnique({ where: { userId } }), prisma.locationPreference.findUnique({ where: { userId } }), prisma.prayerSettings.findUnique({ where: { userId } }),
    prisma.prayerLog.findMany({ where: { userId } }), prisma.quranBookmark.findMany({ where: { userId } }), prisma.quranNote.findMany({ where: { userId } }), prisma.lastRead.findUnique({ where: { userId } }),
    prisma.dhikrSession.findMany({ where: { userId } }), prisma.tahajjudRecord.findMany({ where: { userId } }), prisma.journalEntry.findMany({ where: { userId } }), prisma.worshipGoal.findMany({ where: { userId, progress: true } }),
    prisma.lessonProgress.findMany({ where: { userId } }), prisma.quizAttempt.findMany({ where: { userId, include: { answers: true } } }), prisma.hadithBookmark.findMany({ where: { userId } })
  ]);
  res.setHeader('Content-Disposition', 'attachment; filename="sakinah-data-export.json"');
  res.json({ exportedAt: new Date().toISOString(), user: req.user, preferences, location, prayerSettings, prayers, bookmarks, notes, lastRead, dhikr, tahajjud, journal, goals, lessonProgress, quizAttempts, hadithBookmarks });
}));
accountRouter.delete('/', asyncRoute(async (req, res) => {
  const confirmation = z.object({ confirmation: z.literal('DELETE') }).parse(req.body);
  if (!confirmation) throw new ApiError(400, 'INVALID_CONFIRMATION', 'Confirmation required.');
  await prisma.user.delete({ where: { id: req.user.id } });
  res.clearCookie('sakinah_refresh', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/api/v1/auth' });
  res.status(204).end();
}));