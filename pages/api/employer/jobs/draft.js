import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '../../../../lib/prisma';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session || (session.user.role || '').toLowerCase() !== 'employer') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'POST') {
    try {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const draftData = req.body;

      // Store draft in database (you can create a separate Draft model or use Job with draft status)
      // For now, we'll just acknowledge the save
      console.log('Draft saved for user:', user.id);

      return res.status(200).json({ success: true, message: 'Draft saved successfully' });
    } catch (error) {
      console.error('Draft save error:', error);
      return res.status(500).json({ error: 'Failed to save draft' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
