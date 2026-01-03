-- Add Interview table for Google Meet integration
CREATE TABLE "Interview" (
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
  "status" TEXT NOT NULL DEFAULT 'scheduled',
  "message" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Interview_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Interview_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "EmployerProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Interview_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "CandidateProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Add index for querying interviews by application
CREATE INDEX "Interview_applicationId_idx" ON "Interview"("applicationId");

-- Add index for querying interviews by employer
CREATE INDEX "Interview_employerId_idx" ON "Interview"("employerId");

-- Add index for querying interviews by candidate
CREATE INDEX "Interview_candidateId_idx" ON "Interview"("candidateId");

-- Add index for querying upcoming interviews
CREATE INDEX "Interview_startTime_idx" ON "Interview"("startTime");

-- Add index for querying by status
CREATE INDEX "Interview_status_idx" ON "Interview"("status");
