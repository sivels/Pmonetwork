import { prisma } from '../../../../lib/prisma';
import { requireSupportRole } from '../../../../lib/adminSupportAuth';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const auth = await requireSupportRole(req, res, 'SUPPORT_AGENT');
  if (!auth) return;

  try {
    const [
      activeUsers,
      flaggedAccounts,
      openSupportIssues,
      urgentCases,
      recentAdminActions,
      recentFailedLogins,
    ] = await Promise.all([
      prisma.user.count({
        where: {
          accountStatus: 'ACTIVE',
          isSuspended: false,
          deactivatedAt: null,
        },
      }),
      prisma.user.count({
        where: {
          OR: [
            { isLocked: true },
            { isSuspended: true },
            { verificationStatus: 'REJECTED' },
            { failedLoginAttempts: { gte: 5 } },
          ],
        },
      }),
      prisma.supportTicket.count({
        where: { status: { in: ['OPEN', 'IN_PROGRESS', 'ON_HOLD', 'ESCALATED'] } },
      }),
      prisma.supportTicket.count({
        where: {
          status: { in: ['OPEN', 'IN_PROGRESS', 'ESCALATED'] },
          priority: { in: ['HIGH', 'CRITICAL'] },
        },
      }),
      prisma.adminActionAudit.findMany({
        take: 12,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: { select: { id: true, email: true, role: true } },
          target: { select: { id: true, email: true } },
        },
      }),
      prisma.loginAttempt.groupBy({
        by: ['email'],
        where: {
          success: false,
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
        _count: { email: true },
        orderBy: { _count: { email: 'desc' } },
        take: 10,
      }),
    ]);

    const alerts = [];
    if (urgentCases > 0) alerts.push({ level: 'high', message: `${urgentCases} urgent support case(s) need attention` });
    if (flaggedAccounts > 0) alerts.push({ level: 'medium', message: `${flaggedAccounts} flagged account(s) require review` });

    const suspicious = recentFailedLogins
      .filter((row) => row._count.email >= 3)
      .map((row) => ({ email: row.email, failedAttempts24h: row._count.email }));

    return res.status(200).json({
      metrics: { activeUsers, flaggedAccounts, openSupportIssues, urgentCases },
      alerts,
      suspicious,
      recentAdminActions,
    });
  } catch (error) {
    console.error('Admin support dashboard error:', error);
    return res.status(500).json({ error: 'Failed to load support dashboard metrics' });
  }
}
