import { Router } from 'express';
import argon2 from 'argon2';
import { randomBytes, createHash } from 'node:crypto';
import { z } from 'zod';
import { rateLimit } from 'express-rate-limit';
import { prisma } from '../config/database.js';
import { config } from '../config/env.js';
import { ApiError, asyncRoute } from '../middleware/errors.js';
import { authenticate, signAccessToken } from '../middleware/auth.js';

export const authRouter = Router();
const hash = token => createHash('sha256').update(token).digest('hex');
const cookieName = 'sakinah_refresh';
const cookieOptions = { httpOnly: true, secure: config.NODE_ENV === 'production', sameSite: 'lax', path: '/api/v1/auth', maxAge: 30 * 86400000 };
const authLimit = rateLimit({ windowMs: 15 * 60000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: { code: 'RATE_LIMITED', message: 'Too many attempts. Please try again later.' } } });
authRouter.use(authLimit);
authRouter.use((req, res, next) => prisma ? next() : next(new ApiError(503, 'DATABASE_UNAVAILABLE', 'Account services are unavailable. You can continue as a guest; all worship tracking works on this device.')));
const credentials = z.object({ email: z.string().trim().toLowerCase().email().max(320), password: z.string().min(10).max(128) });
const registration = credentials.extend({ displayName: z.string().trim().min(1).max(80) });
const publicUser = user => ({ id: user.id, email: user.email, displayName: user.displayName, role: user.role });
async function createSession(user, req, res, familyId) {
  const token = randomBytes(48).toString('base64url');
  const expiresAt = new Date(Date.now() + cookieOptions.maxAge);
  const session = familyId ? { id: familyId } : await prisma.authSession.create({ data: { userId: user.id, deviceLabel: String(req.headers['user-agent'] || 'Unknown device').slice(0, 160), expiresAt } });
  await prisma.refreshToken.create({ data: { sessionId: session.id, tokenHash: hash(token), expiresAt } });
  res.cookie(cookieName, `${session.id}.${token}`, cookieOptions);
  return { user: publicUser(user), accessToken: await signAccessToken(user) };
}
authRouter.post('/register', asyncRoute(async (req, res) => {
  const data = registration.parse(req.body);
  const passwordHash = await argon2.hash(data.password, { type: argon2.argon2id });
  const user = await prisma.$transaction(async tx => {
    const created = await tx.user.create({ data: { email: data.email, displayName: data.displayName, passwordHash } });
    await tx.userPreferences.create({ data: { userId: created.id } });
    await tx.prayerSettings.create({ data: { userId: created.id } });
    return created;
  });
  res.status(201).json(await createSession(user, req, res));
}));
authRouter.post('/login', asyncRoute(async (req, res) => {
  const data = credentials.parse(req.body);
  const user = await prisma.user.findFirst({ where: { email: data.email, deletedAt: null } });
  const valid = user && await argon2.verify(user.passwordHash, data.password);
  if (!valid) throw new ApiError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
  res.json(await createSession(user, req, res));
}));
let refreshLock = Promise.resolve();
authRouter.post('/refresh', asyncRoute(async (req, res) => {
  const task = refreshLock.then(async () => {
    const raw = req.cookies?.[cookieName];
    const [sessionId, token] = typeof raw === 'string' ? raw.split('.') : [];
    if (!sessionId || !token) throw new ApiError(401, 'NO_SESSION', 'Please sign in.');
    const tokenHash = hash(token);
    const result = await prisma.$transaction(async tx => {
      const stored = await tx.refreshToken.findUnique({ where: { tokenHash }, include: { session: { include: { user: true } } } });
      if (!stored || stored.sessionId !== sessionId || stored.expiresAt < new Date() || stored.session.revokedAt || stored.session.user.deletedAt) throw new ApiError(401, 'INVALID_SESSION', 'Please sign in again.');
      if (stored.revokedAt || stored.replacedById) {
        await tx.authSession.update({ where: { id: sessionId }, data: { revokedAt: new Date() } });
        throw new ApiError(401, 'SESSION_REUSED', 'This session was already used. Please sign in again.');
      }
      const nextToken = randomBytes(48).toString('base64url');
      const replacement = await tx.refreshToken.create({ data: { sessionId, tokenHash: hash(nextToken), expiresAt: stored.expiresAt } });
      await tx.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date(), replacedById: replacement.id } });
      return { user: stored.session.user, nextToken };
    });
    res.cookie(cookieName, `${sessionId}.${result.nextToken}`, cookieOptions);
    return { user: publicUser(result.user), accessToken: await signAccessToken(result.user) };
  });
  refreshLock = task.catch(() => {});
  res.json(await task);
}));
authRouter.post('/logout', asyncRoute(async (req, res) => {
  const sessionId = req.cookies?.[cookieName]?.split('.')[0];
  if (z.string().uuid().safeParse(sessionId).success) await prisma.authSession.updateMany({ where: { id: sessionId }, data: { revokedAt: new Date() } });
  res.clearCookie(cookieName, { ...cookieOptions, maxAge: undefined });
  res.status(204).end();
}));
authRouter.get('/me', authenticate, (req, res) => res.json({ user: publicUser(req.user) }));