import { getSession } from 'next-auth/react';
import { prisma } from '../../../lib/prisma';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getSession({ req });
  if (!session || session.user.role !== 'candidate') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const candidateId = session.user.id;
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Document ID is required' });
  }

  try {
    // Get document to find file path
    const document = await prisma.document.findFirst({
      where: { id, candidateId }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

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
    console.error('Delete document error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
