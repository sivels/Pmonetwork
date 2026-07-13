import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '../../../../lib/prisma';
import { resolveEmployerContext } from '../../../../lib/employerContext';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session || (session.user.role || '').toLowerCase() !== 'employer') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const {
      q,
      location,
      skills,
      minExp,
      maxExp,
      availability,
      employmentType,
      minSalary,
      maxSalary,
      minDayRate,
      maxDayRate,
      rightToWork,
      hideInactive,
      remoteOnly,
      page = 1,
      pageSize = 20,
    } = req.query;

    const parsedPage = Number.parseInt(page, 10) || 1;
    const parsedPageSize = Number.parseInt(req.query.limit || pageSize, 10) || 20;
    const skip = (parsedPage - 1) * parsedPageSize;
    const take = parsedPageSize;

    // Build where clause
    const where = {
      isPublic: true,
      anonymousMode: false,
    };

    // Text search across multiple fields
    if (q) {
      const searchTerms = q.toLowerCase().split(' ').filter(Boolean);
      where.OR = searchTerms.flatMap(term => [
        { fullName: { contains: term, mode: 'insensitive' } },
        { jobTitle: { contains: term, mode: 'insensitive' } },
        { summary: { contains: term, mode: 'insensitive' } },
        { sector: { contains: term, mode: 'insensitive' } },
      ]);
    }

    // Location filter
    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }

    // Remote preference filter
    if (remoteOnly === 'true') {
      where.remotePreference = { in: ['remote', 'hybrid'] };
    }

    // Experience range
    if (minExp) {
      where.yearsExperience = { ...where.yearsExperience, gte: parseInt(minExp) };
    }
    if (maxExp) {
      where.yearsExperience = { ...where.yearsExperience, lte: parseInt(maxExp) };
    }

    // Availability
    if (availability) {
      where.availability = availability;
    }

    // Employment type
    if (employmentType) {
      where.employmentType = { contains: employmentType };
    }

    // Salary expectations
    if (minSalary) {
      where.salaryExpectation = { ...where.salaryExpectation, gte: parseInt(minSalary) };
    }
    if (maxSalary) {
      where.salaryExpectation = { ...where.salaryExpectation, lte: parseInt(maxSalary) };
    }

    // Day rate
    if (minDayRate) {
      where.dayRate = { ...where.dayRate, gte: parseInt(minDayRate) };
    }
    if (maxDayRate) {
      where.dayRate = { ...where.dayRate, lte: parseInt(maxDayRate) };
    }

    // Right to work
    if (rightToWork) {
      where.rightToWork = rightToWork;
    }

    // Hide inactive profiles (no activity in the last 30 days)
    if (hideInactive === 'true') {
      const activityThreshold = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { updatedAt: { gte: activityThreshold } },
            { user: { is: { lastLoginAt: { gte: activityThreshold } } } },
            { user: { is: { updatedAt: { gte: activityThreshold } } } },
          ],
        },
      ];
    }

    // Skills filter (if provided as comma-separated)
    let candidates = await prisma.candidateProfile.findMany({
      where,
      include: {
        user: {
          select: {
            lastLoginAt: true,
            updatedAt: true,
          },
        },
        skills: {
          take: 10,
          select: { name: true, proficiency: true, category: true }
        },
        experiences: {
          take: 1,
          orderBy: { startDate: 'desc' },
          select: { jobTitle: true, company: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Post-filter by skills if specified
    if (skills) {
      const skillsList = skills.toLowerCase().split(',').map(s => s.trim());
      candidates = candidates.filter(c => 
        c.skills.some(skill => 
          skillsList.some(searchSkill => 
            skill.name.toLowerCase().includes(searchSkill)
          )
        )
      );
    }

    // Always sort by most recent activity (most active first)
    const sortedCandidates = [...candidates].sort((a, b) => {
      const aLastActive = new Date(a.user?.lastLoginAt || a.updatedAt || a.user?.updatedAt || 0).getTime();
      const bLastActive = new Date(b.user?.lastLoginAt || b.updatedAt || b.user?.updatedAt || 0).getTime();

      if (bLastActive !== aLastActive) {
        return bLastActive - aLastActive;
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const total = sortedCandidates.length;
    const paginatedCandidates = sortedCandidates.slice(skip, skip + take);

    // Check which candidates are bookmarked by this employer/company
    const context = await resolveEmployerContext({ userId: session.user.id });
    const savedCandidates = context?.employerProfile
      ? await prisma.savedCandidate.findMany({
          where: { employerId: context.employerProfile.id },
          select: { candidateId: true },
        })
      : [];

    const savedCandidateIds = new Set(savedCandidates.map((item) => item.candidateId));

    // Format results
    const results = paginatedCandidates.map(c => {
      const lastActiveAt = c.user?.lastLoginAt || c.updatedAt || c.user?.updatedAt || null;
      const inactivityThresholdMs = 30 * 24 * 60 * 60 * 1000;
      const isInactiveProfile = lastActiveAt
        ? (Date.now() - new Date(lastActiveAt).getTime()) > inactivityThresholdMs
        : true;

      return {
        id: c.id,
        fullName: c.fullName,
        jobTitle: c.jobTitle,
        location: c.location,
        yearsExperience: c.yearsExperience,
        profilePhotoUrl: c.profilePhotoUrl,
        summary: c.summary?.substring(0, 150) + (c.summary?.length > 150 ? '...' : ''),
        skills: c.skills.slice(0, 5).map(s => s.name),
        totalSkills: c.skills.length,
        availability: c.availability,
        employmentType: c.employmentType,
        remotePreference: c.remotePreference,
        salaryExpectation: c.salaryExpectation,
        dayRate: c.dayRate,
        isSaved: savedCandidateIds.has(c.id),
        recentExperience: c.experiences[0] || null,
        lastActiveAt,
        isInactiveProfile,
      };
    });

    return res.status(200).json({
      candidates: results,
      pagination: {
        page: parsedPage,
        pageSize: parsedPageSize,
        total,
        totalPages: Math.ceil(total / parsedPageSize)
      }
    });

  } catch (error) {
    console.error('Error searching candidates:', error);
    return res.status(500).json({ error: 'Failed to search candidates' });
  }
}
