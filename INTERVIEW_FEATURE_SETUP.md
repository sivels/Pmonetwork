# Interview Feature Setup Guide

## Overview
This guide will help you set up the "Invite to Interview" feature with Google Meet integration for PMO Network.

## What's Been Implemented

### 1. Database Changes
- **New Interview Table**: Stores scheduled interviews with Google Meet links
- **Relations**: Connected to Applications, Employers, Candidates

### 2. Google OAuth Integration
- **Enhanced NextAuth**: Added Google Calendar and Meet scopes
- **Token Storage**: Refresh tokens stored in Account table for ongoing access

### 3. API Endpoints
- `POST /api/interviews/schedule`: Schedule interviews and create Google Meet links
- `GET /api/interviews/upcoming`: Fetch upcoming interviews for employers/candidates

### 4. UI Components
- **InviteToInterviewModal**: Modal for scheduling interviews
- **UpcomingInterviews Widget**: Dashboard card showing upcoming interviews
- **Interview Button**: Added to application management pages

## Setup Instructions

### Step 1: Run Database Migration

Run the SQL migration to create the Interview table:

```bash
# If using Supabase (production)
# Go to your Supabase SQL Editor and run:
# /prisma/migrations/add_interviews.sql

# OR if using local PostgreSQL
psql $DATABASE_URL -f prisma/migrations/add_interviews.sql
```

The migration creates:
- `Interview` table with all required fields
- Indexes for performance
- Foreign key constraints

### Step 2: Configure Google OAuth

#### A. Create Google Cloud Project (if not already done)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable APIs:
   - Google Calendar API
   - Google People API

#### B. Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Add authorized redirect URIs:
   ```
   http://localhost:3000/api/auth/callback/google
   https://yourdomain.com/api/auth/callback/google
   ```
5. Copy the **Client ID** and **Client Secret**

#### C. Update Environment Variables

Add to your `.env` and Vercel environment variables:

```bash
# Google OAuth (already configured)
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here

# NextAuth (already configured)
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=https://yourdomain.com
```

### Step 3: Deploy Changes

```bash
git add .
git commit -m "Add Interview scheduling with Google Meet integration"
git push
```

Vercel will automatically deploy the changes.

### Step 4: Test the Feature

#### As an Employer:

1. **Connect Google Account**:
   - Go to your profile or settings
   - Click "Sign in with Google" to connect your Google account
   - Grant Calendar permissions

2. **Schedule an Interview**:
   - Go to **Applicants Centre** or **Manage Applications**
   - Click the **Interview** button on any application
   - Fill in the interview details:
     - Date & Time
     - Duration
     - Interview Type (Google Meet or Phone)
     - Optional message
   - Click **Send Invite**

3. **View Upcoming Interviews**:
   - Add `<UpcomingInterviews userRole="EMPLOYER" />` to your employer dashboard
   - See all scheduled interviews with "Join Google Meet" buttons

#### As a Candidate:

1. **Receive Interview Invitation**:
   - Get in-platform message with interview details
   - Receive email calendar invite with Google Meet link
   - Application status automatically updates to "INTERVIEW"

2. **View Upcoming Interviews**:
   - Add `<UpcomingInterviews userRole="CANDIDATE" />` to candidate dashboard
   - Click "Join Google Meet" to enter the interview

## Feature Capabilities

### ✅ What Works

1. **Google Meet Links**: Automatically generated for each interview
2. **Calendar Events**: Created in employer's Google Calendar
3. **Email Invitations**: Sent to candidates via Google Calendar
4. **In-Platform Messages**: Candidates receive messages in PMO Network
5. **Status Updates**: Application status changes to "INTERVIEW"
6. **Timeline Tracking**: All changes logged in application history
7. **Upcoming Interviews Widget**: Shows interviews for both employers and candidates

### 📋 Data Stored

Each interview includes:
- Meeting URL (Google Meet link)
- Start & end time
- Duration
- Provider (google_meet or phone)
- Status (scheduled, completed, cancelled)
- Custom message from employer
- Links to application, job, employer, candidate

### 🔒 Security

- Only employers can schedule interviews
- Employers can only schedule for their own job applications
- Google OAuth tokens stored securely server-side
- Refresh tokens allow ongoing access without re-authentication

## Integration Points

### Add to Employer Dashboard

```javascript
import UpcomingInterviews from '../components/UpcomingInterviews';

// In your employer dashboard:
<UpcomingInterviews userRole="EMPLOYER" />
```

### Add to Candidate Dashboard

```javascript
import UpcomingInterviews from '../components/UpcomingInterviews';

// In your candidate dashboard:
<UpcomingInterviews userRole="CANDIDATE" />
```

### Already Integrated

- ✅ **Manage Applications** page - Interview button added
- ✅ **Applicant Centre** - Interview button in DataTable
- ✅ Application status automation
- ✅ In-platform messaging

## Troubleshooting

### "Google account not connected" Error

**Solution**: Employer needs to connect their Google account:
1. Go to `/api/auth/signin/google`
2. Grant Calendar permissions
3. Try scheduling again

### "Google authorization expired" Error

**Solution**: The refresh token may have expired:
1. Disconnect and reconnect Google account
2. Ensure `access_type: 'offline'` is in NextAuth config (already done)

### No Google Meet Link Generated

**Check**:
1. Google Calendar API is enabled in Google Cloud Console
2. OAuth consent screen is configured
3. Scopes include `https://www.googleapis.com/auth/calendar.events`

### Candidate Not Receiving Email

**Check**:
1. Google Calendar event has `sendUpdates: 'all'` (already configured)
2. Candidate email is correct in their profile
3. Check spam folder

## Phase 2 Features (Future)

The following can be added later:

- ❌ Reschedule interviews
- ❌ Cancel interviews
- ❌ Multi-stage interview workflows
- ❌ Interview feedback forms
- ❌ Recording links
- ❌ Automated reminders
- ❌ Calendar sync for candidates

## Support

If you encounter issues:
1. Check the browser console for errors
2. Check server logs for API errors
3. Verify Google OAuth credentials are correct
4. Ensure database migration ran successfully

## Summary

You now have a complete interview scheduling system that:
- Generates Google Meet links automatically
- Sends professional calendar invites
- Tracks all interview activity
- Provides a seamless experience for both employers and candidates
- Maintains PMO Network's premium, enterprise-grade feel

All done in **under 60 seconds** for employers to schedule! 🚀
