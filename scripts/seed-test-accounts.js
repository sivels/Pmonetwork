#!/usr/bin/env node
/**
 * Seed script to create two test accounts:
 * - candidate@test.pmo (password: Test1234)
 * - employer@test.pmo  (password: Test1234)
 *
 * Usage: node ./scripts/seed-test-accounts.js
 * Make sure your `DATABASE_URL` is available (e.g. in .env) before running.
 */

const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma').default || require('../lib/prisma');

async function main() {
  const password = 'Test1234';
  const hashed = await bcrypt.hash(password, 10);

  // Candidate
  let candidateUser = await prisma.user.findUnique({ where: { email: 'candidate@test.pmo' } });
  if (!candidateUser) {
    candidateUser = await prisma.user.create({
      data: {
        email: 'candidate@test.pmo',
        password: hashed,
        role: 'CANDIDATE',
        emailVerified: new Date(),
      },
    });
    await prisma.candidateProfile.create({ data: { userId: candidateUser.id, fullName: 'Test Candidate' } });
    console.log('Created candidate@test.pmo / Test1234');
  } else {
    console.log('candidate@test.pmo already exists');
  }

  // Employer
  let employerUser = await prisma.user.findUnique({ where: { email: 'employer@test.pmo' } });
  if (!employerUser) {
    employerUser = await prisma.user.create({
      data: {
        email: 'employer@test.pmo',
        password: hashed,
        role: 'EMPLOYER',
        emailVerified: new Date(),
      },
    });
    await prisma.employerProfile.create({ data: { userId: employerUser.id, companyName: 'Test Employer' } });
    console.log('Created employer@test.pmo / Test1234');
  } else {
    console.log('employer@test.pmo already exists');
  }

  console.log('\nYou can sign in with either account using the password: Test1234');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
