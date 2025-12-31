import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session || (session.user.role || '').toLowerCase() !== 'employer') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { employerEmployerProfile: true }
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (!user.employerEmployerProfile) {
    return res.status(404).json({ error: 'Employer profile not found' });
  }

  const employerId = user.employerEmployerProfile.id;

  if (req.method === 'POST') {
    try {
      const jobData = req.body;
      
      // Map form data to schema fields
      const location = `${jobData.city || ''}${jobData.country ? ', ' + jobData.country : ''}`.trim() || jobData.location || null;
      const isRemote = jobData.workArrangement === 'Remote' || jobData.workArrangement === 'Hybrid';
      
      // Create job posting data
      const createData = {
        employerId: employerId,
        title: jobData.jobTitle || jobData.title,
        description: jobData.jobSummary || jobData.description,
        shortDescription: jobData.responsibilities || null,
        location: location,
        employmentType: jobData.employmentType,
        isRemote: isRemote,
        seniority: jobData.seniorityLevel || jobData.seniority || null,
        specialism: jobData.department || jobData.specialism || null,
        salaryMin: parseFloat(jobData.salaryMin) || null,
        salaryMax: parseFloat(jobData.salaryMax) || null,
        currency: jobData.currency || 'GBP',
        isFeatured: jobData.isFeatured || false,
        isUrgent: jobData.isUrgent || false,
        paused: jobData.status === 'paused' || false
      };
      
      // Add isDraft field only if it exists in the database schema
      try {
        await prisma.job.findFirst({ where: { id: 'test' }, select: { isDraft: true } });
        createData.isDraft = false;
      } catch (e) {
        // Column doesn't exist yet, skip it
      }
      
      const job = await prisma.job.create({ data: createData });

      return res.status(201).json({ success: true, job });
    } catch (error) {
      console.error('Job creation error:', error);
      return res.status(500).json({ error: 'Failed to create job posting' });
    }
  }

  if (req.method === 'GET') {
    try {
      const jobs = await prisma.job.findMany({
        where: { employerId: employerId },
        orderBy: { createdAt: 'desc' },
        include: {
          applications: true
        }
      });

      return res.status(200).json({ jobs });
    } catch (error) {
      console.error('Job fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch jobs' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
