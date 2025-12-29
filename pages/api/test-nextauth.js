import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';

export default async function handler(req, res) {
  console.log('Test NextAuth - Request received');
  console.log('NEXTAUTH_SECRET exists:', !!process.env.NEXTAUTH_SECRET);
  console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
  
  try {
    const session = await getServerSession(req, res, authOptions);
    console.log('Session retrieved:', !!session);
    
    return res.status(200).json({
      success: true,
      hasSession: !!session,
      sessionData: session ? {
        user: session.user?.email,
        role: session.user?.role
      } : null,
      env: {
        hasSecret: !!process.env.NEXTAUTH_SECRET,
        hasUrl: !!process.env.NEXTAUTH_URL,
        url: process.env.NEXTAUTH_URL
      }
    });
  } catch (error) {
    console.error('Test NextAuth error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}
