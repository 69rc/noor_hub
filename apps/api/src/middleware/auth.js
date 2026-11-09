import { jwtVerify, SignJWT } from 'jose';
import { config } from '../config/env.js';
import { ApiError, asyncRoute } from './errors.js';
import { prisma } from '../config/database.js';
const secret = new TextEncoder().encode(config.JWT_ACCESS_SECRET || 'development-only-not-a-production-secret-32');
export const signAccessToken = user => new SignJWT({ role: user.role }).setProtectedHeader({ alg: 'HS256' }).setSubject(user.id).setIssuer('sakinah').setAudience('sakinah-web').setIssuedAt().setExpirationTime('15m').sign(secret);
export const authenticate = asyncRoute(async (req, res, next) => {
  if (!prisma) throw new ApiError(503, 'DATABASE_UNAVAILABLE', 'Account services are not configured.');
  const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!token) throw new ApiError(401, 'UNAUTHORIZED', 'Please sign in.');
  try {
    const { payload } = await jwtVerify(token, secret, { issuer: 'sakinah', audience: 'sakinah-web', algorithms: ['HS256'] });
    const user = await prisma.user.findFirst({ where: { id: payload.sub, deletedAt: null }, select: { id: true, role: true, displayName: true, email: true } });
    if (!user) throw new Error('Missing user');
    req.user = user;
    next();
  } catch { throw new ApiError(401, 'UNAUTHORIZED', 'Your session has expired. Please sign in again.'); }
});
export const requireRole = (...roles) => (req, res, next) => roles.includes(req.user?.role) ? next() : next(new ApiError(403, 'FORBIDDEN', 'You do not have permission.'));