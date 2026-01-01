import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '../../../../lib/prisma';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if ((session.user.role || '').toLowerCase() !== 'candidate') {
    return res.status(403).json({ error: 'Only candidates can save jobs' });
  }

  const { jobId } = req.query;

  // Get the candidate profile
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { candidateCandidateProfile: true }
  });

  if (!user?.candidateCandidateProfile) {
    return res.status(404).json({ error: 'Candidate profile not found' });
  }

  const candidateId = user.candidateCandidateProfile.id;

  // Verify the job exists
  const job = await prisma.job.findUnique({
    where: { id: jobId }
  });

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  if (req.method === 'POST') {
    // Save the job
    try {
      const savedJob = await prisma.savedJob.create({
        data: {
          candidateId,
          jobId
        }
      });
      return res.status(201).json({ success: true, savedJob });
    } catch (error) {
      // Handle duplicate save (already saved)
      if (error.code === 'P2002') {
        return res.status(200).json({ success: true, message: 'Job already saved' });
      }
      console.error('Error saving job:', error);
      return res.status(500).json({ error: 'Failed to save job' });
    }
  } else if (req.method === 'DELETE') {
    // Unsave the job
    try {
      await prisma.savedJob.deleteMany({
        where: {
          candidateId,
          jobId
        }
      });
      return res.status(200).json({ success: true, message: 'Job removed from saved' });
    } catch (error) {
      console.error('Error unsaving job:', error);
      return res.status(500).json({ error: 'Failed to unsave job' });
    }
  } else {
    res.setHeader('Allow', ['POST', 'DELETE']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}
