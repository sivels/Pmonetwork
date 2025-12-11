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
      const skills = await prisma.skill.findMany({
        where: { candidateId },
        orderBy: { createdAt: 'desc' }
      });
      return res.status(200).json({ skills });
    }

    if (req.method === 'POST') {
      const { name, proficiency, category } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Skill name is required' });
      }

      const skill = await prisma.skill.create({
        data: {
          candidateId,
          name,
          proficiency: proficiency || 'Intermediate',
          category: category || 'Other'
        }
      });

      return res.status(201).json({ skill });
    }

    if (req.method === 'PUT') {
      const { id, proficiency } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Skill ID is required' });
      }

      const skill = await prisma.skill.update({
        where: { id, candidateId },
        data: { proficiency }
      });

      return res.status(200).json({ skill });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'Skill ID is required' });
      }

      await prisma.skill.delete({
        where: { id, candidateId }
      });

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Skills API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
