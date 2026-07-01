import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
import { resolve } from 'path';


// Load our environment variables
dotenv.config({ path: resolve(process.cwd(), '.env')});

export default defineConfig({
  schema: './src/db/schema/index.ts', // 📍 Where our TypeScript schemas live
  out: './drizzle',                   // 📍 Where our generated SQL migrations will go
  dialect: 'postgresql',              // We are using Postgres
  dbCredentials: {
    url: process.env.DATABASE_URL!,   // Grab the DB connection string from our environment
  },
});