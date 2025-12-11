const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Clearing database...');

  // Delete in correct order due to foreign key constraints
  await prisma.activityLog.deleteMany({});
  console.log('  ✓ Cleared activity logs');

  await prisma.message.deleteMany({});
  console.log('  ✓ Cleared messages');

  await prisma.conversation.deleteMany({});
  console.log('  ✓ Cleared conversations');

  await prisma.applicationStatusHistory.deleteMany({});
  console.log('  ✓ Cleared application status history');

  await prisma.application.deleteMany({});
  console.log('  ✓ Cleared applications');

  await prisma.job.deleteMany({});
  console.log('  ✓ Cleared jobs');

  await prisma.savedCandidate.deleteMany({});
  console.log('  ✓ Cleared saved candidates');

  await prisma.sharedDocument.deleteMany({});
  console.log('  ✓ Cleared shared documents');

  await prisma.document.deleteMany({});
  console.log('  ✓ Cleared documents');

  await prisma.education.deleteMany({});
  console.log('  ✓ Cleared education');

  await prisma.experience.deleteMany({});
  console.log('  ✓ Cleared experience');

  await prisma.certification.deleteMany({});
  console.log('  ✓ Cleared certifications');

  await prisma.skill.deleteMany({});
  console.log('  ✓ Cleared skills');

  await prisma.employerProfile.deleteMany({});
  console.log('  ✓ Cleared employer profiles');

  await prisma.candidateProfile.deleteMany({});
  console.log('  ✓ Cleared candidate profiles');

  await prisma.contactSubmission.deleteMany({});
  console.log('  ✓ Cleared contact submissions');

  await prisma.account.deleteMany({});
  console.log('  ✓ Cleared accounts');

  await prisma.passwordResetToken.deleteMany({});
  console.log('  ✓ Cleared password reset tokens');

  await prisma.verificationToken.deleteMany({});
  console.log('  ✓ Cleared verification tokens');

  await prisma.user.deleteMany({});
  console.log('  ✓ Cleared users');

  console.log('\n✅ Database cleared successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Clear failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
