const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'levibatty1@gmail.com';
  const password = 'PMOEmployer2025!';
  
  // Check if user exists
  const existing = await prisma.user.findUnique({ where: { email } });
  
  if (existing) {
    console.log('User already exists:', email);
    console.log('Role:', existing.role);
    return;
  }
  
  // Create user
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      role: 'EMPLOYER',
      emailVerified: new Date()
    }
  });
  
  // Create employer profile
  await prisma.employerProfile.create({
    data: {
      userId: user.id,
      companyName: 'PMO Network'
    }
  });
  
  console.log('✅ Employer account created successfully!');
  console.log('Email:', email);
  console.log('Password:', password);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
