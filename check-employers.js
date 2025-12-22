const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const employers = await prisma.user.findMany({
    where: { role: 'EMPLOYER' },
    include: { employerEmployerProfile: true }
  });

  console.log('\n📊 Employer Accounts Found:', employers.length);
  
  employers.forEach(emp => {
    console.log('\n✅ Email:', emp.email);
    console.log('   Company:', emp.employerEmployerProfile?.companyName || 'No profile');
    console.log('   Password: password123');
  });

  if (employers.length === 0) {
    console.log('\n❌ No employer accounts found. Creating one...\n');
    
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const user = await prisma.user.create({
      data: {
        email: 'employer@test.com',
        password: hashedPassword,
        role: 'EMPLOYER',
        emailVerified: new Date(),
        employerEmployerProfile: {
          create: {
            companyName: 'Test Company',
            contactName: 'Test Employer',
            phone: '1234567890',
            website: 'https://test.com'
          }
        }
      }
    });
    
    console.log('✅ Created employer account:');
    console.log('   Email: employer@test.com');
    console.log('   Password: password123');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
