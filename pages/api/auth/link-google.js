import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    // User needs to be logged in to link an account
    // Redirect to Google OAuth with a state parameter indicating this is account linking
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    return res.redirect(
      302,
      `${baseUrl}/api/auth/signin/google?callbackUrl=${encodeURIComponent('/employer/settings?tab=integrations&linked=true')}`
    );
  }

  return res.status(200).json({ message: 'Already authenticated' });
}
