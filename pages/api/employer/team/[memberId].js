import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '../../../../lib/prisma';
import { canManageEmployerTeam, resolveEmployerContext } from '../../../../lib/employerContext';

const MANAGEABLE_ROLES = ['ADMIN', 'RECRUITER', 'VIEWER'];

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || (session.user.role || '').toLowerCase() !== 'employer') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const context = await resolveEmployerContext({ userId: session.user.id });
  if (!context?.employerProfile) {
    return res.status(404).json({ error: 'Employer profile not found' });
  }

  if (!canManageEmployerTeam(context)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  const { memberId } = req.query;

  if (req.method === 'PATCH') {
    try {
      const nextRole = (req.body?.role || '').toString().toUpperCase();
      if (!MANAGEABLE_ROLES.includes(nextRole)) {
        return res.status(400).json({ error: 'Invalid role' });
      }

      const member = await prisma.employerTeamMember.findUnique({ where: { id: memberId } });
      if (!member || member.employerId !== context.employerProfile.id) {
        return res.status(404).json({ error: 'Team member not found' });
      }

      const updated = await prisma.employerTeamMember.update({
        where: { id: memberId },
        data: { role: nextRole },
      });

      return res.status(200).json({ ok: true, member: updated });
    } catch (error) {
      console.error('Team member update error:', error);
      return res.status(500).json({ error: 'Failed to update team member role' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const member = await prisma.employerTeamMember.findUnique({ where: { id: memberId } });
      if (!member || member.employerId !== context.employerProfile.id) {
        return res.status(404).json({ error: 'Team member not found' });
      }

      await prisma.employerTeamMember.delete({ where: { id: memberId } });
      return res.status(200).json({ ok: true });
    } catch (error) {
      console.error('Team member delete error:', error);
      return res.status(500).json({ error: 'Failed to remove team member' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
