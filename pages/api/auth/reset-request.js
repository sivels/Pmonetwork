import { prisma } from '../../../lib/prisma';
import { randomBytes } from 'crypto';
import { sendMail } from '../../../lib/email';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Missing email' });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(200).json({ ok: true }); // don't reveal user existence

  const token = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
  await prisma.passwordResetToken.create({ data: { token, userId: user.id, expiresAt: expires } });

  const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset?token=${token}`;
  const html = `<p>You requested a password reset. Click <a href="${resetUrl}">here</a> to set a new password. The link is valid for 1 hour.</p>`;
  try {
    await sendMail({ to: email, subject: 'Password reset — PMO Network', html, text: `Reset link: ${resetUrl}` });
  } catch (err) {
    console.error('Failed sending reset email', err);
  }

  return res.status(200).json({ ok: true });
}
