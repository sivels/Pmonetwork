import { getSession } from 'next-auth/react';
import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  const session = await getSession({ req });

  if (!session || session.user.role !== 'candidate') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const candidateId = session.user.id;

  try {
    if (req.method === 'GET') {
      const experiences = await prisma.experience.findMany({
        where: { candidateId },
        orderBy: { startDate: 'desc' }
      });
      return res.status(200).json({ experiences: JSON.parse(JSON.stringify(experiences)) });
    }

    if (req.method === 'POST') {
      const { jobTitle, company, location, startDate, endDate, current, description, achievements, projectType, projectValue, teamSize } = req.body;

      if (!jobTitle || !company || !startDate) {
        return res.status(400).json({ error: 'Job Title, Company, and Start Date are required' });
      }

      const experience = await prisma.experience.create({
        data: {
          candidateId,
          jobTitle,
          company,
          location,
          startDate: new Date(startDate),
          endDate: endDate && !current ? new Date(endDate) : null,
          current: current || false,
          description,
          achievements,
          projectType,
          projectValue,
          teamSize
        }
      });

      return res.status(201).json({ experience: JSON.parse(JSON.stringify(experience)) });
    }

    if (req.method === 'PUT') {
      const { id, jobTitle, company, location, startDate, endDate, current, description, achievements, projectType, projectValue, teamSize } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Experience ID is required' });
      }

      const experience = await prisma.experience.update({
        where: { id, candidateId },
        data: {
          jobTitle,
          company,
          location,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate && !current ? new Date(endDate) : null,
          current: current || false,
          description,
          achievements,
          projectType,
          projectValue,
          teamSize
        }
      });

      return res.status(200).json({ experience: JSON.parse(JSON.stringify(experience)) });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'Experience ID is required' });
      }

      await prisma.experience.delete({
        where: { id, candidateId }
      });

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Experience API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
