ALTER TABLE "CandidateProfile"
ADD COLUMN IF NOT EXISTS "biggestStrength" TEXT,
ADD COLUMN IF NOT EXISTS "biggestWeakness" TEXT;
