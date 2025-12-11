import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session || (session.user.role || '').toLowerCase() !== 'employer') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (req.method === 'POST') {
    try {
      const jobData = req.body;
      
      // Create job posting
      const job = await prisma.job.create({
        data: {
          userId: user.id,
          title: jobData.jobTitle,
          department: jobData.department,
          seniorityLevel: jobData.seniorityLevel,
          employmentType: jobData.employmentType,
          workArrangement: jobData.workArrangement,
          location: `${jobData.city}${jobData.country ? ', ' + jobData.country : ''}`,
          description: jobData.jobSummary,
          responsibilities: jobData.responsibilities,
          requiredSkills: JSON.stringify(jobData.requiredSkills),
          preferredSkills: JSON.stringify(jobData.preferredSkills),
          salaryMin: parseFloat(jobData.salaryMin) || null,
          salaryMax: parseFloat(jobData.salaryMax) || null,
          benefits: JSON.stringify(jobData.benefits),
          status: jobData.status || 'draft',
          postedAt: new Date()
        }
      });

      return res.status(201).json({ success: true, job });
    } catch (error) {
      console.error('Job creation error:', error);
      return res.status(500).json({ error: 'Failed to create job posting' });
    }
  }

  if (req.method === 'GET') {
    try {
      const jobs = await prisma.job.findMany({
        where: { userId: user.id },
        orderBy: { postedAt: 'desc' }
      });

      return res.status(200).json({ jobs });
    } catch (error) {
      console.error('Job fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch jobs' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
