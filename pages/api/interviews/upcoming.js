import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  
  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    let interviews = [];

    if (session.user.role === 'EMPLOYER') {
      const employer = await prisma.employerProfile.findFirst({
        where: { userId: session.user.id },
      });

      if (!employer) {
        return res.status(404).json({ error: 'Employer profile not found' });
      }

      interviews = await prisma.interview.findMany({
        where: {
          employerId: employer.id,
          status: 'scheduled',
          startTime: {
            gte: new Date(), // Only future interviews
          },
        },
        include: {
          candidate: {
            include: {
              user: true,
            },
          },
          application: {
            include: {
              job: true,
            },
          },
        },
        orderBy: {
          startTime: 'asc',
        },
      });
    } else if (session.user.role === 'CANDIDATE') {
      const candidate = await prisma.candidateProfile.findFirst({
        where: { userId: session.user.id },
      });

      if (!candidate) {
        return res.status(404).json({ error: 'Candidate profile not found' });
      }

      interviews = await prisma.interview.findMany({
        where: {
          candidateId: candidate.id,
          status: 'scheduled',
          startTime: {
            gte: new Date(), // Only future interviews
          },
        },
        include: {
          employer: {
            include: {
              user: true,
            },
          },
          application: {
            include: {
              job: true,
            },
          },
        },
        orderBy: {
          startTime: 'asc',
        },
      });
    }

    return res.status(200).json({ interviews });
  } catch (error) {
    console.error('Error fetching interviews:', error);
    return res.status(500).json({ error: 'Failed to fetch interviews' });
  }
}
