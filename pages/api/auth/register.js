import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { sendMail } from '../../../lib/email';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  const { 
    email, 
    password, 
    role = 'CANDIDATE',
    termsAccepted,
    gdprConsent,
    // Candidate fields
    firstName,
    lastName,
    phone,
    jobTitle,
    yearsExperience,
    skills,
    linkedIn,
    // Employer fields
    companyName,
    contactName,
    contactPhone,
    website,
    industry,
    hiresExpected,
    payment
  } = req.body;

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email or password' });
  }

  if (!termsAccepted || !gdprConsent) {
    return res.status(400).json({ error: 'You must accept Terms and provide GDPR consent' });
  }

  // Candidate specific validation
  if (role === 'CANDIDATE' && (!firstName || !lastName || !jobTitle)) {
    return res.status(400).json({ error: 'Missing required candidate fields' });
  }

  // Employer specific validation
  if (role === 'EMPLOYER' && (!companyName || !contactName || !contactPhone)) {
    return res.status(400).json({ error: 'Missing required employer fields' });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: 'User already exists with this email address' });
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ 
    data: { 
      email, 
      password: hashed, 
      role 
    } 
  });

  // Create candidate profile with detailed information
  if (role === 'CANDIDATE') {
    await prisma.candidateProfile.create({ 
      data: { 
        userId: user.id, 
        fullName: `${firstName} ${lastName}`,
        jobTitle: jobTitle || '',
        yearsExperience: yearsExperience || null,
        // Note: skills array would need a relation setup in Prisma
        // For now, store as JSON string if needed
        summary: linkedIn ? `LinkedIn: ${linkedIn}` : ''
      } 
    });
  } 
  // Create employer profile with detailed information
  else if (role === 'EMPLOYER') {
    await prisma.employerProfile.create({ 
      data: { 
        userId: user.id, 
        companyName: companyName || '',
        contactName: contactName || '',
        phone: contactPhone || null,
        website: website || null
      } 
    });

    // In production: Create Stripe customer and subscription with trial
    // For now, log payment info (in production, this would be tokenized via Stripe.js)
    console.log('Employer trial started:', {
      userId: user.id,
      companyName,
      industry,
      hiresExpected,
      paymentLast4: payment?.cardLast4,
      trialStartDate: new Date(),
      trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });
  }

  // Create verification token
  const token = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h
  await prisma.verificationToken.create({ 
    data: { 
      token, 
      userId: user.id, 
      expiresAt: expires 
    } 
  });

  // Send verification email
  const verifyUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/verify?token=${token}`;
  
  const candidateHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: 600; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 28px;">Welcome to PMO Network!</h1>
        </div>
        <div class="content">
          <p>Hi ${firstName},</p>
          <p>Thank you for joining PMO Network! Your free candidate profile has been created.</p>
          <p><strong>What's Next:</strong></p>
          <ul>
            <li>Verify your email address using the button below</li>
            <li>Complete your profile with your experience and skills</li>
            <li>Start applying for PMO roles</li>
            <li>Get discovered by top employers</li>
          </ul>
          <p style="text-align: center;">
            <a href="${verifyUrl}" class="button">Verify Email Address</a>
          </p>
          <p><small>This link expires in 24 hours. If you didn't create this account, please ignore this email.</small></p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} PMO Network. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const employerHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
        .trial-box { background: #fef3c7; border: 2px solid #fde047; border-radius: 8px; padding: 16px; margin: 20px 0; }
        .button { display: inline-block; background: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: 600; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 28px;">Welcome to PMO Network!</h1>
        </div>
        <div class="content">
          <p>Hi ${contactName},</p>
          <p>Thank you for joining PMO Network as an employer! Your ${companyName} account has been created.</p>
          <div class="trial-box">
            <p style="margin: 0; color: #92400e; font-weight: 600;">🎉 Your 7-Day Free Trial Has Started!</p>
            <p style="margin: 8px 0 0; color: #92400e; font-size: 14px;">After your trial ends, your subscription of $1,000/month will begin automatically. You can cancel anytime before the trial ends.</p>
          </div>
          <p><strong>What You Can Do During Your Trial:</strong></p>
          <ul>
            <li>Post unlimited job listings</li>
            <li>Search and view all candidate profiles</li>
            <li>Contact PMO professionals directly</li>
            <li>Access advanced filtering and matching tools</li>
          </ul>
          <p style="text-align: center;">
            <a href="${verifyUrl}" class="button">Verify Email & Get Started</a>
          </p>
          <p><small>This verification link expires in 24 hours.</small></p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} PMO Network. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const emailHtml = role === 'CANDIDATE' ? candidateHtml : employerHtml;
  const emailSubject = role === 'CANDIDATE' 
    ? 'Welcome to PMO Network – Verify Your Email' 
    : 'Your Free Trial Has Started – Verify Your Email';

  try {
    await sendMail({ 
      to: email, 
      subject: emailSubject, 
      html: emailHtml, 
      text: `Welcome to PMO Network! Verify your email: ${verifyUrl}` 
    });
  } catch (err) {
    console.error('Failed sending verification email', err);
  }

  // For local testing, return the verification link in the response when not in production
  const resp = { 
    ok: true,
    message: role === 'CANDIDATE' 
      ? 'Registration successful! Check your email to verify your account.'
      : 'Your trial has started! Check your email to verify and access your account.'
  };
  
  if (process.env.NODE_ENV !== 'production') {
    resp.verifyUrl = verifyUrl;
  }

  return res.status(201).json(resp);
}
