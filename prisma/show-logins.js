const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('\n🔑 LOGIN CREDENTIALS (Password: password123)\n');
  
  console.log('👔 EMPLOYERS:');
  console.log('═══════════════════════════════════════════════════════════');
  const employers = await prisma.user.findMany({
    where: { role: 'EMPLOYER' },
    include: {
      employerEmployerProfile: {
        include: {
          jobs: {
            include: {
              applications: true
            }
          }
        }
      }
    }
  });

  for (const emp of employers) {
    const profile = emp.employerEmployerProfile;
    const totalApps = profile.jobs.reduce((sum, job) => sum + job.applications.length, 0);
    const newApps = profile.jobs.reduce((sum, job) => 
      sum + job.applications.filter(a => a.status === 'APPLIED').length, 0);
    
    console.log(`\n📧 ${emp.email}`);
    console.log(`   Company: ${profile.companyName}`);
    console.log(`   Jobs: ${profile.jobs.length}`);
    console.log(`   Total Applications: ${totalApps}`);
    console.log(`   New Applications: ${newApps}`);
  }

  console.log('\n\n👤 CANDIDATES (Sample):');
  console.log('═══════════════════════════════════════════════════════════');
  const candidates = await prisma.user.findMany({
    where: { role: 'CANDIDATE' },
    take: 5,
    include: {
      candidateCandidateProfile: {
        include: {
          applications: true
        }
      }
    }
  });

  for (const cand of candidates) {
    const profile = cand.candidateCandidateProfile;
    console.log(`\n📧 ${cand.email}`);
    console.log(`   Name: ${profile.fullName}`);
    console.log(`   Title: ${profile.jobTitle}`);
    console.log(`   Applications: ${profile.applications.length}`);
  }

  console.log('\n\n💡 TIP: Logout and login with one of the employer emails above!');
  console.log('═══════════════════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
