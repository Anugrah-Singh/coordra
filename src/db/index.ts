import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema/index.js';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is missing in environment variables');
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
});

export const db = drizzle(pool, { schema });