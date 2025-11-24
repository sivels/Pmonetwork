import prisma from '../../../../lib/prisma';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ error: 'Missing token or newPassword' });

  const record = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!record) return res.status(400).json({ error: 'Invalid or expired token' });
  if (record.expiresAt < new Date()) {
    await prisma.passwordResetToken.delete({ where: { id: record.id } });
    return res.status(410).json({ error: 'Token expired' });
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: record.userId }, data: { password: hashed } });
  await prisma.passwordResetToken.delete({ where: { id: record.id } });

  return res.status(200).json({ ok: true });
}
