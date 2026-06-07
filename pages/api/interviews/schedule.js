import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '../../../lib/prisma';

function isMissingInterviewTableError(error) {
  const message = String(error?.message || '');
  const code = error?.code;
  const tableMeta = String(error?.meta?.table || '');

  if (code === 'P2021') {
    return tableMeta.includes('Interview') || message.includes('Interview');
  }

  return /relation\s+"?Interview"?\s+does\s+not\s+exist/i.test(message);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  
  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Only employers can schedule interviews
  if ((session.user.role || '').toLowerCase() !== 'employer') {
    return res.status(403).json({ error: 'Only employers can schedule interviews' });
  }

  try {
    const {
      applicationId,
      startTime,
      duration, // in minutes
      meetingUrl,
      message,
    } = req.body;

    // Validate required fields
    if (!applicationId || !startTime || !duration || !meetingUrl) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get application details
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
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

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Verify employer owns this job
    const employer = await prisma.employerProfile.findFirst({
      where: { userId: session.user.id },
    });

    if (!employer || application.job.employerId !== employer.id) {
      return res.status(403).json({ error: 'You do not have permission to schedule interviews for this application' });
    }

    // Calculate end time
    const start = new Date(startTime);
    const end = new Date(start.getTime() + duration * 60000);

    // Save interview to database
    const interview = await prisma.interview.create({
      data: {
        applicationId,
        employerId: employer.id,
        candidateId: application.candidateId,
        jobId: application.jobId,
        startTime: start,
        endTime: end,
        duration,
        provider: 'google_meet',
        meetingUrl,
        notes: message,
        status: 'SCHEDULED',
      },
    });

    // Update application status to "INTERVIEW"
    await prisma.application.update({
      where: { id: applicationId },
      data: { status: 'INTERVIEW' },
    });

    // Log status change
    await prisma.applicationStatusHistory.create({
      data: {
        applicationId,
        fromStatus: application.status,
        toStatus: 'INTERVIEW',
        note: `Interview scheduled for ${start.toLocaleString()}`,
        changedByUserId: session.user.id,
      },
    });

    // Create in-platform message for candidate
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

    const messageText = `🎉 You've been invited to an interview!\n\n📅 Date & Time: ${start.toLocaleString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    })}\n⏱️ Duration: ${duration} minutes\n💼 Position: ${application.job.title}\n\n${message ? `Message from employer:\n${message}\n\n` : ''}Join meeting: ${meetingUrl}`;

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderUserId: session.user.id,
        receiverUserId: application.candidate.userId,
        text: messageText,
      },
    });

    return res.status(201).json({
      success: true,
      interview,
      message: 'Interview scheduled successfully',
    });

  } catch (error) {
    console.error('Error scheduling interview:', error);
    
    // Check if it's a database table not found error
    if (isMissingInterviewTableError(error)) {
      return res.status(500).json({ 
        error: 'Database migration required. Please run the Interview table migration in your Supabase SQL Editor.',
        details: 'The Interview table does not exist. Run: prisma/migrations/add_interviews.sql'
      });
    }
    
    return res.status(500).json({ 
      error: 'Failed to schedule interview',
      details: error?.message || 'Unknown error',
      code: error?.code || null,
    });
  }
}
