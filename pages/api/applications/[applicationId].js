import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  const { applicationId } = req.query;

  if (req.method === 'GET') {
    try {
      const app = await prisma.application.findUnique({
        where: { id: applicationId },
        include: {
          candidate: {
            include: {
              skills: true,
              experiences: true,
              education: true,
              certifications: true,
              documents: true,
            },
          },
          job: true,
          statusHistory: { orderBy: { createdAt: 'desc' } },
        },
      });
      
      if (!app) {
        return res.status(404).json({ error: 'Not found' });
      }
      
      return res.status(200).json(app);
    } catch (error) {
      console.error('Error fetching application:', error);
      return res.status(500).json({ error: 'Failed to fetch application' });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const { toStatus, note, actorUserId, markViewed } = req.body;

      const application = await prisma.application.findUnique({ 
        where: { id: applicationId } 
      });
      
      if (!application) {
        return res.status(404).json({ error: 'Not found' });
      }

      const updates = {};
      if (markViewed) updates.viewedByEmployerAt = new Date();
      if (toStatus) updates.status = toStatus.toUpperCase();

      const updated = await prisma.$transaction(async (tx) => {
        const up = await tx.application.update({ 
          where: { id: applicationId }, 
          data: updates 
        });
        
        if (markViewed) {
          await tx.activityLog.create({ 
            data: { 
              actorUserId, 
              applicationId: up.id, 
              candidateId: up.candidateId, 
              jobId: up.jobId, 
              type: 'APPLICATION_VIEWED' 
            } 
          });
        }
        
        if (toStatus) {
          await tx.applicationStatusHistory.create({
            data: {
              applicationId: up.id,
              fromStatus: application.status,
              toStatus: toStatus.toUpperCase(),
              note,
              changedByUserId: actorUserId,
            },
          });
          
          const job = await tx.job.findUnique({ where: { id: up.jobId } });
          
          await tx.activityLog.create({
            data: {
              actorUserId,
              employerId: job?.employerId,
              candidateId: up.candidateId,
              jobId: up.jobId,
              applicationId: up.id,
              type: 'APPLICATION_STATUS_CHANGED',
              details: JSON.stringify({ toStatus, note }),
            },
          });
        }
        
        return up;
      });

      return res.status(200).json(updated);
    } catch (error) {
      console.error('Error updating application:', error);
      return res.status(500).json({ error: 'Failed to update application' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
