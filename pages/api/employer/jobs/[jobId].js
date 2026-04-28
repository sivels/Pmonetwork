import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '../../../../lib/prisma';
import { resolveEmployerContext } from '../../../../lib/employerContext';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session || (session.user.role || '').toLowerCase() !== 'employer') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { jobId } = req.query;

  const context = await resolveEmployerContext({ userId: session.user.id });

  if (!context?.employerProfile) {
    return res.status(404).json({ error: 'Employer profile not found' });
  }

  const employerId = context.employerProfile.id;

  if (req.method === 'GET') {
    try {
      const job = await prisma.job.findUnique({ where: { id: jobId } });

      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      if (job.employerId !== employerId) {
        return res.status(403).json({ error: 'Not authorized to view this job' });
      }

      return res.status(200).json({ job });
    } catch (error) {
      console.error('Job fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch job' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const existing = await prisma.job.findUnique({ where: { id: jobId } });

      if (!existing) {
        return res.status(404).json({ error: 'Job not found' });
      }

      if (existing.employerId !== employerId) {
        return res.status(403).json({ error: 'Not authorized to update this job' });
      }

      const jobData = req.body || {};
      const location = `${jobData.city || ''}${jobData.country ? ', ' + jobData.country : ''}`.trim() || jobData.location || existing.location || null;
      const isRemote = typeof jobData.workArrangement === 'string'
        ? (jobData.workArrangement === 'Remote' || jobData.workArrangement === 'Hybrid')
        : existing.isRemote;

      const updated = await prisma.job.update({
        where: { id: jobId },
        data: {
          title: jobData.jobTitle || jobData.title || existing.title,
          description: jobData.jobSummary || jobData.description || existing.description,
          shortDescription: jobData.responsibilities || existing.shortDescription || null,
          location,
          employmentType: jobData.employmentType || existing.employmentType,
          isRemote,
          seniority: jobData.seniorityLevel || jobData.seniority || existing.seniority || null,
          specialism: jobData.department || jobData.specialism || existing.specialism || null,
          salaryMin: jobData.salaryMin ? parseFloat(jobData.salaryMin) : null,
          salaryMax: jobData.salaryMax ? parseFloat(jobData.salaryMax) : null,
          currency: jobData.currency || existing.currency || 'GBP',
          paused: typeof jobData.status === 'string' ? jobData.status === 'paused' : existing.paused,
        }
      });

      return res.status(200).json({ success: true, job: updated });
    } catch (error) {
      console.error('Job update error:', error);
      return res.status(500).json({ error: 'Failed to update job posting' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      // Verify the job belongs to this employer and is a draft
      const job = await prisma.job.findUnique({
        where: { id: jobId }
      });

      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      if (job.employerId !== employerId) {
        return res.status(403).json({ error: 'Not authorized to delete this job' });
      }

      // Delete the job
      await prisma.job.delete({
        where: { id: jobId }
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Job deletion error:', error);
      return res.status(500).json({ error: 'Failed to delete job' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
