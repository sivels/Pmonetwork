import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]';
import { prisma } from '../../lib/prisma';
import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';

function calculateCompletion(profile) {
  if (!profile) return 0;
  let total = 10;
  let score = 0;
  if (profile.fullName && profile.jobTitle && profile.location) score++;
  if (profile.profilePhotoUrl) score++;
  if (profile.videoUrl || profile.videoIntroUrl) score++;
  if (profile.summary && profile.summary.length > 120) score++;
  if (profile.skills && profile.skills.length > 4) score++;
  if (profile.certifications && profile.certifications.length > 0) score++;
  if (profile.experiences && profile.experiences.length > 0) score++;
  if (profile.education && profile.education.length > 0) score++;
  if (profile.cvUrl || (profile.documents && profile.documents.length > 0)) score++;
  if (profile.linkedinUrl || profile.portfolioUrl) score++;
  return Math.min(100, Math.round((score / total) * 100));
}

export async function getServerSideProps(ctx) {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session) {
    return { redirect: { destination: '/auth/login', permanent: false } };
  }
  if ((session.user.role || '').toLowerCase() !== 'candidate') {
    return { redirect: { destination: '/dashboard', permanent: false } };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      candidateCandidateProfile: {
        include: {
          skills: true,
          certifications: true,
          experiences: true,
          education: true,
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
  const profileScore = calculateCompletion(profile);

  const serializedProfile = profile
    ? {
        ...profile,
        createdAt: profile.createdAt?.toISOString() || null,
        updatedAt: profile.updatedAt?.toISOString() || null,
        skills:
          profile.skills?.map((skill) => ({
            ...skill,
            createdAt: skill.createdAt?.toISOString() || null,
            updatedAt: skill.updatedAt?.toISOString() || null,
          })) || [],
        certifications:
          profile.certifications?.map((certification) => ({
            ...certification,
            createdAt: certification.createdAt?.toISOString() || null,
            updatedAt: certification.updatedAt?.toISOString() || null,
          })) || [],
        experiences:
          profile.experiences?.map((experience) => ({
            ...experience,
            createdAt: experience.createdAt?.toISOString() || null,
            startDate: experience.startDate?.toISOString() || null,
            endDate: experience.endDate?.toISOString() || null,
          })) || [],
        education:
          profile.education?.map((education) => ({
            ...education,
            createdAt: education.createdAt?.toISOString() || null,
            startDate: education.startDate?.toISOString() || null,
            endDate: education.endDate?.toISOString() || null,
          })) || [],
        documents:
          profile.documents?.map((document) => ({
            ...document,
            createdAt: document.createdAt?.toISOString() || null,
            updatedAt: document.updatedAt?.toISOString() || null,
          })) || [],
        applications:
          profile.applications?.map((application) => ({
            ...application,
            createdAt: application.createdAt?.toISOString() || null,
            updatedAt: application.updatedAt?.toISOString() || null,
            job: application.job
              ? {
                  ...application.job,
                  createdAt: application.job.createdAt?.toISOString() || null,
                  updatedAt: application.job.updatedAt?.toISOString() || null,
                  employer: application.job.employer
                    ? {
                        ...application.job.employer,
                        createdAt: application.job.employer.createdAt?.toISOString() || null,
                        updatedAt: application.job.employer.updatedAt?.toISOString() || null,
                      }
                    : null,
                }
              : null,
          })) || [],
      }
    : null;

  return { props: { profile: serializedProfile, profileScore } };
}

export default function CandidateDashboard({ profile, profileScore }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [unreadMessages, setUnreadMessages] = useState(0);

  function handleTabChange(tab) {
    setActiveTab(tab);
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  }

  useEffect(() => {
    function readUnreadFromStorage() {
      try {
        const raw = typeof window !== 'undefined' ? window.localStorage.getItem('candidateUnreadMessagesCount') : '0';
        const value = parseInt(raw || '0', 10);
        setUnreadMessages(Number.isFinite(value) ? value : 0);
      } catch {
        setUnreadMessages(0);
      }
    }

    const onCustom = (event) => {
      if (typeof event?.detail === 'number') setUnreadMessages(event.detail);
    };

    const onStorage = (event) => {
      if (event.key === 'candidateUnreadMessagesCount') readUnreadFromStorage();
    };

    readUnreadFromStorage();
    window.addEventListener('candidateUnreadMessages', onCustom);
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('candidateUnreadMessages', onCustom);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const applications = profile?.applications || [];
  const recentApplications = applications.slice(0, 8);
  const skillsCount = profile?.skills?.length || 0;
  const profileCompletion = Math.min(profileScore || 0, 100);

  return (
    <>
      <Head>
        <title>Candidate Dashboard – PMO Network</title>
        <meta name="description" content="Manage your PMO profile and applications." />
      </Head>

      <div className="modern-dashboard">
        {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}

        <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <div className="sidebar-header">
            <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="sidebar-nav">
            <button className={`sidebar-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => handleTabChange('overview')}>
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Overview</span>
            </button>

            <Link href="/dashboard/applications" className={`sidebar-item ${activeTab === 'applications' ? 'active' : ''}`}>
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>Manage Applications</span>
              {applications.length > 0 && <span className="sidebar-badge">{applications.length}</span>}
            </Link>

            <Link href="/jobs" className="sidebar-item">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Find Jobs</span>
            </Link>

            <Link href="/dashboard/interviews" className="sidebar-item">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Interviews</span>
            </Link>

            <Link href="/dashboard/messages" className="sidebar-item">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <span>Messages</span>
              {unreadMessages > 0 && <span className="sidebar-badge">{unreadMessages}</span>}
            </Link>

            <div className="sidebar-divider"></div>

            <Link href="/dashboard/profile" className="sidebar-item">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span>Candidate Profile</span>
            </Link>

            <Link href="/dashboard/settings" className="sidebar-item">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Settings</span>
            </Link>
          </nav>
        </aside>

        <main className="dashboard-main">
          {activeTab === 'overview' && (
            <div className="dashboard-content">
              <div className="content-header">
                <div>
                  <h1 className="content-title">Candidate Dashboard</h1>
                  <p className="content-subtitle">{profile?.fullName || 'Your Profile'}</p>
                </div>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon blue">
                    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="stat-details">
                    <span className="stat-label">Applications</span>
                    <span className="stat-value">{applications.length}</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon green">
                    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="stat-details">
                    <span className="stat-label">Profile Completeness</span>
                    <span className="stat-value">{profileCompletion}%</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon purple">
                    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <div className="stat-details">
                    <span className="stat-label">Unread Messages</span>
                    <span className="stat-value">{unreadMessages}</span>
                  </div>
                </div>
              </div>

              {profile ? (
                <>
                  <section className="content-card">
                    <div className="card-header">
                      <h2 className="card-title">Profile Overview</h2>
                      <div className="card-actions">
                        <Link href="/candidate/preview" className="card-action">View Public →</Link>
                        <Link href="/dashboard/profile" className="card-action">Edit Profile →</Link>
                      </div>
                    </div>

                    <div className="profile-grid">
                      <div className="profile-item">
                        <span className="profile-label">Full Name</span>
                        <span className="profile-value">{profile.fullName || '—'}</span>
                      </div>
                      <div className="profile-item">
                        <span className="profile-label">Job Title</span>
                        <span className="profile-value">{profile.jobTitle || '—'}</span>
                      </div>
                      <div className="profile-item">
                        <span className="profile-label">Location</span>
                        <span className="profile-value">{profile.location || '—'}</span>
                      </div>
                      <div className="profile-item">
                        <span className="profile-label">Experience</span>
                        <span className="profile-value">{profile.yearsExperience ? `${profile.yearsExperience} years` : '—'}</span>
                      </div>
                      <div className="profile-item">
                        <span className="profile-label">Sector</span>
                        <span className="profile-value">{profile.sector || '—'}</span>
                      </div>
                      <div className="profile-item">
                        <span className="profile-label">Skills</span>
                        <span className="profile-value">{skillsCount}</span>
                      </div>
                    </div>

                    {profile.summary && <p className="profile-summary">{profile.summary}</p>}

                    {skillsCount > 0 && (
                      <div className="skills-container">
                        {profile.skills.map((skill) => (
                          <span key={skill.id} className="skill-tag">{skill.name}</span>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="content-card">
                    <div className="card-header">
                      <h2 className="card-title">Recent Applications</h2>
                      <Link href="/dashboard/applications" className="card-action">View All →</Link>
                    </div>

                    {recentApplications.length === 0 && (
                      <p className="empty-state">No applications yet. Start exploring roles and apply to opportunities.</p>
                    )}

                    {recentApplications.length > 0 && (
                      <div className="applications-list">
                        {recentApplications.map((application) => (
                          <div key={application.id} className="application-item">
                            <div>
                              <h3 className="application-title">{application.job?.title || 'Untitled role'}</h3>
                              <p className="application-meta">{application.job?.employer?.companyName || 'Company'}</p>
                            </div>
                            <span className="application-date">
                              {new Date(application.createdAt).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </>
              ) : (
                <section className="content-card">
                  <div className="card-header">
                    <h2 className="card-title">Profile Overview</h2>
                  </div>
                  <p className="empty-state">No profile found. Create your profile to start applying for roles.</p>
                  <Link href="/dashboard/profile" className="job-btn primary">Create Your Profile</Link>
                </section>
              )}
            </div>
          )}
        </main>
      </div>

      <style jsx>{`
        .modern-dashboard{display:flex;min-height:100vh;background:#f8f9fc}
        .sidebar-overlay{display:none}
        .dashboard-sidebar{display:none}
        .dashboard-sidebar.closed{width:0;overflow:hidden}
        .sidebar-header{display:none}
        .sidebar-close-btn{background:none;border:none;cursor:pointer;color:#6b7280;padding:0.5rem;display:none}
        .sidebar-nav{padding:1.5rem 0;display:flex;flex-direction:column;gap:0.25rem}
        .sidebar-item{display:flex;align-items:center;gap:0.75rem;padding:0.75rem 1.5rem;color:#6b7280;text-decoration:none;transition:all 0.15s;border:none;background:transparent;width:100%;text-align:left;cursor:pointer;position:relative}
        .sidebar-item:hover{background:#f3f4f6;color:#374151}
        .sidebar-item.active{background:#eef2ff;color:#4f46e5;font-weight:600}
        .sidebar-item svg{flex-shrink:0}
        .sidebar-badge{margin-left:auto;background:#7c3aed;color:#fff;font-size:0.7rem;font-weight:600;padding:0.125rem 0.5rem;border-radius:9999px;min-width:20px;text-align:center}
        .sidebar-divider{height:1px;background:#e5e7eb;margin:0.5rem 1.5rem}

        .dashboard-main{flex:1;overflow-y:auto;padding:2rem;min-width:0;display:flex;justify-content:center;margin-left:0}
        .dashboard-content{width:100%;max-width:1200px;margin:0 auto}
        .content-header{margin-bottom:1.5rem;padding-bottom:1rem;border-bottom:1px solid #e5e7eb}
        .content-title{font-size:1.75rem;font-weight:700;color:#111827;margin:0 0 0.25rem}
        .content-subtitle{font-size:1rem;color:#6b7280;margin:0}

        .stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem;margin-bottom:1.5rem}
        .stat-card{background:#fff;border-radius:12px;padding:1.25rem;box-shadow:0 1px 3px rgba(0,0,0,0.06);display:flex;align-items:center;gap:0.875rem}
        .stat-icon{width:42px;height:42px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .stat-icon.blue{background:#dbeafe;color:#1e40af}
        .stat-icon.green{background:#d1fae5;color:#065f46}
        .stat-icon.purple{background:#e9d5ff;color:#6b21a8}
        .stat-details{display:flex;flex-direction:column;gap:0.15rem;min-width:0}
        .stat-label{font-size:0.8rem;color:#6b7280}
        .stat-value{font-size:1.5rem;font-weight:700;color:#111827}

        .content-card{background:#fff;border-radius:14px;padding:1.25rem;box-shadow:0 1px 3px rgba(0,0,0,0.06);margin-bottom:1.25rem}
        .card-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;padding-bottom:0.875rem;border-bottom:1px solid #f3f4f6;gap:1rem}
        .card-title{font-size:1.125rem;font-weight:600;color:#111827;margin:0}
        .card-actions{display:flex;gap:1rem;flex-wrap:wrap}
        .card-action{color:#4f46e5;font-size:0.875rem;font-weight:500;text-decoration:none}
        .card-action:hover{text-decoration:underline}

        .profile-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:1rem}
        .profile-item{display:flex;flex-direction:column;gap:0.25rem}
        .profile-label{font-size:0.875rem;color:#6b7280}
        .profile-value{font-size:1rem;color:#111827;font-weight:500}
        .profile-summary{margin-top:1rem;margin-bottom:0;color:#4b5563;line-height:1.6}

        .skills-container{display:flex;flex-wrap:wrap;gap:0.75rem;margin-top:1rem}
        .skill-tag{background:#eef2ff;color:#4f46e5;padding:0.35rem 0.75rem;border-radius:9999px;font-size:0.8125rem;font-weight:500;border:1px solid #c7d2fe}

        .applications-list{display:flex;flex-direction:column;gap:0.875rem}
        .application-item{border:1px solid #e5e7eb;border-radius:12px;padding:1rem;display:flex;justify-content:space-between;align-items:flex-start;gap:1rem}
        .application-title{font-size:1rem;font-weight:600;color:#111827;margin:0 0 0.25rem}
        .application-meta{font-size:0.875rem;color:#6b7280;margin:0}
        .application-date{background:#eef2ff;color:#4f46e5;font-size:0.8125rem;font-weight:500;padding:0.25rem 0.75rem;border-radius:9999px;white-space:nowrap}

        .empty-state{color:#6b7280;text-align:center;padding:2rem;margin:0}
        .job-btn{padding:0.5rem 0.875rem;border-radius:8px;font-size:0.875rem;font-weight:500;border:none;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;transition:all 0.15s}
        .job-btn.primary{background:#4f46e5;color:#fff}
        .job-btn.primary:hover{background:#4338ca}

        @media (max-width:1024px){
          .dashboard-main{padding:1.5rem}
        }
        @media (max-width:768px){
          .dashboard-sidebar{position:fixed;z-index:1000;box-shadow:2px 0 8px rgba(0,0,0,0.1)}
          .sidebar-header{display:flex;padding:1rem;border-bottom:1px solid #e5e7eb;justify-content:flex-end}
          .sidebar-close-btn{display:block}
          .dashboard-main{padding:1rem 1rem}
          .stats-grid{grid-template-columns:repeat(2,1fr)}
          .card-header{flex-direction:column;align-items:flex-start}
          .application-item{flex-direction:column}
        }
        @media (max-width:480px){
          .stats-grid{grid-template-columns:1fr}
          .dashboard-main{padding:0.875rem}
        }
      `}</style>
    </>
  );
}
