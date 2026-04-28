import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '../../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id || !session?.user?.email) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = (req.body?.token || '').toString().trim();
  if (!token) {
    return res.status(400).json({ error: 'Invitation token is required' });
  }

  try {
    const invite = await prisma.employerTeamInvite.findUnique({
      where: { token },
      include: {
        employer: {
          select: { id: true, companyName: true },
        },
      },
    });

    if (!invite) {
      return res.status(404).json({ error: 'Invite not found' });
    }

    if (invite.status !== 'PENDING') {
      return res.status(400).json({ error: 'Invite is no longer valid' });
    }

    if (new Date(invite.expiresAt).getTime() < Date.now()) {
      await prisma.employerTeamInvite.update({
        where: { id: invite.id },
        data: { status: 'EXPIRED' },
      });
      return res.status(400).json({ error: 'Invite has expired' });
    }

    if ((invite.email || '').toLowerCase() !== (session.user.email || '').toLowerCase()) {
      return res.status(403).json({ error: 'This invite was sent to a different email address' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.employerTeamMember.upsert({
        where: {
          employerId_userId: {
            employerId: invite.employerId,
            userId: session.user.id,
          },
        },
        update: {
          role: invite.role,
          status: 'ACTIVE',
          invitedById: invite.invitedById,
        },
        create: {
          employerId: invite.employerId,
          userId: session.user.id,
          role: invite.role,
          status: 'ACTIVE',
          invitedById: invite.invitedById,
        },
      });

      await tx.employerTeamInvite.update({
        where: { id: invite.id },
        data: {
          status: 'ACCEPTED',
          acceptedById: session.user.id,
        },
      });

      await tx.user.update({
        where: { id: session.user.id },
        data: { role: 'EMPLOYER' },
      });
    });

    return res.status(200).json({
      ok: true,
      companyName: invite.employer?.companyName || 'Company',
      redirectTo: '/dashboard/employer',
    });
  } catch (error) {
    console.error('Accept team invite error:', error);
    return res.status(500).json({ error: 'Failed to accept invite' });
  }
}
