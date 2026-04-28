import { prisma } from '../../../../lib/prisma';
import { requireSupportRole } from '../../../../lib/adminSupportAuth';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const auth = await requireSupportRole(req, res, 'SUPPORT_AGENT');
  if (!auth) return;

  try {
    const entityType = (req.query.entityType || '').toString().toUpperCase();
    const action = (req.query.action || '').toString().toUpperCase();
    const targetUserId = (req.query.targetUserId || '').toString();
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize || '30', 10), 1), 100);

    const where = { AND: [] };
    if (entityType) where.AND.push({ entityType });
    if (action) where.AND.push({ action });
    if (targetUserId) where.AND.push({ targetUserId });

    const normalizedWhere = where.AND.length > 0 ? where : {};

    const [total, items] = await Promise.all([
      prisma.adminActionAudit.count({ where: normalizedWhere }),
      prisma.adminActionAudit.findMany({
        where: normalizedWhere,
        include: {
          actor: { select: { id: true, email: true, role: true } },
          target: { select: { id: true, email: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return res.status(200).json({
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(Math.ceil(total / pageSize), 1),
      },
    });
  } catch (error) {
    console.error('Admin audit fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch audit history' });
  }
}
