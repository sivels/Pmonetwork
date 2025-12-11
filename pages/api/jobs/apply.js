import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '../../../lib/prisma';

// POST /api/jobs/apply { jobId, coverLetter, availability }
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session || (session.user.role || '').toLowerCase() !== 'candidate') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { jobId, coverLetter = '', availability = '' } = req.body || {};
  if (!jobId) return res.status(400).json({ error: 'Missing jobId' });
  if (coverLetter && coverLetter.length < 20) return res.status(400).json({ error: 'Cover letter must be at least 20 characters.' });

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { candidateCandidateProfile: true }
    });
    const candidate = user?.candidateCandidateProfile;
    if (!candidate) return res.status(400).json({ error: 'Candidate profile not found' });

    const job = await prisma.job.findUnique({ where: { id: jobId }, include: { employer: { include: { user: true } } } });
    if (!job || job.paused) return res.status(404).json({ error: 'Job not available' });

    // Prevent duplicate application
    const existing = await prisma.application.findFirst({ where: { jobId, candidateId: candidate.id } });
    if (existing) return res.status(409).json({ error: 'Already applied to this job' });

    const app = await prisma.application.create({
      data: {
        job: { connect: { id: jobId } },
        candidate: { connect: { id: candidate.id } },
        coverLetter,
        availability
      }
    });

    // TODO: Email notification stub (employer.user.email) – integrate nodemailer utility if present.

    return res.status(201).json({ applicationId: app.id });
  } catch (e) {
    console.error('Apply error', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
