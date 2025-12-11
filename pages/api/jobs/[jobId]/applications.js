import { prisma } from '../../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { jobId } = req.query;
  const { status, q, sort = 'newest', location, minExp } = req.query;

  try {
    const where = { jobId };
    if (status) where.status = status.toUpperCase();
    if (location) where.location = { contains: location };
    if (minExp) where.yearsExp = { gte: Number(minExp) };

    const applications = await prisma.application.findMany({
      where,
      include: {
        candidate: {
          select: {
            id: true,
            fullName: true,
            jobTitle: true,
            location: true,
            yearsExperience: true,
            profilePhotoUrl: true,
            skills: { take: 6, select: { name: true, proficiency: true } },
          },
        },
        job: { select: { id: true, title: true } },
        statusHistory: {
          select: { id: true, fromStatus: true, toStatus: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy:
        sort === 'experience'
          ? [{ yearsExp: 'desc' }, { createdAt: 'desc' }]
          : [{ createdAt: sort === 'newest' ? 'desc' : 'asc' }],
    });

    const filtered = q
      ? applications.filter((a) =>
          [
            a.candidate.fullName,
            a.candidate.jobTitle ?? '',
            a.candidate.location ?? '',
            a.job.title,
          ]
            .join(' ')
            .toLowerCase()
            .includes(q.toLowerCase())
        )
      : applications;

    return res.status(200).json({ items: filtered });
  } catch (error) {
    console.error('Error fetching applications:', error);
    return res.status(500).json({ error: 'Failed to fetch applications' });
  }
}
