-- CreateTable
CREATE TABLE "ApplicationStatusHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "note" TEXT,
    "changedByUserId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApplicationStatusHistory_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT,
    "employerId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Conversation_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "EmployerProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Conversation_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "CandidateProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversationId" TEXT NOT NULL,
    "senderUserId" TEXT NOT NULL,
    "receiverUserId" TEXT NOT NULL,
    "text" TEXT,
    "attachments" TEXT,
    "readAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorUserId" TEXT NOT NULL,
    "employerId" TEXT,
    "candidateId" TEXT,
    "jobId" TEXT,
    "applicationId" TEXT,
    "type" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivityLog_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "EmployerProfile" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ActivityLog_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "CandidateProfile" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ActivityLog_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ActivityLog_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Application" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "coverLetter" TEXT,
    "availability" TEXT,
    "cvUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'APPLIED',
    "matchScore" INTEGER,
    "yearsExp" INTEGER,
    "location" TEXT,
    "answersJson" TEXT,
    "attachments" TEXT,
    "viewedByEmployerAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Application_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Application_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "CandidateProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Application" ("availability", "candidateId", "coverLetter", "createdAt", "cvUrl", "id", "jobId", "status") SELECT "availability", "candidateId", "coverLetter", "createdAt", "cvUrl", "id", "jobId", "status" FROM "Application";
DROP TABLE "Application";
ALTER TABLE "new_Application" RENAME TO "Application";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
