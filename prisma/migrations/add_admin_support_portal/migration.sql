-- User security/account management fields
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "username" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "accountStatus" TEXT NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "verificationStatus" TEXT NOT NULL DEFAULT 'UNVERIFIED';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isLocked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isSuspended" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "mfaEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "mustResetPassword" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "deactivatedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");

-- Support ticketing system
CREATE TABLE IF NOT EXISTS "SupportTicket" (
  "id" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "createdByUserId" TEXT NOT NULL,
  "targetUserId" TEXT,
  "assignedToUserId" TEXT,
  "targetType" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "subject" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "slaDueAt" TIMESTAMP(3),
  "firstResponseAt" TIMESTAMP(3),
  "resolvedAt" TIMESTAMP(3),
  "tags" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SupportTicket_reference_key" ON "SupportTicket"("reference");
CREATE INDEX IF NOT EXISTS "SupportTicket_status_priority_idx" ON "SupportTicket"("status", "priority");
CREATE INDEX IF NOT EXISTS "SupportTicket_assignedToUserId_idx" ON "SupportTicket"("assignedToUserId");
CREATE INDEX IF NOT EXISTS "SupportTicket_targetUserId_idx" ON "SupportTicket"("targetUserId");

ALTER TABLE "SupportTicket"
  ADD CONSTRAINT "SupportTicket_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SupportTicket"
  ADD CONSTRAINT "SupportTicket_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SupportTicket"
  ADD CONSTRAINT "SupportTicket_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "SupportTicketNote" (
  "id" TEXT NOT NULL,
  "ticketId" TEXT NOT NULL,
  "authorUserId" TEXT NOT NULL,
  "note" TEXT NOT NULL,
  "isInternal" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SupportTicketNote_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SupportTicketNote_ticketId_createdAt_idx" ON "SupportTicketNote"("ticketId", "createdAt");

ALTER TABLE "SupportTicketNote"
  ADD CONSTRAINT "SupportTicketNote_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SupportTicketNote"
  ADD CONSTRAINT "SupportTicketNote_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Admin action auditing
CREATE TABLE IF NOT EXISTS "AdminActionAudit" (
  "id" TEXT NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "targetUserId" TEXT,
  "entityType" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "metadata" TEXT,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminActionAudit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AdminActionAudit_actorUserId_createdAt_idx" ON "AdminActionAudit"("actorUserId", "createdAt");
CREATE INDEX IF NOT EXISTS "AdminActionAudit_targetUserId_createdAt_idx" ON "AdminActionAudit"("targetUserId", "createdAt");

ALTER TABLE "AdminActionAudit"
  ADD CONSTRAINT "AdminActionAudit_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AdminActionAudit"
  ADD CONSTRAINT "AdminActionAudit_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Login attempt monitoring
CREATE TABLE IF NOT EXISTS "LoginAttempt" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "email" TEXT NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "success" BOOLEAN NOT NULL DEFAULT false,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "LoginAttempt_userId_createdAt_idx" ON "LoginAttempt"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "LoginAttempt_email_createdAt_idx" ON "LoginAttempt"("email", "createdAt");

ALTER TABLE "LoginAttempt"
  ADD CONSTRAINT "LoginAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
