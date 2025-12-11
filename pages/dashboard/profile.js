import React, { useMemo, useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]';
import { prisma } from '../../lib/prisma';
import Link from 'next/link';
import PersonalDetailsSection from '../../components/profile/PersonalDetailsSection';
import PhotoUploadSection from '../../components/profile/PhotoUploadSection';
import VideoIntroSection from '../../components/profile/VideoIntroSection';
import SkillsSection from '../../components/profile/SkillsSection';
import CertificationsSection from '../../components/profile/CertificationsSection';
import ExperienceSection from '../../components/profile/ExperienceSection';
import EducationSection from '../../components/profile/EducationSection';
import DocumentsSection from '../../components/profile/DocumentsSection';
import SocialLinksSection from '../../components/profile/SocialLinksSection';
import ProfessionalSummarySection from '../../components/profile/ProfessionalSummarySection';
import PrivacyVisibilitySection from '../../components/profile/PrivacyVisibilitySection';
import AutosaveStatus from '../../components/profile/AutosaveStatus';

export async function getServerSideProps(ctx) {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session) return { redirect: { destination: '/auth/login', permanent: false } };
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
          experiences: { orderBy: { startDate: 'desc' } },
          education: { orderBy: { startDate: 'desc' } }
        } 
      } 
    }
  });
  
  const profile = user?.candidateCandidateProfile || null;
  const serializedProfile = profile ? JSON.parse(JSON.stringify(profile)) : null;
  
  return { props: { profile: serializedProfile, userEmail: session.user.email } };
}

export default function ProfileEditor({ profile, userEmail }) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('personal');
  const [profileData, setProfileData] = useState(profile);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [toast, setToast] = useState('');

  const completion = useMemo(() => calculateCompletion(profileData), [profileData]);

  const sections = [
    { id: 'personal', label: 'Personal Details', icon: 'user' },
    { id: 'photo', label: 'Profile Photo', icon: 'camera' },
    { id: 'video', label: 'Video Intro', icon: 'video' },
    { id: 'summary', label: 'Professional Summary', icon: 'doc' },
    { id: 'skills', label: 'Skills & Competencies', icon: 'star' },
    { id: 'certifications', label: 'Certifications', icon: 'award' },
    { id: 'experience', label: 'Experience & Projects', icon: 'briefcase' },
    { id: 'education', label: 'Education', icon: 'book' },
    { id: 'documents', label: 'Document Repository', icon: 'folder' },
    { id: 'social', label: 'Social Links', icon: 'link' },
    { id: 'privacy', label: 'Privacy & Visibility', icon: 'shield' }
  ];

  const updateProfile = (updatedData) => {
    setProfileData({ ...profileData, ...updatedData });
  };

  useEffect(() => {
    const q = router?.query?.section;
    const ids = ['personal','photo','video','summary','skills','certifications','experience','education','documents','social','privacy','settings'];
    if (typeof q === 'string' && ids.includes(q)) {
      setActiveSection(q);
      return;
    }
    if (typeof window !== 'undefined' && window.location.hash) {
      const h = window.location.hash.replace('#','');
      if (ids.includes(h)) setActiveSection(h);
    }
  }, [router?.query?.section]);

  async function saveInline(updates) {
    try {
      setSaving(true);
      const res = await fetch('/api/candidate/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error('Save failed');
      const data = await res.json();
      setProfileData(prev => ({ ...prev, ...data }));
      setSavedAt(new Date());
      setToast('Changes saved');
      setTimeout(() => setToast(''), 2000);
    } catch (e) {
      // no-op; could show toast
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Head>
        <title>Edit Profile – PMO Network</title>
        <meta name="description" content="Complete and enhance your PMO professional profile" />
      </Head>
      
      <div className="profile-editor-layout premium">
        {/* Banner Header */}
        <div className="profile-banner">
          {/* Left Section */}
          <div className="banner-left">
            <Link href="/dashboard/candidate" className="banner-breadcrumb">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </Link>
            <div className="banner-identity">
              <div className="banner-avatar" style={{ backgroundImage: `url(${profileData?.profilePhotoUrl || '/images/avatar-placeholder.svg'})` }} />
              <div className="banner-name-role">
                <input
                  className="banner-name"
                  defaultValue={profileData?.fullName || ''}
                  placeholder="Full name"
                  onBlur={(e) => e.target.value !== profileData?.fullName && saveInline({ fullName: e.target.value })}
                />
                <input
                  className="banner-role"
                  defaultValue={profileData?.jobTitle || ''}
                  placeholder="Current job title"
                  onBlur={(e) => e.target.value !== profileData?.jobTitle && saveInline({ jobTitle: e.target.value })}
                />
              </div>
            </div>
          </div>
          {/* Right Section */}
          <div className="banner-right">
            <AutosaveStatus saving={saving} savedAt={savedAt} />
            <div className="banner-actions">
              <Link href="/candidate/preview" className="btn secondary">Preview My Public Profile</Link>
              <button className="btn primary" onClick={() => saveInline({ fullName: profileData?.fullName, jobTitle: profileData?.jobTitle })}>Save Changes</button>
            </div>
            {toast && <div role="status" aria-live="polite" className="toast success">{toast}</div>}
          </div>
        </div>

        {/* Profile Completion Bar */}
        <div className="completion-bar-container">
          <div className="completion-bar-content">
            <div className="completion-bar-text">
              <div className="info-wrapper">
                <button className="info-icon" aria-label="Missing items">i</button>
                <div className="tooltip" role="tooltip">
                  <ul className="tooltip-list">
                    {getMissingItems(profileData).map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <span className="label">Profile Completion: <strong>{completion}%</strong></span>
            </div>
            <div className="completion-bar-track">
              <div className="completion-bar-fill" style={{ width: `${completion}%` }} />
            </div>
          </div>
        </div>

        <div className="profile-editor-container">
          {/* Sidebar Navigation */}
          <aside className="profile-editor-sidebar vertical">
            <nav className="sidebar-nav">
              {sections.map(section => (
                <button
                  key={section.id}
                  className={`sidebar-section-btn ${activeSection === section.id ? 'active' : ''}`}
                  onClick={() => setActiveSection(section.id)}
                >
                  <span className="section-icon">{getSectionIcon(section.icon)}</span>
                  <span className="section-label">{section.label}</span>
                  {getSectionCompletionBadge(section.id, profileData)}
                </button>
              ))}
            </nav>
          </aside>

          {/* Main Content Area with AI panel */}
          <main className="profile-editor-main with-aside">
            {activeSection === 'personal' && (
              <PersonalDetailsSection profile={profileData} onUpdate={updateProfile} />
            )}
            {activeSection === 'photo' && (
              <PhotoUploadSection profile={profileData} onUpdate={updateProfile} />
            )}
            {activeSection === 'video' && (
              <VideoIntroSection profile={profileData} onUpdate={updateProfile} />
            )}
            {activeSection === 'summary' && (
              <ProfessionalSummarySection profile={profileData} onUpdate={updateProfile} />
            )}
            {activeSection === 'skills' && (
              <SkillsSection profile={profileData} onUpdate={updateProfile} />
            )}
            {activeSection === 'certifications' && (
              <CertificationsSection profile={profileData} onUpdate={updateProfile} />
            )}
            {activeSection === 'experience' && (
              <ExperienceSection profile={profileData} onUpdate={updateProfile} />
            )}
            {activeSection === 'education' && (
              <EducationSection profile={profileData} onUpdate={updateProfile} />
            )}
            {activeSection === 'documents' && (
              <DocumentsSection profile={profileData} onUpdate={updateProfile} />
            )}
            {activeSection === 'social' && (
              <SocialLinksSection profile={profileData} onUpdate={updateProfile} />
            )}
            {activeSection === 'privacy' && (
              <PrivacyVisibilitySection profile={profileData} onUpdate={updateProfile} />
            )}
          </main>

          <aside className="right-rail ai-panel">
            <AIPanel profile={profileData} />
          </aside>
        </div>
      </div>
    </>
  );
}

function getSectionIcon(icon) {
  const icons = {
    user: <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
    camera: <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    video: <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
    doc: <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 3h6l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1zm6 0v5h5" /></svg>,
    star: <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>,
    award: <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>,
    briefcase: <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
    book: <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
    folder: <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>,
    link: <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>,
    shield: <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
    settings: <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317a1 1 0 01.894-.553h1.562a1 1 0 01.894.553l.41.82a1 1 0 00.746.546l.905.151a1 1 0 01.708.59l.62 1.45a1 1 0 01-.217 1.08l-.651.652a1 1 0 000 1.414l.651.652a1 1 0 01.217 1.08l-.62 1.45a1 1 0 01-.708.59l-.905.151a1 1 0 00-.746.546l-.41.82a1 1 0 01-.894.553h-1.562a1 1 0 01-.894-.553l-.41-.82a1 1 0 00-.746-.546l-.905-.151a1 1 0 01-.708-.59l-.62-1.45a1 1 0 01.217-1.08l.651-.652a1 1 0 000-1.414l-.651-.652a1 1 0 01-.217-1.08l.62-1.45a1 1 0 01.708-.59l.905-.151a1 1 0 00.746-.546l.41-.82zM12 15a3 3 0 100-6 3 3 0 000 6z" /></svg>
  };
  return icons[icon] || icons.user;
}

function getSectionCompletionBadge(sectionId, profile) {
  if (!profile) return null;
  
  const isComplete = {
    personal: profile.fullName && profile.jobTitle && profile.location && profile.dayRate,
    photo: profile.profilePhotoUrl,
    video: profile.videoUrl,
    skills: profile.skills && profile.skills.length > 0,
    certifications: profile.certifications && profile.certifications.length > 0,
    experience: profile.experiences && profile.experiences.length > 0,
    education: profile.education && profile.education.length > 0,
    documents: profile.cvUrl || (profile.documents && profile.documents.length > 0),
    social: profile.linkedInUrl || profile.portfolioUrl
  };

  if (isComplete[sectionId]) {
    return (
      <span className="completion-check">
        <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      </span>
    );
  }
  return null;
}

function getMissingItems(profile) {
  if (!profile) return [
    'Add your job title',
    'Upload your CV',
    'Add skills',
    'Add experience',
    'Add certifications',
    'Add location',
    'Add day rate / salary expectations'
  ];
  const items = [];
  if (!profile.jobTitle) items.push('Add your job title');
  if (!profile.cvUrl && !(profile.documents && profile.documents.length)) items.push('Upload your CV');
  if (!profile.skills || profile.skills.length < 3) items.push('Add skills');
  if (!profile.experiences || profile.experiences.length === 0) items.push('Add experience');
  if (!profile.certifications || profile.certifications.length === 0) items.push('Add certifications');
  if (!profile.location) items.push('Add location');
  if (!profile.dayRate && !profile.salaryExpectation) items.push('Add day rate / salary expectations');
  return items.length > 0 ? items : ['Profile complete! Keep it updated.'];
}

function calculateCompletion(profile) {
  if (!profile) return 0;
  let total = 10; // sections counted
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

function renderHints(profile) {
  if (!profile) return [];
  const hints = [];
  if (!profile.profilePhotoUrl) hints.push('Add a professional profile photo');
  if (!profile.summary || profile.summary.length < 120) hints.push('Write a strong professional summary');
  if (!profile.certifications?.length) hints.push('Add your PMO certifications (e.g., PRINCE2)');
  if (!profile.skills || profile.skills.length < 5) hints.push('Add at least 5 PMO skills');
  if (!profile.cvUrl) hints.push('Upload your latest CV');
  return hints;
}

function AIPanel({ profile }) {
  const [data, setData] = useState({ suggestions: [], matches: [], gaps: [] });
  useEffect(() => {
    let isMounted = true;
    fetch('/api/ai/recommendations')
      .then(r => r.json())
      .then(d => { if (isMounted) setData(d); })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);
  return (
    <div className="ai-panel-card">
      <h3>Recommendations</h3>
      <div className="ai-list">
        {data.suggestions.map((s, i) => (
          <div key={`sug-${i}`} className="ai-item">{s}</div>
        ))}
      </div>
      <h4>Skills gaps</h4>
      <div className="ai-list subtle">
        {data.gaps.map((s, i) => (
          <div key={`gap-${i}`} className="ai-item chip">{s}</div>
        ))}
      </div>
      <h4>Job matches</h4>
      <div className="ai-list">
        {data.matches.map((s, i) => (
          <div key={`match-${i}`} className="ai-item">{s}</div>
        ))}
      </div>
    </div>
  );
}
