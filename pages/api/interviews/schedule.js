import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  
  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Only employers can schedule interviews
  if (session.user.role !== 'EMPLOYER') {
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
        refresh_token: account.refresh_token,
      });

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      // Create calendar event
      const event = {
        summary: `PMO Network Interview – ${application.job.title}`,
        description: `Interview for ${application.job.title} position\n\nCandidate: ${application.candidate.fullName}\nCompany: ${application.job.employer.companyName}\n\n${message || ''}\n\nScheduled via PMO Network`,
        start: {
          dateTime: start.toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: end.toISOString(),
          timeZone: 'UTC',
        },
        attendees: [
          { email: application.candidate.user.email },
          { email: application.job.employer.user.email },
        ],
        conferenceData: {
          createRequest: {
            requestId: `pmo-${applicationId}-${Date.now()}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
        reminders: {
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
        provider: 'video',
        meetingUrl,
        message,
        status: 'scheduled',
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
    return res.status(500).json({ error: 'Failed to schedule interview' });
  }
}
