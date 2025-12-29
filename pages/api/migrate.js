import { prisma } from '../../lib/prisma';

export default async function handler(req, res) {
  // Security: only allow in non-production or with a secret key
  const migrationSecret = process.env.MIGRATION_SECRET || 'dev-only';
  
  if (req.query.secret !== migrationSecret) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    // Try to check if tables exist
    const tableCheck = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'User'
    `;
    
    if (tableCheck.length > 0) {
      return res.status(200).json({
        success: true,
        message: 'Database tables already exist',
        tables: tableCheck
      });
    }

    // If tables don't exist, we need to run migrations manually
    // This is a workaround since prisma migrate deploy doesn't work in serverless
    return res.status(200).json({
      success: false,
      message: 'Tables do not exist. Please run migrations using Vercel CLI or database console.',
      instructions: [
        '1. Install Vercel CLI: npm i -g vercel',
        '2. Run: vercel env pull .env.production',
        '3. Run: npx prisma migrate deploy',
        'OR run the SQL directly in your database console from prisma/migrations/0_init/migration.sql'
      ]
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    });
  }
}
