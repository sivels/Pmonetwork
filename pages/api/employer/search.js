import { getToken } from 'next-auth/jwt';
import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== 'EMPLOYER') return res.status(401).json({ error: 'Unauthorized' });
  const { q, jobTitle, skills, certifications, sector, minExp, maxExp, minRate, maxRate, location, availability, psychology, contractType } = req.query;
  // Build filters
  const filters = {};
  if (jobTitle) filters.jobTitle = jobTitle;
  if (sector) filters.sector = sector;
  if (availability) filters.availability = availability;
  if (location) filters.location = location;
  if (minExp) filters.yearsExperience = { gte: Number(minExp) };
  if (maxExp) filters.yearsExperience = { ...filters.yearsExperience, lte: Number(maxExp) };
  if (minRate) filters.dayRate = { gte: Number(minRate) };
  if (maxRate) filters.dayRate = { ...filters.dayRate, lte: Number(maxRate) };
  if (psychology) filters.personalityType = psychology;
  if (contractType) filters.contractType = contractType;
  // TODO: skills/certifications fuzzy
  // TODO: fuzzy q search
  const candidates = await prisma.candidateProfile.findMany({
    where: filters,
    take: 30,
    orderBy: { updatedAt: 'desc' },
  });
  res.json(candidates);
}
