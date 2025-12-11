import { getToken } from 'next-auth/jwt';
import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== 'EMPLOYER') return res.status(401).json({ error: 'Unauthorized' });
  const employerId = (await prisma.employerProfile.findUnique({ where: { userId: token.id } })).id;
  if (req.method === 'POST') {
    const { candidateId } = req.body;
    if (!candidateId) return res.status(400).json({ error: 'Missing candidateId' });
    const saved = await prisma.savedCandidate.create({ data: { employerId, candidateId } });
    return res.json(saved);
  }
  if (req.method === 'GET') {
    const saved = await prisma.savedCandidate.findMany({ where: { employerId }, include: { candidate: true } });
    return res.json(saved);
  }
  res.status(405).end();
}
