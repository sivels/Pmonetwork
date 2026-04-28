import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '../../../lib/prisma';
import { canManageEmployerTeam, resolveEmployerContext } from '../../../lib/employerContext';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session || (session.user.role || '').toLowerCase() !== 'employer') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'PUT') {
    try {
      const { section, data } = req.body;
      const context = await resolveEmployerContext({ userId: session.user.id });

      if (!context?.user || !context?.employerProfile) {
        return res.status(404).json({ error: 'Employer profile not found' });
      }

      const canManage = canManageEmployerTeam(context);

      // Handle different sections
      if (section === 'company') {
        if (!canManage) {
          return res.status(403).json({ error: 'Insufficient permissions to update company settings' });
        }

        await prisma.employerProfile.update({
          where: { id: context.employerProfile.id },
          data: {
            companyName: data.companyName,
            website: data.website,
          }
        });
        return res.status(200).json({ message: 'Company information updated' });
      }

      if (section === 'contact') {
        if (!canManage) {
          return res.status(403).json({ error: 'Insufficient permissions to update contact settings' });
        }

        await prisma.employerProfile.update({
          where: { id: context.employerProfile.id },
          data: {
            contactName: data.primaryName,
            phone: data.primaryPhone,
          }
        });
        
        // Update user email if changed
        if (data.primaryEmail !== context.user.email) {
          await prisma.user.update({
            where: { id: context.user.id },
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
