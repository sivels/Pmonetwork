-- Create Report table
CREATE TABLE "Report" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "reportedByEmployerId" TEXT NOT NULL,
  "reportedCandidateId" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'CANDIDATE_BEHAVIOR',
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "adminNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Report_reportedByEmployerId_fkey" FOREIGN KEY ("reportedByEmployerId") REFERENCES "EmployerProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Report_reportedCandidateId_fkey" FOREIGN KEY ("reportedCandidateId") REFERENCES "CandidateProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Alter Interview table to make applicationId and jobId optional
ALTER TABLE "Interview" ALTER COLUMN "applicationId" DROP NOT NULL;
ALTER TABLE "Interview" ALTER COLUMN "jobId" DROP NOT NULL;

-- Add endTime if it doesn't exist and status column if needed
ALTER TABLE "Interview" ADD COLUMN IF NOT EXISTS "endTime" TIMESTAMP(3);
ALTER TABLE "Interview" ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- Rename message to notes if message column exists (for backward compatibility)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Interview' AND column_name='message') THEN
    ALTER TABLE "Interview" RENAME COLUMN "message" TO "notes";
  END IF;
END $$;

-- Update status values in Interview table if needed (convert lowercase to uppercase)
UPDATE "Interview" SET status = 'SCHEDULED' WHERE status = 'scheduled';
UPDATE "Interview" SET status = 'COMPLETED' WHERE status = 'completed';
UPDATE "Interview" SET status = 'CANCELLED' WHERE status = 'cancelled';
UPDATE "Interview" SET status = 'RESCHEDULED' WHERE status = 'rescheduled';
