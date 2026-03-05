import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]';
import { prisma } from '../../lib/prisma';
import Head from 'next/head';
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
    where: { id: session.user.id },
    include: {
      candidateCandidateProfile: {
        include: {
          skills: true,
          certifications: true,
          documents: true,
          applications: {
            orderBy: { createdAt: 'desc' },
            include: {
              job: {
                include: {
                  employer: true,
                },
              },
            },
          },
        },
      },
    },
  });
  const profile = user?.candidateCandidateProfile || null;
  let profileScore = 0;
  if (profile) {
    if (profile.fullName) profileScore += 10;
    if (profile.email) profileScore += 10;
    if (profile.phone) profileScore += 10;
    if (profile.location) profileScore += 10;
    if (profile.jobTitle) profileScore += 10;
    if (profile.summary) profileScore += 15;
    if (profile.yearsExperience !== null) profileScore += 10;
    if (profile.skills && profile.skills.length > 0) profileScore += 15;
    if (profile.certifications && profile.certifications.length > 0) profileScore += 10;
    if (profile.profilePhotoUrl) profileScore += 10;
  }
  
  // Serialize dates to avoid serialization errors
  const serializedProfile = profile ? {
    ...profile,
    createdAt: profile.createdAt?.toISOString() || null,
    updatedAt: profile.updatedAt?.toISOString() || null,
    skills: profile.skills?.map(s => ({
      ...s,
      createdAt: s.createdAt?.toISOString() || null,
      updatedAt: s.updatedAt?.toISOString() || null,
    })) || [],
    certifications: profile.certifications?.map(c => ({
      ...c,
      createdAt: c.createdAt?.toISOString() || null,
      updatedAt: c.updatedAt?.toISOString() || null,
    })) || [],
    documents: profile.documents?.map(d => ({
      ...d,
      createdAt: d.createdAt?.toISOString() || null,
      updatedAt: d.updatedAt?.toISOString() || null,
    })) || [],
    applications: profile.applications?.map(a => ({
      ...a,
      createdAt: a.createdAt?.toISOString() || null,
      updatedAt: a.updatedAt?.toISOString() || null,
      job: a.job ? {
        ...a.job,
        createdAt: a.job.createdAt?.toISOString() || null,
        updatedAt: a.job.updatedAt?.toISOString() || null,
        employer: a.job.employer ? {
          ...a.job.employer,
          createdAt: a.job.employer.createdAt?.toISOString() || null,
          updatedAt: a.job.employer.updatedAt?.toISOString() || null,
        } : null,
      } : null,
    })) || [],
  } : null;
  
  return { props: { profile: serializedProfile, profileScore } };
}

export default function CandidateDashboard({ profile, profileScore }) {
  return (
    <div className="candidate-dashboard">
      <style jsx>{`
        .candidate-dashboard {
          min-height: 100vh;
          background: #f3f4f6;
          padding: 2rem 1rem;
        }
        .dashboard-container {
          max-width: 1200px;
          margin: 0 auto;
        }
        .profile-banner {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 16px;
          padding: 2rem;
          margin-bottom: 2rem;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .profile-header-left {
          display: flex;
          gap: 1.5rem;
          flex: 1;
        }
        .profile-photo {
          width: 120px;
          height: 120px;
          border-radius: 12px;
          object-fit: cover;
          border: 4px solid rgba(255, 255, 255, 0.3);
        }
        .profile-banner-info h1 {
          font-size: 1.75rem;
          font-weight: 700;
          margin: 0 0 0.5rem 0;
        }
        .profile-banner-info p {
          margin: 0.25rem 0;
          font-size: 0.95rem;
          opacity: 0.95;
        }
        .profile-banner-actions {
          display: flex;
          gap: 1rem;
        }
        .btn {
          padding: 0.625rem 1.25rem;
          border-radius: 8px;
          border: none;
          font-weight: 500;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          font-size: 0.875rem;
          transition: all 0.2s;
        }
        .btn-primary {
          background: white;
          color: #667eea;
        }
        .btn-primary:hover {
          background: rgba(255, 255, 255, 0.9);
        }
        .btn-secondary {
          background: rgba(255, 255, 255, 0.15);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.25);
        }
        .profile-grid {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          margin-bottom: 2rem;
        }
        .profile-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .card-title {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0 0 1rem 0;
          color: #1f2937;
        }
        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }
        .info-item {
          border-bottom: 1px solid #f3f4f6;
          padding-bottom: 0.75rem;
        }
        .info-item:last-child {
          border-bottom: none;
        }
        .info-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 0.25rem;
        }
        .info-value {
          font-size: 0.95rem;
          font-weight: 500;
          color: #1f2937;
        }
        .score-card {
          text-align: center;
        }
        .score-number {
          font-size: 3rem;
          font-weight: 700;
          color: #667eea;
        }
        .score-label {
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 1rem;
        }
        .score-bar {
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 1rem;
        }
        .score-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          transition: width 0.3s;
        }
        .section-title {
          font-size: 1rem;
          font-weight: 600;
          margin: 1.5rem 0 1rem 0;
          color: #1f2937;
        }
        .skills-container {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }
        .skill-tag {
          background: #eef2ff;
          color: #667eea;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 500;
          border: 1px solid #c7d2fe;
        }
        .applications-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .application-card {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.2s;
        }
        .application-card:hover {
          border-color: #d1d5db;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        .application-info h4 {
          margin: 0 0 0.25rem 0;
          font-size: 0.95rem;
          color: #1f2937;
        }
        .application-info p {
          margin: 0;
          font-size: 0.875rem;
          color: #6b7280;
        }
        .application-date {
          font-size: 0.875rem;
          color: #9ca3af;
          white-space: nowrap;
        }
        .empty-state {
          text-align: center;
          padding: 2rem;
          color: #6b7280;
        }
        .empty-state p {
          margin: 0 0 1rem 0;
        }
        @media (max-width: 768px) {
          .profile-banner {
            flex-direction: column;
          }
          .profile-banner-actions {
            width: 100%;
            margin-top: 1rem;
          }
          .btn {
            flex: 1;
            text-align: center;
          }
          .info-grid {
            grid-template-columns: 1fr;
          }
          .profile-header-left {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }
        }
      `}</style>

      <div className="dashboard-container">
        {profile ? (
          <>
            {/* Profile Banner */}
            <div className="profile-banner">
              <div className="profile-header-left">
                {profile.profilePhotoUrl && (
                  <img 
                    src={profile.profilePhotoUrl} 
                    alt={profile.fullName} 
                    className="profile-photo"
                  />
                )}
                <div className="profile-banner-info">
                  <h1>{profile.fullName || 'Your Name'}</h1>
                  <p>{profile.jobTitle || 'Add your job title'}</p>
                  <p>{profile.location || 'Add location'}</p>
                  {profile.summary && <p style={{ marginTop: '0.75rem', fontSize: '0.9rem' }}>{profile.summary.substring(0, 100)}...</p>}
                </div>
              </div>
              <div className="profile-banner-actions">
                <Link href="/dashboard/profile" className="btn btn-primary">Edit Profile</Link>
                <Link href="/candidate/preview" className="btn btn-secondary">View Public</Link>
              </div>
            </div>

            {/* Profile Details Grid */}
            <div className="profile-grid">
              <div className="profile-card">
                <h2 className="card-title">About</h2>
                <div className="info-grid">
                  <div className="info-item">
                    <div className="info-label">Experience</div>
                    <div className="info-value">{profile.yearsExperience ? `${profile.yearsExperience} years` : 'Not specified'}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Sector</div>
                    <div className="info-value">{profile.sector || 'Not specified'}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Day Rate</div>
                    <div className="info-value">{profile.dayRate ? `£${profile.dayRate}` : 'Not specified'}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Remote</div>
                    <div className="info-value">
                      {profile.remotePreference === null ? 'Not specified' : profile.remotePreference ? 'Open' : 'On-site'}
                    </div>
                  </div>
                </div>

                {profile.summary && (
                  <>
                    <h3 className="section-title">Professional Summary</h3>
                    <p style={{ margin: 0, color: '#4b5563', lineHeight: 1.6 }}>{profile.summary}</p>
                  </>
                )}

                {profile.skills && profile.skills.length > 0 && (
                  <>
                    <h3 className="section-title">Skills & Competencies</h3>
                    <div className="skills-container">
                      {profile.skills.map(skill => (
                        <div key={skill.id} className="skill-tag">{skill.name}</div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Score Card */}
              <div className="profile-card score-card">
                <h2 className="card-title">Profile Score</h2>
                <div className="score-number">{profileScore}</div>
                <div className="score-label">Profile Completeness</div>
                <div className="score-bar">
                  <div className="score-fill" style={{ width: `${profileScore}%` }} />
                </div>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>Keep your profile updated to increase visibility with employers.</p>
              </div>
            </div>

            {/* Applications Section */}
            {profile.applications && profile.applications.length > 0 && (
              <div className="profile-card">
                <h2 className="card-title">Recent Applications ({profile.applications.length})</h2>
                <div className="applications-container">
                  {profile.applications.slice(0, 8).map(app => (
                    <div key={app.id} className="application-card">
                      <div className="application-info">
                        <h4>{app.job?.title}</h4>
                        <p>{app.job?.employer?.companyName}</p>
                      </div>
                      <div className="application-date">
                        {new Date(app.createdAt).toLocaleDateString('en-GB', { 
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="profile-card empty-state">
            <p style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>No Profile Found</p>
            <p>Let's get you started by creating your professional PMO profile.</p>
            <Link href="/dashboard/profile" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Create Your Profile
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
