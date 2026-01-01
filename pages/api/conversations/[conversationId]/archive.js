import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '../../../../lib/prisma';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { conversationId } = req.query;
  const userRole = (session.user.role || '').toLowerCase();

  if (req.method === 'POST') {
    try {
      // Get user profile to verify ownership
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
          candidateCandidateProfile: true,
          employerEmployerProfile: true
        }
      });

      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId }
      });

      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      // Check if user is part of this conversation
      const isCandidate = user?.candidateCandidateProfile?.id === conversation.candidateId;
      const isEmployer = user?.employerEmployerProfile?.id === conversation.employerId;

      if (!isCandidate && !isEmployer) {
        return res.status(403).json({ error: 'You do not have access to this conversation' });
      }

      // Archive for the appropriate user
      const updateData = isCandidate 
        ? { archivedByCandidate: true }
        : { archivedByEmployer: true };

      const updated = await prisma.conversation.update({
        where: { id: conversationId },
        data: updateData
      });

      return res.status(200).json({ success: true, conversation: updated });
    } catch (error) {
      console.error('Error archiving conversation:', error);
      return res.status(500).json({ error: 'Failed to archive conversation' });
    }
  } else if (req.method === 'DELETE') {
    // Unarchive
    try {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
          candidateCandidateProfile: true,
          employerEmployerProfile: true
        }
      });

      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId }
      });

      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      const isCandidate = user?.candidateCandidateProfile?.id === conversation.candidateId;
      const isEmployer = user?.employerEmployerProfile?.id === conversation.employerId;

      if (!isCandidate && !isEmployer) {
        return res.status(403).json({ error: 'You do not have access to this conversation' });
      }

      const updateData = isCandidate 
        ? { archivedByCandidate: false }
        : { archivedByEmployer: false };

      const updated = await prisma.conversation.update({
        where: { id: conversationId },
        data: updateData
      });

      return res.status(200).json({ success: true, conversation: updated });
    } catch (error) {
      console.error('Error unarchiving conversation:', error);
      return res.status(500).json({ error: 'Failed to unarchive conversation' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
