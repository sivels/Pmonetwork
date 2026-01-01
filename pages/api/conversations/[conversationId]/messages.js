import { prisma } from '../../../../lib/prisma';

export default async function handler(req, res) {
  const { conversationId } = req.query;

  if (req.method === 'GET') {
    try {
      const messages = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
      });
      
      return res.status(200).json({ items: messages });
    } catch (error) {
      console.error('Error fetching messages:', error);
      return res.status(500).json({ error: 'Failed to fetch messages' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { senderUserId, receiverUserId, text, attachments } = req.body;
      
      console.log('Creating message:', { conversationId, senderUserId, receiverUserId, textLength: text?.length });
      
      if (!senderUserId || !receiverUserId || !text) {
        console.log('Missing required fields');
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      const msg = await prisma.message.create({
        data: {
          conversationId,
          senderUserId,
          receiverUserId,
          text,
          attachments: attachments ? JSON.stringify(attachments) : undefined,
        },
      });
      
      console.log('Message created:', msg.id);
      
      await prisma.activityLog.create({
        data: {
          actorUserId: senderUserId,
          type: 'MESSAGE_SENT',
          details: JSON.stringify({ conversationId }),
        },
      });

      return res.status(200).json(msg);
    } catch (error) {
      console.error('Error creating message:', error);
      return res.status(500).json({ error: 'Failed to create message', details: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
