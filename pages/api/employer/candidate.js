import { getToken } from 'next-auth/jwt';
import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== 'EMPLOYER') return res.status(401).json({ error: 'Unauthorized' });
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing id' });
  const profile = await prisma.candidateProfile.findUnique({
    where: { id },
    include: { skills: true, certifications: true, documents: true },
  });
  if (!profile) return res.status(404).json({ error: 'Not found' });

  let visibleToEmployers = false;
  if (profile.personalityDesc) {
    try {
      const parsed = JSON.parse(profile.personalityDesc);
      visibleToEmployers = Boolean(parsed?.visibleToEmployers);
    } catch {
      visibleToEmployers = false;
    }
  }

  if (!visibleToEmployers) {
    profile.personalityType = null;
    profile.personalityDesc = null;
  }

  res.json(profile);
}
