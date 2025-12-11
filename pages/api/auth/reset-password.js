import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Token and new password are required' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  try {
    const record = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!record) return res.status(400).json({ error: 'Invalid or expired token' });
    if (record.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({ where: { token } });
      return res.status(400).json({ error: 'Token expired' });
    }

    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.update({ where: { id: record.userId }, data: { password: hashed } });
    // Remove token after use
    await prisma.passwordResetToken.delete({ where: { token } });

    return res.status(200).json({ ok: true, message: 'Password updated successfully. You may now sign in.' });
  } catch (err) {
    console.error('Reset password error', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
