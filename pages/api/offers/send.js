import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '../../../lib/prisma';
import { resolveEmployerContext } from '../../../lib/employerContext';

function normalizeAttachments(attachments) {
  if (!attachments) return [];
  if (Array.isArray(attachments)) return attachments;
  try {
    const parsed = JSON.parse(attachments);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user || session.user.role !== 'EMPLOYER') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { applicationId, interviewId, title, message, salary, startDate, attachments } = req.body || {};

    if (!applicationId || !title?.trim()) {
      return res.status(400).json({ error: 'applicationId and title are required' });
    }

    const employerContext = await resolveEmployerContext({ userId: session.user.id, email: session.user.email });
    if (!employerContext?.employerProfile?.id) {
      return res.status(403).json({ error: 'Employer context not found' });
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: {
          include: {
            employer: true,
          },
        },
        candidate: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    if (application.job.employerId !== employerContext.employerProfile.id) {
      return res.status(403).json({ error: 'You do not have permission to send offers for this application' });
    }

    let interview = null;
    if (interviewId) {
      interview = await prisma.interview.findFirst({
        where: {
          id: interviewId,
          applicationId,
          employerId: employerContext.employerProfile.id,
        },
      });

      if (!interview) {
        return res.status(400).json({ error: 'Invalid interview for this application' });
      }
    }

    const safeAttachments = normalizeAttachments(attachments)
      .filter((item) => item?.url && item?.name)
      .map((item) => ({
        name: String(item.name),
        url: String(item.url),
        type: item.type ? String(item.type) : null,
        size: typeof item.size === 'number' ? item.size : null,
      }));

    const offer = await prisma.$transaction(async (tx) => {
      const createdOffer = await tx.jobOffer.create({
        data: {
          applicationId,
          interviewId: interview?.id || null,
          title: title.trim(),
          message: message?.trim() || null,
          salary: salary?.trim() || null,
          startDate: startDate ? new Date(startDate) : null,
          status: 'SENT',
          attachmentsJson: safeAttachments.length ? JSON.stringify(safeAttachments) : null,
          sentByUserId: session.user.id,
        },
        include: {
          application: {
            include: {
              job: true,
            },
          },
        },
      });

      await tx.application.update({
        where: { id: applicationId },
        data: { status: 'OFFER' },
      });

      await tx.applicationStatusHistory.create({
        data: {
          applicationId,
          fromStatus: application.status,
          toStatus: 'OFFER',
          note: `Job offer sent: ${title.trim()}`,
          changedByUserId: session.user.id,
        },
      });

      await tx.activityLog.create({
        data: {
          actorUserId: session.user.id,
          employerId: application.job.employerId,
          candidateId: application.candidateId,
          jobId: application.jobId,
          applicationId,
          type: 'APPLICATION_STATUS_CHANGED',
          details: JSON.stringify({ toStatus: 'OFFER', note: `Job offer sent: ${title.trim()}` }),
        },
      });

      let conversation = await tx.conversation.findFirst({
        where: {
          employerId: application.job.employerId,
          candidateId: application.candidateId,
          jobId: application.jobId,
        },
      });

      if (!conversation) {
        conversation = await tx.conversation.create({
          data: {
            employerId: application.job.employerId,
            candidateId: application.candidateId,
            jobId: application.jobId,
          },
        });
      }

      const attachmentLines = safeAttachments.length
        ? `\n\nAttachments:\n${safeAttachments.map((item) => `• ${item.name} (${item.url})`).join('\n')}`
        : '';

      await tx.message.create({
        data: {
          conversationId: conversation.id,
          senderUserId: session.user.id,
          receiverUserId: application.candidate.userId,
          text: `🎉 Job Offer: ${title.trim()}\n\nRole: ${application.job.title}${salary?.trim() ? `\nCompensation: ${salary.trim()}` : ''}${startDate ? `\nProposed start: ${new Date(startDate).toLocaleDateString()}` : ''}${message?.trim() ? `\n\nMessage:\n${message.trim()}` : ''}${attachmentLines}`,
        },
      });

      return createdOffer;
    });

    return res.status(201).json({ offer });
  } catch (error) {
    console.error('Error sending job offer:', error);
    return res.status(500).json({ error: 'Failed to send offer', details: error.message });
  }
}
