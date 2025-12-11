import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]';
import { prisma } from '../../lib/prisma';

export async function getServerSideProps(ctx) {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session) return { redirect: { destination: '/auth/login', permanent: false } };
  
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { 
      candidateCandidateProfile: {
        include: { 
          skills: true, 
          certifications: true, 
          experiences: { orderBy: { startDate: 'desc' } }, 
          education: { orderBy: { startDate: 'desc' } },
          documents: true
        }
      }
    }
  });
  
  let profile = user?.candidateCandidateProfile || null;
  
  // If no profile exists, create a basic one
  if (!profile && user) {
    profile = await prisma.candidateProfile.create({
      data: {
        userId: user.id,
        fullName: user.name || '',
        email: user.email
      },
      include: {
        skills: true,
        certifications: true,
        experiences: { orderBy: { startDate: 'desc' } },
        education: { orderBy: { startDate: 'desc' } },
        documents: true
      }
    });
  }
  
  const isOwnProfile = true; // This is candidate's own preview
  const isHiringManager = false; // Extend later for employer view
  
  return { 
    props: { 
      profile: profile ? JSON.parse(JSON.stringify(profile)) : null,
      isOwnProfile,
      isHiringManager,
      userEmail: session.user.email
    } 
  };
}

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

function getProfileStrength(completion) {
  if (completion >= 80) return { label: 'Ready', color: '#16a34a' };
  if (completion >= 50) return { label: 'Strong', color: '#0ea5e9' };
  return { label: 'Needs work', color: '#f59e0b' };
}

export default function Preview({ profile, isOwnProfile, isHiringManager, userEmail }) {
  if (!profile) {
    return (
      <div className="container" style={{ padding: '40px', textAlign: 'center' }}>
        <h2>No Profile Found</h2>
        <p>Please create your profile first.</p>
        <Link href="/dashboard/profile" className="btn primary" style={{ marginTop: '20px', display: 'inline-block' }}>Create Profile</Link>
      </div>
    );
  }
  
  const anon = profile.anonymousMode;
  const completion = calculateCompletion(profile);
  const strength = getProfileStrength(completion);
  return (
    <>
      <Head>
        <title>{anon ? 'Candidate Profile' : profile.fullName} – PMO Network</title>
        <meta name="description" content="Professional profile preview" />
      </Head>
      
      <div className="profile-preview-page">
        {/* 1️⃣ Identity Banner */}
        <header className="preview-identity-banner">
          <div className="preview-banner-content">
            <div className="preview-left">
              <div 
                className={`preview-avatar ${!profile.showProfilePhoto || anon ? 'anonymous' : ''}`}
                style={{ backgroundImage: (profile.showProfilePhoto && !anon && profile.profilePhotoUrl) ? `url(${profile.profilePhotoUrl})` : 'url(/images/avatar-placeholder.svg)' }}
              />
              <div className="preview-identity">
                <h1 className="preview-name">{anon ? 'Anonymous Candidate' : profile.fullName || 'Candidate'}</h1>
                <p className="preview-title">{profile.jobTitle || 'PMO Professional'}</p>
                <div className="preview-meta">
                  {profile.location && <span className="meta-item">📍 {profile.location}</span>}
                  {profile.updatedAt && <span className="meta-item muted">Updated {new Date(profile.updatedAt).toLocaleDateString()}</span>}
                </div>
              </div>
            </div>
            <div className="preview-actions">
              {isOwnProfile && (
                <>
                  <Link href="/dashboard/profile" className="btn primary">Edit Profile</Link>
                  {profile.cvUrl && <a href={profile.cvUrl} download className="btn secondary">Download CV</a>}
                </>
              )}
              {isHiringManager && (
                <>
                  <button className="btn primary">Request Interview</button>
                  <button className="btn secondary">Shortlist</button>
                  {profile.cvUrl && <a href={profile.cvUrl} download className="btn secondary">Download CV</a>}
                </>
              )}
            </div>
          </div>
        </header>

        {/* 2️⃣ Profile Strength Snapshot */}
        {isOwnProfile && (
          <div className="preview-strength-bar">
            <div className="strength-content">
              <div className="strength-label">
                <span>Profile Strength: <strong style={{ color: strength.color }}>{strength.label}</strong> ({completion}%)</span>
              </div>
              <div className="strength-track">
                <div className="strength-fill" style={{ width: `${completion}%`, background: strength.color }} />
              </div>
            </div>
          </div>
        )}

        <div className="preview-main-content">
          {/* 3️⃣ Summary / Bio */}
          {profile.summary && (
            <section className="preview-card summary-card">
              <h2 className="card-title">Candidate Overview</h2>
              <div className="summary-content">
                {profile.videoIntroUrl && (
                  <div className="video-thumb">
                    <video src={profile.videoIntroUrl} controls style={{ maxWidth: '300px', borderRadius: '12px' }} />
                  </div>
                )}
                <div className="summary-text">
                  <p>{profile.summary}</p>
                </div>
              </div>
            </section>
          )}

          {/* 4️⃣ Skills & Expertise */}
          {profile.skills && profile.skills.length > 0 && (
            <section className="preview-card skills-card">
              <h2 className="card-title">Skills & Expertise</h2>
              <div className="skills-list">
                {profile.skills.map(skill => (
                  <div key={skill.id} className="skill-item">
                    <div className="skill-header">
                      <span className="skill-name">{skill.name}</span>
                      <span className="skill-level">{skill.level || 'Intermediate'}</span>
                    </div>
                    <div className="skill-meter">
                      <div 
                        className="skill-fill" 
                        style={{ width: skill.level === 'Expert' ? '90%' : skill.level === 'Advanced' ? '70%' : '50%' }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 5️⃣ Employment History */}
          {profile.experiences && profile.experiences.length > 0 && (
            <section className="preview-card experience-card">
              <h2 className="card-title">Employment History</h2>
              <div className="timeline">
                {profile.experiences.map(exp => (
                  <div key={exp.id} className="timeline-item">
                    <div className="timeline-marker" />
                    <div className="timeline-content">
                      <h3 className="exp-title">{exp.jobTitle}</h3>
                      <p className="exp-company">{exp.company} {exp.location && `• ${exp.location}`}</p>
                      <p className="exp-dates">
                        {new Date(exp.startDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })} – {exp.endDate ? new Date(exp.endDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : 'Present'}
                      </p>
                      {exp.description && <p className="exp-description">{exp.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 6️⃣ Education & Certifications */}
          <div className="preview-grid-two">
            {profile.education && profile.education.length > 0 && (
              <section className="preview-card education-card">
                <h2 className="card-title">Education</h2>
                <div className="edu-list">
                  {profile.education.map(edu => (
                    <div key={edu.id} className="edu-item">
                      <h4>{edu.degree}</h4>
                      <p className="edu-school">{edu.school}</p>
                      <p className="edu-dates muted">
                        {new Date(edu.startDate).getFullYear()} – {edu.endDate ? new Date(edu.endDate).getFullYear() : 'Present'}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {profile.certifications && profile.certifications.length > 0 && (
              <section className="preview-card cert-card">
                <h2 className="card-title">Certifications</h2>
                <div className="cert-list">
                  {profile.certifications.map(cert => (
                    <div key={cert.id} className="cert-item">
                      <div className="cert-badge">🏆</div>
                      <div className="cert-info">
                        <h4>{cert.title}</h4>
                        <p className="cert-issuer">{cert.issuingOrganization}</p>
                        {cert.issueDate && <p className="cert-date muted">{new Date(cert.issueDate).toLocaleDateString()}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* 8️⃣ Salary / Day Rate (Hiring Managers only) */}
          {isHiringManager && (profile.dayRate || profile.salaryExpectation) && (
            <section className="preview-card compensation-card">
              <h2 className="card-title">Compensation & Preferences</h2>
              <div className="comp-grid">
                {profile.dayRate && <div className="comp-item"><strong>Day Rate:</strong> £{profile.dayRate}</div>}
                {profile.salaryExpectation && <div className="comp-item"><strong>Salary Expectation:</strong> £{profile.salaryExpectation}</div>}
                {profile.availability && <div className="comp-item"><strong>Availability:</strong> {profile.availability}</div>}
              </div>
            </section>
          )}

          {/* 9️⃣ Document Repository */}
          {profile.documents && profile.documents.length > 0 && (
            <section className="preview-card documents-card">
              <h2 className="card-title">Documents</h2>
              <div className="doc-list">
                {profile.documents.map(doc => (
                  <div key={doc.id} className="doc-item">
                    <span className="doc-icon">📄</span>
                    <span className="doc-name">{doc.fileName}</span>
                    <a href={doc.url} download className="doc-download">Download</a>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* 🔟 Footer */}
        <footer className="preview-footer">
          <p className="muted">PMO Network © {new Date().getFullYear()}</p>
        </footer>
      </div>
    </>
  );
}
