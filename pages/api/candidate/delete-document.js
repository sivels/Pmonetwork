import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session || (session.user.role || '').toLowerCase() !== 'candidate') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = session.user.id;
  
  // Get the CandidateProfile ID
  const profile = await prisma.candidateProfile.findUnique({
    where: { userId }
  });
  
  if (!profile) {
    return res.status(404).json({ error: 'Candidate profile not found' });
  }
  
  const candidateId = profile.id;
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Document ID is required' });
  }

  try {
    // Get document to verify ownership
    const document = await prisma.document.findFirst({
      where: { id, candidateId }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Files are stored as base64 data URLs, no file system cleanup needed
    // Just delete from database
    await prisma.document.delete({
      where: { id }
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Delete document error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
