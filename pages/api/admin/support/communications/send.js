import { prisma } from '../../../../../lib/prisma';
import { sendMail } from '../../../../../lib/email';
import { logAdminAction } from '../../../../../lib/adminAudit';
import { requireSupportRole } from '../../../../../lib/adminSupportAuth';

function interpolate(template, variables = {}) {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
    const value = variables[key];
    return value === undefined || value === null ? '' : String(value);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const auth = await requireSupportRole(req, res, 'SUPPORT_AGENT');
  if (!auth) return;

  const { actor } = auth;

  try {
    const {
      userId,
      email,
      subject,
      body,
      variables = {},
      ticketId = null,
    } = req.body || {};

    let targetUserId = null;
    let to = (email || '').trim();

    if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true } });
      if (!user) return res.status(404).json({ error: 'Target user not found' });
      targetUserId = user.id;
      to = user.email;
    }

    if (!to || !subject || !body) {
      return res.status(400).json({ error: 'Recipient, subject and body are required' });
    }

    const interpolatedSubject = interpolate(subject, variables);
    const interpolatedBody = interpolate(body, variables);

    await sendMail({
      to,
      subject: interpolatedSubject,
      text: interpolatedBody,
      html: `<pre style="font-family:Arial, sans-serif; white-space:pre-wrap;">${interpolatedBody}</pre>`,
    });

    if (ticketId) {
      await prisma.supportTicketNote.create({
        data: {
          ticketId,
          authorUserId: actor.id,
          note: `Outbound email sent to ${to}: ${interpolatedSubject}`,
          isInternal: true,
        },
      });
    }

    await logAdminAction(req, {
      actorUserId: actor.id,
      targetUserId,
      entityType: 'USER',
      action: 'SUPPORT_EMAIL_SENT',
      summary: `Sent support email to ${to}`,
      metadata: { ticketId, subject: interpolatedSubject },
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Support communication send error:', error);
    return res.status(500).json({ error: 'Failed to send support communication' });
  }
}
