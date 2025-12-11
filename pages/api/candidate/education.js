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
      const education = await prisma.education.findMany({
        where: { candidateId },
        orderBy: { startDate: 'desc' }
      });
      return res.status(200).json({ education: JSON.parse(JSON.stringify(education)) });
    }

    if (req.method === 'POST') {
      const { institution, degree, fieldOfStudy, grade, startDate, endDate, current, description } = req.body;

      if (!institution || !degree) {
        return res.status(400).json({ error: 'Institution and Degree are required' });
      }

      const education = await prisma.education.create({
        data: {
          candidateId,
          institution,
          degree,
          fieldOfStudy,
          grade,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate && !current ? new Date(endDate) : null,
          current: current || false,
          description
        }
      });

      return res.status(201).json({ education: JSON.parse(JSON.stringify(education)) });
    }

    if (req.method === 'PUT') {
      const { id, institution, degree, fieldOfStudy, grade, startDate, endDate, current, description } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Education ID is required' });
      }

      const education = await prisma.education.update({
        where: { id, candidateId },
        data: {
          institution,
          degree,
          fieldOfStudy,
          grade,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate && !current ? new Date(endDate) : null,
          current: current || false,
          description
        }
      });

      return res.status(200).json({ education: JSON.parse(JSON.stringify(education)) });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'Education ID is required' });
      }

      await prisma.education.delete({
        where: { id, candidateId }
      });

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Education API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
