import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '../../../lib/prisma';

function parseAttachments(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user || (session.user.role || '').toLowerCase() !== 'candidate') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const candidate = await prisma.candidateProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!candidate) {
      return res.status(404).json({ error: 'Candidate profile not found' });
    }

    const offers = await prisma.jobOffer.findMany({
      where: {
        application: {
          candidateId: candidate.id,
        },
      },
      include: {
        application: {
          include: {
            job: {
              include: {
                employer: true,
              },
            },
          },
        },
        interview: true,
      },
      orderBy: {
        sentAt: 'desc',
      },
    });

    const normalized = offers.map((offer) => ({
      ...offer,
      attachments: parseAttachments(offer.attachmentsJson),
    }));

    return res.status(200).json({ offers: normalized });
  } catch (error) {
    console.error('Error fetching candidate offers:', error);
    return res.status(500).json({ error: 'Failed to fetch offers' });
  }
}
