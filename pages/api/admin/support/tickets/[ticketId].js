import { prisma } from '../../../../../lib/prisma';
import { hasSupportRole, requireSupportRole } from '../../../../../lib/adminSupportAuth';
import { logAdminAction } from '../../../../../lib/adminAudit';

function safeJson(data) {
  return JSON.parse(JSON.stringify(data));
}

export default async function handler(req, res) {
  const auth = await requireSupportRole(req, res, 'SUPPORT_AGENT');
  if (!auth) return;

  const { actor } = auth;
  const ticketId = req.query.ticketId;

  if (!ticketId || typeof ticketId !== 'string') {
    return res.status(400).json({ error: 'Invalid ticket id' });
  }

  if (req.method === 'GET') {
    try {
      const ticket = await prisma.supportTicket.findUnique({
        where: { id: ticketId },
        include: {
          assignedTo: { select: { id: true, email: true, role: true } },
          createdBy: { select: { id: true, email: true, role: true } },
          targetUser: {
            select: {
              id: true,
              email: true,
              role: true,
              accountStatus: true,
              verificationStatus: true,
              candidateCandidateProfile: { select: { fullName: true, jobTitle: true } },
              employerEmployerProfile: { select: { companyName: true, contactName: true } },
            },
          },
          notes: {
            orderBy: { createdAt: 'desc' },
            include: {
              author: { select: { id: true, email: true, role: true } },
            },
          },
        },
      });

      if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
      return res.status(200).json({ ticket: safeJson(ticket) });
    } catch (error) {
      console.error('Support ticket detail error:', error);
      return res.status(500).json({ error: 'Failed to fetch ticket details' });
    }
  }

  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, payload = {} } = req.body || {};
  if (!action) return res.status(400).json({ error: 'Action is required' });

  try {
    const existing = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!existing) return res.status(404).json({ error: 'Ticket not found' });

    if (action === 'ADD_NOTE') {
      if (!payload.note || !payload.note.trim()) {
        return res.status(400).json({ error: 'Note is required' });
      }

      const note = await prisma.supportTicketNote.create({
        data: {
          ticketId,
          authorUserId: actor.id,
          note: payload.note.trim(),
          isInternal: payload.isInternal !== false,
        },
        include: {
          author: { select: { id: true, email: true, role: true } },
        },
      });

      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: {
          updatedAt: new Date(),
          firstResponseAt: existing.firstResponseAt || new Date(),
        },
      });

      await logAdminAction(req, {
        actorUserId: actor.id,
        targetUserId: existing.targetUserId,
        entityType: 'TICKET',
        action: 'TICKET_NOTE_ADDED',
        summary: `Added note to ticket ${existing.reference}`,
        metadata: { ticketId, isInternal: payload.isInternal !== false },
      });

      return res.status(200).json({ ok: true, note: safeJson(note) });
    }

    if (action === 'ASSIGN_TICKET') {
      const assignedToUserId = payload.assignedToUserId || null;
      if (assignedToUserId && !hasSupportRole(payload.assignedToRole || 'SUPPORT_AGENT', 'SUPPORT_AGENT')) {
        return res.status(400).json({ error: 'Assignee must be a support/admin user' });
      }

      const ticket = await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { assignedToUserId },
      });

      await logAdminAction(req, {
        actorUserId: actor.id,
        targetUserId: existing.targetUserId,
        entityType: 'TICKET',
        action: 'TICKET_ASSIGNED',
        summary: assignedToUserId
          ? `Assigned ticket ${existing.reference} to ${assignedToUserId}`
          : `Unassigned ticket ${existing.reference}`,
        metadata: { ticketId, assignedToUserId },
      });

      return res.status(200).json({ ok: true, ticket: safeJson(ticket) });
    }

    if (action === 'UPDATE_STATUS') {
      const status = (payload.status || '').toUpperCase();
      const validStatuses = ['OPEN', 'IN_PROGRESS', 'ON_HOLD', 'ESCALATED', 'RESOLVED', 'CLOSED'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid ticket status' });
      }

      const data = {
        status,
        firstResponseAt: existing.firstResponseAt || (status === 'IN_PROGRESS' ? new Date() : existing.firstResponseAt),
      };

      if (status === 'RESOLVED' || status === 'CLOSED') {
        data.resolvedAt = new Date();
      }

      const ticket = await prisma.supportTicket.update({ where: { id: ticketId }, data });

      await logAdminAction(req, {
        actorUserId: actor.id,
        targetUserId: existing.targetUserId,
        entityType: 'TICKET',
        action: 'TICKET_STATUS_UPDATED',
        summary: `Updated ticket ${existing.reference} status to ${status}`,
        metadata: { from: existing.status, to: status },
      });

      return res.status(200).json({ ok: true, ticket: safeJson(ticket) });
    }

    if (action === 'UPDATE_PRIORITY') {
      if (!hasSupportRole(actor.role, 'SUPPORT_MANAGER')) {
        return res.status(403).json({ error: 'Manager role required for priority updates' });
      }

      const priority = (payload.priority || '').toUpperCase();
      const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
      if (!validPriorities.includes(priority)) {
        return res.status(400).json({ error: 'Invalid priority' });
      }

      const ticket = await prisma.supportTicket.update({ where: { id: ticketId }, data: { priority } });

      await logAdminAction(req, {
        actorUserId: actor.id,
        targetUserId: existing.targetUserId,
        entityType: 'TICKET',
        action: 'TICKET_PRIORITY_UPDATED',
        summary: `Updated ticket ${existing.reference} priority to ${priority}`,
        metadata: { from: existing.priority, to: priority },
      });

      return res.status(200).json({ ok: true, ticket: safeJson(ticket) });
    }

    return res.status(400).json({ error: 'Unsupported ticket action' });
  } catch (error) {
    console.error('Support ticket action error:', error);
    return res.status(500).json({ error: 'Failed to update support ticket' });
  }
}
