# 🚨 REQUIRED: Run Interview Table Migration

## The Interview feature requires a database migration to be run manually.

### Quick Setup (2 minutes)

1. **Go to Supabase SQL Editor**:
   - Open: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new
   - Or navigate to: Project → SQL Editor → New Query

2. **Copy and paste this SQL**:

```sql
-- Add Interview table
CREATE TABLE IF NOT EXISTS "Interview" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "applicationId" TEXT NOT NULL,
  "employerId" TEXT NOT NULL,
  "candidateId" TEXT NOT NULL,
  "jobId" TEXT NOT NULL,
  "meetingUrl" TEXT,
  "startTime" TIMESTAMP(3) NOT NULL,
  "endTime" TIMESTAMP(3) NOT NULL,
  "duration" INTEGER NOT NULL,
  "provider" TEXT NOT NULL DEFAULT 'google_meet',
  "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
  "message" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Interview_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Interview_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "EmployerProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Interview_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "CandidateProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS "Interview_applicationId_idx" ON "Interview"("applicationId");
CREATE INDEX IF NOT EXISTS "Interview_employerId_idx" ON "Interview"("employerId");
CREATE INDEX IF NOT EXISTS "Interview_candidateId_idx" ON "Interview"("candidateId");
CREATE INDEX IF NOT EXISTS "Interview_startTime_idx" ON "Interview"("startTime");
CREATE INDEX IF NOT EXISTS "Interview_status_idx" ON "Interview"("status");
```

3. **Click "Run"** (or press Cmd/Ctrl + Enter)

4. **Verify Success**:
   - You should see: "Success. No rows returned"
   - The Interview table now exists!

5. **Test the feature**:
   - Go to your application
   - Click "Interview" on any application
   - Schedule an interview with a meeting URL
   - Should work! ✅

---

## What This Creates

The Interview table stores:
- Meeting details (date, time, duration, URL)
- Links to applications, employers, candidates
- Status tracking (scheduled, completed, cancelled)
- Optional messages from employer to candidate

---

## Troubleshooting

**Error: "relation does not exist"**
- The table wasn't created. Re-run the SQL above.

**Error: "duplicate key value"**
- Table already exists. You're good to go!

**Still getting 500 errors?**
- Check browser console for specific error
- Verify all foreign key tables exist (Application, EmployerProfile, CandidateProfile)

---

## Alternative: Full Migration File

If you prefer to use the complete migration file:
- File location: `prisma/migrations/add_interviews.sql`
- Copy entire contents and run in Supabase SQL Editor

---

**That's it! The Interview scheduling feature will work once this migration is run.** 🚀
