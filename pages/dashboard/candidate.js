import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]';
import { prisma } from '../../lib/prisma';
import DashboardStatusCards from '../../components/DashboardStatusCards';

export async function getServerSideProps(ctx) {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session) {
    return { redirect: { destination: '/auth/login', permanent: false } };
  }
  if ((session.user.role || '').toLowerCase() !== 'candidate') {
    return { redirect: { destination: '/dashboard/employer', permanent: false } };
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { 
      candidateCandidateProfile: { 
        include: { 
          skills: true, 
          certifications: true, 
          documents: true, 
          applications: { 
            include: { 
              job: { 
                select: { 
                  id: true, 
                  title: true, 
                  employmentType: true, 
                  location: true, 
                  isRemote: true,
                  salaryMin: true,
                  salaryMax: true,
                  employer: { 
                    select: { companyName: true } 
                  } 
                } 
              } 
            },
            orderBy: { createdAt: 'desc' }
          } 
        } 
      } 
    }
  });
  const profile = user?.candidateCandidateProfile || null;

  function computeScore(p) {
    if (!p) return 0;
    let score = 0;
    if (p.fullName) score += 10;
    if (p.jobTitle) score += 10;
    if (p.summary) score += Math.min(10, (p.summary.length / 60) * 10);
    if (typeof p.yearsExperience === 'number') score += 10;
    if (p.sector) score += 5;
    if (p.location) score += 5;
    if (typeof p.remotePreference === 'boolean') score += 5;
    if (p.dayRate) score += 5;
    const skillsCount = p.skills?.length || 0;
    score += Math.min(10, skillsCount * 2);
    const certCount = p.certifications?.length || 0;
    score += Math.min(10, certCount * 3.33);
    if (p.cvUrl) score += 10;
    if (p.videoUrl) score += 10;
    if (p.profilePhotoUrl) score += 5;
    return Math.round(Math.min(100, score));
  }
  const profileScore = computeScore(profile);
  const serializedProfile = profile ? JSON.parse(JSON.stringify(profile)) : null;
  return { props: { profile: serializedProfile, profileScore, userEmail: session.user.email } };
}

export default function CandidateDashboard({ profile, profileScore, userEmail }) {
  return (
    <>
      <DashboardStatusCards profile={profile} profileScore={profileScore} />
      {/* Add more dashboard widgets/components here as needed */}
    </>
  );
}
