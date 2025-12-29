const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createEmployer() {
  try {
    const email = 'levibatty@gmail.com';
    const password = 'TempPassword123!'; // You should change this after first login
    
    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email }
    });

    if (existing) {
      console.log('User already exists. Updating to EMPLOYER role...');
      
      // Update to employer role
      await prisma.user.update({
        where: { email },
        data: { 
          role: 'EMPLOYER',
          emailVerified: new Date()
        }
      });

      // Check if employer profile exists
      const employerProfile = await prisma.employerProfile.findUnique({
        where: { userId: existing.id }
      });

      if (!employerProfile) {
        await prisma.employerProfile.create({
          data: {
            userId: existing.id,
            companyName: 'PMO Network Admin',
            contactName: 'Levi Batty',
            phone: null
          }
        });
        console.log('✅ Employer profile created');
      } else {
        console.log('✅ Employer profile already exists');
      }

      console.log('✅ User updated to EMPLOYER role');
      console.log(`Email: ${email}`);
      console.log(`Role: EMPLOYER`);
      
    } else {
      console.log('Creating new employer account...');
      
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role: 'EMPLOYER',
          emailVerified: new Date()
        }
      });

      await prisma.employerProfile.create({
        data: {
          userId: user.id,
          companyName: 'PMO Network Admin',
          contactName: 'Levi Batty',
          phone: null
        }
      });

      console.log('✅ Employer account created successfully!');
      console.log(`Email: ${email}`);
      console.log(`Temporary Password: ${password}`);
      console.log(`Role: EMPLOYER`);
      console.log('\n⚠️  Please change your password after first login!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createEmployer();
