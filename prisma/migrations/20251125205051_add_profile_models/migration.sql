/*
  Warnings:

  - You are about to drop the `_CandidateProfileToCertification` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_CandidateProfileToSkill` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `name` on the `Certification` table. All the data in the column will be lost.
  - Added the required column `candidateId` to the `Certification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `issuingBody` to the `Certification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Certification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `candidateId` to the `Skill` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "_CandidateProfileToCertification_B_index";

-- DropIndex
DROP INDEX "_CandidateProfileToCertification_AB_unique";

-- DropIndex
DROP INDEX "_CandidateProfileToSkill_B_index";

-- DropIndex
DROP INDEX "_CandidateProfileToSkill_AB_unique";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_CandidateProfileToCertification";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_CandidateProfileToSkill";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Experience" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "candidateId" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "location" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "current" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "achievements" TEXT,
    "projectType" TEXT,
    "projectValue" TEXT,
    "teamSize" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Experience_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "CandidateProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Education" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "candidateId" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "degree" TEXT NOT NULL,
    "fieldOfStudy" TEXT,
    "grade" TEXT,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "current" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Education_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "CandidateProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT,
    "employmentType" TEXT,
    "isRemote" BOOLEAN NOT NULL DEFAULT false,
    "shortDescription" TEXT,
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "currency" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isUrgent" BOOLEAN NOT NULL DEFAULT false,
    "specialism" TEXT,
    "seniority" TEXT,
    "paused" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Job_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "EmployerProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "coverLetter" TEXT,
    "availability" TEXT,
    "cvUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Application_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Application_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "CandidateProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CandidateProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "jobTitle" TEXT,
    "summary" TEXT,
    "yearsExperience" INTEGER,
    "sector" TEXT,
    "personalityType" TEXT,
    "personalityDesc" TEXT,
    "availability" TEXT NOT NULL DEFAULT 'AVAILABLE_IMMEDIATE',
    "dayRate" INTEGER,
    "salaryExpectation" INTEGER,
    "location" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "remotePreference" TEXT DEFAULT 'remote',
    "employmentType" TEXT DEFAULT 'contract',
    "cvUrl" TEXT,
    "videoUrl" TEXT,
    "videoIntroUrl" TEXT,
    "profilePhotoUrl" TEXT,
    "linkedinUrl" TEXT,
    "portfolioUrl" TEXT,
    "githubUrl" TEXT,
    "twitterUrl" TEXT,
    "websiteUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CandidateProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_CandidateProfile" ("availability", "createdAt", "cvUrl", "dayRate", "fullName", "id", "jobTitle", "location", "personalityDesc", "personalityType", "remotePreference", "sector", "summary", "updatedAt", "userId", "videoUrl", "yearsExperience") SELECT "availability", "createdAt", "cvUrl", "dayRate", "fullName", "id", "jobTitle", "location", "personalityDesc", "personalityType", "remotePreference", "sector", "summary", "updatedAt", "userId", "videoUrl", "yearsExperience" FROM "CandidateProfile";
DROP TABLE "CandidateProfile";
ALTER TABLE "new_CandidateProfile" RENAME TO "CandidateProfile";
CREATE UNIQUE INDEX "CandidateProfile_userId_key" ON "CandidateProfile"("userId");
CREATE TABLE "new_Certification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "candidateId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "issuingBody" TEXT NOT NULL,
    "issueDate" DATETIME,
    "expiryDate" DATETIME,
    "credentialId" TEXT,
    "verificationUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Certification_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "CandidateProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Certification" ("id") SELECT "id" FROM "Certification";
DROP TABLE "Certification";
ALTER TABLE "new_Certification" RENAME TO "Certification";
CREATE TABLE "new_Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "candidateId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "fileSize" INTEGER,
    "documentType" TEXT NOT NULL DEFAULT 'other',
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Document_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "CandidateProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Document" ("candidateId", "filename", "id", "isPublic", "uploadedAt", "url") SELECT "candidateId", "filename", "id", "isPublic", "uploadedAt", "url" FROM "Document";
DROP TABLE "Document";
ALTER TABLE "new_Document" RENAME TO "Document";
CREATE TABLE "new_Skill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "candidateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "proficiency" TEXT NOT NULL DEFAULT 'Intermediate',
    "category" TEXT NOT NULL DEFAULT 'Other',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Skill_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "CandidateProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Skill" ("id", "name") SELECT "id", "name" FROM "Skill";
DROP TABLE "Skill";
ALTER TABLE "new_Skill" RENAME TO "Skill";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
