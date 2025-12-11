import { getSession } from 'next-auth/react';
import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  const session = await getSession({ req });

  if (!session || session.user.role !== 'candidate') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const candidateId = session.user.id;

  try {
    if (req.method === 'GET') {
      const certifications = await prisma.certification.findMany({
        where: { candidateId },
        orderBy: { issueDate: 'desc' }
      });
      return res.status(200).json({ certifications: JSON.parse(JSON.stringify(certifications)) });
    }

    if (req.method === 'POST') {
      const { title, issuingBody, issueDate, expiryDate, credentialId, verificationUrl } = req.body;

      if (!title || !issuingBody) {
        return res.status(400).json({ error: 'Title and Issuing Body are required' });
      }

      const certification = await prisma.certification.create({
        data: {
          candidateId,
          title,
          issuingBody,
          issueDate: issueDate ? new Date(issueDate) : null,
          expiryDate: expiryDate ? new Date(expiryDate) : null,
          credentialId,
          verificationUrl
        }
      });

      return res.status(201).json({ certification: JSON.parse(JSON.stringify(certification)) });
    }

    if (req.method === 'PUT') {
      const { id, title, issuingBody, issueDate, expiryDate, credentialId, verificationUrl } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Certification ID is required' });
      }

      const certification = await prisma.certification.update({
        where: { id, candidateId },
        data: {
          title,
          issuingBody,
          issueDate: issueDate ? new Date(issueDate) : null,
          expiryDate: expiryDate ? new Date(expiryDate) : null,
          credentialId,
          verificationUrl
        }
      });

      return res.status(200).json({ certification: JSON.parse(JSON.stringify(certification)) });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'Certification ID is required' });
      }

      await prisma.certification.delete({
        where: { id, candidateId }
      });

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Certifications API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
