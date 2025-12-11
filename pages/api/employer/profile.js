import { prisma } from '../../../lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user.role?.toLowerCase() !== 'employer') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { employerEmployerProfile: true }
    });

    if (!user?.employerEmployerProfile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const { companyName, contactName, website, phone } = req.body;

    const updated = await prisma.employerProfile.update({
      where: { id: user.employerEmployerProfile.id },
      data: {
        ...(companyName !== undefined && { companyName }),
        ...(contactName !== undefined && { contactName }),
        ...(website !== undefined && { website }),
        ...(phone !== undefined && { phone })
      }
    });

    return res.status(200).json({
      companyName: updated.companyName,
      contactName: updated.contactName,
      website: updated.website,
      phone: updated.phone
    });
  } catch (error) {
    console.error('Employer profile update error:', error);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
}
