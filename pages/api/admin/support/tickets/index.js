import { prisma } from '../../../../../lib/prisma';
import { logAdminAction } from '../../../../../lib/adminAudit';
import { requireSupportRole } from '../../../../../lib/adminSupportAuth';

function buildReference() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SUP-${ts}-${rand}`;
}

function getSlaDueAt(priority) {
  const now = Date.now();
  const map = {
    LOW: 120,
    MEDIUM: 72,
    HIGH: 24,
    CRITICAL: 4,
  };
  const hours = map[(priority || 'MEDIUM').toUpperCase()] || 72;
  return new Date(now + hours * 60 * 60 * 1000);
}

export default async function handler(req, res) {
  const auth = await requireSupportRole(req, res, 'SUPPORT_AGENT');
  if (!auth) return;

  const { actor } = auth;

  if (req.method === 'GET') {
    try {
      const status = (req.query.status || '').toString().toUpperCase();
      const priority = (req.query.priority || '').toString().toUpperCase();
      const category = (req.query.category || '').toString().toUpperCase();
      const assignedToMe = req.query.assignedToMe === 'true';
      const query = (req.query.q || '').toString().trim();
      const page = Math.max(parseInt(req.query.page || '1', 10), 1);
      const pageSize = Math.min(Math.max(parseInt(req.query.pageSize || '20', 10), 1), 50);

      const where = { AND: [] };
      if (status) where.AND.push({ status });
      if (priority) where.AND.push({ priority });
      if (category) where.AND.push({ category });
      if (assignedToMe) where.AND.push({ assignedToUserId: actor.id });
      if (query) {
        where.AND.push({
          OR: [
            { reference: { contains: query, mode: 'insensitive' } },
            { subject: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { targetUser: { is: { email: { contains: query, mode: 'insensitive' } } } },
          ],
        });
      }

      const normalizedWhere = where.AND.length > 0 ? where : {};

      const [total, tickets] = await Promise.all([
        prisma.supportTicket.count({ where: normalizedWhere }),
        prisma.supportTicket.findMany({
          where: normalizedWhere,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { updatedAt: 'desc' },
          include: {
            assignedTo: { select: { id: true, email: true, role: true } },
            createdBy: { select: { id: true, email: true, role: true } },
            targetUser: { select: { id: true, email: true, role: true } },
            _count: { select: { notes: true } },
          },
        }),
      ]);

      return res.status(200).json({
        tickets,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.max(Math.ceil(total / pageSize), 1),
        },
      });
    } catch (error) {
      console.error('Support ticket list error:', error);
      return res.status(500).json({ error: 'Failed to fetch support tickets' });
    }
  }

  if (req.method === 'POST') {
    try {
      const {
        targetUserId = null,
        targetType = 'USER',
        category = 'OTHER',
        priority = 'MEDIUM',
        subject,
        description,
        tags,
      } = req.body || {};

      if (!subject || !description) {
        return res.status(400).json({ error: 'Subject and description are required' });
      }

      const reference = buildReference();
      const ticket = await prisma.supportTicket.create({
        data: {
          reference,
          createdByUserId: actor.id,
          targetUserId,
          targetType,
          category,
          priority,
          status: 'OPEN',
          subject: subject.trim(),
          description: description.trim(),
          tags: Array.isArray(tags) ? JSON.stringify(tags) : null,
          slaDueAt: getSlaDueAt(priority),
        },
      });

      await logAdminAction(req, {
        actorUserId: actor.id,
        targetUserId,
        entityType: 'TICKET',
        action: 'TICKET_CREATED',
        summary: `Created support ticket ${reference}`,
        metadata: {
          ticketId: ticket.id,
          priority,
          category,
        },
      });

      return res.status(201).json({ ok: true, ticket });
    } catch (error) {
      console.error('Support ticket create error:', error);
      return res.status(500).json({ error: 'Failed to create support ticket' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
