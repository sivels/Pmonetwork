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
    const candidate = await prisma.candidateProfile.findFirst({
      where: { userId: session.user.id },
    });

    if (!candidate) {
      return res.status(404).json({ error: 'Candidate profile not found' });
    }

    const interviews = await prisma.interview.findMany({
      where: {
        candidateId: candidate.id,
      },
      include: {
        employer: true,
        application: {
          include: {
            job: true,
          },
        },
      },
      orderBy: {
        startTime: 'desc',
      },
    });

    return res.status(200).json(interviews);
  } catch (error) {
    console.error('Error fetching candidate interviews:', error);
    return res.status(500).json({ error: 'Failed to fetch interviews' });
  }
}
