import Head from 'next/head';
import dynamic from 'next/dynamic';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]';
import { prisma } from '../../lib/prisma';
import Link from 'next/link';
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NotificationPanel from '../../components/NotificationPanel';
import MessagesPanel from '../../components/MessagesPanel';
import ProfileStatusPanel from '../../components/ProfileStatusPanel';
import DashboardStatusCards from '../../components/DashboardStatusCards';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

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
  
  // Serialize profile data to ensure it's JSON-safe
  const serializedProfile = profile ? JSON.parse(JSON.stringify(profile)) : null;
  
  return { props: { profile: serializedProfile, profileScore, userEmail: session.user.email } };
}

const CandidateRealtime = dynamic(() => import('../../components/realtime/CandidateRealtime'), { ssr: false });

export default function CandidateDashboard({ profile, profileScore, userEmail }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [profileStatusOpen, setProfileStatusOpen] = useState(false);

  // Calculate missing profile items (original simple list for banner buttons)
  const getMissingItems = () => {
    const missing = [];
    if (!profile?.cvUrl) missing.push({ label: 'Upload CV', action: 'cv' });
    if (!profile?.yearsExperience && profile?.yearsExperience !== 0) missing.push({ label: 'Add Work Experience', action: 'experience' });
    if (!profile?.skills || profile.skills.length === 0) missing.push({ label: 'Add PMO Skills', action: 'skills' });
    if (!profile?.certifications || profile.certifications.length === 0) missing.push({ label: 'Add Certifications', action: 'certs' });
    if (!profile?.profilePhotoUrl) missing.push({ label: 'Upload Profile Picture', action: 'photo' });
    if (!profile?.videoUrl) missing.push({ label: 'Record Video Intro', action: 'video' });
    return missing;
  };

  const missingItems = getMissingItems();
  const actionToSection = {
    cv: 'documents',
    experience: 'experience',
    skills: 'skills',
    certs: 'certifications',
    photo: 'photo',
    video: 'video'
  };
  const isProfileComplete = profileScore === 100;

  return (
    <QueryClientProvider client={queryClient}>
      <Head>
        <title>Candidate Dashboard – PMO Network</title>
        <meta name="description" content="Manage your PMO profile, track applications, and connect with employers." />
      </Head>
      
      <CandidateRealtime candidateId={profile?.id || ''} onStatus={(p) => console.log('Status update', p)} onMessage={(p) => console.log('New message', p)} />
      <div className="modern-dashboard">
        {/* Top Navigation Bar */}
        <div className="dashboard-topbar">
          <div className="topbar-left">
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="topbar-title">PMO Network</h1>
          </div>
          <div className="topbar-right">
            <button 
              className="topbar-icon-btn" 
              title="Messages"
              onClick={() => {
                setMessagesOpen(!messagesOpen);
                setNotificationsOpen(false);
                setProfileStatusOpen(false);
              }}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="badge">3</span>
            </button>
            <button 
              className="topbar-icon-btn" 
              title="Notifications"
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                setMessagesOpen(false);
                setProfileStatusOpen(false);
              }}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="badge">5</span>
            </button>
            <div 
              className="topbar-profile"
              onClick={() => {
                setProfileStatusOpen(!profileStatusOpen);
                setNotificationsOpen(false);
                setMessagesOpen(false);
              }}
              style={{ cursor: 'pointer' }}
            >
              <img src={profile?.profilePhotoUrl || '/images/avatar-placeholder.svg'} alt="Profile" className="topbar-avatar" />
              <span className="topbar-name">{profile?.fullName || 'User'}</span>
            </div>
          </div>
        </div>

        <div className="dashboard-container">
          {/* Sidebar Navigation */}
          <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
            <nav className="sidebar-nav">
              <button className={`sidebar-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>Overview</span>
              </button>
              <button className={`sidebar-item ${activeTab === 'applications' ? 'active' : ''}`} onClick={() => setActiveTab('applications')}>
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Applications</span>
                {profile?.applications?.length > 0 && <span className="sidebar-badge">{profile.applications.length}</span>}
              </button>
              <button className={`sidebar-item ${activeTab === 'jobs' ? 'active' : ''}`} onClick={() => setActiveTab('jobs')}>
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>Recommended Jobs</span>
              </button>
              <Link href="/dashboard/saved-jobs" className={`sidebar-item ${activeTab === 'saved' ? 'active' : ''}`}>
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                <span>Saved Jobs</span>
              </Link>
              <Link href="/dashboard/messages" className={`sidebar-item ${activeTab === 'messages' ? 'active' : ''}`}>
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <span>Messages</span>
                <span className="sidebar-badge">3</span>
              </Link>
              <Link href="/dashboard/documents" className={`sidebar-item ${activeTab === 'documents' ? 'active' : ''}`}>
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Documents</span>
              </Link>
              <button className={`sidebar-item ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Analytics</span>
              </button>
              <Link href="/dashboard/settings" className={`sidebar-item ${activeTab === 'settings' ? 'active' : ''}`}>
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Settings</span>
              </Link>
            </nav>
          </aside>

          {/* Main Content Area */}
          <main className="dashboard-main">
            {activeTab === 'overview' && (
              <>
                {/* Profile Completion Status */}
                {!isProfileComplete && (
                  <div className="completion-banner">
                    <div className="completion-header">
                      <div>
                        <h2 className="completion-title">Complete Your Profile</h2>
                        <p className="completion-subtitle">Boost your visibility to employers</p>
                      </div>
                      <div className="completion-score">
                        <div className="score-circle">
                          <svg className="score-ring" width="80" height="80">
                            <circle cx="40" cy="40" r="35" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                            <circle 
                              cx="40" cy="40" r="35" fill="none" 
                              stroke="#4f46e5" strokeWidth="6"
                              strokeDasharray={`${profileScore * 2.2} 220`}
                              strokeLinecap="round"
                              transform="rotate(-90 40 40)"
                            />
                          </svg>
                          <span className="score-text">{profileScore}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="completion-items">
                      {missingItems.map((item, idx) => (
                        <Link
                          key={idx}
                          href={`/dashboard/profile${actionToSection[item.action] ? `?section=${actionToSection[item.action]}` : ''}`}
                          className="completion-btn"
                        >
                          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {isProfileComplete && (
                  <div className="completion-badge-banner">
                    <svg width="48" height="48" fill="none" stroke="#10b981" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h3 className="badge-title">🎉 PMO-Ready Certified</h3>
                      <p className="badge-subtitle">Your profile is 100% complete and visible to employers</p>
                    </div>
                  </div>
                )}

                {/* Overview Grid */}
                <div className="dashboard-grid-modern">{/* Profile Overview Card */}
                  <div className="dash-card profile-card">
                    <div className="card-header">
                      <h3 className="card-title">Profile Overview</h3>
                      <div className="card-actions">
                        <Link href="/dashboard/profile" className="btn-icon" title="Edit Profile">
                          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                    <div className="profile-info">
                      <div className="profile-photo-large">
                        <img src={profile?.profilePhotoUrl || '/images/avatar-placeholder.svg'} alt={profile?.fullName || 'User'} />
                      </div>
                      <div className="profile-details">
                        <h4 className="profile-name">{profile?.fullName || 'Complete your profile'}</h4>
                        <p className="profile-title">{profile?.jobTitle || 'Job title not set'}</p>
                        <div className="profile-meta">
                          <div className="meta-item">
                            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>{profile?.location || 'Not specified'}</span>
                          </div>
                          <div className="meta-item">
                            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{profile?.dayRate ? `£${profile.dayRate}/day` : 'Rate not set'}</span>
                          </div>
                          <div className="meta-item">
                            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{profile?.availability || 'Not set'}</span>
                          </div>
                        </div>
                        <div className="profile-sector">
                          <strong>PMO Specialism:</strong> {profile?.sector || 'Not specified'}
                        </div>
                      </div>
                    </div>
                    <div className="card-footer">
                      <Link href="/candidate/preview" className="btn-secondary">Preview Profile</Link>
                      <Link href="/dashboard/profile" className="btn-primary">Quick Edit</Link>
                    </div>
                  </div>

                  {/* Removed individual missing data cards (reverted) */}

                </div>

                {/* Dashboard Status Cards (moved to bottom) */}
                <DashboardStatusCards />
              </>
            )}

            {activeTab === 'applications' && (
              <div className="applications-full-view">
                <h2 className="page-title">Application Tracking</h2>
                {profile?.applications && profile.applications.length > 0 ? (
                  <div className="applications-table">
                    {profile.applications.map(app => (
                      <div key={app.id} className="application-row">
                        <div className="app-main-info">
                          <h3 className="app-title">{app.job.title}</h3>
                          <p className="app-meta">
                            {app.job.employer?.companyName} • {app.job.location} • {app.job.employmentType}
                          </p>
                        </div>
                        <div className="app-salary">
                          {app.job.salaryMin && app.job.salaryMax && (
                            <span>£{app.job.salaryMin.toLocaleString()} - £{app.job.salaryMax.toLocaleString()}</span>
                          )}
                        </div>
                        <div className="app-date">
                          <span className="date-label">Applied</span>
                          <span className="date-value">{new Date(app.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="app-status-col">
                          <span className={`status-badge status-${app.status.toLowerCase()}`}>{app.status}</span>
                        </div>
                        <div className="app-actions">
                          <Link href={`/jobs/${app.job.id}`} className="btn-sm-secondary">View Job</Link>
                          <button className="btn-sm-text">Withdraw</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state-large">
                    <svg width="80" height="80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="empty-state-title">No applications yet</h3>
                    <p className="empty-state-subtitle">You haven't applied for any roles yet. Start by browsing available PMO positions.</p>
                    <Link href="/jobs" className="btn-primary-lg">Browse PMO Jobs</Link>
                  </div>
                )}
              </div>
            )}

            {/* Placeholder tabs */}
            {activeTab === 'jobs' && <div className="tab-placeholder"><h2>Recommended Jobs</h2><p>Coming soon...</p></div>}
            {activeTab === 'saved' && <div className="tab-placeholder"><h2>Saved Jobs</h2><p>Coming soon...</p></div>}
            {activeTab === 'messages' && <div className="tab-placeholder"><h2>Messages</h2><p>Coming soon...</p></div>}
            {activeTab === 'documents' && <div className="tab-placeholder"><h2>Document Repository</h2><p>Coming soon...</p></div>}
            {activeTab === 'analytics' && <div className="tab-placeholder"><h2>Profile Analytics</h2><p>Coming soon...</p></div>}
            {activeTab === 'settings' && <div className="tab-placeholder"><h2>Account Settings</h2><p>Coming soon...</p></div>}
          </main>
        </div>

        {/* Notification Panels */}
        <NotificationPanel 
          isOpen={notificationsOpen} 
          onClose={() => setNotificationsOpen(false)} 
        />
        <MessagesPanel 
          isOpen={messagesOpen} 
          onClose={() => setMessagesOpen(false)} 
        />
        <ProfileStatusPanel 
          isOpen={profileStatusOpen} 
          onClose={() => setProfileStatusOpen(false)}
          profile={profile}
          user={{ email: userEmail }}
        />
      </div>
    </QueryClientProvider>
  );
}
