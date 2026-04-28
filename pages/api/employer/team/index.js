import crypto from 'crypto';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '../../../../lib/prisma';
import { canManageEmployerTeam, resolveEmployerContext } from '../../../../lib/employerContext';

const TEAM_ROLES = ['ADMIN', 'RECRUITER', 'VIEWER'];

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || (session.user.role || '').toLowerCase() !== 'employer') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const context = await resolveEmployerContext({ userId: session.user.id });
  if (!context?.employerProfile) {
    return res.status(404).json({ error: 'Employer profile not found' });
  }

  const employerId = context.employerProfile.id;

  if (req.method === 'GET') {
    try {
      const ownerUser = await prisma.user.findUnique({
        where: { id: context.employerProfile.userId },
        select: { id: true, email: true, createdAt: true },
      });

      const [members, invites] = await Promise.all([
        prisma.employerTeamMember.findMany({
          where: { employerId, status: 'ACTIVE' },
          include: {
            user: {
              select: { id: true, email: true, createdAt: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        }),
        prisma.employerTeamInvite.findMany({
          where: { employerId, status: 'PENDING' },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      const owner = {
        id: `owner_${ownerUser?.id || context.employerProfile.userId}`,
        userId: ownerUser?.id || context.employerProfile.userId,
        email: ownerUser?.email || '',
        role: 'OWNER',
        status: 'ACTIVE',
        isOwner: true,
        createdAt: ownerUser?.createdAt || new Date(),
      };

      const normalizedMembers = members
        .filter((member) => member.userId !== context.user.id)
        .map((member) => ({
          id: member.id,
          userId: member.userId,
          email: member.user.email,
          role: member.role,
          status: member.status,
          isOwner: false,
          createdAt: member.createdAt,
        }));

      return res.status(200).json({
        permissions: {
          canManage: canManageEmployerTeam(context),
          teamRole: context.teamRole,
          isOwner: context.isOwner,
        },
        members: [owner, ...normalizedMembers],
        invites: invites.map((invite) => ({
          id: invite.id,
          email: invite.email,
          role: invite.role,
          status: invite.status,
          expiresAt: invite.expiresAt,
          createdAt: invite.createdAt,
        })),
      });
    } catch (error) {
      console.error('Team list error:', error);
      return res.status(500).json({ error: 'Failed to load team members' });
    }
  }

  if (req.method === 'POST') {
    if (!canManageEmployerTeam(context)) {
      return res.status(403).json({ error: 'Insufficient permissions to invite members' });
    }

    try {
      const rawEmail = (req.body?.email || '').toString().trim().toLowerCase();
      const role = (req.body?.role || 'RECRUITER').toString().toUpperCase();

      if (!rawEmail) {
        return res.status(400).json({ error: 'Email is required' });
      }

      if (!TEAM_ROLES.includes(role)) {
        return res.status(400).json({ error: 'Invalid team role' });
      }

      const ownerUser = await prisma.user.findUnique({
        where: { id: context.employerProfile.userId },
        select: { email: true },
      });
      const ownerEmail = (ownerUser?.email || '').toLowerCase();
      if (rawEmail === ownerEmail) {
        return res.status(400).json({ error: 'Company owner is already part of the team' });
      }

      const existingUser = await prisma.user.findUnique({ where: { email: rawEmail } });
      const existingMember = existingUser
        ? await prisma.employerTeamMember.findUnique({
            where: { employerId_userId: { employerId, userId: existingUser.id } },
          })
        : null;

      if (existingMember?.status === 'ACTIVE') {
        return res.status(400).json({ error: 'This user is already an active team member' });
      }

      const token = crypto.randomBytes(24).toString('hex');
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

      let invite;
      let activatedImmediately = false;

      if (existingUser) {
        await prisma.employerTeamMember.upsert({
          where: { employerId_userId: { employerId, userId: existingUser.id } },
          update: {
            role,
            status: 'ACTIVE',
            invitedById: session.user.id,
          },
          create: {
            employerId,
            userId: existingUser.id,
            role,
            status: 'ACTIVE',
            invitedById: session.user.id,
          },
        });

        if ((existingUser.role || '').toUpperCase() !== 'EMPLOYER') {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { role: 'EMPLOYER' },
          });
        }

        invite = await prisma.employerTeamInvite.create({
          data: {
            employerId,
            email: rawEmail,
            role,
            status: 'ACCEPTED',
            token,
            invitedById: session.user.id,
            acceptedById: existingUser.id,
            expiresAt,
          },
        });

        activatedImmediately = true;
      } else {
        invite = await prisma.employerTeamInvite.create({
          data: {
            employerId,
            email: rawEmail,
            role,
            status: 'PENDING',
            token,
            invitedById: session.user.id,
            expiresAt,
          },
        });
      }

      const baseUrl = process.env.NEXTAUTH_URL || `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;
      const inviteUrl = `${baseUrl}/auth/team-invite?token=${invite.token}`;

      return res.status(201).json({
        ok: true,
        activatedImmediately,
        invite: {
          id: invite.id,
          email: invite.email,
          role: invite.role,
          status: invite.status,
          expiresAt: invite.expiresAt,
          inviteUrl,
        },
      });
    } catch (error) {
      console.error('Team invite error:', error);
      return res.status(500).json({ error: 'Failed to invite team member' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
