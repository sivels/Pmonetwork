import { prisma } from './prisma';

export async function resolveEmployerContext({ userId, email }) {
  if (!userId && !email) return null;

  const user = await prisma.user.findFirst({
    where: userId ? { id: userId } : { email },
    include: {
      employerEmployerProfile: true,
      employerTeamMemberships: {
        where: { status: 'ACTIVE' },
        include: {
          employer: true,
        },
        orderBy: { createdAt: 'asc' },
        take: 1,
      },
    },
  });

  if (!user) return null;

  if (user.employerEmployerProfile) {
    return {
      user,
      employerProfile: user.employerEmployerProfile,
      isOwner: true,
      teamRole: 'OWNER',
      membership: null,
    };
  }

  const membership = user.employerTeamMemberships?.[0] || null;
  if (!membership?.employer) {
    return {
      user,
      employerProfile: null,
      isOwner: false,
      teamRole: null,
      membership: null,
    };
  }

  return {
    user,
    employerProfile: membership.employer,
    isOwner: false,
    teamRole: membership.role || 'RECRUITER',
    membership,
  };
}

export function canManageEmployerTeam(context) {
  const role = (context?.teamRole || '').toUpperCase();
  return context?.isOwner || role === 'ADMIN';
}
