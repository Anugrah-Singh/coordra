import 'dotenv/config';

import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Client } from 'pg';

import { env } from '../config/env.js';

async function runMigrations() {
  // Production migrations use a direct connection rather than the pooled runtime URL.
  const client = new Client({
    connectionString: env.DATABASE_URL,
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    const db = drizzle(client);

    console.log('Applying schema migrations...');
    await migrate(db, { migrationsFolder: './drizzle' });

    console.log('Migrations applied successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Database migration failed.');
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
