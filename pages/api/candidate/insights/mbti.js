import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '../../../../lib/prisma';

function parseMBTIData(personalityDesc) {
  if (!personalityDesc) return null;
  try {
    const parsed = JSON.parse(personalityDesc);
    if (parsed && typeof parsed === 'object') return parsed;
    return null;
  } catch {
    return null;
  }
}

async function getCandidateProfileBySession(session) {
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { candidateCandidateProfile: true },
  });

  if (!user) return { user: null, profile: null };

  if (user.candidateCandidateProfile) {
    return { user, profile: user.candidateCandidateProfile };
  }

  const profile = await prisma.candidateProfile.create({
    data: {
      userId: user.id,
      fullName: user.name || '',
      email: user.email || '',
    },
  });

  return { user, profile };
}

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if ((session.user.role || '').toLowerCase() !== 'candidate') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { profile } = await getCandidateProfileBySession(session);

    if (!profile) {
      return res.status(404).json({ error: 'Candidate profile not found' });
    }

    if (req.method === 'GET') {
      const parsed = parseMBTIData(profile.personalityDesc);
      const hasResult = Boolean(profile.personalityType);
      const mbti = hasResult
        ? {
            assessment: 'mbti',
            type: profile.personalityType,
            pairScores: parsed?.pairScores || [],
            counts: parsed?.counts || null,
            completedAt: parsed?.completedAt || null,
            visibleToEmployers: Boolean(parsed?.visibleToEmployers),
          }
        : null;

      return res.status(200).json({ hasResult, mbti });
    }

    if (req.method === 'PUT') {
      const body = req.body || {};
      const incomingResult = body.result || null;
      const incomingVisible = typeof body.visibleToEmployers === 'boolean' ? body.visibleToEmployers : undefined;

      const existingParsed = parseMBTIData(profile.personalityDesc) || {};
      const existingType = profile.personalityType || existingParsed.type || null;

      const nextType = incomingResult?.type || existingType;

      if (!nextType) {
        return res.status(400).json({ error: 'No MBTI result to save' });
      }

      const payload = {
        assessment: 'mbti',
        type: nextType,
        pairScores: Array.isArray(incomingResult?.pairScores) ? incomingResult.pairScores : (existingParsed.pairScores || []),
        counts: incomingResult?.counts || existingParsed.counts || null,
        completedAt: incomingResult?.completedAt || existingParsed.completedAt || new Date().toISOString(),
        visibleToEmployers: incomingVisible !== undefined ? incomingVisible : Boolean(existingParsed.visibleToEmployers),
      };

      const updated = await prisma.candidateProfile.update({
        where: { id: profile.id },
        data: {
          personalityType: payload.type,
          personalityDesc: JSON.stringify(payload),
        },
      });

      return res.status(200).json({
        hasResult: Boolean(updated.personalityType),
        mbti: payload,
      });
    }

    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('MBTI insights API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
