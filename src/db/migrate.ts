import 'dotenv/config';

import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Client } from 'pg';
import { z } from 'zod';

const databaseUrl = z
  .url({ message: 'DATABASE_URL must be a valid PostgreSQL URL' })
  .refine((value) => ['postgres:', 'postgresql:'].includes(new URL(value).protocol), {
    message: 'DATABASE_URL must use the postgres:// or postgresql:// protocol',
  })
  .transform((value) => {
    const url = new URL(value);
    const sslMode = url.searchParams.get('sslmode');
    if (sslMode === 'prefer' || sslMode === 'require' || sslMode === 'verify-ca') {
      url.searchParams.set('sslmode', 'verify-full');
    }
    return url.toString();
  })
  .parse(process.env.DATABASE_URL);

async function runMigrations() {
  // Production migrations use a direct connection rather than the pooled runtime URL.
  const client = new Client({
    connectionString: databaseUrl,
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
