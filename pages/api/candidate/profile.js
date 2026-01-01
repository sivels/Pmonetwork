import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '../../../lib/prisma';

// GET returns candidate profile with relations.
// POST/PUT updates candidate profile (limited fields).
export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);
    
    console.log('Session:', JSON.stringify(session, null, 2));
    console.log('Session user role:', session?.user?.role);
    
    if (!session) {
      console.log('No session found');
      return res.status(401).json({ error: 'Unauthorized - No session' });
    }
    
    if (!session.user) {
      console.log('No user in session');
      return res.status(401).json({ error: 'Unauthorized - No user in session' });
    }
    
    const userRole = (session.user.role || '').toLowerCase();
    console.log('User role (lowercase):', userRole);
    
    if (userRole !== 'candidate') {
      console.log('User is not a candidate, role:', session.user.role);
      return res.status(401).json({ error: `Unauthorized - Role is ${session.user.role}, not candidate` });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { candidateCandidateProfile: { include: { skills: true, certifications: true, documents: true } } }
    });
    
    if (!user) {
      console.log('User not found in database:', session.user.email);
      return res.status(404).json({ error: 'User not found in database' });
    }
    
    const profile = user?.candidateCandidateProfile;

  if (req.method === 'GET') {
    if (!profile) {
      // Create empty profile if it doesn't exist
      const newProfile = await prisma.candidateProfile.create({
        data: {
          userId: user.id,
          fullName: user.name || '',
          email: user.email || ''
        }
      });
      return res.json(newProfile);
    }
    return res.json(profile);
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    const body = req.body.profile || req.body; // Support both { profile: {...} } and flat {...}
    
    // Create profile if it doesn't exist
    if (!profile) {
      try {
        const newProfile = await prisma.candidateProfile.create({
          data: {
            userId: user.id,
            fullName: user.name || body.full_name || body.fullName || '',
            email: user.email || body.contact_email || body.email || ''
          }
        });
        
        // Now update with the rest of the data
        const data = mapProfileData(body);
        const updated = await prisma.candidateProfile.update({
          where: { id: newProfile.id },
          data
        });
        
        // Handle skills if provided
        if (body.skills) {
          await updateSkills(newProfile.id, body.skills);
        }
        
        const result = await prisma.candidateProfile.findUnique({
          where: { id: newProfile.id },
          include: { skills: true, certifications: true, documents: true }
        });
        
        return res.json(result);
      } catch (e) {
        console.error('Profile creation error:', e);
        return res.status(500).json({ error: 'Profile creation failed', details: e.message });
      }
    }
    
    // Update existing profile
    try {
      const data = mapProfileData(body);
      const updated = await prisma.candidateProfile.update({
        where: { id: profile.id },
        data
      });
      
      // Handle skills if provided
      if (body.skills) {
        await updateSkills(profile.id, body.skills);
      }
      
      const result = await prisma.candidateProfile.findUnique({
        where: { id: profile.id },
        include: { skills: true, certifications: true, documents: true }
      });
      
      return res.json(result);
    } catch (e) {
      console.error('Profile update error:', e);
      return res.status(500).json({ error: 'Update failed', details: e.message });
    }
  }

    res.setHeader('Allow', 'GET, POST, PUT');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

// Map frontend fields to database fields
function mapProfileData(body) {
  const data = {};
  
  // Map snake_case to camelCase and handle both formats
  const fieldMap = {
    'full_name': 'fullName',
    'fullName': 'fullName',
    'jobTitle': 'jobTitle',
    'job_title': 'jobTitle',
    'summary': 'summary',
    'bio': 'summary', // bio maps to summary
    'yearsExperience': 'yearsExperience',
    'years_experience': 'yearsExperience',
    'sector': 'sector',
    'location': 'location',
    'remotePreference': 'remotePreference',
    'work_pref': 'remotePreference', // work_pref maps to remotePreference
    'dayRate': 'dayRate',
    'day_rate': 'dayRate',
    'salaryExpectation': 'salaryExpectation',
    'salary_expectation': 'salaryExpectation',
    'availability': 'availability',
    'email': 'email',
    'contact_email': 'email', // contact_email maps to email
    'phone': 'phone',
    'employmentType': 'employmentType',
    'employment_type': 'employmentType',
    'rightToWork': 'rightToWork',
    'right_to_work': 'rightToWork',
    'linkedinUrl': 'linkedinUrl',
    'linkedin': 'linkedinUrl', // linkedin maps to linkedinUrl
    'linkedin_url': 'linkedinUrl',
    'portfolioUrl': 'portfolioUrl',
    'portfolio_url': 'portfolioUrl',
    'githubUrl': 'githubUrl',
    'github_url': 'githubUrl',
    'twitterUrl': 'twitterUrl',
    'twitter_url': 'twitterUrl',
    'websiteUrl': 'websiteUrl',
    'website_url': 'websiteUrl',
    'isPublic': 'isPublic',
    'is_public': 'isPublic',
    'showSalary': 'showSalary',
    'show_salary': 'showSalary',
    'showProfilePhoto': 'showProfilePhoto',
    'show_profile_photo': 'showProfilePhoto',
    'anonymousMode': 'anonymousMode',
    'anonymous_mode': 'anonymousMode',
    'completionStyle': 'completionStyle',
    'completion_style': 'completionStyle',
    'videoIntroUrl': 'videoIntroUrl',
    'video_intro_url': 'videoIntroUrl'
  };

  for (const [key, dbField] of Object.entries(fieldMap)) {
    if (key in body && body[key] !== undefined && body[key] !== null) {
      data[dbField] = body[key];
    }
  }

  return data;
}

// Update skills - skills is an object like { "RAID Management": "3", "Planning & Scheduling": "4" }
async function updateSkills(candidateId, skillsObj) {
  if (!skillsObj || typeof skillsObj !== 'object') return;
  
  // Delete existing skills
  await prisma.skill.deleteMany({
    where: { candidateId }
  });
  
  // Create new skills
  const skillEntries = Object.entries(skillsObj).filter(([name, level]) => level && name);
  
  if (skillEntries.length > 0) {
    await prisma.skill.createMany({
      data: skillEntries.map(([name, level]) => ({
        candidateId,
        name,
        proficiency: mapSkillLevel(level),
        category: 'PMO'
      }))
    });
  }
}

// Map numeric skill level to proficiency string
function mapSkillLevel(level) {
  const levelMap = {
    '1': 'Beginner',
    '2': 'Intermediate',
    '3': 'Intermediate',
    '4': 'Advanced',
    '5': 'Expert'
  };
  return levelMap[String(level)] || 'Intermediate';
}
