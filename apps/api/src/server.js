import { createApp } from './app.js';
import { config } from './config/env.js';
import { prisma } from './config/database.js';
const app = createApp();
const server = app.listen(config.PORT, () => console.log(JSON.stringify({ level: 'info', message: `Noor Hub API listening on ${config.PORT}`, accounts: config.databaseEnabled })));
async function shutdown() { server.close(async () => { await prisma?.$disconnect(); process.exit(0); }); setTimeout(() => process.exit(1), 10000).unref(); }
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);