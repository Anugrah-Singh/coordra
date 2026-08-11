import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import request from 'supertest';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET ??= 'pulse-integration-secret-with-at-least-32-characters';
process.env.FRONTEND_URL ??= 'http://localhost:3000';
process.env.DB_POOL_MAX ??= '2';
process.env.SHUTDOWN_TIMEOUT_MS ??= '1000';
process.env.AI_ENABLED = 'false';

const [{ createApp }, dbModule, schema] = await Promise.all([
  import('../../src/app.js'),
  import('../../src/db/index.js'),
  import('../../src/db/schema/index.js'),
]);

export const app = createApp();
export const { db, closeDatabase } = dbModule;
export { schema, dbModule };

export const makeRunId = () => `${Date.now().toString(36)}-${randomUUID().slice(0, 6)}`;
