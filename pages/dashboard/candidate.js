import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]';
import { prisma } from '../../lib/prisma';
import DashboardStatusCards from '../../components/DashboardStatusCards';
import Link from 'next/link';

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
    <div className="candidate-dashboard-container">
      <style jsx>{`
        .candidate-dashboard-container {
          padding: 2rem 1rem;
          max-width: 1200px;
          margin: 0 auto;
        }
        .dashboard-section {
          margin-bottom: 2rem;
        }
        .section-title {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: #1f2937;
        }
        .profile-overview {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        .profile-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .profile-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        .profile-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid #4f46e5;
        }
        .profile-info h2 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
        }
        .profile-info p {
          color: #6b7280;
          margin: 0.25rem 0;
          font-size: 0.875rem;
        }
        .profile-score {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .score-value {
          font-size: 2rem;
          font-weight: 700;
          color: #4f46e5;
        }
        .score-label {
          font-size: 0.875rem;
          color: #6b7280;
        }
        .profile-section {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          border: 1px solid #e5e7eb;
        }
        .profile-section h3 {
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 1rem 0;
          color: #1f2937;
        }
        .info-row {
          display: grid;
          grid-template-columns: 150px 1fr;
          gap: 1rem;
          padding: 0.75rem 0;
          border-bottom: 1px solid #f3f4f6;
        }
        .info-row:last-child {
          border-bottom: none;
        }
        .info-label {
          font-weight: 500;
          color: #6b7280;
        }
        .info-value {
          color: #1f2937;
        }
        .skills-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .skill-badge {
          background: #eef2ff;
          color: #4f46e5;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 500;
        }
        .applications-list {
          display: grid;
          gap: 1rem;
        }
        .application-item {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .application-title {
          font-weight: 600;
          color: #1f2937;
        }
        .application-company {
          font-size: 0.875rem;
          color: #6b7280;
        }
        .application-date {
          font-size: 0.875rem;
          color: #9ca3af;
        }
        .btn-primary {
          background: #4f46e5;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 500;
          border: none;
          cursor: pointer;
          display: inline-block;
        }
        .btn-primary:hover {
          background: #4338ca;
        }
        @media (max-width: 768px) {
          .profile-overview {
            grid-template-columns: 1fr;
          }
          .info-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <DashboardStatusCards profile={profile} profileScore={profileScore} />

      {profile ? (
        <div className="dashboard-section">
          <h2 className="section-title">Your Profile</h2>
          
          {/* Profile Overview Cards */}
          <div className="profile-overview">
            <div className="profile-card">
              <div className="profile-header">
                {profile.profilePhotoUrl && (
                  <img 
                    src={profile.profilePhotoUrl} 
                    alt={profile.fullName} 
                    className="profile-avatar"
                  />
                )}
                <div className="profile-info">
                  <h2>{profile.fullName || 'Your Name'}</h2>
                  <p>{profile.jobTitle || 'Job Title'}</p>
                  <p>{profile.location}</p>
                </div>
              </div>
            </div>

            <div className="profile-card">
              <div className="profile-score">
                <div>
                  <div className="score-value">{profileScore}</div>
                  <div className="score-label">Profile Score</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>Profile Completeness</div>
                  <div style={{ height: '8px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        height: '100%', 
                        background: '#4f46e5', 
                        width: `${profileScore}%`,
                        transition: 'width 0.3s'
                      }} 
                    />
                  </div>
                </div>
              </div>
              <Link href="/dashboard/profile-edit" className="btn-primary" style={{ display: 'block', marginTop: '1rem', textAlign: 'center' }}>
                Edit Profile
              </Link>
            </div>
          </div>

          {/* Profile Details */}
          <div className="profile-section" style={{ marginBottom: '2rem' }}>
            <h3>About You</h3>
            <div className="info-row">
              <div className="info-label">Summary</div>
              <div className="info-value">{profile.summary || 'No summary added'}</div>
            </div>
            <div className="info-row">
              <div className="info-label">Experience</div>
              <div className="info-value">{profile.yearsExperience ? `${profile.yearsExperience} years` : 'Not specified'}</div>
            </div>
            <div className="info-row">
              <div className="info-label">Sector</div>
              <div className="info-value">{profile.sector || 'Not specified'}</div>
            </div>
            <div className="info-row">
              <div className="info-label">Day Rate</div>
              <div className="info-value">{profile.dayRate ? `£${profile.dayRate}` : 'Not specified'}</div>
            </div>
            <div className="info-row">
              <div className="info-label">Remote Preference</div>
              <div className="info-value">
                {profile.remotePreference === null ? 'Not specified' : profile.remotePreference ? 'Open to remote' : 'Prefer on-site'}
              </div>
            </div>
          </div>

          {/* Skills */}
          {profile.skills && profile.skills.length > 0 && (
            <div className="profile-section" style={{ marginBottom: '2rem' }}>
              <h3>Skills ({profile.skills.length})</h3>
              <div className="skills-list">
                {profile.skills.map(skill => (
                  <div key={skill.id} className="skill-badge">{skill.name}</div>
                ))}
              </div>
            </div>
          )}

          {/* Applications */}
          {profile.applications && profile.applications.length > 0 && (
            <div className="profile-section">
              <h3>Recent Applications ({profile.applications.length})</h3>
              <div className="applications-list">
                {profile.applications.slice(0, 5).map(app => (
                  <div key={app.id} className="application-item">
                    <div>
                      <div className="application-title">{app.job?.title}</div>
                      <div className="application-company">{app.job?.employer?.companyName}</div>
                      <div className="application-date">
                        Applied {new Date(app.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="profile-section" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: '#6b7280', marginBottom: '1rem' }}>No profile found. Let's create one!</p>
          <Link href="/dashboard/profile-edit" className="btn-primary">
            Create Your Profile
          </Link>
        </div>
      )}
    </div>
  );
}
