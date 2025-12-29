import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '../../../lib/prisma';

// GET /api/jobs/list?search=&location=&employmentType=&specialism=&seniority=&remote=&featured=&minSalary=&maxSalary=&page=1&pageSize=20
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    search = '',
    location = '',
    employmentType = '',
    specialism = '',
    seniority = '',
    remote = '',
    featured = '',
    minSalary = '',
    maxSalary = '',
    page = '1',
    pageSize = '20'
  } = req.query;

  const take = Math.min(parseInt(pageSize, 10) || 20, 100);
  const currentPage = Math.max(parseInt(page, 10) || 1, 1);
  const skip = (currentPage - 1) * take;

  const where = {
    paused: false,
  };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { shortDescription: { contains: search, mode: 'insensitive' } }
    ];
  }
  if (location) where.location = { contains: location, mode: 'insensitive' };
  if (employmentType) where.employmentType = employmentType;
  if (specialism) where.specialism = { contains: specialism, mode: 'insensitive' };
  if (seniority) where.seniority = { contains: seniority, mode: 'insensitive' };
  if (remote) where.isRemote = remote === 'true';
  if (featured) where.isFeatured = featured === 'true';
  if (minSalary) where.salaryMin = { gte: parseInt(minSalary, 10) };
  if (maxSalary) where.salaryMax = { lte: parseInt(maxSalary, 10) };

  try {
    const [total, jobs] = await Promise.all([
      prisma.job.count({ where }),
      prisma.job.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
            title: true,
            shortDescription: true,
            location: true,
            employmentType: true,
            isRemote: true,
            salaryMin: true,
            salaryMax: true,
            currency: true,
            isFeatured: true,
            isUrgent: true,
            specialism: true,
            seniority: true,
            employer: { select: { companyName: true } },
            createdAt: true
        }
      })
    ]);

    // Return empty results if no jobs found

    return res.json({
      page: currentPage,
      pageSize: take,
      total,
      totalPages: Math.ceil(total / take),
      jobs
    });
  } catch (e) {
    console.error('Job list error', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
