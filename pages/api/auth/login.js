import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password, role, rememberMe } = req.body;
  const normalizedEmail = (email || '').trim().toLowerCase();
  const ipAddress = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || req.socket?.remoteAddress || null;
  const userAgent = req.headers['user-agent'] || null;

  if (!normalizedEmail || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      await prisma.loginAttempt.create({
        data: {
          email: normalizedEmail,
          ipAddress,
          userAgent,
          success: false,
          reason: 'USER_NOT_FOUND',
        },
      }).catch(() => {});
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.isLocked || user.accountStatus === 'LOCKED') {
      await prisma.loginAttempt.create({
        data: {
          userId: user.id,
          email: user.email,
          ipAddress,
          userAgent,
          success: false,
          reason: 'ACCOUNT_LOCKED',
        },
      }).catch(() => {});
      return res.status(403).json({ error: 'Account locked. Contact support.' });
    }

    if (user.isSuspended || user.accountStatus === 'SUSPENDED' || user.accountStatus === 'DEACTIVATED') {
      await prisma.loginAttempt.create({
        data: {
          userId: user.id,
          email: user.email,
          ipAddress,
          userAgent,
          success: false,
          reason: user.accountStatus,
        },
      }).catch(() => {});
      return res.status(403).json({ error: 'Account unavailable. Contact support.' });
    }

    if (role && role !== user.role) {
      return res.status(401).json({ error: 'Role mismatch – check you selected the correct account type' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      const nextFailedAttempts = (user.failedLoginAttempts || 0) + 1;
      const shouldLock = nextFailedAttempts >= 5;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: nextFailedAttempts,
          isLocked: shouldLock,
          accountStatus: shouldLock ? 'LOCKED' : user.accountStatus,
        },
      }).catch(() => {});

      await prisma.loginAttempt.create({
        data: {
          userId: user.id,
          email: user.email,
          ipAddress,
          userAgent,
          success: false,
          reason: shouldLock ? 'INVALID_PASSWORD_LOCKED' : 'INVALID_PASSWORD',
        },
      }).catch(() => {});
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lastLoginAt: new Date(),
      },
    }).catch(() => {});

    await prisma.loginAttempt.create({
      data: {
        userId: user.id,
        email: user.email,
        ipAddress,
        userAgent,
        success: true,
        reason: 'LOGIN_SUCCESS',
      },
    }).catch(() => {});

    // Placeholder session handling – replace with NextAuth/JWT in production
    const cookieExpiryDays = rememberMe ? 30 : 1;
    const expires = new Date(Date.now() + cookieExpiryDays * 24 * 60 * 60 * 1000).toUTCString();
    res.setHeader('Set-Cookie', `pmo_session=user_${user.id}; Path=/; HttpOnly; SameSite=Lax; Expires=${expires}`);

    const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'SUPPORT_MANAGER', 'SUPPORT_AGENT'];
    const redirect = ADMIN_ROLES.includes((user.role || '').toUpperCase())
      ? '/dashboard/admin'
      : (user.role || '').toUpperCase() === 'EMPLOYER'
      ? '/dashboard/employer'
      : '/dashboard/candidate';
    return res.status(200).json({ ok: true, redirect });
  } catch (err) {
    console.error('Login error', err);
    return res.status(500).json({ error: 'Server error – please try again later' });
  }
}
