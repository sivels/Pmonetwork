-- Migration: Add SavedJob table for candidates to save jobs
-- Run this manually in Supabase SQL editor

CREATE TABLE IF NOT EXISTS "SavedJob" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "candidateId" TEXT NOT NULL,
  "jobId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SavedJob_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "CandidateProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SavedJob_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Add unique constraint to prevent duplicate saves
CREATE UNIQUE INDEX IF NOT EXISTS "SavedJob_candidateId_jobId_key" ON "SavedJob"("candidateId", "jobId");

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS "SavedJob_candidateId_idx" ON "SavedJob"("candidateId");
CREATE INDEX IF NOT EXISTS "SavedJob_jobId_idx" ON "SavedJob"("jobId");
