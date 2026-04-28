import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorised' });
    }

    if ((session.user.role || '').toLowerCase() !== 'candidate') {
      return res.status(403).json({ error: 'Only candidates can withdraw applications' });
    }

    const { applicationId, reason } = req.body;
    if (!applicationId) {
      return res.status(400).json({ error: 'applicationId is required' });
    }

    const trimmedReason = typeof reason === 'string' ? reason.trim() : '';

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { candidateCandidateProfile: true },
    });

    const candidateProfile = user?.candidateCandidateProfile;
    if (!candidateProfile) {
      return res.status(404).json({ error: 'Candidate profile not found' });
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        interviews: true,
        job: {
          include: {
            employer: {
              include: {
                user: true,
              },
            },
          },
        },
        candidate: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!application || application.candidateId !== candidateProfile.id) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const currentStatus = (application.status || '').toUpperCase();
    if (['REJECTED', 'HIRED', 'WITHDRAWN'].includes(currentStatus)) {
      return res.status(400).json({ error: 'This application can no longer be withdrawn' });
    }

    const updatedApplication = await prisma.$transaction(async (tx) => {
      if (trimmedReason) {
        let conversation = await tx.conversation.findFirst({
          where: {
            employerId: application.job?.employerId,
            candidateId: application.candidateId,
            jobId: application.jobId,
          },
        });

        if (!conversation) {
          conversation = await tx.conversation.create({
            data: {
              employerId: application.job?.employerId,
              candidateId: application.candidateId,
              jobId: application.jobId,
            },
          });
        }

        const candidateName = application.candidate?.fullName || session.user.name || 'The candidate';
        const messageText = [
          '[APPLICATION_WITHDRAWN] Hi,',
          '',
          `I have decided to withdraw my application for the ${application.job?.title || 'role'} position.`,
          '',
          'Reason:',
          trimmedReason,
          '',
          'Thank you for your time and consideration.',
          '',
          candidateName,
        ].join('\n');

        await tx.message.create({
          data: {
            conversationId: conversation.id,
            senderUserId: session.user.id,
            receiverUserId: application.job?.employer?.user?.id,
            text: messageText,
          },
        });

        await tx.activityLog.create({
          data: {
            actorUserId: session.user.id,
            employerId: application.job?.employerId,
            candidateId: application.candidateId,
            jobId: application.jobId,
            applicationId,
            type: 'MESSAGE_SENT',
            details: JSON.stringify({
              source: 'APPLICATION_WITHDRAWAL_REASON',
            }),
          },
        });
      }

      const updated = await tx.application.update({
        where: { id: applicationId },
        data: { status: 'WITHDRAWN' },
      });

      await tx.applicationStatusHistory.create({
        data: {
          applicationId,
          fromStatus: application.status,
          toStatus: 'WITHDRAWN',
          note: 'Application withdrawn by candidate.',
          changedByUserId: session.user.id,
        },
      });

      await tx.interview.updateMany({
        where: {
          applicationId,
          status: 'scheduled',
        },
        data: {
          status: 'cancelled',
          message: 'Interview cancelled because the candidate withdrew their application.',
        },
      });

      await tx.activityLog.create({
        data: {
          actorUserId: session.user.id,
          employerId: application.job?.employerId,
          candidateId: application.candidateId,
          jobId: application.jobId,
          applicationId,
          type: 'APPLICATION_STATUS_CHANGED',
          details: JSON.stringify({
            toStatus: 'WITHDRAWN',
            note: 'Application withdrawn by candidate.',
            reasonProvided: Boolean(trimmedReason),
          }),
        },
      });

      return tx.application.findUnique({
        where: { id: updated.id },
        include: {
          job: {
            include: { employer: true },
          },
          statusHistory: {
            orderBy: { createdAt: 'asc' },
          },
          interviews: {
            orderBy: { startTime: 'asc' },
          },
        },
      });
    });

    return res.status(200).json({
      success: true,
      application: JSON.parse(JSON.stringify(updatedApplication)),
    });
  } catch (error) {
    console.error('Error withdrawing application:', error);
    return res.status(500).json({ error: 'Failed to withdraw application' });
  }
}
