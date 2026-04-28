CREATE TABLE IF NOT EXISTS "JobOffer" (
  "id" TEXT NOT NULL,
  "applicationId" TEXT NOT NULL,
  "interviewId" TEXT,
  "title" TEXT NOT NULL,
  "message" TEXT,
  "salary" TEXT,
  "startDate" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'SENT',
  "attachmentsJson" TEXT,
  "sentByUserId" TEXT NOT NULL,
  "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "respondedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "JobOffer_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "JobOffer_applicationId_idx" ON "JobOffer"("applicationId");
CREATE INDEX IF NOT EXISTS "JobOffer_interviewId_idx" ON "JobOffer"("interviewId");
CREATE INDEX IF NOT EXISTS "JobOffer_status_idx" ON "JobOffer"("status");
CREATE INDEX IF NOT EXISTS "JobOffer_sentAt_idx" ON "JobOffer"("sentAt");

ALTER TABLE "JobOffer"
  ADD CONSTRAINT "JobOffer_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "JobOffer"
  ADD CONSTRAINT "JobOffer_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE SET NULL ON UPDATE CASCADE;
