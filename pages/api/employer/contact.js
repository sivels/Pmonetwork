import { getToken } from 'next-auth/jwt';
import prisma from '../../../lib/prisma';
import { sendMail } from '../../../lib/email';

export default async function handler(req, res) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== 'EMPLOYER') return res.status(401).json({ error: 'Unauthorized' });
  if (req.method !== 'POST') return res.status(405).end();
  const { candidateId, message } = req.body;
  if (!candidateId || !message) return res.status(400).json({ error: 'Missing fields' });
  const candidate = await prisma.candidateProfile.findUnique({ where: { id: candidateId }, include: { user: true } });
  if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
  // Send email to candidate
  await sendMail({
    to: candidate.user.email,
    subject: 'Employer contact request — PMO Network',
    html: `<p>You have a new contact request from an employer:</p><p>${message}</p>`,
    text: message,
  });
  res.json({ ok: true });
}
