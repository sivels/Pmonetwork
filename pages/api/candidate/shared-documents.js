import { getToken } from 'next-auth/jwt';
import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== 'CANDIDATE') return res.status(401).json({ error: 'Unauthorized' });
  const candidate = await prisma.candidateProfile.findUnique({ where: { userId: token.id } });
  if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
  if (req.method === 'GET') {
    const docs = await prisma.sharedDocument.findMany({ where: { candidateId: candidate.id }, orderBy: { sentAt: 'desc' } });
    return res.json(docs);
  }
  if (req.method === 'PUT') {
    // Candidate signs/returns document
    const { id, action } = req.body;
    if (!id || !['VIEWED','SIGNED','RETURNED'].includes(action)) return res.status(400).json({ error: 'Invalid action' });
    const doc = await prisma.sharedDocument.findUnique({ where: { id } });
    if (!doc) return res.status(404).json({ error: 'Not found' });
    let update = { status: action, auditTrail: [...(doc.auditTrail||[]), { action, by: 'CANDIDATE', at: new Date().toISOString() }] };
    if (action === 'SIGNED') update.signedAt = new Date();
    if (action === 'RETURNED') update.returnedAt = new Date();
    const updated = await prisma.sharedDocument.update({ where: { id }, data: update });
    return res.json(updated);
  }
  res.status(405).end();
}
