import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '../../../../lib/prisma';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session || (session.user.role || '').toLowerCase() !== 'employer') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'POST') {
    try {
      const user = await prisma.user.findUnique(
        {
        where: { email: session.user.email },
        include: { employerEmployerProfile: true }
      });

      if (!user || !user.employerEmployerProfile) {
        return res.status(404).json({ error: 'Employer profile not found' });
      }

      const draftData = req.body;
      const employerId = user.employerEmployerProfile.id;

      // Map form fields to schema fields
      const jobData = {
        title: draftData.jobTitle || 'Untitled Draft',
        description: draftData.jobSummary || '',
        location: draftData.city || null,
        employmentType: draftData.employmentType || null,
        isRemote: draftData.workArrangement === 'Remote',
        shortDescription: draftData.jobSummary?.substring(0, 200) || null,
        salaryMin: draftData.salaryMin ? parseInt(draftData.salaryMin) : null,
        salaryMax: draftData.salaryMax ? parseInt(draftData.salaryMax) : null,
        currency: draftData.currency || 'GBP',
        specialism: draftData.department || null,
        seniority: draftData.seniorityLevel || null,
        paused: false,
        employerId: employerId
      };
      
      // Add isDraft field only if it exists in the database schema
      try {
        // Test if isDraft column exists by trying to query with it
        await prisma.job.findFirst({ where: { id: 'test' }, select: { isDraft: true } });
        jobData.isDraft = true;
      } catch (e) {
        // Column doesn't exist yet, skip it
      }

      // Check if updating existing draft
      if (draftData.jobId) {
        const updated = await prisma.job.update({
          where: { id: draftData.jobId },
          data: jobData
        });
        return res.status(200).json({ success: true, jobId: updated.id });
      } else {
        // Create new draft
        const draft = await prisma.job.create({
          data: jobData
        });
        return res.status(200).json({ success: true, jobId: draft.id });
      }
    } catch (error) {
      console.error('Draft save error:', error);
      return res.status(500).json({ error: 'Failed to save draft' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
