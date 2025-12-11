import { prisma } from '../../../lib/prisma';
import { randomBytes } from 'crypto';

export default async function handler(req, res) {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'Missing token' });

  const record = await prisma.verificationToken.findUnique({ where: { token } });
  if (!record) return res.status(404).json({ error: 'Invalid or expired token' });
  if (record.expiresAt < new Date()) {
    await prisma.verificationToken.delete({ where: { id: record.id } });
    return res.status(410).json({ error: 'Token expired' });
  }

  await prisma.user.update({ where: { id: record.userId }, data: { emailVerified: new Date() } });
  await prisma.verificationToken.delete({ where: { id: record.id } });

  // Reuse a recent valid one-time token when possible to avoid token flood.
  const now = new Date();
  const existingToken = await prisma.passwordResetToken.findFirst({
    where: { userId: record.userId, expiresAt: { gt: now } },
    orderBy: { createdAt: 'desc' },
  });

  let oneTimeToken;
  if (existingToken) {
    // If a token exists and is still valid, reuse it (rate-limit behavior)
    oneTimeToken = existingToken.token;
  } else {
    // Remove any old tokens and create a fresh one
    await prisma.passwordResetToken.deleteMany({ where: { userId: record.userId } }).catch(() => {});
    oneTimeToken = randomBytes(20).toString('hex');
    const oneTimeExpiry = new Date(Date.now() + 1000 * 60 * 10); // 10 minutes
    await prisma.passwordResetToken.create({ data: { token: oneTimeToken, userId: record.userId, expiresAt: oneTimeExpiry } });
  }

  // Audit the token creation/reuse
  try {
    const { appendAudit } = await import('../../../lib/tokenAudit');
    await appendAudit({ action: 'one_time_token_issued', userId: record.userId, token: oneTimeToken, ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress });
  } catch (err) {
    console.error('Failed to audit token issue', err);
  }

  // Redirect user to the one-click auth page which will exchange the token for a session
  const redirectTo = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/one-click?token=${oneTimeToken}`;
  res.writeHead(302, { Location: redirectTo });
  res.end();
}
