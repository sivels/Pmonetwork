import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || (session.user.role || '').toLowerCase() !== 'candidate') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return res.status(404).json({ error: 'User not found' });
  const candidate = await prisma.candidateProfile.findUnique({ where: { userId: user.id } });
  if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

  if (req.method === 'GET') {
    const docs = await prisma.document.findMany({ where: { candidateId: candidate.id } });
    return res.json(docs);
  }

  if (req.method === 'PUT') {
    try {
      const { id, isPublic } = req.body || {};
      if (!id) return res.status(400).json({ error: 'Missing id' });
      const doc = await prisma.document.update({ where: { id }, data: { isPublic: Boolean(isPublic) } });
      return res.json(doc);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Failed to update document' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'Missing id' });
      await prisma.document.delete({ where: { id } });
      return res.json({ ok: true });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Failed to delete document' });
    }
  }

  res.setHeader('Allow', 'GET, PUT, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}
