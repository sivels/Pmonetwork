import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '../../../lib/prisma';

// POST /api/jobs/create
// Body: { title, description, location, employmentType, isRemote }
// Requires authenticated user with role === 'employer' and existing EmployerProfile.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user?.role !== 'employer') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { title, description, location, employmentType, isRemote } = req.body || {};

  // Basic validation
  if (!title || typeof title !== 'string' || title.trim().length < 4) {
    return res.status(400).json({ error: 'Title must be at least 4 characters.' });
  }
  if (!description || typeof description !== 'string' || description.trim().length < 20) {
    return res.status(400).json({ error: 'Description must be at least 20 characters.' });
  }
  if (!employmentType || !['full-time','part-time','contract','temporary','internship','fractional'].includes(employmentType)) {
    return res.status(400).json({ error: 'Invalid employment type.' });
  }

  try {
    // Fetch employer profile for linkage
    const employerProfile = await prisma.employerProfile.findUnique({
      where: { userId: session.user.id }
    });
    if (!employerProfile) {
      return res.status(400).json({ error: 'Employer profile not found. Complete onboarding first.' });
    }

    const job = await prisma.job.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        location: (location || '').trim(),
        employmentType,
        isRemote: Boolean(isRemote),
        employer: { connect: { id: employerProfile.id } }
      }
    });

    return res.status(201).json({ job });
  } catch (err) {
    console.error('Job creation failed', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
