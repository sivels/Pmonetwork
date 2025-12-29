import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const migrationSecret = process.env.MIGRATION_SECRET || 'dev-only';
  
  if (req.query.secret !== migrationSecret) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    // Read the migration SQL file
    const migrationPath = join(process.cwd(), 'prisma', 'migrations', '0_init', 'migration.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    // Split SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    const results = [];
    
    // Execute each statement
    for (const statement of statements) {
      try {
        await prisma.$executeRawUnsafe(statement);
        results.push({ success: true, statement: statement.substring(0, 50) + '...' });
      } catch (err) {
        // Ignore "already exists" errors
        if (err.message.includes('already exists')) {
          results.push({ success: true, statement: statement.substring(0, 50) + '...', note: 'Already exists' });
        } else {
          results.push({ success: false, statement: statement.substring(0, 50) + '...', error: err.message });
        }
      }
    }
    
    return res.status(200).json({
      success: true,
      message: 'Migration executed!',
      statementsExecuted: statements.length,
      results
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      details: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    });
  } finally {
    await prisma.$disconnect();
  }
}
