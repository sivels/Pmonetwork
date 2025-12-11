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
    "rightToWork" TEXT,
    "cvUrl" TEXT,
    "videoUrl" TEXT,
    "videoIntroUrl" TEXT,
    "profilePhotoUrl" TEXT,
    "linkedinUrl" TEXT,
    "portfolioUrl" TEXT,
    "githubUrl" TEXT,
    "twitterUrl" TEXT,
    "websiteUrl" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "showSalary" BOOLEAN NOT NULL DEFAULT false,
    "showProfilePhoto" BOOLEAN NOT NULL DEFAULT true,
    "anonymousMode" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CandidateProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_CandidateProfile" ("availability", "createdAt", "cvUrl", "dayRate", "email", "employmentType", "fullName", "githubUrl", "id", "jobTitle", "linkedinUrl", "location", "personalityDesc", "personalityType", "phone", "portfolioUrl", "profilePhotoUrl", "remotePreference", "salaryExpectation", "sector", "summary", "twitterUrl", "updatedAt", "userId", "videoIntroUrl", "videoUrl", "websiteUrl", "yearsExperience") SELECT "availability", "createdAt", "cvUrl", "dayRate", "email", "employmentType", "fullName", "githubUrl", "id", "jobTitle", "linkedinUrl", "location", "personalityDesc", "personalityType", "phone", "portfolioUrl", "profilePhotoUrl", "remotePreference", "salaryExpectation", "sector", "summary", "twitterUrl", "updatedAt", "userId", "videoIntroUrl", "videoUrl", "websiteUrl", "yearsExperience" FROM "CandidateProfile";
DROP TABLE "CandidateProfile";
ALTER TABLE "new_CandidateProfile" RENAME TO "CandidateProfile";
CREATE UNIQUE INDEX "CandidateProfile_userId_key" ON "CandidateProfile"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
