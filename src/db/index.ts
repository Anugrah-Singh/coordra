import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { env } from '../config/env.js';
import * as schema from './schema/index.js';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: env.DB_POOL_MAX,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

pool.on('error', (error) => {
  console.error('[Database Pool Error]:', error);
});

export const db = drizzle(pool, { schema });

let databaseClosed = false;

export const closeDatabase = async (): Promise<void> => {
  if (databaseClosed) {
    return;
  }

  databaseClosed = true;
  await pool.end();
};
