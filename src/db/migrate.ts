import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Client } from 'pg';

async function runDiagnosticMigration() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is missing!');
    process.exit(1);
  }

  // Create a direct client connection
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔌 Connecting to Neon database...');
    await client.connect();
    const db = drizzle(client);
    
    console.log('🚀 Executing schema migrations...');
    // This points to the folder containing your generated SQL
    await migrate(db, { migrationsFolder: './drizzle' });
    
    console.log('✅ Migrations applied successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n🚨 FATAL DATABASE ERROR REVEALED 🚨');
    console.error('======================================');
    console.error(error);
    console.error('======================================\n');
    process.exit(1);
  } finally {
    await client.end();
  }
}

runDiagnosticMigration();