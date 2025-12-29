const { Pool } = require('pg');
const { readFileSync } = require('fs');
const { join } = require('path');

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    const migrationPath = join(__dirname, '..', 'prisma', 'migrations', '0_init', 'migration.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    console.log('Running migration...');
    await pool.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    console.log('All database tables have been created.');
  } catch (error) {
    if (error.message.includes('already exists') || error.code === '42P07') {
      console.log('✅ Tables already exist - migration already applied');
    } else {
      console.error('❌ Migration failed:', error.message);
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

runMigration();
