import { prisma } from '../../../../lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';

export default async function handler(req, res) {
  const { conversationId } = req.query;

  if (req.method === 'GET') {
    try {
      const session = await getServerSession(req, res, authOptions);
      
      const messages = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
      });
      
      // Mark messages as read for the current user
      if (session?.user?.id) {
        await prisma.message.updateMany({
          where: {
            conversationId,
            receiverUserId: session.user.id,
            readAt: null
          },
          data: {
            readAt: new Date()
          }
        });
      }
      
      return res.status(200).json({ items: messages });
    } catch (error) {
      console.error('Error fetching messages:', error);
      return res.status(500).json({ error: 'Failed to fetch messages' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { senderUserId, receiverUserId, text, attachments } = req.body;
      const session = await getServerSession(req, res, authOptions);
      
      console.log('Creating message:', { conversationId, senderUserId, receiverUserId, textLength: text?.length });
      
      if (!senderUserId || !receiverUserId || !text) {
        console.log('Missing required fields');
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          employer: { include: { user: true } },
          candidate: { include: { user: true } },
        },
      });

      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }
      
      const msg = await prisma.message.create({
        data: {
          conversationId,
          senderUserId,
          receiverUserId,
          text,
          attachments: attachments ? JSON.stringify(attachments) : undefined,
        },
      });
      
      console.log('Message created:', msg.id);
      
      await prisma.activityLog.create({
        data: {
          actorUserId: senderUserId,
          type: 'MESSAGE_SENT',
          details: JSON.stringify({ conversationId }),
        },
      });

      const isEmployerReply =
        session?.user?.id &&
        session.user.id === senderUserId &&
        conversation.employer?.user?.id === senderUserId &&
        Boolean(conversation.jobId);

      if (isEmployerReply) {
        const latestFeedbackRequest = await prisma.message.findFirst({
          where: {
            conversationId,
            senderUserId: conversation.candidate?.user?.id,
            text: { contains: '[FEEDBACK_REQUEST]' },
          },
          orderBy: { createdAt: 'desc' },
        });

        if (latestFeedbackRequest) {
          const previousEmployerReplyAfterRequest = await prisma.message.findFirst({
            where: {
              conversationId,
              senderUserId: conversation.employer?.user?.id,
              createdAt: { gt: latestFeedbackRequest.createdAt, lt: msg.createdAt },
            },
          });

          if (!previousEmployerReplyAfterRequest) {
            const application = await prisma.application.findFirst({
              where: {
                jobId: conversation.jobId,
                candidateId: conversation.candidateId,
              },
              orderBy: { createdAt: 'desc' },
            });

            if (application && !['REJECTED', 'HIRED', 'WITHDRAWN'].includes((application.status || '').toUpperCase())) {
              await prisma.$transaction(async (tx) => {
                await tx.application.update({
                  where: { id: application.id },
                  data: { status: 'FEEDBACK_GIVEN' },
                });

                await tx.applicationStatusHistory.create({
                  data: {
                    applicationId: application.id,
                    fromStatus: application.status,
                    toStatus: 'FEEDBACK_GIVEN',
                    note: 'Employer responded to your feedback request via messages.',
                    changedByUserId: senderUserId,
                  },
                });

                await tx.activityLog.create({
                  data: {
                    actorUserId: senderUserId,
                    employerId: conversation.employerId,
                    candidateId: conversation.candidateId,
                    jobId: conversation.jobId,
                    applicationId: application.id,
                    type: 'APPLICATION_STATUS_CHANGED',
                    details: JSON.stringify({
                      toStatus: 'FEEDBACK_GIVEN',
                      source: 'EMPLOYER_FEEDBACK_REPLY',
                    }),
                  },
                });
              });
            }
          }
        }
      }

      return res.status(200).json(msg);
    } catch (error) {
      console.error('Error creating message:', error);
      return res.status(500).json({ error: 'Failed to create message', details: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
