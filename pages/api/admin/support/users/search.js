import { prisma } from '../../../../../lib/prisma';
import { requireSupportRole } from '../../../../../lib/adminSupportAuth';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const auth = await requireSupportRole(req, res, 'SUPPORT_AGENT');
  if (!auth) return;

  try {
    const query = (req.query.q || '').toString().trim();
    const role = (req.query.role || '').toString().trim().toUpperCase();
    const accountStatus = (req.query.accountStatus || '').toString().trim().toUpperCase();
    const verificationStatus = (req.query.verificationStatus || '').toString().trim().toUpperCase();
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize || '20', 10), 1), 50);

    const where = { AND: [] };

    if (query) {
      where.AND.push({
        OR: [
          { id: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { username: { contains: query, mode: 'insensitive' } },
          { candidateCandidateProfile: { is: { fullName: { contains: query, mode: 'insensitive' } } } },
          { employerEmployerProfile: { is: { companyName: { contains: query, mode: 'insensitive' } } } },
        ],
      });
    }

    if (role) where.AND.push({ role });
    if (accountStatus) where.AND.push({ accountStatus });
    if (verificationStatus) where.AND.push({ verificationStatus });

    const normalizedWhere = where.AND.length > 0 ? where : {};

    const [total, users] = await Promise.all([
      prisma.user.count({ where: normalizedWhere }),
      prisma.user.findMany({
        where: normalizedWhere,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          accountStatus: true,
          verificationStatus: true,
          isLocked: true,
          isSuspended: true,
          mfaEnabled: true,
          failedLoginAttempts: true,
          lastLoginAt: true,
          createdAt: true,
          candidateCandidateProfile: {
            select: {
              id: true,
              fullName: true,
              jobTitle: true,
              location: true,
            },
          },
          employerEmployerProfile: {
            select: {
              id: true,
              companyName: true,
              contactName: true,
              website: true,
            },
          },
        },
      }),
    ]);

    return res.status(200).json({
      users,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(Math.ceil(total / pageSize), 1),
      },
    });
  } catch (error) {
    console.error('Admin support user search error:', error);
    return res.status(500).json({ error: 'Failed to search users' });
  }
}
