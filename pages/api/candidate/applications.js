import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '../../../lib/prisma';

// GET /api/candidate/applications
// Returns list of applications for the logged-in candidate with job summary.
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const session = await getServerSession(req, res, authOptions);
  if (!session || (session.user.role || '').toLowerCase() !== 'candidate') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { candidateCandidateProfile: true }
    });
    const profile = user?.candidateCandidateProfile;
    if (!profile) return res.status(404).json({ error: 'Candidate profile missing' });
    const applications = await prisma.application.findMany({
      where: { candidateId: profile.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        createdAt: true,
        job: {
          select: {
            id: true,
            title: true,
            employmentType: true,
            location: true,
            isRemote: true,
            employer: { select: { companyName: true } }
          }
        }
      }
    });
    return res.json({ applications });
  } catch (e) {
    console.error('Fetch applications error', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
