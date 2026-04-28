import { getServerSession } from 'next-auth/next';
import { authOptions } from '../pages/api/auth/[...nextauth]';
import { prisma } from './prisma';

const ROLE_LEVELS = {
  SUPPORT_AGENT: 1,
  SUPPORT_MANAGER: 2,
  SUPER_ADMIN: 3,
  ADMIN: 3,
};

export function hasSupportRole(role, minRole = 'SUPPORT_AGENT') {
  const current = ROLE_LEVELS[(role || '').toUpperCase()] || 0;
  const required = ROLE_LEVELS[(minRole || 'SUPPORT_AGENT').toUpperCase()] || 1;
  return current >= required;
}

export async function requireSupportRole(req, res, minRole = 'SUPPORT_AGENT') {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }

  const role = (session.user.role || '').toUpperCase();
  if (!hasSupportRole(role, minRole)) {
    res.status(403).json({ error: 'Insufficient admin permissions' });
    return null;
  }

  const actor = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, role: true },
  });

  if (!actor) {
    res.status(401).json({ error: 'Admin account not found' });
    return null;
  }

  return { session, actor };
}

export function getClientIp(req) {
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (typeof xForwardedFor === 'string' && xForwardedFor.length > 0) {
    return xForwardedFor.split(',')[0].trim();
  }
  if (Array.isArray(xForwardedFor) && xForwardedFor.length > 0) {
    return xForwardedFor[0];
  }
  return req.socket?.remoteAddress || null;
}
