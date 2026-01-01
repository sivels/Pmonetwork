-- Add archive fields to Conversation table
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "archivedByCandidate" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "archivedByEmployer" BOOLEAN NOT NULL DEFAULT false;
