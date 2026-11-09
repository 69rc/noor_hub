import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

describe('API in guest mode (no database configured)', () => {
  it('health reports ok with accounts disabled', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.accounts).toBe(false);
  });
  it('registration returns 503 and invites guest usage when accounts are unavailable', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({ email: 'guest@example.com', password: 'a-long-password', displayName: 'Guest' });
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('DATABASE_UNAVAILABLE');
  });
  it('unknown endpoints return a structured 404', async () => {
    const res = await request(app).get('/api/v1/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
  it('rejects an out-of-range surah number', async () => {
    const res = await request(app).get('/api/v1/content/quran/surahs/0');
    expect(res.status).toBe(400);
  });
  it('rejects an unknown hadith collection', async () => {
    const res = await request(app).get('/api/v1/content/hadith/notacollection/1');
    expect(res.status).toBe(400);
  });
  it('sync is unavailable (503) in guest mode rather than silently accepting writes', async () => {
    const res = await request(app).post('/api/v1/sync').send({ operations: [] });
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('DATABASE_UNAVAILABLE');
  });
  it('account export is unavailable (503) in guest mode', async () => {
    const res = await request(app).get('/api/v1/account/export');
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('DATABASE_UNAVAILABLE');
  });
});