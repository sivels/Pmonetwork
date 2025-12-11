const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'candidate.rt@test.local' },
      include: { candidateCandidateProfile: true }
    });
    
    console.log('User found:', user ? 'YES' : 'NO');
    if (user) {
      console.log('Email:', user.email);
      console.log('Role:', user.role);
      console.log('Has profile:', user.candidateCandidateProfile ? 'YES' : 'NO');
      if (user.candidateCandidateProfile) {
        console.log('Profile ID:', user.candidateCandidateProfile.id);
        console.log('Full Name:', user.candidateCandidateProfile.fullName);
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
})();
