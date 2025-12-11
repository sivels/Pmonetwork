import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '../../../lib/prisma';

// PUT /api/jobs/update { id, ...fields }
// Editable fields: title, shortDescription, description, location, employmentType, isRemote, salaryMin, salaryMax, currency, isFeatured, isUrgent, specialism, seniority
export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    res.setHeader('Allow', 'PUT');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const session = await getServerSession(req, res, authOptions);
  if (!session || (session.user.role || '').toLowerCase() !== 'employer') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const { id, ...body } = req.body || {};
  if (!id) return res.status(400).json({ error: 'Missing job id' });
  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email }, include: { employerEmployerProfile: true } });
    const employerProfile = user?.employerEmployerProfile;
    if (!employerProfile) return res.status(400).json({ error: 'Employer profile missing' });
    const job = await prisma.job.findUnique({ where: { id } });
    if (!job || job.employerId !== employerProfile.id) return res.status(404).json({ error: 'Job not found' });
    const allowed = ['title','shortDescription','description','location','employmentType','isRemote','salaryMin','salaryMax','currency','isFeatured','isUrgent','specialism','seniority'];
    const data = {};
    for (const key of allowed) if (key in body) data[key] = body[key];
    if (data.title && data.title.trim().length < 4) return res.status(400).json({ error: 'Title too short' });
    if (data.shortDescription && data.shortDescription.length > 240) return res.status(400).json({ error: 'Short description max 240 chars' });
    if (data.salaryMin && data.salaryMin < 0) return res.status(400).json({ error: 'Invalid salaryMin' });
    if (data.salaryMax && data.salaryMax < 0) return res.status(400).json({ error: 'Invalid salaryMax' });
    if (data.salaryMin && data.salaryMax && data.salaryMax < data.salaryMin) return res.status(400).json({ error: 'salaryMax < salaryMin' });
    const updated = await prisma.job.update({ where: { id }, data });
    return res.json({ job: { id: updated.id } });
  } catch (e) {
    console.error('Job update error', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
