import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      // Get connected accounts for the user
      const accounts = await prisma.account.findMany({
        where: {
          userId: session.user.id,
        },
        select: {
          provider: true,
          providerAccountId: true,
          access_token: true,
          expires_at: true,
        },
      });

      // Format the response to hide sensitive tokens
      const connectedAccounts = accounts.map(account => ({
        provider: account.provider,
        providerAccountId: account.providerAccountId,
        isConnected: !!account.access_token,
        expiresAt: account.expires_at,
      }));

      return res.status(200).json({ accounts: connectedAccounts });
    } catch (error) {
      console.error('Error fetching accounts:', error);
      return res.status(500).json({ error: 'Failed to fetch connected accounts' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { provider } = req.body;

      if (!provider) {
        return res.status(400).json({ error: 'Provider is required' });
      }

      // Delete the account connection
      await prisma.account.deleteMany({
        where: {
          userId: session.user.id,
          provider,
        },
      });

      return res.status(200).json({ success: true, message: `${provider} account disconnected` });
    } catch (error) {
      console.error('Error disconnecting account:', error);
      return res.status(500).json({ error: 'Failed to disconnect account' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
