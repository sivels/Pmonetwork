import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  const adminSecret = process.env.ADMIN_SECRET || 'dev-secret-change-in-prod';
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${adminSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({ error: 'Email and role required' });
    }

    if (!['CANDIDATE', 'EMPLOYER'].includes(role)) {
      return res.status(400).json({ error: 'Role must be CANDIDATE or EMPLOYER' });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await prisma.user.update({
      where: { email },
      data: { role }
    });

    return res.status(200).json({ 
      success: true,
      message: `User role updated to ${role}`,
      email,
      role
    });

  } catch (error) {
    console.error('Error updating role:', error);
    return res.status(500).json({ 
      error: 'Failed to update user role',
      details: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
}
