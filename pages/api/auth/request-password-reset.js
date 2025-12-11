import { prisma } from '../../../lib/prisma';
import { randomBytes } from 'crypto';
import { sendMail } from '../../../lib/email';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    // Always respond success to prevent email enumeration
    if (!user) return res.status(200).json({ ok: true, message: 'If that email exists, a reset link has been sent.' });

    // Invalidate existing tokens
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
    await prisma.passwordResetToken.create({ data: { token, userId: user.id, expiresAt: expires } });

    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`;
    const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;">
      <h2>Password Reset Request</h2>
      <p>You requested to reset your PMO Network password. Click the link below to set a new password. This link expires in 1 hour.</p>
      <p><a href="${resetUrl}" style="background:#4f46e5;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;font-weight:600">Reset Password</a></p>
      <p>If you did not request this, you can safely ignore this email.</p>
    </body></html>`;
    try {
      await sendMail({ to: email, subject: 'Reset Your PMO Network Password', html, text: `Reset your password: ${resetUrl}` });
    } catch (e) {
      console.error('Failed sending reset email', e); // still return success to user
    }
    const response = { ok: true, message: 'If that email exists, a reset link has been sent.' };
    if (process.env.NODE_ENV !== 'production') response.resetUrl = resetUrl;
    return res.status(200).json(response);
  } catch (err) {
    console.error('Password reset request error', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
