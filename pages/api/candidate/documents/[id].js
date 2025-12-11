import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '../../../../lib/prisma';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user.role?.toLowerCase() !== 'candidate') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { candidateCandidateProfile: true }
  });

  if (!user?.candidateCandidateProfile) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  // Verify document belongs to user
  const document = await prisma.document.findUnique({
    where: { id }
  });

  if (!document || document.candidateId !== user.candidateCandidateProfile.id) {
    return res.status(404).json({ error: 'Document not found' });
  }

  if (req.method === 'DELETE') {
    try {
      // Delete file from filesystem
      const filePath = path.join(process.cwd(), 'public', document.url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Delete from database
      await prisma.document.delete({
        where: { id }
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Delete error:', error);
      return res.status(500).json({ error: 'Failed to delete document' });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const { filename, title, isPublic } = req.body;

      const updatedDoc = await prisma.document.update({
        where: { id },
        data: {
          ...(filename && { filename }),
          ...(title && { title }),
          ...(isPublic !== undefined && { isPublic })
        }
      });

      return res.status(200).json(updatedDoc);
    } catch (error) {
      console.error('Update error:', error);
      return res.status(500).json({ error: 'Failed to update document' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
