import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';

export default async function handler(req, res) {
  try {
    console.log('Debug session - starting');
    const session = await getServerSession(req, res, authOptions);
    console.log('Debug session - result:', session);
    
    res.status(200).json({
      success: true,
      hasSession: !!session,
      session: session || null
    });
  } catch (error) {
    console.error('Debug session error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}
