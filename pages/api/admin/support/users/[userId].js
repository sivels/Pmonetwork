import { randomBytes } from 'crypto';
import { prisma } from '../../../../../lib/prisma';
import { sendMail } from '../../../../../lib/email';
import { logAdminAction } from '../../../../../lib/adminAudit';
import { hasSupportRole, requireSupportRole } from '../../../../../lib/adminSupportAuth';

function safeJson(data) {
  return JSON.parse(JSON.stringify(data));
}

export default async function handler(req, res) {
  const auth = await requireSupportRole(req, res, 'SUPPORT_AGENT');
  if (!auth) return;

  const { actor } = auth;
  const userId = req.query.userId;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'Invalid user id' });
  }

  if (req.method === 'GET') {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          candidateCandidateProfile: true,
          employerEmployerProfile: true,
          supportTicketsTargeted: {
            take: 10,
            orderBy: { updatedAt: 'desc' },
            select: {
              id: true,
              reference: true,
              status: true,
              priority: true,
              category: true,
              subject: true,
              updatedAt: true,
            },
          },
          loginAttempts: {
            take: 15,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              email: true,
              ipAddress: true,
              userAgent: true,
              success: true,
              reason: true,
              createdAt: true,
            },
          },
          adminActionsTargeted: {
            take: 15,
            orderBy: { createdAt: 'desc' },
            include: {
              actor: {
                select: {
                  id: true,
                  email: true,
                  role: true,
                },
              },
            },
          },
        },
      });

      if (!user) return res.status(404).json({ error: 'User not found' });

      return res.status(200).json({ user: safeJson(user) });
    } catch (error) {
      console.error('Admin support user detail error:', error);
      return res.status(500).json({ error: 'Failed to load user details' });
    }
  }

  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, payload = {} } = req.body || {};
  if (!action) return res.status(400).json({ error: 'Action is required' });

  try {
    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    let updatedUser = null;
    let responseData = {};

    switch (action) {
      case 'UPDATE_IDENTITY': {
        const updateData = {};
        if (payload.email) updateData.email = payload.email.trim().toLowerCase();
        if (payload.username !== undefined) updateData.username = payload.username ? payload.username.trim() : null;
        if (Object.keys(updateData).length === 0) {
          return res.status(400).json({ error: 'No identity changes supplied' });
        }

        updatedUser = await prisma.user.update({ where: { id: userId }, data: updateData });
        await logAdminAction(req, {
          actorUserId: actor.id,
          targetUserId: userId,
          entityType: 'USER',
          action,
          summary: `Updated user identity for ${targetUser.email}`,
          metadata: { updateData },
        });
        break;
      }

      case 'LOCK_ACCOUNT': {
        updatedUser = await prisma.user.update({
          where: { id: userId },
          data: { isLocked: true, accountStatus: 'LOCKED' },
        });
        await logAdminAction(req, {
          actorUserId: actor.id,
          targetUserId: userId,
          entityType: 'USER',
          action,
          summary: `Locked account ${targetUser.email}`,
        });
        break;
      }

      case 'UNLOCK_ACCOUNT': {
        updatedUser = await prisma.user.update({
          where: { id: userId },
          data: { isLocked: false, failedLoginAttempts: 0, accountStatus: 'ACTIVE' },
        });
        await logAdminAction(req, {
          actorUserId: actor.id,
          targetUserId: userId,
          entityType: 'USER',
          action,
          summary: `Unlocked account ${targetUser.email}`,
        });
        break;
      }

      case 'SUSPEND_ACCOUNT': {
        updatedUser = await prisma.user.update({
          where: { id: userId },
          data: { isSuspended: true, accountStatus: 'SUSPENDED' },
        });
        await logAdminAction(req, {
          actorUserId: actor.id,
          targetUserId: userId,
          entityType: 'USER',
          action,
          summary: `Suspended account ${targetUser.email}`,
        });
        break;
      }

      case 'UNSUSPEND_ACCOUNT': {
        updatedUser = await prisma.user.update({
          where: { id: userId },
          data: { isSuspended: false, accountStatus: 'ACTIVE' },
        });
        await logAdminAction(req, {
          actorUserId: actor.id,
          targetUserId: userId,
          entityType: 'USER',
          action,
          summary: `Unsuspended account ${targetUser.email}`,
        });
        break;
      }

      case 'DEACTIVATE_ACCOUNT': {
        if (!hasSupportRole(actor.role, 'SUPPORT_MANAGER')) {
          return res.status(403).json({ error: 'Manager role required for deactivation' });
        }

        updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            accountStatus: 'DEACTIVATED',
            deactivatedAt: new Date(),
            isLocked: true,
          },
        });
        await logAdminAction(req, {
          actorUserId: actor.id,
          targetUserId: userId,
          entityType: 'USER',
          action,
          summary: `Deactivated account ${targetUser.email}`,
          metadata: { reason: payload.reason || null },
        });
        break;
      }

      case 'SET_VERIFICATION_STATUS': {
        const status = (payload.status || '').toUpperCase();
        if (!['UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED'].includes(status)) {
          return res.status(400).json({ error: 'Invalid verification status' });
        }

        updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            verificationStatus: status,
            emailVerified: status === 'VERIFIED' ? new Date() : targetUser.emailVerified,
          },
        });
        await logAdminAction(req, {
          actorUserId: actor.id,
          targetUserId: userId,
          entityType: 'USER',
          action,
          summary: `Set verification status to ${status} for ${targetUser.email}`,
        });
        break;
      }

      case 'TRIGGER_PASSWORD_RESET': {
        await prisma.passwordResetToken.deleteMany({ where: { userId } });
        const token = randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

        await prisma.passwordResetToken.create({
          data: {
            token,
            userId,
            expiresAt,
          },
        });

        await prisma.user.update({
          where: { id: userId },
          data: {
            mustResetPassword: true,
          },
        });

        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`;

        if (payload.sendEmail !== false) {
          try {
            await sendMail({
              to: targetUser.email,
              subject: 'PMO Network password reset initiated by support',
              html: `<p>Hello,</p><p>Your password reset was initiated by the PMO Network support team.</p><p><a href="${resetUrl}">Reset your password</a> (expires in 1 hour).</p>`,
              text: `Your password reset was initiated by PMO Network support. Reset link: ${resetUrl}`,
            });
          } catch (emailError) {
            console.error('Support reset email failed:', emailError);
          }
        }

        await logAdminAction(req, {
          actorUserId: actor.id,
          targetUserId: userId,
          entityType: 'USER',
          action,
          summary: `Triggered password reset for ${targetUser.email}`,
          metadata: { sendEmail: payload.sendEmail !== false },
        });

        responseData = {
          resetRequested: true,
          expiresAt,
          resetUrl: process.env.NODE_ENV === 'production' ? undefined : resetUrl,
        };
        break;
      }

      default:
        return res.status(400).json({ error: 'Unsupported action' });
    }

    if (!updatedUser) {
      updatedUser = await prisma.user.findUnique({ where: { id: userId } });
    }

    return res.status(200).json({
      ok: true,
      user: updatedUser ? safeJson(updatedUser) : null,
      ...responseData,
    });
  } catch (error) {
    console.error('Admin support user action error:', error);
    return res.status(500).json({ error: 'Failed to perform user action' });
  }
}
