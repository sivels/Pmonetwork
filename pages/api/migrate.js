import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export default async function handler(req, res) {
  // Security: only allow in non-production or with a secret key
  const migrationSecret = process.env.MIGRATION_SECRET || 'dev-only';
  
  if (req.query.secret !== migrationSecret) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    const { stdout, stderr } = await execAsync('npx prisma migrate deploy');
    
    return res.status(200).json({
      success: true,
      stdout,
      stderr,
      message: 'Migrations applied successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      stdout: error.stdout,
      stderr: error.stderr
    });
  }
}
