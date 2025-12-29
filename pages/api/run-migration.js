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
    
    // Execute the SQL
    await prisma.$executeRawUnsafe(migrationSQL);
    
    return res.status(200).json({
      success: true,
      message: 'Database tables created successfully!'
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
