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
      if (interview.application.conversationId) {
        await prisma.message.create({
          data: {
            conversationId: interview.application.conversationId,
            senderUserId: session.user.id,
            receiverUserId: interview.candidate.userId,
            text: `🔔 Interview Rescheduled\n\n📅 Your interview for ${interview.application.job.title} has been rescheduled to ${new Date(startTime).toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })}.${message ? `\n\nMessage from employer:\n${message}` : ''}`,
          },
        });
      }

      return res.status(200).json(interview);
    } catch (error) {
      console.error('Error updating interview:', error);
      
      // Check if it's a database table not found error
      if (error.message?.includes('Interview') || error.code === 'P2021') {
        return res.status(500).json({ 
          error: 'Database migration required. Please run the Interview table migration in your Supabase SQL Editor.',
          details: 'The Interview table does not exist. See RUN_INTERVIEW_MIGRATION.md'
        });
      }
      
      return res.status(500).json({ error: 'Failed to update interview', details: error.message });
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
      if (interview.application.conversationId) {
        await prisma.message.create({
          data: {
            conversationId: interview.application.conversationId,
            senderUserId: session.user.id,
            receiverUserId: interview.candidate.userId,
            text: `🚫 Interview Cancelled\n\n${interview.application.job.title}\n\n${message}`,
          },
        });
      }

      // Delete the interview
      await prisma.interview.delete({
        where: { id: interviewId },
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error cancelling interview:', error);
      
      // Check if it's a database table not found error
      if (error.message?.includes('Interview') || error.code === 'P2021') {
        return res.status(500).json({ 
          error: 'Database migration required. Please run the Interview table migration in your Supabase SQL Editor.',
          details: 'The Interview table does not exist. See RUN_INTERVIEW_MIGRATION.md'
        });
      }
      
      return res.status(500).json({ error: 'Failed to cancel interview', details: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
