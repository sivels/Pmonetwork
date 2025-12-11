import React, { useState } from 'react';
import Head from 'next/head';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]';
import { prisma } from '../../lib/prisma';
import Link from 'next/link';
import AutosaveStatus from '../../components/profile/AutosaveStatus';

export async function getServerSideProps(ctx) {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session) return { redirect: { destination: '/auth/login', permanent: false } };
  if ((session.user.role || '').toLowerCase() !== 'employer') {
    return { redirect: { destination: '/dashboard/candidate', permanent: false } };
  }
  
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { employerEmployerProfile: true }
  });
  
  const profile = user?.employerEmployerProfile || null;
  const serializedProfile = profile ? {
    ...profile,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString()
  } : null;
  
  return { props: { profile: serializedProfile, userEmail: session.user.email } };
}

export default function EmployerProfile({ profile, userEmail }) {
  const [profileData, setProfileData] = useState(profile || {});
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [toast, setToast] = useState('');

  async function saveProfile(updates) {
    try {
      setSaving(true);
      const res = await fetch('/api/employer/profile', {
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
      setToast('Save failed');
      setTimeout(() => setToast(''), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Head>
        <title>Company Profile – PMO Network</title>
      </Head>
      
      <div className="profile-editor-layout premium">
        <div className="profile-banner">
          <div className="banner-left">
            <Link href="/dashboard/employer" className="banner-breadcrumb">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </Link>
            <div className="banner-identity">
              <div className="banner-avatar employer-logo" style={{ backgroundImage: `url(/logo.svg)` }} />
              <div className="banner-name-role">
                <h1 className="banner-name">{profileData?.companyName || 'Company Profile'}</h1>
                <p className="banner-role">Employer Account</p>
              </div>
            </div>
          </div>
          <div className="banner-right">
            <AutosaveStatus saving={saving} savedAt={savedAt} />
          </div>
        </div>

        <div className="profile-content">
          <div className="profile-main">
            <section className="profile-section">
              <div className="section-header">
                <h2 className="section-title">Company Information</h2>
                <p className="section-desc">Basic details about your organization</p>
              </div>
              <div className="section-body">
                <div className="form-row">
                  <label className="form-label">
                    Company Name
                    <input
                      type="text"
                      className="form-input"
                      defaultValue={profileData?.companyName || ''}
                      placeholder="Your Company Ltd"
                      onBlur={(e) => {
                        const val = e.target.value.trim();
                        if (val !== profileData?.companyName) saveProfile({ companyName: val });
                      }}
                    />
                  </label>
                </div>
                <div className="form-row">
                  <label className="form-label">
                    Contact Name
                    <input
                      type="text"
                      className="form-input"
                      defaultValue={profileData?.contactName || ''}
                      placeholder="Hiring Manager Name"
                      onBlur={(e) => {
                        const val = e.target.value.trim();
                        if (val !== profileData?.contactName) saveProfile({ contactName: val });
                      }}
                    />
                  </label>
                </div>
                <div className="form-row">
                  <label className="form-label">
                    Company Website
                    <input
                      type="url"
                      className="form-input"
                      defaultValue={profileData?.website || ''}
                      placeholder="https://yourcompany.com"
                      onBlur={(e) => {
                        const val = e.target.value.trim();
                        if (val !== profileData?.website) saveProfile({ website: val });
                      }}
                    />
                  </label>
                </div>
                <div className="form-row">
                  <label className="form-label">
                    Contact Phone
                    <input
                      type="tel"
                      className="form-input"
                      defaultValue={profileData?.phone || ''}
                      placeholder="+44 20 1234 5678"
                      onBlur={(e) => {
                        const val = e.target.value.trim();
                        if (val !== profileData?.phone) saveProfile({ phone: val });
                      }}
                    />
                  </label>
                </div>
              </div>
            </section>
          </div>
        </div>

        {toast && (
          <div className="toast-notification">
            {toast}
          </div>
        )}
      </div>

      <style jsx>{`
        .profile-editor-layout { min-height:100vh; background:#f8f9fc; }
        .profile-editor-layout.premium { background:linear-gradient(135deg, #f0f4ff 0%, #f8f9fc 100%); }

        .profile-banner { background:#fff; border-bottom:1px solid #e5e7eb; box-shadow:0 1px 3px rgba(0,0,0,0.05); padding:1.5rem 2rem; display:flex; align-items:center; justify-content:space-between; }
        .banner-left { display:flex; flex-direction:column; gap:1rem; }
        .banner-breadcrumb { display:inline-flex; align-items:center; gap:0.5rem; color:#6b7280; font-size:0.9rem; text-decoration:none; transition:color 0.15s; }
        .banner-breadcrumb:hover { color:#4f46e5; }
        .banner-identity { display:flex; align-items:center; gap:1rem; }
        .banner-avatar { width:64px; height:64px; border-radius:12px; background:#eef2ff; background-size:cover; background-position:center; }
        .banner-avatar.employer-logo { background-size:contain; background-repeat:no-repeat; }
        .banner-name-role { display:flex; flex-direction:column; gap:0.25rem; }
        .banner-name { font-size:1.5rem; font-weight:700; color:#111827; margin:0; }
        .banner-role { font-size:0.95rem; color:#6b7280; margin:0; }
        .banner-right { display:flex; align-items:center; gap:1rem; }

        .profile-content { max-width:1200px; margin:0 auto; padding:2rem; }
        .profile-main { display:flex; flex-direction:column; gap:1.5rem; }

        .profile-section { background:#fff; border-radius:16px; box-shadow:0 1px 3px rgba(0,0,0,0.06); padding:1.5rem; }
        .section-header { margin-bottom:1.25rem; border-bottom:1px solid #f3f4f6; padding-bottom:1rem; }
        .section-title { font-size:1.25rem; font-weight:700; color:#111827; margin:0 0 0.25rem; }
        .section-desc { font-size:0.9rem; color:#6b7280; margin:0; }
        .section-body { display:flex; flex-direction:column; gap:1rem; }

        .form-row { display:flex; flex-direction:column; gap:0.5rem; }
        .form-label { font-size:0.9rem; font-weight:500; color:#374151; display:flex; flex-direction:column; gap:0.5rem; }
        .form-input { border:1px solid #e5e7eb; border-radius:10px; padding:0.65rem 0.85rem; font-size:0.95rem; transition:all 0.15s; }
        .form-input:focus { outline:none; border-color:#4f46e5; box-shadow:0 0 0 3px rgba(79,70,229,0.1); }

        .toast-notification { position:fixed; bottom:2rem; right:2rem; background:#10b981; color:#fff; padding:0.75rem 1.25rem; border-radius:10px; box-shadow:0 4px 12px rgba(0,0,0,0.15); font-size:0.9rem; font-weight:500; animation:slideIn 0.2s ease-out; z-index:9999; }
        @keyframes slideIn { from { opacity:0; transform:translateY(1rem); } to { opacity:1; transform:translateY(0); } }

        @media (max-width:768px) {
          .profile-banner { flex-direction:column; align-items:flex-start; gap:1rem; }
          .banner-identity { flex-direction:column; align-items:flex-start; }
          .profile-content { padding:1rem; }
        }
      `}</style>
    </>
  );
}
