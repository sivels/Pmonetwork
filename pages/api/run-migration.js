import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

export default async function handler(req, res) {
  const migrationSecret = process.env.MIGRATION_SECRET || 'dev-only';
  
  if (req.query.secret !== migrationSecret) {
    return res.status(403).json({ error: 'Unauthorized - migration endpoint' });
  }

  let pool;
  
  try {
    // Use raw PostgreSQL client to execute the migration
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    // Read the migration SQL file
    const migrationPath = join(process.cwd(), 'prisma', 'migrations', '0_init', 'migration.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    // Execute the entire SQL file at once using the raw PostgreSQL client
    const result = await pool.query(migrationSQL);
    
    return res.status(200).json({
      success: true,
      message: 'Database tables created successfully!',
      result: result.command
    });
  } catch (error) {
    // Check if tables already exist
    if (error.message.includes('already exists') || error.code === '42P07') {
      return res.status(200).json({
        success: true,
        message: 'Database tables already exist',
        note: 'Migration already applied'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
      details: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    });
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}
