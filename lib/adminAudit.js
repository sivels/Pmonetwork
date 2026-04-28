import { prisma } from './prisma';
import { getClientIp } from './adminSupportAuth';

export async function logAdminAction(req, {
  actorUserId,
  targetUserId = null,
  entityType,
  action,
  summary,
  metadata = null,
}) {
  try {
    await prisma.adminActionAudit.create({
      data: {
        actorUserId,
        targetUserId,
        entityType,
        action,
        summary,
        metadata: metadata ? JSON.stringify(metadata) : null,
        ipAddress: getClientIp(req),
        userAgent: req.headers['user-agent'] || null,
      },
    });
  } catch (error) {
    console.error('Failed to write AdminActionAudit log:', error);
  }
}
