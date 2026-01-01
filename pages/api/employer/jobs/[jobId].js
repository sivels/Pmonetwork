import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '../../../../lib/prisma';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session || (session.user.role || '').toLowerCase() !== 'employer') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { jobId } = req.query;

  if (req.method === 'DELETE') {
    try {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { employerEmployerProfile: true }
      });

      if (!user || !user.employerEmployerProfile) {
        return res.status(404).json({ error: 'Employer profile not found' });
      }

      const employerId = user.employerEmployerProfile.id;

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

      if (!job.isDraft) {
        return res.status(400).json({ error: 'Can only delete draft jobs' });
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
