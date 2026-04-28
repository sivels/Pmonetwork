import { prisma } from '../../../lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { resolveEmployerContext } from '../../../lib/employerContext';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        candidateCandidateProfile: {
          select: {
            id: true,
            fullName: true,
            profilePhotoUrl: true,
            email: true,
          }
        },
        employerEmployerProfile: {
          select: { id: true }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const employerContext = await resolveEmployerContext({ userId: user.id });

    return res.status(200).json({
      candidateProfile: user.candidateCandidateProfile,
      employerProfile: employerContext?.employerProfile ? { id: employerContext.employerProfile.id } : null,
      employerTeamRole: employerContext?.teamRole || null,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
}
