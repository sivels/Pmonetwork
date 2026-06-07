import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session || (session.user.role || '').toLowerCase() !== 'employer') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { conversationId, candidateId, employerId, startTime, duration, meetingUrl, message } = req.body;

  if (!conversationId || !candidateId || !employerId || !startTime) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Verify the employer
    const employer = await prisma.employerProfile.findUnique({
      where: { id: employerId },
      include: { user: true }
    });

    if (!employer || employer.user.email !== session.user.email) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Verify conversation exists
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation || conversation.employerId !== employerId) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Create the interview
    const interview = await prisma.interview.create({
      data: {
        candidateId,
        employerId,
        jobId: conversation.jobId || null,
        startTime: new Date(startTime),
        endTime: new Date(new Date(startTime).getTime() + (duration || 60) * 60000),
        duration: duration || 60,
        meetingUrl: meetingUrl || null,
        provider: 'google_meet',
        status: 'SCHEDULED',
        notes: message || null
      }
    });

    // Send a message in the conversation to notify the candidate
    const messageText = message 
      ? `[INTERVIEW_INVITATION]\n${message}\n\nScheduled: ${new Date(startTime).toLocaleString()}\nDuration: ${duration || 60} minutes${meetingUrl ? `\nMeeting URL: ${meetingUrl}` : ''}` 
      : `[INTERVIEW_INVITATION]\nYou have been invited to an interview.\n\nScheduled: ${new Date(startTime).toLocaleString()}\nDuration: ${duration || 60} minutes${meetingUrl ? `\nMeeting URL: ${meetingUrl}` : ''}`;

    await prisma.message.create({
      data: {
        conversationId,
        senderUserId: employer.userId,
        text: messageText
      }
    });

    return res.status(201).json({ 
      success: true, 
      interview,
      message: 'Interview scheduled successfully!'
    });
  } catch (error) {
    console.error('Error scheduling interview:', error);
    return res.status(500).json({ error: error.message || 'Failed to schedule interview' });
  }
}
