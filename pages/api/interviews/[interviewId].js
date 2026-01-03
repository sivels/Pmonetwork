import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session?.user || session.user.role !== 'EMPLOYER') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { interviewId } = req.query;

  // PATCH - Update interview
  if (req.method === 'PATCH') {
    try {
      const { startTime, endTime, duration, meetingUrl, message } = req.body;

      const interview = await prisma.interview.update({
        where: { id: interviewId },
        data: {
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          duration,
          meetingUrl,
          message,
          updatedAt: new Date(),
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
      });

      // Send notification to candidate about the change
      await prisma.message.create({
        data: {
          conversationId: interview.application.conversationId || 'system',
          senderId: session.user.id,
          receiverId: interview.candidate.userId,
          text: `Your interview for ${interview.application.job.title} has been rescheduled to ${new Date(startTime).toLocaleString()}.${message ? `\n\nMessage from employer: ${message}` : ''}`,
          type: 'SYSTEM',
        },
      });

      return res.status(200).json(interview);
    } catch (error) {
      console.error('Error updating interview:', error);
      return res.status(500).json({ error: 'Failed to update interview' });
    }
  }

  // DELETE - Cancel interview
  if (req.method === 'DELETE') {
    try {
      const { message } = req.body;

      const interview = await prisma.interview.findUnique({
        where: { id: interviewId },
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
      });

      if (!interview) {
        return res.status(404).json({ error: 'Interview not found' });
      }

      // Send cancellation message to candidate
      await prisma.message.create({
        data: {
          conversationId: interview.application.conversationId || 'system',
          senderId: session.user.id,
          receiverId: interview.candidate.userId,
          text: `Interview Cancelled: ${interview.application.job.title}\n\n${message}`,
          type: 'SYSTEM',
        },
      });

      // Delete the interview
      await prisma.interview.delete({
        where: { id: interviewId },
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error cancelling interview:', error);
      return res.status(500).json({ error: 'Failed to cancel interview' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
