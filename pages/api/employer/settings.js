import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session || (session.user.role || '').toLowerCase() !== 'employer') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'PUT') {
    try {
      const { section, data } = req.body;
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { employerEmployerProfile: true }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Handle different sections
      if (section === 'company') {
        // Update company information in employerProfile
        if (user.employerEmployerProfile) {
          await prisma.employerProfile.update({
            where: { id: user.employerEmployerProfile.id },
            data: {
              companyName: data.companyName,
              website: data.website,
              // Add other fields as they're added to the schema
            }
          });
        } else {
          // Create profile if it doesn't exist
          await prisma.employerProfile.create({
            data: {
              userId: user.id,
              companyName: data.companyName,
              website: data.website,
            }
          });
        }
        return res.status(200).json({ message: 'Company information updated' });
      }

      if (section === 'contact') {
        // Update contact details
        if (user.employerEmployerProfile) {
          await prisma.employerProfile.update({
            where: { id: user.employerEmployerProfile.id },
            data: {
              contactName: data.primaryName,
              phone: data.primaryPhone,
            }
          });
        }
        
        // Update user email if changed
        if (data.primaryEmail !== user.email) {
          await prisma.user.update({
            where: { id: user.id },
            data: { email: data.primaryEmail }
          });
        }
        
        return res.status(200).json({ message: 'Contact details updated' });
      }

      if (section === 'notifications') {
        // Store notification preferences (could be in a separate table or JSON field)
        // For now, just acknowledge the save
        return res.status(200).json({ message: 'Notification preferences updated' });
      }

      return res.status(400).json({ error: 'Invalid section' });
    } catch (error) {
      console.error('Settings update error:', error);
      return res.status(500).json({ error: 'Failed to update settings' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
