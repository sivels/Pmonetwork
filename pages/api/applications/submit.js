import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  
  if (!session || session.user.role !== 'candidate') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { jobId, coverLetter, availability, noteToEmployer } = req.body;

    if (!jobId) {
      return res.status(400).json({ error: 'Job ID is required' });
    }

    // Get candidate profile
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { candidateCandidateProfile: true }
    });

    if (!user?.candidateCandidateProfile) {
      return res.status(400).json({ error: 'Candidate profile not found' });
    }

    const candidateId = user.candidateCandidateProfile.id;

    // Check if job exists and is not paused
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { employer: true }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.paused) {
      return res.status(400).json({ error: 'This job is no longer accepting applications' });
    }

    // Check if already applied
    const existingApplication = await prisma.application.findFirst({
      where: {
        jobId,
        candidateId
      }
    });

    if (existingApplication) {
      return res.status(400).json({ error: 'You have already applied to this job' });
    }

    // Create application
    const application = await prisma.application.create({
      data: {
        jobId,
        candidateId,
        coverLetter: coverLetter || null,
        availability: availability || null,
        status: 'pending',
        // Store noteToEmployer in coverLetter if no cover letter provided
        // Or you can add a noteToEmployer field to the Application model
      }
    });

    // TODO: Send email notification to employer
    // TODO: Create message thread

    return res.status(200).json({ 
      success: true,
      application: {
        id: application.id,
        status: application.status,
        createdAt: application.createdAt
      }
    });

  } catch (error) {
    console.error('Application submission error:', error);
    return res.status(500).json({ error: 'Failed to submit application' });
  }
}
