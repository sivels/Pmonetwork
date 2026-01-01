const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'levibatty1@gmail.com';
  const newPassword = 'PMOEmployer2025!';
  
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword }
  });
  
  console.log('✅ Password reset successfully!');
  console.log('Email:', email);
  console.log('New Password:', newPassword);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
