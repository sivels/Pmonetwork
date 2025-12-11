import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '../../../lib/prisma';

// GET returns candidate profile with relations.
// PUT updates candidate profile (limited fields).
export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || (session.user.role || '').toLowerCase() !== 'candidate') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { candidateCandidateProfile: { include: { skills: true, certifications: true, documents: true } } }
  });
  const profile = user?.candidateCandidateProfile;

  if (req.method === 'GET') {
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    return res.json(profile);
  }

  if (req.method === 'PUT') {
    // Create profile if it doesn't exist
    if (!profile) {
      try {
        const newProfile = await prisma.candidateProfile.create({
          data: {
            userId: user.id,
            fullName: user.name || '',
            email: user.email || ''
          }
        });
        
        const allowed = [
          'fullName','jobTitle','summary','yearsExperience','sector','location','remotePreference','dayRate',
          'salaryExpectation','availability','email','phone','employmentType','rightToWork',
          'linkedinUrl','portfolioUrl','githubUrl','twitterUrl','websiteUrl',
          'isPublic','showSalary','showProfilePhoto','anonymousMode','completionStyle'
        ];
        const data = {};
        for (const key of allowed) {
          if (key in req.body) data[key] = req.body[key];
        }
        
        // Basic validation
        if (data.fullName && data.fullName.length < 2) return res.status(400).json({ error: 'Full name too short' });
        if (data.summary && data.summary.length < 20) return res.status(400).json({ error: 'Summary must be at least 20 characters' });
        if (data.yearsExperience && (data.yearsExperience < 0 || data.yearsExperience > 60)) return res.status(400).json({ error: 'Years experience out of range' });
        
        const updated = await prisma.candidateProfile.update({
          where: { id: newProfile.id },
          data
        });
        return res.json(updated);
      } catch (e) {
        console.error(e);
        return res.status(500).json({ error: 'Profile creation failed' });
      }
    }
    
    const allowed = [
      'fullName','jobTitle','summary','yearsExperience','sector','location','remotePreference','dayRate',
      'salaryExpectation','availability','email','phone','employmentType','rightToWork',
      'linkedinUrl','portfolioUrl','githubUrl','twitterUrl','websiteUrl',
      'isPublic','showSalary','showProfilePhoto','anonymousMode','completionStyle'
    ];
    const data = {};
    for (const key of allowed) {
      if (key in req.body) data[key] = req.body[key];
    }
    // Basic validation examples
    if (data.fullName && data.fullName.length < 2) return res.status(400).json({ error: 'Full name too short' });
    if (data.summary && data.summary.length < 20) return res.status(400).json({ error: 'Summary must be at least 20 characters' });
    if (data.yearsExperience && (data.yearsExperience < 0 || data.yearsExperience > 60)) return res.status(400).json({ error: 'Years experience out of range' });
    try {
      const updated = await prisma.candidateProfile.update({
        where: { id: profile.id },
        data
      });
      return res.json(updated);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Update failed' });
    }
  }

  res.setHeader('Allow', 'GET, PUT');
  return res.status(405).json({ error: 'Method not allowed' });
}
