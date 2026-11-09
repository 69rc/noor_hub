import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import { randomUUID } from 'node:crypto';
import { config } from './config/env.js';
import { prisma } from './config/database.js';
import { errorHandler, ApiError } from './middleware/errors.js';
import { authRouter } from './modules/auth.js';
import { accountRouter } from './modules/account.js';
import { syncRouter } from './modules/sync.js';
import { contentRouter } from './modules/content.js';
import { assistantRouter } from './modules/assistant.js';
export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use((req, res, next) => { req.id = randomUUID(); res.setHeader('X-Request-Id', req.id); next(); });
  app.use(helmet());
  app.use(cors({ origin: config.WEB_ORIGIN, credentials: true, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], allowedHeaders: ['Content-Type', 'Authorization'] }));
  app.use(express.json({ limit: '256kb' }));
  app.use(cookieParser());
  app.use('/api', rateLimit({ windowMs: 60000, limit: 180, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: { code: 'RATE_LIMITED', message: 'Please wait a moment before trying again.' } } }));
  app.get('/api/health', async (req, res) => {
    let database = 'not_configured';
    if (prisma) { try { await prisma.$queryRaw`SELECT 1`; database = 'connected'; } catch { database = 'unavailable'; } }
    res.json({ status: 'ok', version: '1.0.0', database, accounts: config.databaseEnabled, ai: config.aiEnabled });
  });
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/account', accountRouter);
  app.use('/api/v1/sync', syncRouter);
  app.use('/api/v1/content', contentRouter);
  app.use('/api/v1/assistant', assistantRouter);
  app.use('/api', (req, res, next) => next(new ApiError(404, 'NOT_FOUND', 'Endpoint not found.')));
  app.use(errorHandler);
  return app;
}