import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });
  const { current, next } = req.body || {};
  if (!current || !next) return res.status(400).json({ error: 'Missing fields' });
  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    // NOTE: This is a placeholder. Proper implementation should use password hashing.
    if (user.password !== current) return res.status(400).json({ error: 'Current password is incorrect' });
    const updated = await prisma.user.update({ where: { id: user.id }, data: { password: next } });
    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to update password' });
  }
}
