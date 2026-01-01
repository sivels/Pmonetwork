import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { employerId, candidateId, jobId } = req.body;
      
      console.log('Creating conversation with:', { employerId, candidateId, jobId });
      
      if (!employerId || !candidateId) {
        console.log('Missing required IDs');
        return res.status(400).json({ error: 'Missing ids' });
      }

      const existing = await prisma.conversation.findFirst({ 
        where: { employerId, candidateId, jobId: jobId ?? undefined } 
      });
      
      if (existing) {
        console.log('Found existing conversation:', existing.id);
        return res.status(200).json(existing);
      }

      const created = await prisma.conversation.create({ 
        data: { employerId, candidateId, jobId: jobId ?? undefined } 
      });
      
      console.log('Created new conversation:', created.id);
      return res.status(200).json(created);
    } catch (error) {
      console.error('Error creating conversation:', error);
      return res.status(500).json({ error: 'Failed to create conversation', details: error.message });
    }
  }

  if (req.method === 'GET') {
    try {
      const { employerId, candidateId } = req.query;

      const where = {};
      if (employerId) where.employerId = employerId;
      if (candidateId) where.candidateId = candidateId;

      const items = await prisma.conversation.findMany({ 
        where, 
        orderBy: { updatedAt: 'desc' } 
      });
      
      return res.status(200).json({ items });
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return res.status(500).json({ error: 'Failed to fetch conversations' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
