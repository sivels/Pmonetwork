import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) return res.status(401).json({ error: 'Unauthorised' });
    if ((session.user.role || '').toLowerCase() !== 'candidate') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { applicationId } = req.body;
    if (!applicationId) return res.status(400).json({ error: 'applicationId required' });

    // Fetch the application with related data
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: { include: { employer: { include: { user: true } } } },
        candidate: { include: { user: true } },
        interviews: { orderBy: { startTime: 'desc' } },
      },
    });

    if (!application) return res.status(404).json({ error: 'Application not found' });

    // Confirm the requesting user owns this application
    if (application.candidate.userId !== session.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const employer = application.job?.employer;
    if (!employer) return res.status(400).json({ error: 'Employer not found' });

    // Rate-limit: don't allow more than one feedback request per 48 hours
    const recentRequest = await prisma.message.findFirst({
      where: {
        senderUserId: session.user.id,
        text: { contains: '[FEEDBACK_REQUEST]' },
        conversation: {
          employerId: employer.id,
          candidateId: application.candidateId,
          jobId: application.jobId,
        },
        createdAt: { gte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
      },
    });

    if (recentRequest) {
      return res.status(429).json({ error: 'You already sent a feedback request recently. Please wait 48 hours before sending another.' });
    }

    // Find or create conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        employerId: employer.id,
        candidateId: application.candidateId,
        jobId: application.jobId,
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          employerId: employer.id,
          candidateId: application.candidateId,
          jobId: application.jobId,
        },
      });
    }

    const candidateName = application.candidate.fullName || session.user.name || 'The candidate';
    const jobTitle = application.job?.title || 'the role';
    const lastInterview = application.interviews?.[0];
    const interviewDateStr = lastInterview?.startTime
      ? new Date(lastInterview.startTime).toLocaleDateString('en-GB', {
          day: 'numeric', month: 'long', year: 'numeric',
        })
      : null;

    const messageText = [
      `[FEEDBACK_REQUEST] Hi,`,
      ``,
      `Following my interview${interviewDateStr ? ` on ${interviewDateStr}` : ''} for the ${jobTitle} position, I wanted to follow up and ask if you have any feedback to share about my application.`,
      ``,
      `I appreciate your time and look forward to hearing from you.`,
      ``,
      `Kind regards,`,
      candidateName,
    ].join('\n');

    const employerUserId = employer.user?.id;

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderUserId: session.user.id,
        receiverUserId: employerUserId || null,
        text: messageText,
      },
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error sending feedback request:', error);
    return res.status(500).json({ error: 'Failed to send feedback request' });
  }
}
