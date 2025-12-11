import { getServerSession } from 'next-auth/next';
import { authOptions } from './[...nextauth]';
import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const { role, fullName, jobTitle, companyName, contactName } = req.body;
  if (!role || (role !== 'CANDIDATE' && role !== 'EMPLOYER')) return res.status(400).json({ error: 'Invalid role' });

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email }, include: { candidateCandidateProfile: true, employerEmployerProfile: true } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.candidateCandidateProfile || user.employerEmployerProfile) {
      return res.status(400).json({ error: 'Profile already completed' });
    }

    let profile;
    if (role === 'CANDIDATE') {
      if (!fullName) return res.status(400).json({ error: 'Full name is required' });
      profile = await prisma.candidateProfile.create({
        data: { userId: user.id, fullName, jobTitle: jobTitle || '' }
      });
    } else {
      if (!companyName || !contactName) return res.status(400).json({ error: 'Company and contact name required' });
      profile = await prisma.employerProfile.create({
        data: { userId: user.id, companyName, contactName }
      });
    }
    await prisma.user.update({ where: { id: user.id }, data: { role } });
    return res.status(200).json({ ok: true, role, profile });
  } catch (err) {
    console.error('Complete profile error', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
