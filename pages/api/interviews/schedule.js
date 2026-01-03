import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '../../../lib/prisma';
import { google } from 'googleapis';

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
      provider,
      message,
    } = req.body;

    // Validate required fields
    if (!applicationId || !startTime || !duration) {
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

    let meetingUrl = null;

    // Create Google Calendar event if provider is google_meet
    if (provider === 'google_meet') {
      // Get the employer's Google OAuth tokens
      const account = await prisma.account.findFirst({
        where: {
          userId: session.user.id,
          provider: 'google',
        },
      });

      if (!account?.access_token) {
        return res.status(400).json({ 
          error: 'Google account not connected. Please connect your Google account to schedule Google Meet interviews.',
          needsGoogleAuth: true,
        });
      }

      // Initialize Google Calendar API
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );

      oauth2Client.setCredentials({
        access_token: account.access_token,
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
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 day before
            { method: 'popup', minutes: 30 }, // 30 minutes before
          ],
        },
      };

      try {
        const calendarEvent = await calendar.events.insert({
          calendarId: 'primary',
          resource: event,
          conferenceDataVersion: 1,
          sendUpdates: 'all', // Send email invites to attendees
        });

        meetingUrl = calendarEvent.data.hangoutLink || calendarEvent.data.conferenceData?.entryPoints?.[0]?.uri;
      } catch (calendarError) {
        console.error('Google Calendar API error:', calendarError);
        
        // Check if token is expired
        if (calendarError.code === 401) {
          return res.status(401).json({ 
            error: 'Google authorization expired. Please reconnect your Google account.',
            needsGoogleAuth: true,
          });
        }
        
        return res.status(500).json({ error: 'Failed to create calendar event: ' + calendarError.message });
      }
    }

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
        provider: provider || 'google_meet',
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
    })}\n⏱️ Duration: ${duration} minutes\n💼 Position: ${application.job.title}\n\n${message ? `Message from employer:\n${message}\n\n` : ''}${meetingUrl ? `Join Google Meet: ${meetingUrl}` : 'Interview details will be shared separately.'}`;

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
