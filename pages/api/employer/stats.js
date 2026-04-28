import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '../../../lib/prisma';
import { resolveEmployerContext } from '../../../lib/employerContext';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session || (session.user.role || '').toLowerCase() !== 'employer') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const context = await resolveEmployerContext({ userId: session.user.id });
    const employerProfile = context?.employerProfile;

    if (!employerProfile) {
      return res.status(200).json({ activeJobs: 0, applicants: 0, unread: 0 });
    }

    const [activeJobs, applicants, unread] = await Promise.all([
      prisma.job.count({
        where: {
          employerId: employerProfile.id,
          paused: false,
          isDraft: false,
        },
      }),
      prisma.application.count({
        where: {
          job: {
            employerId: employerProfile.id,
          },
        },
      }),
      prisma.message.count({
        where: {
          receiverUserId: session.user.id,
          readAt: null,
          conversation: {
            employerId: employerProfile.id,
            archivedByEmployer: false,
          },
        },
      }),
    ]);

    return res.status(200).json({ activeJobs, applicants, unread });
  } catch (error) {
    console.error('Employer stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch employer stats' });
  }
}
