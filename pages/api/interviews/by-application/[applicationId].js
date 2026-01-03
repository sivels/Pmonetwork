import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '../../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  
  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { applicationId } = req.query;

  try {
    const interview = await prisma.interview.findFirst({
      where: {
        applicationId: applicationId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!interview) {
      return res.status(404).json(null);
    }

    return res.status(200).json(interview);
  } catch (error) {
    console.error('Error fetching interview:', error);
    return res.status(500).json({ error: 'Failed to fetch interview' });
  }
}
