import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  
  if (!session?.user || (session.user.role || '').toLowerCase() !== 'employer') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const employer = await prisma.employerProfile.findFirst({
      where: { userId: session.user.id },
    });

    if (!employer) {
      return res.status(404).json({ error: 'Employer profile not found' });
    }

    const interviews = await prisma.interview.findMany({
      where: {
        employerId: employer.id,
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
        startTime: 'desc',
      },
    });

    return res.status(200).json(interviews);
  } catch (error) {
    console.error('Error fetching employer interviews:', error);
    return res.status(500).json({ error: 'Failed to fetch interviews' });
  }
}
