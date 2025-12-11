// Automated test for returnTo flow using Playwright
// Assumes dev server running at http://localhost:3000
// Flow: seed employer+job and candidate without profile -> visit job -> login with returnTo -> onboarding -> redirected with apply modal open

const { test, expect } = require('@playwright/test');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function seedData() {
  const prisma = new PrismaClient();
  // Create employer
  const employerPassword = bcrypt.hashSync('EmployerPass123!', 10);
  const employerUser = await prisma.user.upsert({
    where: { email: 'employer.rt@test.local' },
    update: {},
    create: { email: 'employer.rt@test.local', password: employerPassword, role: 'EMPLOYER' }
  });
  const employerProfile = await prisma.employerProfile.upsert({
    where: { userId: employerUser.id },
    update: {},
    create: { userId: employerUser.id, companyName: 'ReturnTo Corp', contactName: 'Owner' }
  });
  // Create job
  const job = await prisma.job.create({
    data: {
      employerId: employerProfile.id,
      title: 'ReturnTo Test Analyst',
      description: 'Testing returnTo application flow.',
      shortDescription: 'ReturnTo flow job',
      employmentType: 'contract'
    }
  });
  // Candidate without profile
  const candidatePassword = bcrypt.hashSync('CandidatePass123!', 10);
  const candidateUser = await prisma.user.upsert({
    where: { email: 'candidate.rt@test.local' },
    update: {},
    create: { email: 'candidate.rt@test.local', password: candidatePassword, role: 'CANDIDATE' }
  });
  await prisma.$disconnect();
  return { jobId: job.id };
}

// Helper to wait for navigation that includes substring
async function waitForUrlContains(page, substr) {
  await page.waitForFunction((s) => window.location.href.includes(s), substr, { timeout: 10000 });
}

test.describe('returnTo candidate apply flow', () => {
  let jobId;

  test.beforeAll(async () => {
    const data = await seedData();
    jobId = data.jobId;
    console.log('Seeded job for returnTo test:', jobId);
  });

  test('redirects back to job with apply modal open after onboarding', async ({ page }) => {
    const base = 'http://localhost:3000';
    const jobUrl = `${base}/jobs/${jobId}`;
    // Visit job page unauthenticated
    await page.goto(jobUrl);
    await expect(page.getByRole('heading', { name: 'ReturnTo Test Analyst' })).toBeVisible();

    // Navigate directly to login with returnTo (simulate clicking Apply then choosing sign in)
    await page.goto(`${base}/auth/login?returnTo=/jobs/${jobId}`);
    // Fill credentials (candidate default selected)
    await page.getByLabel(/Email Address|Company Email|Email/i).fill('candidate.rt@test.local');
    await page.getByLabel(/Password/i).fill('CandidatePass123!');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Expect onboarding page
    await waitForUrlContains(page, '/auth/onboarding');
    await expect(page.getByRole('heading', { name: /Finish Setting Up/i })).toBeVisible();

    // Complete onboarding
    await page.getByLabel('Full Name').fill('ReturnTo Candidate');
    await page.getByRole('button', { name: 'Complete Onboarding' }).click();

    // Wait for redirect to job with apply=1
    await waitForUrlContains(page, `jobs/${jobId}?apply=1`);

    // Modal visible (Apply for ... heading)
    await expect(page.getByRole('heading', { name: `Apply for ReturnTo Test Analyst` })).toBeVisible();
  });
});
