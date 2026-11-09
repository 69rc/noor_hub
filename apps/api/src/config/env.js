import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  WEB_ORIGIN: z.string().url().default('http://localhost:5173'),
  DATABASE_URL: z.string().min(1).optional(),
  JWT_ACCESS_SECRET: z.string().min(32).optional(),
  JWT_REFRESH_SECRET: z.string().min(32).optional(),
  AI_API_KEY: z.string().optional(),
  AI_BASE_URL: z.string().url().optional(),
  AI_MODEL: z.string().optional()
}).superRefine((value, ctx) => {
  if (value.NODE_ENV === 'production') {
    for (const key of ['DATABASE_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET']) {
      if (!value[key]) ctx.addIssue({ code: 'custom', path: [key], message: `${key} is required in production` });
    }
    if (value.JWT_ACCESS_SECRET === value.JWT_REFRESH_SECRET) ctx.addIssue({ code: 'custom', path: ['JWT_REFRESH_SECRET'], message: 'Token secrets must be different' });
  }
});
const result = schema.safeParse(process.env);
if (!result.success) throw new Error(`Invalid environment: ${result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
export const config = Object.freeze({ ...result.data, databaseEnabled: Boolean(result.data.DATABASE_URL && result.data.JWT_ACCESS_SECRET && result.data.JWT_REFRESH_SECRET), aiEnabled: Boolean(result.data.AI_API_KEY && result.data.AI_BASE_URL && result.data.AI_MODEL) });