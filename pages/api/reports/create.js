import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session || (session.user.role || '').toLowerCase() !== 'employer') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { reportedByEmployerId, reportedCandidateId, reason, type } = req.body;

  if (!reportedByEmployerId || !reportedCandidateId || !reason) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Verify the employer making the report
    const employer = await prisma.employerProfile.findUnique({
      where: { id: reportedByEmployerId },
      include: { user: true }
    });

    if (!employer || employer.user.email !== session.user.email) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Create the report
    const report = await prisma.report.create({
      data: {
        reportedByEmployerId,
        reportedCandidateId,
        reason,
        type: type || 'CANDIDATE_BEHAVIOR',
        status: 'PENDING',
        createdAt: new Date()
      }
    });

    return res.status(201).json(report);
  } catch (error) {
    console.error('Error creating report:', error);
    return res.status(500).json({ error: 'Failed to create report' });
  }
}
