import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '../../../lib/prisma';

function normalizeTicket(ticket) {
  return {
    ...ticket,
    notes: (ticket.notes || []).filter((note) => !note.isInternal),
  };
}

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'POST') {
    // Create a support ticket/message
    const { subject, message, category } = req.body;
    if (!subject?.trim() || !message?.trim()) {
      return res.status(400).json({ error: 'Subject and message required' });
    }

    const allowedCategories = [
      'LOGIN_ISSUE',
      'PROFILE_ISSUE',
      'FRAUD',
      'ACCOUNT_ACCESS',
      'BILLING',
      'OTHER',
      'GENERAL_INQUIRY',
      'DATA_REQUEST',
    ];

    const normalizedCategory = (category || '').toString().trim().toUpperCase();
    const ticketCategory = allowedCategories.includes(normalizedCategory)
      ? normalizedCategory
      : 'GENERAL_INQUIRY';

    try {
      const ticket = await prisma.supportTicket.create({
        data: {
          id: `sup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          reference: `SUP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
          createdByUserId: session.user.id,
          targetUserId: session.user.id,
          targetType: 'USER',
          category: ticketCategory,
          priority: 'MEDIUM',
          subject,
          description: message,
        },
        include: {
          createdBy: { select: { email: true } },
          notes: {
            include: {
              author: { select: { email: true, id: true } },
            },
          },
        },
      });

      // Add initial note
      const note = await prisma.supportTicketNote.create({
        data: {
          id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ticketId: ticket.id,
          authorUserId: session.user.id,
          note: message,
          isInternal: false,
        },
        include: {
          author: { select: { email: true, id: true } },
        },
      });

      // Return ticket with the new note included
      return res.status(201).json({ 
        ticket: normalizeTicket({
          ...ticket,
          notes: [...(ticket.notes || []), note],
        })
      });
    } catch (error) {
      console.error('Support message error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'GET') {
    // Get user's support tickets/messages
    try {
      const tickets = await prisma.supportTicket.findMany({
        where: {
          OR: [
            { createdByUserId: session.user.id },
            { targetUserId: session.user.id },
          ],
        },
        include: {
          createdBy: { select: { email: true, id: true } },
          notes: {
            orderBy: { createdAt: 'asc' },
            where: { isInternal: false },
            include: {
              author: { select: { email: true, id: true } },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      return res.status(200).json({ tickets: tickets.map(normalizeTicket) });
    } catch (error) {
      console.error('Get support messages error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'PATCH') {
    const { ticketId, message } = req.body || {};

    if (!ticketId || typeof ticketId !== 'string') {
      return res.status(400).json({ error: 'Valid ticketId is required' });
    }

    if (!message?.trim()) {
      return res.status(400).json({ error: 'Reply message is required' });
    }

    try {
      const existingTicket = await prisma.supportTicket.findFirst({
        where: {
          id: ticketId,
          OR: [
            { createdByUserId: session.user.id },
            { targetUserId: session.user.id },
          ],
        },
      });

      if (!existingTicket) {
        return res.status(404).json({ error: 'Ticket not found' });
      }

      const note = await prisma.supportTicketNote.create({
        data: {
          id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
          ticketId,
          authorUserId: session.user.id,
          note: message.trim(),
          isInternal: false,
        },
        include: {
          author: { select: { email: true, id: true } },
        },
      });

      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: {
          updatedAt: new Date(),
          status: existingTicket.status === 'CLOSED' ? 'OPEN' : existingTicket.status,
        },
      });

      const refreshedTicket = await prisma.supportTicket.findUnique({
        where: { id: ticketId },
        include: {
          createdBy: { select: { email: true, id: true } },
          notes: {
            where: { isInternal: false },
            orderBy: { createdAt: 'asc' },
            include: {
              author: { select: { email: true, id: true } },
            },
          },
        },
      });

      return res.status(200).json({
        ok: true,
        note,
        ticket: refreshedTicket ? normalizeTicket(refreshedTicket) : null,
      });
    } catch (error) {
      console.error('Reply to support ticket error:', error);
      return res.status(500).json({ error: error.message || 'Failed to send reply' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
