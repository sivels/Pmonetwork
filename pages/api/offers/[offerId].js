import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  const { offerId } = req.query;

  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user || (session.user.role || '').toLowerCase() !== 'candidate') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { decision } = req.body || {};
    const normalizedDecision = String(decision || '').toUpperCase();

    if (!['ACCEPTED', 'DECLINED'].includes(normalizedDecision)) {
      return res.status(400).json({ error: 'decision must be ACCEPTED or DECLINED' });
    }

    const candidate = await prisma.candidateProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!candidate) {
      return res.status(404).json({ error: 'Candidate profile not found' });
    }

    const offer = await prisma.jobOffer.findUnique({
      where: { id: offerId },
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
      },
    });

    if (!offer || offer.application.candidateId !== candidate.id) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    if (offer.status !== 'SENT') {
      return res.status(400).json({ error: 'Offer already responded to' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedOffer = await tx.jobOffer.update({
        where: { id: offerId },
        data: {
          status: normalizedDecision,
          respondedAt: new Date(),
        },
      });

      if (normalizedDecision === 'ACCEPTED') {
        await tx.application.update({
          where: { id: offer.applicationId },
          data: { status: 'HIRED' },
        });

        await tx.applicationStatusHistory.create({
          data: {
            applicationId: offer.applicationId,
            fromStatus: offer.application.status,
            toStatus: 'HIRED',
            note: 'Candidate accepted the job offer',
            changedByUserId: session.user.id,
          },
        });

        await tx.activityLog.create({
          data: {
            actorUserId: session.user.id,
            employerId: offer.application.job.employerId,
            candidateId: offer.application.candidateId,
            jobId: offer.application.jobId,
            applicationId: offer.applicationId,
            type: 'APPLICATION_STATUS_CHANGED',
            details: JSON.stringify({ toStatus: 'HIRED', note: 'Candidate accepted the job offer' }),
          },
        });
      }

      let conversation = await tx.conversation.findFirst({
        where: {
          employerId: offer.application.job.employerId,
          candidateId: offer.application.candidateId,
          jobId: offer.application.jobId,
        },
      });

      if (!conversation) {
        conversation = await tx.conversation.create({
          data: {
            employerId: offer.application.job.employerId,
            candidateId: offer.application.candidateId,
            jobId: offer.application.jobId,
          },
        });
      }

      await tx.message.create({
        data: {
          conversationId: conversation.id,
          senderUserId: session.user.id,
          receiverUserId: offer.application.job.employer.userId,
          text: normalizedDecision === 'ACCEPTED'
            ? `✅ Offer accepted: ${offer.title}`
            : `❌ Offer declined: ${offer.title}`,
        },
      });

      return updatedOffer;
    });

    return res.status(200).json({ offer: result });
  } catch (error) {
    console.error('Error responding to offer:', error);
    return res.status(500).json({ error: 'Failed to respond to offer' });
  }
}
