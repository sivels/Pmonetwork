import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session || (session.user.role || '').toLowerCase() !== 'employer') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'POST') {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
      }

      const user = await prisma.user.findUnique({
        where: { email: session.user.email }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify current password
      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      });

      return res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Password change error:', error);
      return res.status(500).json({ error: 'Failed to update password' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
