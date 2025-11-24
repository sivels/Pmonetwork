# Contact Form Email Setup Guide

The Contact Us page (`/contact`) is fully functional with database storage. Email notifications are currently using console logging for development. Follow these steps to enable actual email sending in production.

## Current Status

✅ **Working:**
- Contact form with validation
- Database storage (ContactSubmission model)
- Form submission handling
- Success/error UI feedback

📧 **Email Setup Required:**
The API endpoint (`/pages/api/contact.js`) has placeholder email functions that log to console. Configure one of the options below to send real emails.

---

## Option 1: Nodemailer with Gmail (Quickest for Testing)

### 1. Install nodemailer (already installed)
```bash
npm install nodemailer
```

### 2. Update `.env` with Gmail credentials
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_FROM=PMO Network <your-email@gmail.com>
SUPPORT_EMAIL=support@pmonetwork.example
```

**Important:** Use Gmail App Password (not regular password):
1. Go to Google Account → Security
2. Enable 2-Step Verification
3. Generate App Password for "Mail"
4. Use that 16-character password in `EMAIL_PASSWORD`

### 3. Update `pages/api/contact.js`

Replace the `sendEmail` function with:

```javascript
import nodemailer from 'nodemailer';

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

async function sendEmail(to, subject, html) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });
    console.log(`✅ Email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Email error:', error);
    throw error;
  }
}
```

---

## Option 2: SendGrid (Recommended for Production)

### 1. Sign up for SendGrid
- Free tier: 100 emails/day
- https://sendgrid.com/

### 2. Get API Key
1. Settings → API Keys → Create API Key
2. Give it "Mail Send" permissions
3. Copy the key

### 3. Install SendGrid SDK
```bash
npm install @sendgrid/mail
```

### 4. Update `.env`
```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
EMAIL_FROM=support@pmonetwork.example
SUPPORT_EMAIL=support@pmonetwork.example
```

### 5. Update `pages/api/contact.js`

```javascript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendEmail(to, subject, html) {
  try {
    await sgMail.send({
      to,
      from: process.env.EMAIL_FROM, // Must be verified in SendGrid
      subject,
      html,
    });
    console.log(`✅ Email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('SendGrid error:', error);
    throw error;
  }
}
```

---

## Option 3: AWS SES (Lowest Cost at Scale)

### 1. Set up AWS SES
- Sign up for AWS
- Verify sender email in SES console
- Get SMTP credentials

### 2. Update `.env`
```env
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_USER=your-aws-smtp-username
EMAIL_PASSWORD=your-aws-smtp-password
EMAIL_FROM=support@pmonetwork.example
SUPPORT_EMAIL=support@pmonetwork.example
```

### 3. Use nodemailer (same as Option 1)

---

## Option 4: Resend (Modern Developer Experience)

### 1. Sign up at https://resend.com
- Free tier: 100 emails/day

### 2. Install Resend SDK
```bash
npm install resend
```

### 3. Update `.env`
```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=support@pmonetwork.example
SUPPORT_EMAIL=support@pmonetwork.example
```

### 4. Update `pages/api/contact.js`

```javascript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail(to, subject, html) {
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });
    console.log(`✅ Email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Resend error:', error);
    throw error;
  }
}
```

---

## Testing the Contact Form

### 1. Start the dev server
```bash
npm run dev
```

### 2. Visit http://localhost:3000/contact

### 3. Fill out and submit the form

### 4. Check:
- ✅ Form validates required fields
- ✅ Success message appears after submission
- ✅ Database record created (check Prisma Studio: `npx prisma studio`)
- ✅ Emails sent (check console logs or actual inbox)

---

## Production Deployment Checklist

- [ ] Choose email provider (SendGrid, AWS SES, Resend recommended)
- [ ] Set environment variables in hosting platform (Vercel, Railway, etc.)
- [ ] Verify sender email/domain
- [ ] Update `SUPPORT_EMAIL` to real support inbox
- [ ] Test form submission in production
- [ ] Set up email monitoring/logging
- [ ] Consider rate limiting (prevent spam)
- [ ] Add reCAPTCHA (optional but recommended)

---

## Database Management

View all contact submissions:
```bash
npx prisma studio
```

Query submissions programmatically:
```javascript
const submissions = await prisma.contactSubmission.findMany({
  where: { status: 'NEW' },
  orderBy: { createdAt: 'desc' }
});
```

Update submission status:
```javascript
await prisma.contactSubmission.update({
  where: { id: 'submission-id' },
  data: { status: 'RESOLVED' }
});
```

---

## Email Templates

The current implementation includes:

1. **User Confirmation Email** - Sent to the person who submitted the form
2. **Support Notification Email** - Sent to your support team

Both use HTML templates with professional styling. Customize them in `/pages/api/contact.js`.

---

## Rate Limiting (Optional Enhancement)

Prevent spam by adding rate limiting:

```bash
npm install express-rate-limit
```

In `pages/api/contact.js`:
```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 requests per window
  message: 'Too many submissions, please try again later.'
});

// Apply in handler
export default async function handler(req, res) {
  await limiter(req, res);
  // ... rest of handler
}
```

---

## Support

For issues or questions:
- Check Prisma logs: `npx prisma studio`
- Check email provider logs/dashboard
- Verify environment variables are set
- Test with console.log in sendEmail function

---

**Recommendation:** Start with **SendGrid** or **Resend** for simplest production setup. Both have generous free tiers and excellent documentation.
