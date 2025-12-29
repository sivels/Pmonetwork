export default async function handler(req, res) {
  // Simple endpoint to verify it's reachable
  return res.status(200).json({
    success: true,
    message: 'Endpoint is reachable',
    timestamp: new Date().toISOString(),
    env: {
      hasSecret: !!process.env.NEXTAUTH_SECRET,
      hasUrl: !!process.env.NEXTAUTH_URL,
      url: process.env.NEXTAUTH_URL,
      nodeEnv: process.env.NODE_ENV
    }
  });
}
