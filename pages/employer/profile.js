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
    return { redirect: { destination: '/dashboard', permanent: false } };
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
  const [uploading, setUploading] = useState(false);

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

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setToast('Please select an image file');
      setTimeout(() => setToast(''), 2000);
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setToast('Logo must be smaller than 5MB');
      setTimeout(() => setToast(''), 2000);
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('logo', file);

      const res = await fetch('/api/employer/upload-logo', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setProfileData(prev => ({ ...prev, logoUrl: data.logoUrl }));
        setToast('Logo uploaded successfully');
        setTimeout(() => setToast(''), 2000);
      } else {
        setToast(data.error || 'Upload failed');
        setTimeout(() => setToast(''), 2000);
      }
    } catch (err) {
      console.error(err);
      setToast('Upload failed');
      setTimeout(() => setToast(''), 2000);
    } finally {
      setUploading(false);
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
              <div 
                className="banner-avatar employer-logo" 
                style={{ 
                  backgroundImage: profileData?.logoUrl 
                    ? `url(${profileData.logoUrl})` 
                    : 'url(/logo.svg)' 
                }} 
              />
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
                <h2 className="section-title">Company Logo</h2>
                <p className="section-desc">Upload your company logo to personalize your profile</p>
              </div>
              <div className="section-body">
                <div className="logo-upload-container">
                  <div className="logo-preview">
                    <div 
                      className="logo-preview-image"
                      style={{
                        backgroundImage: profileData?.logoUrl 
                          ? `url(${profileData.logoUrl})` 
                          : 'url(/logo.svg)'
                      }}
                    />
                  </div>
                  <div className="logo-upload-actions">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="file-input-hidden"
                      id="logo-upload-input"
                      disabled={uploading}
                    />
                    <label 
                      htmlFor="logo-upload-input" 
                      className={`btn-upload ${uploading ? 'btn-disabled' : ''}`}
                    >
                      {uploading ? 'Uploading...' : profileData?.logoUrl ? 'Change Logo' : 'Upload Logo'}
                    </label>
                    <p className="upload-hint">
                      Recommended: Square image, at least 200x200px. Max 5MB. PNG or JPG format.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="profile-section">\n              <div className="section-header">
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

        .logo-upload-container { display:flex; gap:2rem; align-items:center; }
        .logo-preview { flex-shrink:0; }
        .logo-preview-image { width:120px; height:120px; border-radius:12px; background:#f3f4f6; background-size:contain; background-position:center; background-repeat:no-repeat; border:2px solid #e5e7eb; }
        .logo-upload-actions { display:flex; flex-direction:column; gap:0.75rem; flex:1; }
        .file-input-hidden { display:none; }
        .btn-upload { display:inline-block; background:#7c3aed; color:#fff; padding:0.65rem 1.5rem; border-radius:10px; font-size:0.95rem; font-weight:500; cursor:pointer; transition:all 0.15s; text-align:center; }
        .btn-upload:hover { background:#6d28d9; transform:translateY(-1px); box-shadow:0 4px 12px rgba(124,58,237,0.3); }
        .btn-upload.btn-disabled { opacity:0.6; cursor:not-allowed; }
        .btn-upload.btn-disabled:hover { transform:none; box-shadow:none; }
        .upload-hint { font-size:0.85rem; color:#6b7280; margin:0; }

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
