import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '../../../lib/prisma';

// POST /api/jobs/pause { id, paused: boolean }
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const session = await getServerSession(req, res, authOptions);
  if (!session || (session.user.role || '').toLowerCase() !== 'employer') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const { id, paused } = req.body || {};
  if (!id || typeof paused !== 'boolean') return res.status(400).json({ error: 'Missing id or paused' });
  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email }, include: { employerEmployerProfile: true } });
    const employerProfile = user?.employerEmployerProfile;
    if (!employerProfile) return res.status(400).json({ error: 'Employer profile missing' });
    const job = await prisma.job.findUnique({ where: { id } });
    if (!job || job.employerId !== employerProfile.id) return res.status(404).json({ error: 'Job not found' });
    const updated = await prisma.job.update({ where: { id }, data: { paused } });
    return res.json({ id: updated.id, paused: updated.paused });
  } catch (e) {
    console.error('Pause job error', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
