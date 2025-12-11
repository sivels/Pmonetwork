import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '../../../../lib/prisma';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || (session.user.role || '').toLowerCase() !== 'employer') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { employerEmployerProfile: true }
  });

  if (!user?.employerEmployerProfile) {
    return res.status(404).json({ error: 'Employer profile not found' });
  }

  const employerId = user.employerEmployerProfile.id;
  const { candidateId } = req.query;

  if (req.method === 'POST') {
    // Save/bookmark candidate
    try {
      const existing = await prisma.savedCandidate.findFirst({
        where: { employerId, candidateId }
      });

      if (existing) {
        return res.status(200).json({ message: 'Already saved', saved: true });
      }

      await prisma.savedCandidate.create({
        data: { employerId, candidateId }
      });

      return res.status(200).json({ message: 'Candidate saved', saved: true });
    } catch (error) {
      console.error('Error saving candidate:', error);
      return res.status(500).json({ error: 'Failed to save candidate' });
    }
  }

  if (req.method === 'DELETE') {
    // Remove bookmark
    try {
      await prisma.savedCandidate.deleteMany({
        where: { employerId, candidateId }
      });

      return res.status(200).json({ message: 'Candidate removed', saved: false });
    } catch (error) {
      console.error('Error removing candidate:', error);
      return res.status(500).json({ error: 'Failed to remove candidate' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
