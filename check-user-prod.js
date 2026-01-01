const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'levibatty1@gmail.com';
  
  const user = await prisma.user.findUnique({ 
    where: { email },
    include: { employerEmployerProfile: true }
  });
  
  if (!user) {
    console.log('User not found');
    return;
  }
  
  console.log('User details:');
  console.log('Email:', user.email);
  console.log('Role:', user.role);
  console.log('Has employer profile:', !!user.employerEmployerProfile);
  console.log('Password hash:', user.password.substring(0, 20) + '...');
  
  // Test password
  const testPassword = 'PMOEmployer2025!';
  const isValid = await bcrypt.compare(testPassword, user.password);
  console.log('\nPassword test for "PMOEmployer2025!":', isValid ? '✅ VALID' : '❌ INVALID');
  
  // Try with password123
  const isValid2 = await bcrypt.compare('password123', user.password);
  console.log('Password test for "password123":', isValid2 ? '✅ VALID' : '❌ INVALID');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
