import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '../../../lib/prisma';

// POST { applicationId, status }
// Allowed statuses: REVIEW, INTERVIEW, OFFER, REJECTED
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const session = await getServerSession(req, res, authOptions);
  if (!session || (session.user.role || '').toLowerCase() !== 'employer') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const { applicationId, status } = req.body || {};
  if (!applicationId || !status) return res.status(400).json({ error: 'Missing fields' });
  const allowed = ['REVIEW', 'INTERVIEW', 'OFFER', 'REJECTED'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  try {
    // Verify ownership: application -> job -> employerId matches current employer profile
    const user = await prisma.user.findUnique({ where: { email: session.user.email }, include: { employerEmployerProfile: true } });
    const employerProfile = user?.employerEmployerProfile;
    if (!employerProfile) return res.status(400).json({ error: 'Employer profile missing' });
    const app = await prisma.application.findUnique({ where: { id: applicationId }, include: { job: true } });
    if (!app) return res.status(404).json({ error: 'Application not found' });
    if (app.job.employerId !== employerProfile.id) return res.status(403).json({ error: 'Forbidden' });
    const updated = await prisma.application.update({ where: { id: app.id }, data: { status } });
    return res.json({ id: updated.id, status: updated.status });
  } catch (e) {
    console.error('Status update error', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
