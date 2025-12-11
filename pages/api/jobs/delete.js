import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '../../../lib/prisma';

// DELETE /api/jobs/delete?id=JOB_ID
export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', 'DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const session = await getServerSession(req, res, authOptions);
  if (!session || (session.user.role || '').toLowerCase() !== 'employer') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing id' });
  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email }, include: { employerEmployerProfile: true } });
    const employerProfile = user?.employerEmployerProfile;
    if (!employerProfile) return res.status(400).json({ error: 'Employer profile missing' });
    const job = await prisma.job.findUnique({ where: { id: String(id) } });
    if (!job || job.employerId !== employerProfile.id) return res.status(404).json({ error: 'Job not found' });
    await prisma.application.deleteMany({ where: { jobId: job.id } }); // clean associated applications
    await prisma.job.delete({ where: { id: job.id } });
    return res.json({ deleted: true });
  } catch (e) {
    console.error('Delete job error', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
