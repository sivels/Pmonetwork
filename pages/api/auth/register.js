import prisma from '../../../lib/prisma';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { sendMail } from '../../../lib/email';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { email, password, role = 'CANDIDATE', fullName } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: 'User already exists' });

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, password: hashed, role } });

  // create candidate profile if role is CANDIDATE
  if (role === 'CANDIDATE') {
    await prisma.candidateProfile.create({ data: { userId: user.id, fullName: fullName || '' } });
  } else if (role === 'EMPLOYER') {
    await prisma.employerProfile.create({ data: { userId: user.id, companyName: fullName || '' } });
  }

  // create verification token
  const token = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h
  await prisma.verificationToken.create({ data: { token, userId: user.id, expiresAt: expires } });

  // send verification email
  const verifyUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/verify?token=${token}`;
  const html = `<p>Welcome to PMO Network.</p><p>Please verify your email by clicking <a href="${verifyUrl}">this link</a>. The link expires in 24 hours.</p>`;
  try {
    await sendMail({ to: email, subject: 'Verify your email — PMO Network', html, text: `Open this link to verify: ${verifyUrl}` });
  } catch (err) {
    console.error('Failed sending verification email', err);
  }

  // For local testing, return the verification link in the response when not in production
  const resp = { ok: true };
  if (process.env.NODE_ENV !== 'production') {
    resp.verifyUrl = verifyUrl;
  }

  return res.status(201).json(resp);
}
