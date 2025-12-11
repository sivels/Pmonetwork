import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '../../../../lib/prisma';

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
      remoteOnly,
      page = 1,
      pageSize = 20,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const take = parseInt(pageSize);

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

    // Skills filter (if provided as comma-separated)
    let candidates = await prisma.candidateProfile.findMany({
      where,
      include: {
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
      skip,
      take,
      orderBy: [
        { yearsExperience: 'desc' },
        { createdAt: 'desc' }
      ]
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

    // Get total count for pagination
    const total = await prisma.candidateProfile.count({ where });

    // Check which candidates are bookmarked by this employer
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        employerEmployerProfile: {
          include: {
            savedCandidates: {
              select: { candidateId: true }
            }
          }
        }
      }
    });

    const savedCandidateIds = new Set(
      user?.employerEmployerProfile?.savedCandidates?.map(sc => sc.candidateId) || []
    );

    // Format results
    const results = candidates.map(c => ({
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
    }));

    return res.status(200).json({
      candidates: results,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / parseInt(pageSize))
      }
    });

  } catch (error) {
    console.error('Error searching candidates:', error);
    return res.status(500).json({ error: 'Failed to search candidates' });
  }
}
