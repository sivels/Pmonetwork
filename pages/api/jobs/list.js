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

    // If no jobs in database, return dummy data for testing
    if (total === 0) {
      const dummyJobs = [
        { id: 'dummy-1', title: 'Senior PMO Manager', shortDescription: 'Lead PMO function for digital transformation programme. Manage team of 8 PMO analysts.', location: 'London, UK', employmentType: 'full-time', isRemote: false, salaryMin: 75000, salaryMax: 95000, currency: 'GBP', isFeatured: true, isUrgent: false, specialism: 'Digital Transformation', seniority: 'Senior', employer: { companyName: 'HSBC' }, createdAt: new Date('2025-11-20') },
        { id: 'dummy-2', title: 'PMO Analyst', shortDescription: '6-month contract supporting client-side PMO. Experience with MS Project and RAID logs required.', location: 'Manchester, UK', employmentType: 'contract', isRemote: true, salaryMin: 45000, salaryMax: 55000, currency: 'GBP', isFeatured: false, isUrgent: false, specialism: 'Project Support', seniority: 'Mid', employer: { companyName: 'Deloitte' }, createdAt: new Date('2025-11-18') },
        { id: 'dummy-3', title: 'Portfolio Manager', shortDescription: 'Manage technology portfolio worth £50M+. Strategic role reporting to CTO.', location: 'Birmingham, UK', employmentType: 'full-time', isRemote: false, salaryMin: 80000, salaryMax: 105000, currency: 'GBP', isFeatured: true, isUrgent: true, specialism: 'Portfolio Management', seniority: 'Senior', employer: { companyName: 'Barclays' }, createdAt: new Date('2025-11-15') },
        { id: 'dummy-4', title: 'Project Controls Lead', shortDescription: 'Energy sector project controls. Earned Value Management and cost forecasting experience essential.', location: 'Aberdeen, UK', employmentType: 'full-time', isRemote: false, salaryMin: 65000, salaryMax: 80000, currency: 'GBP', isFeatured: false, isUrgent: false, specialism: 'Project Controls', seniority: 'Senior', employer: { companyName: 'BP' }, createdAt: new Date('2025-11-14') },
        { id: 'dummy-5', title: 'Agile PMO Consultant', shortDescription: 'Support agile transformation across multiple squads. Jira, Confluence expertise required.', location: 'Leeds, UK', employmentType: 'contract', isRemote: true, salaryMin: 550, salaryMax: 650, currency: 'GBP', isFeatured: false, isUrgent: false, specialism: 'Agile', seniority: 'Mid', employer: { companyName: 'Accenture' }, createdAt: new Date('2025-11-12') },
        { id: 'dummy-6', title: 'Programme Manager', shortDescription: 'Run strategic banking platform migration. £30M budget, 18-month timeline.', location: 'Edinburgh, UK', employmentType: 'full-time', isRemote: false, salaryMin: 85000, salaryMax: 110000, currency: 'GBP', isFeatured: true, isUrgent: false, specialism: 'Programme Management', seniority: 'Senior', employer: { companyName: 'Lloyds Banking Group' }, createdAt: new Date('2025-11-10') },
        { id: 'dummy-7', title: 'Junior PMO Officer', shortDescription: 'Graduate-level role. Reporting, scheduling, and stakeholder coordination. Full training provided.', location: 'Bristol, UK', employmentType: 'full-time', isRemote: false, salaryMin: 32000, salaryMax: 40000, currency: 'GBP', isFeatured: false, isUrgent: false, specialism: 'PMO Support', seniority: 'Junior', employer: { companyName: 'PwC' }, createdAt: new Date('2025-11-08') },
        { id: 'dummy-8', title: 'Transformation PMO Director', shortDescription: 'Executive-level PMO leadership. Build and scale enterprise PMO for global transformation.', location: 'London, UK', employmentType: 'full-time', isRemote: false, salaryMin: 120000, salaryMax: 150000, currency: 'GBP', isFeatured: true, isUrgent: true, specialism: 'Transformation', seniority: 'Director', employer: { companyName: 'EY' }, createdAt: new Date('2025-11-05') },
        { id: 'dummy-9', title: 'PMO Business Analyst', shortDescription: 'Bridge PMO and business teams. Requirements gathering, process mapping, UAT coordination.', location: 'Remote, UK', employmentType: 'full-time', isRemote: true, salaryMin: 40000, salaryMax: 50000, currency: 'GBP', isFeatured: false, isUrgent: false, specialism: 'Business Analysis', seniority: 'Mid', employer: { companyName: 'Capita' }, createdAt: new Date('2025-11-03') },
        { id: 'dummy-10', title: 'Change Manager (PMO)', shortDescription: 'Drive organizational change for core banking system upgrade. PROSCI certification preferred.', location: 'Glasgow, UK', employmentType: 'contract', isRemote: false, salaryMin: 55000, salaryMax: 70000, currency: 'GBP', isFeatured: false, isUrgent: false, specialism: 'Change Management', seniority: 'Senior', employer: { companyName: 'NatWest Group' }, createdAt: new Date('2025-11-01') },
        { id: 'dummy-11', title: 'IT PMO Lead', shortDescription: 'Head up IT PMO. Oversee project pipeline, resource allocation, and governance frameworks.', location: 'Newbury, UK', employmentType: 'full-time', isRemote: false, salaryMin: 70000, salaryMax: 85000, currency: 'GBP', isFeatured: false, isUrgent: false, specialism: 'IT PMO', seniority: 'Senior', employer: { companyName: 'Vodafone' }, createdAt: new Date('2025-10-30') },
        { id: 'dummy-12', title: 'Freelance PMO Coordinator', shortDescription: 'Flexible freelance opportunities. Short-term projects, part-time availability accepted.', location: 'Remote, UK', employmentType: 'freelance', isRemote: true, salaryMin: 350, salaryMax: 450, currency: 'GBP', isFeatured: false, isUrgent: false, specialism: 'PMO Coordination', seniority: 'Mid', employer: { companyName: 'Freelance Network' }, createdAt: new Date('2025-10-28') },
        { id: 'dummy-13', title: 'PMO Manager - Financial Services', shortDescription: 'High-profile role managing critical regulatory projects. Investment banking experience preferred.', location: 'London, UK', employmentType: 'full-time', isRemote: false, salaryMin: 90000, salaryMax: 120000, currency: 'GBP', isFeatured: true, isUrgent: false, specialism: 'Financial Services', seniority: 'Senior', employer: { companyName: 'Goldman Sachs' }, createdAt: new Date('2025-11-22') },
        { id: 'dummy-14', title: 'PMO Scheduler', shortDescription: 'Major infrastructure project. Primavera P6 essential. 12-month contract with extension potential.', location: 'London, UK', employmentType: 'contract', isRemote: false, salaryMin: 48000, salaryMax: 58000, currency: 'GBP', isFeatured: false, isUrgent: false, specialism: 'Scheduling', seniority: 'Mid', employer: { companyName: 'Crossrail Ltd' }, createdAt: new Date('2025-11-24') },
        { id: 'dummy-15', title: 'Digital PMO Lead', shortDescription: 'Media/tech PMO. Support product launches, feature releases, and digital campaigns.', location: 'Osterley, UK', employmentType: 'full-time', isRemote: false, salaryMin: 68000, salaryMax: 82000, currency: 'GBP', isFeatured: false, isUrgent: false, specialism: 'Digital', seniority: 'Senior', employer: { companyName: 'Sky' }, createdAt: new Date('2025-11-26') },
      ];

      return res.json({
        page: currentPage,
        pageSize: take,
        total: dummyJobs.length,
        totalPages: Math.ceil(dummyJobs.length / take),
        jobs: dummyJobs.slice(skip, skip + take)
      });
    }

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
