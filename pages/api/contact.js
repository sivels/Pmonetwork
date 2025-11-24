import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Email sending function (using a simple approach for demo - in production use nodemailer or SendGrid)
async function sendEmail(to, subject, html) {
  // For production, integrate with nodemailer, SendGrid, AWS SES, etc.
  // This is a placeholder that logs the email content
  console.log('📧 EMAIL SENT:');
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body: ${html}`);
  console.log('---');
  
  // In production, replace with actual email sending:
  // const nodemailer = require('nodemailer');
  // const transporter = nodemailer.createTransport({ ... });
  // await transporter.sendMail({ from: 'support@pmonetwork.example', to, subject, html });
  
  return true;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { firstName, lastName, email, phone, company, jobTitle, userType, subject, message } = req.body;

    // Server-side validation
    if (!firstName || !lastName || !email || !userType || !subject || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // Message length validation
    if (message.trim().length < 10) {
      return res.status(400).json({ error: 'Message must be at least 10 characters' });
    }

    // Save to database
    const contactSubmission = await prisma.contactSubmission.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        company: company?.trim() || null,
        jobTitle: jobTitle?.trim() || null,
        userType,
        subject: subject.trim(),
        message: message.trim(),
        status: 'NEW', // NEW, IN_PROGRESS, RESOLVED
        createdAt: new Date()
      }
    });

    // Send confirmation email to user
    const userEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          .button { display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">Thank You for Contacting PMO Network</h1>
          </div>
          <div class="content">
            <p>Hi ${firstName},</p>
            <p>We've received your message and will respond as soon as possible. Our support team typically replies within 24 hours.</p>
            <p><strong>Your Submission Details:</strong></p>
            <ul>
              <li><strong>Subject:</strong> ${subject}</li>
              <li><strong>Type:</strong> ${userType === 'CANDIDATE' ? 'Candidate (PMO Professional)' : userType === 'EMPLOYER' ? 'Employer' : 'General Inquiry'}</li>
              <li><strong>Message:</strong> ${message.substring(0, 150)}${message.length > 150 ? '...' : ''}</li>
            </ul>
            <p>If you have any urgent questions, feel free to reply to this email.</p>
            <p style="margin-top: 30px;">Best regards,<br><strong>PMO Network Support Team</strong></p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} PMO Network. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail(email, 'We received your message – PMO Network', userEmailHtml);

    // Send notification email to support team
    const supportEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1e293b; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .field { margin-bottom: 15px; }
          .label { font-weight: 600; color: #475569; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin: 0;">New Contact Form Submission</h2>
          </div>
          <div class="content">
            <div class="field">
              <div class="label">Submission ID:</div>
              <div>${contactSubmission.id}</div>
            </div>
            <div class="field">
              <div class="label">Name:</div>
              <div>${firstName} ${lastName}</div>
            </div>
            <div class="field">
              <div class="label">Email:</div>
              <div><a href="mailto:${email}">${email}</a></div>
            </div>
            ${phone ? `
            <div class="field">
              <div class="label">Phone:</div>
              <div>${phone}</div>
            </div>
            ` : ''}
            ${company ? `
            <div class="field">
              <div class="label">Company:</div>
              <div>${company}</div>
            </div>
            ` : ''}
            ${jobTitle ? `
            <div class="field">
              <div class="label">Job Title:</div>
              <div>${jobTitle}</div>
            </div>
            ` : ''}
            <div class="field">
              <div class="label">User Type:</div>
              <div>${userType === 'CANDIDATE' ? 'Candidate (PMO Professional)' : userType === 'EMPLOYER' ? 'Employer' : 'General Inquiry'}</div>
            </div>
            <div class="field">
              <div class="label">Subject:</div>
              <div><strong>${subject}</strong></div>
            </div>
            <div class="field">
              <div class="label">Message:</div>
              <div style="background: #f1f5f9; padding: 15px; border-radius: 6px; white-space: pre-wrap;">${message}</div>
            </div>
            <div class="field">
              <div class="label">Submitted:</div>
              <div>${new Date().toLocaleString()}</div>
            </div>
            <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <strong>Action Required:</strong> Please respond to ${firstName} at <a href="mailto:${email}">${email}</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail('support@pmonetwork.example', `New Contact: ${subject}`, supportEmailHtml);

    return res.status(200).json({
      success: true,
      message: 'Your message has been sent successfully. We will respond shortly.',
      submissionId: contactSubmission.id
    });

  } catch (error) {
    console.error('Contact form error:', error);
    return res.status(500).json({
      error: 'An error occurred while processing your request. Please try again later.'
    });
  }
}
