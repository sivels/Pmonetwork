import Head from 'next/head';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]';
import { prisma } from '../../lib/prisma';
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
    score += Math.min(10, skillsCount * 2); // 5 skills -> 10
    const certCount = p.certifications?.length || 0;
    score += Math.min(10, certCount * 3.33); // ~3 certs -> 10
    if (p.cvUrl) score += 10;
    if (p.videoUrl) score += 10;
    return Math.round(Math.min(100, score));
  }
  const profileScore = computeScore(profile);
  
  // Serialize profile data to ensure it's JSON-safe
  const serializedProfile = profile ? JSON.parse(JSON.stringify(profile)) : null;
  
  return { props: { profile: serializedProfile, profileScore } };
}

export default function CandidateDashboard({ profile, profileScore }) {
  return (
    <>
      <Head>
        <title>Candidate Dashboard – PMO Network</title>
        <meta name="description" content="View your PMO profile score, documents and recent activity." />
      </Head>
      <main className="dashboard-page">
        <div className="dashboard-header">
          <h1>Candidate Dashboard</h1>
          <p className="dashboard-subtitle">Welcome {profile?.fullName || 'PMO Professional'} – manage and enrich your profile.</p>
          {profile && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Profile Completeness</span>
                <span className="text-sm font-semibold text-gray-800">{profileScore}%</span>
              </div>
              <div className="h-3 w-full bg-gray-200 rounded">
                <div
                  className="h-3 rounded bg-indigo-600 transition-all"
                  style={{ width: `${profileScore}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">Improve your score by adding experience details, skills, certifications and documents.</p>
            </div>
          )}
        </div>
        <div className="dashboard-grid">
          <section className="dashboard-card">
            <h2 className="card-title">Profile Overview</h2>
            <ul className="card-list">
              <li><strong>Name:</strong> {profile?.fullName || '—'}</li>
              <li><strong>Role:</strong> {profile?.jobTitle || '—'}</li>
              <li><strong>Experience (yrs):</strong> {profile?.yearsExperience ?? '—'}</li>
              <li><strong>Availability:</strong> {profile?.availability || '—'}</li>
            </ul>
            <Link href="/dashboard/profile-edit" className="card-link">Edit Profile →</Link>
          </section>
          <section className="dashboard-card">
            <h2 className="card-title">Skills</h2>
            {profile?.skills?.length ? (
              <div className="tag-list">
                {profile.skills.map(s => <span key={s.id} className="tag-item">{s.name}</span>)}
              </div>
            ) : <p className="muted">No skills added yet.</p>}
          </section>
          <section className="dashboard-card">
            <h2 className="card-title">Certifications</h2>
            {profile?.certifications?.length ? (
              <div className="tag-list">
                {profile.certifications.map(c => <span key={c.id} className="tag-item cert">{c.name}</span>)}
              </div>
            ) : <p className="muted">No certifications listed.</p>}
          </section>
          <section className="dashboard-card">
            <h2 className="card-title">Documents</h2>
            {profile?.documents?.length ? (
              <ul className="doc-list">
                {profile.documents.map(d => <li key={d.id}>{d.filename}</li>)}
              </ul>
            ) : <p className="muted">No documents uploaded.</p>}
          </section>
          <section className="dashboard-card md:col-span-2">
            <h2 className="card-title">Applications</h2>
            {profile?.applications?.length ? (
              <ul className="card-list">
                {profile.applications.slice(0,8).map(app => (
                  <li key={app.id} className="flex justify-between gap-2">
                    <a href={`/jobs/${app.job.id}`} className="hover:text-indigo-600 font-medium">{app.job.title}</a>
                    <span className="text-xs text-gray-500">{app.job.employer?.companyName || 'Company'}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700">{app.status}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="muted">No applications yet.</p>}
            {profile?.applications?.length > 8 && <a href="#" className="card-link mt-2 inline-block">View All</a>}
          </section>
        </div>
      </main>
    </>
  );
}
