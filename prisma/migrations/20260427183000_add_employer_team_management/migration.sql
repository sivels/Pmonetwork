CREATE TABLE IF NOT EXISTS "EmployerTeamMember" (
  "id" TEXT NOT NULL,
  "employerId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'RECRUITER',
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "invitedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EmployerTeamMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "EmployerTeamMember_employerId_userId_key" ON "EmployerTeamMember"("employerId", "userId");

CREATE TABLE IF NOT EXISTS "EmployerTeamInvite" (
  "id" TEXT NOT NULL,
  "employerId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'RECRUITER',
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "token" TEXT NOT NULL,
  "invitedById" TEXT NOT NULL,
  "acceptedById" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EmployerTeamInvite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "EmployerTeamInvite_token_key" ON "EmployerTeamInvite"("token");
CREATE INDEX IF NOT EXISTS "EmployerTeamInvite_employerId_status_idx" ON "EmployerTeamInvite"("employerId", "status");
CREATE INDEX IF NOT EXISTS "EmployerTeamInvite_email_status_idx" ON "EmployerTeamInvite"("email", "status");

ALTER TABLE "EmployerTeamMember"
  ADD CONSTRAINT "EmployerTeamMember_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "EmployerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EmployerTeamMember"
  ADD CONSTRAINT "EmployerTeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EmployerTeamInvite"
  ADD CONSTRAINT "EmployerTeamInvite_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "EmployerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EmployerTeamInvite"
  ADD CONSTRAINT "EmployerTeamInvite_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "EmployerTeamInvite"
  ADD CONSTRAINT "EmployerTeamInvite_acceptedById_fkey" FOREIGN KEY ("acceptedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
