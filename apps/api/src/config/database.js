import { PrismaClient } from '@prisma/client';
import { config } from '../config/env.js';
export const prisma = config.databaseEnabled ? new PrismaClient({ log: config.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'] }) : null;