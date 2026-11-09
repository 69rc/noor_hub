import { Router } from 'express';
import { z } from 'zod';
import { createHash } from 'node:crypto';
import { prisma } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { asyncRoute, ApiError } from '../middleware/errors.js';
export const syncRouter = Router();
syncRouter.use(authenticate);
const operation = z.object({ clientOpId: z.string().uuid(), entityType: z.enum(['prayerLog', 'journalEntry', 'dhikrSession', 'lessonProgress']), entityId: z.string().uuid(), action: z.enum(['CREATE', 'UPDATE', 'DELETE']), baseVersion: z.number().int().positive().optional(), payload: z.record(z.string(), z.unknown()) });
const prayerPayload = z.object({ localDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), prayer: z.enum(['FAJR', 'DHUHR', 'ASR', 'MAGHRIB', 'ISHA']), timezone: z.string().min(1).max(60).refine(t => { try { new Intl.DateTimeFormat('en', { timeZone: t }); return true; } catch { return false; } }), status: z.enum(['COMPLETED', 'MISSED', 'EXCUSED']), performedAt: z.string().datetime().nullable().optional() });
const journalPayload = z.object({ localDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), title: z.string().max(160), body: z.string().max(20000), checklist: z.record(z.string(), z.boolean()), fasting: z.boolean().nullable().optional(), tags: z.array(z.string().max(40)).max(20) });
const dhikrPayload = z.object({ label: z.string().max(120), count: z.number().int().min(0).max(1000000), target: z.number().int().min(1).max(1000000), endedAt: z.string().datetime().nullable().optional() });
const lessonPayload = z.object({ lessonId: z.string().uuid(), completed: z.boolean(), lastPosition: z.number().int().min(0) });
const dateOnly = value => new Date(`${value}T00:00:00.000Z`);
syncRouter.post('/', asyncRoute(async (req, res) => {
  const { operations } = z.object({ operations: z.array(operation).min(1).max(50) }).parse(req.body);
  const results = [];
  for (const op of operations) {
    const payloadHash = createHash('sha256').update(JSON.stringify({ entityType: op.entityType, entityId: op.entityId, action: op.action, payload: op.payload })).digest('hex');
    const result = await prisma.$transaction(async tx => {
      const prior = await tx.syncOperation.findUnique({ where: { userId_clientOpId: { userId: req.user.id, clientOpId: op.clientOpId } } });
      if (prior) {
        if (prior.payloadHash !== payloadHash) throw new ApiError(409, 'IDEMPOTENCY_CONFLICT', 'Operation ID was reused with different content.');
        return { clientOpId: op.clientOpId, sequence: Number(prior.sequence), result: prior.result, replayed: true };
      }
      const existing = await tx[op.entityType].findUnique({ where: op.entityType === 'lessonProgress' ? { userId_lessonId: { userId: req.user.id, lessonId: lessonPayload.parse(op.payload).lessonId } } : { id: op.entityId } });
      if (existing && (existing.userId !== req.user.id || (op.baseVersion && existing.rowVersion !== op.baseVersion))) throw new ApiError(409, 'VERSION_CONFLICT', 'The server has a newer version.', { entityId: op.entityId });
      let saved;
      if (op.entityType === 'prayerLog') {
        const p = prayerPayload.parse(op.payload);
        const data = { userId: req.user.id, localDate: dateOnly(p.localDate), prayer: p.prayer, timezone: p.timezone, status: p.status, performedAt: p.performedAt ? new Date(p.performedAt) : null, deletedAt: op.action === 'DELETE' ? new Date() : null, rowVersion: { increment: 1 } };
        saved = await tx.prayerLog.upsert({ where: { userId_localDate_prayer: { userId: req.user.id, localDate: data.localDate, prayer: p.prayer } }, create: { ...data, id: op.entityId, rowVersion: 1 }, update: data });
      } else if (op.entityType === 'journalEntry') {
        const p = journalPayload.parse(op.payload);
        const data = { ...p, localDate: dateOnly(p.localDate), userId: req.user.id, deletedAt: op.action === 'DELETE' ? new Date() : null, rowVersion: { increment: 1 } };
        saved = await tx.journalEntry.upsert({ where: { id: op.entityId }, create: { ...data, id: op.entityId, rowVersion: 1 }, update: data });
      } else if (op.entityType === 'dhikrSession') {
        const p = dhikrPayload.parse(op.payload);
        const data = { ...p, endedAt: p.endedAt ? new Date(p.endedAt) : null, userId: req.user.id, deletedAt: op.action === 'DELETE' ? new Date() : null, rowVersion: { increment: 1 } };
        saved = await tx.dhikrSession.upsert({ where: { id: op.entityId }, create: { ...data, id: op.entityId, rowVersion: 1 }, update: data });
      } else {
        const p = lessonPayload.parse(op.payload);
        if (!await tx.lesson.findUnique({ where: { id: p.lessonId } })) throw new ApiError(404, 'LESSON_NOT_FOUND', 'Lesson is not available.');
        const data = { completedAt: p.completed ? new Date() : null, lastPosition: p.lastPosition, rowVersion: { increment: 1 } };
        saved = await tx.lessonProgress.upsert({ where: { userId_lessonId: { userId: req.user.id, lessonId: p.lessonId } }, create: { ...data, userId: req.user.id, lessonId: p.lessonId, rowVersion: 1 }, update: data });
      }
      const user = await tx.user.update({ where: { id: req.user.id }, data: { syncSequence: { increment: 1 } } });
      const outcome = { id: saved.id, rowVersion: saved.rowVersion, updatedAt: saved.updatedAt };
      await tx.syncOperation.create({ data: { userId: req.user.id, clientOpId: op.clientOpId, sequence: user.syncSequence, entityType: op.entityType, entityId: saved.id, action: op.action, payloadHash, baseVersion: op.baseVersion, result: outcome } });
      return { clientOpId: op.clientOpId, sequence: Number(user.syncSequence), result: outcome, replayed: false };
    });
    results.push(result);
  }
  res.json({ operations: results });
}));