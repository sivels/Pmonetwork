import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  // Security: Only allow this in development or with a secret key
  const adminSecret = process.env.ADMIN_SECRET || 'dev-secret-change-in-prod';
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check authorization
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${adminSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { email, password, companyName, contactName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email }
    });

    if (existing) {
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
            companyName: companyName || 'PMO Network Admin',
            contactName: contactName || email.split('@')[0],
            phone: null
          }
        });
      }

      return res.status(200).json({ 
        success: true,
        message: 'User updated to EMPLOYER role',
        email,
        role: 'EMPLOYER'
      });
    } else {
      // Create new employer account
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
          companyName: companyName || 'PMO Network Admin',
          contactName: contactName || email.split('@')[0],
          phone: null
        }
      });

      return res.status(201).json({ 
        success: true,
        message: 'Employer account created successfully',
        email,
        role: 'EMPLOYER'
      });
    }

  } catch (error) {
    console.error('Error creating employer:', error);
    return res.status(500).json({ 
      error: 'Failed to create employer account',
      details: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
}
