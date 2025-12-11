import Head from 'next/head';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]';
import { prisma } from '../../lib/prisma';
import Link from 'next/link';
import { useState } from 'react';

export async function getServerSideProps(ctx) {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session) {
    return { redirect: { destination: '/auth/login', permanent: false } };
  }
  if ((session.user.role || '').toLowerCase() !== 'employer') {
    return { redirect: { destination: '/dashboard/candidate', permanent: false } };
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { employerEmployerProfile: true }
  });
  const profile = user?.employerEmployerProfile || null;
  let jobCount = 0;
  let latestJobs = [];
  if (profile) {
    const jobs = await prisma.job.findMany({
      where: { employerId: profile.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { _count: { select: { applications: true } } }
    });
    latestJobs = jobs.map(j => ({ 
      id: j.id, 
      title: j.title, 
      employmentType: j.employmentType, 
      isRemote: j.isRemote, 
      createdAt: j.createdAt.toISOString(), 
      applicationsCount: j._count.applications, 
      paused: j.paused 
    }));
    jobCount = await prisma.job.count({ where: { employerId: profile.id } });
  }
  // Serialize profile dates
  const serializedProfile = profile ? {
    ...profile,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString()
  } : null;
  return { props: { profile: serializedProfile, jobCount, latestJobs } };
}

export default function EmployerDashboard({ profile, jobCount, latestJobs }) {
  const [jobs, setJobs] = useState(latestJobs || []);
  const [editingJob, setEditingJob] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState(null);
  const [editSuccess, setEditSuccess] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  function handleEdit(job) {
    setEditingJob(job);
    setEditForm({
      title: job.title || '',
      shortDescription: job.shortDescription || '',
      location: job.location || '',
      employmentType: job.employmentType || '',
      salaryMin: job.salaryMin ?? null,
      salaryMax: job.salaryMax ?? null,
      currency: job.currency || 'GBP',
      isRemote: job.isRemote || false,
      specialism: job.specialism || '',
      seniority: job.seniority || '',
      isFeatured: job.isFeatured || false,
      isUrgent: job.isUrgent || false
    });
    setEditError(null);
    setEditSuccess(false);
  }

  async function submitEdit(e) {
    e.preventDefault();
    if (!editingJob) return;
    setEditSaving(true); setEditError(null); setEditSuccess(false);
    try {
      const res = await fetch('/api/jobs/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingJob.id, ...editForm })
      });
      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error || 'Save failed');
      } else {
        setJobs(jobs.map(j => j.id === editingJob.id ? { ...j, ...editForm } : j));
        setEditSuccess(true);
      }
    } catch (err) {
      setEditError('Network error');
    } finally {
      setEditSaving(false);
    }
  }

  async function togglePause(job) {
    try {
      const res = await fetch('/api/jobs/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: job.id, paused: !job.paused })
      });
      const data = await res.json();
      if (res.ok) {
        setJobs(jobs.map(j => j.id === job.id ? { ...j, paused: data.paused } : j));
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function deleteJob(job) {
    if (!confirm('Delete this job? This cannot be undone.')) return;
    try {
      const res = await fetch('/api/jobs/delete?id=' + job.id, { method: 'DELETE' });
      if (res.ok) setJobs(jobs.filter(j => j.id !== job.id));
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <>
      <Head>
        <title>Employer Dashboard – PMO Network</title>
        <meta name="description" content="Manage your hiring activity and company profile on PMO Network." />
      </Head>
      
      <div className="modern-dashboard">
        {/* Sidebar Navigation */}
        <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <nav className="sidebar-nav">
            <button className={`sidebar-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Overview</span>
            </button>
            <Link href="/employer/jobs" className={`sidebar-item ${activeTab === 'jobs' ? 'active' : ''}`}>
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>Manage Jobs</span>
              {jobCount > 0 && <span className="sidebar-badge">{jobCount}</span>}
            </Link>
            <Link href="/employer/post-job" className="sidebar-item">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Post New Job</span>
            </Link>
            <Link href="/employer/applicants" className="sidebar-item">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Applicants</span>
            </Link>
            <Link href="/employer/messages" className="sidebar-item">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <span>Messages</span>
            </Link>
            <div className="sidebar-divider"></div>
            <Link href="/employer/profile" className="sidebar-item">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span>Company Profile</span>
            </Link>
            <Link href="/employer/settings" className="sidebar-item">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Settings</span>
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="dashboard-main">
          {activeTab === 'overview' && (
            <div className="dashboard-content">
              <div className="content-header">
                <div>
                  <h1 className="content-title">Employer Dashboard</h1>
                  <p className="content-subtitle">{profile?.companyName || 'Your Company'}</p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon blue">
                    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="stat-details">
                    <span className="stat-label">Active Jobs</span>
                    <span className="stat-value">{jobCount}</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon green">
                    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="stat-details">
                    <span className="stat-label">Total Applications</span>
                    <span className="stat-value">{jobs.reduce((sum, j) => sum + (j.applicationsCount || 0), 0)}</span>
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
                    <span className="stat-value">5</span>
                  </div>
                </div>
              </div>

              {/* Company Profile Card */}
              <section className="content-card">
                <div className="card-header">
                  <h2 className="card-title">Company Profile</h2>
                  <Link href="/employer/profile" className="card-action">Edit Profile →</Link>
                </div>
                <div className="profile-grid">
                  <div className="profile-item">
                    <span className="profile-label">Company Name</span>
                    <span className="profile-value">{profile?.companyName || '—'}</span>
                  </div>
                  <div className="profile-item">
                    <span className="profile-label">Contact</span>
                    <span className="profile-value">{profile?.contactName || '—'}</span>
                  </div>
                  <div className="profile-item">
                    <span className="profile-label">Website</span>
                    <span className="profile-value">{profile?.website || '—'}</span>
                  </div>
                  <div className="profile-item">
                    <span className="profile-label">Phone</span>
                    <span className="profile-value">{profile?.phone || '—'}</span>
                  </div>
                </div>
              </section>

              {/* Recent Jobs */}
              <section className="content-card">
                <div className="card-header">
                  <h2 className="card-title">Recent Jobs</h2>
                  <Link href="/employer/post-job" className="card-action">Post New Job →</Link>
                </div>
                {jobs.length === 0 && <p className="empty-state">No jobs posted yet. Start by posting your first role!</p>}
                {jobs.length > 0 && (
                  <div className="jobs-list">
                    {jobs.map(j => (
                      <div key={j.id} className="job-item">
                        <div className="job-header">
                          <div>
                            <h3 className="job-title">{j.title}</h3>
                            <p className="job-meta">
                              {j.employmentType || 'n/a'}{j.isRemote ? ' • Remote' : ''}{j.paused ? ' • Paused' : ''}
                            </p>
                          </div>
                          <span className="job-applicants">{j.applicationsCount} applicant{j.applicationsCount !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="job-actions">
                          <button onClick={()=>handleEdit(j)} className="job-btn secondary">Edit</button>
                          <button onClick={()=>togglePause(j)} className="job-btn secondary">{j.paused ? 'Unpause' : 'Pause'}</button>
                          <button onClick={()=>deleteJob(j)} className="job-btn danger">Delete</button>
                          <Link href={`/jobs/${j.id}`} className="job-btn primary">View</Link>
                        </div>
                        {editingJob && editingJob.id === j.id && (
                          <form onSubmit={submitEdit} className="job-edit-form">
                            <input name="title" value={editForm.title} onChange={e=>setEditForm(f=>({...f,title:e.target.value}))} placeholder="Title" />
                            <textarea name="shortDescription" value={editForm.shortDescription} onChange={e=>setEditForm(f=>({...f,shortDescription:e.target.value}))} rows={3} placeholder="Short description" />
                            <div className="form-row-2">
                              <input name="location" value={editForm.location} onChange={e=>setEditForm(f=>({...f,location:e.target.value}))} placeholder="Location" />
                              <select name="employmentType" value={editForm.employmentType} onChange={e=>setEditForm(f=>({...f,employmentType:e.target.value}))}>
                                <option value="">Type</option>
                                <option value="contract">Contract</option>
                                <option value="full-time">Full-Time</option>
                                <option value="part-time">Part-Time</option>
                                <option value="temporary">Temporary</option>
                                <option value="internship">Internship</option>
                                <option value="fractional">Fractional</option>
                              </select>
                            </div>
                            <div className="form-row-3">
                              <input type="number" name="salaryMin" value={editForm.salaryMin||''} onChange={e=>setEditForm(f=>({...f,salaryMin:e.target.value?Number(e.target.value):null}))} placeholder="Salary Min" />
                              <input type="number" name="salaryMax" value={editForm.salaryMax||''} onChange={e=>setEditForm(f=>({...f,salaryMax:e.target.value?Number(e.target.value):null}))} placeholder="Salary Max" />
                              <input name="currency" value={editForm.currency||''} onChange={e=>setEditForm(f=>({...f,currency:e.target.value}))} placeholder="Currency" />
                            </div>
                            {editError && <p className="error-msg">{editError}</p>}
                            {editSuccess && <p className="success-msg">Saved.</p>}
                            <div className="form-actions">
                              <button type="submit" disabled={editSaving} className="job-btn primary">{editSaving ? 'Saving…' : 'Save'}</button>
                              <button type="button" onClick={()=>{setEditingJob(null);}} className="job-btn secondary">Cancel</button>
                            </div>
                          </form>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </main>
      </div>

      <style jsx>{`
        .modern-dashboard{display:flex;min-height:100vh;background:#f8f9fc}
        .dashboard-sidebar{width:260px;background:#fff;border-right:1px solid #e5e7eb;display:flex;flex-direction:column;position:sticky;top:0;height:100vh;overflow-y:auto;transition:all 0.3s}
        .dashboard-sidebar.closed{width:0;overflow:hidden}
        .sidebar-nav{padding:1.5rem 0;display:flex;flex-direction:column;gap:0.25rem}
        .sidebar-item{display:flex;align-items:center;gap:0.75rem;padding:0.75rem 1.5rem;color:#6b7280;text-decoration:none;transition:all 0.15s;border:none;background:transparent;width:100%;text-align:left;cursor:pointer;position:relative}
        .sidebar-item:hover{background:#f3f4f6;color:#374151}
        .sidebar-item.active{background:#eef2ff;color:#4f46e5;font-weight:600}
        .sidebar-item svg{flex-shrink:0}
        .sidebar-badge{margin-left:auto;background:#ef4444;color:#fff;font-size:0.7rem;font-weight:600;padding:0.125rem 0.5rem;border-radius:9999px;min-width:20px;text-align:center}
        .sidebar-divider{height:1px;background:#e5e7eb;margin:0.5rem 1.5rem}
        
        .dashboard-main{flex:1;overflow-y:auto;padding:2.5rem 3rem;max-width:1400px;margin:0 auto;width:100%}
        .dashboard-content{width:100%;max-width:100%}
        .content-header{margin-bottom:2rem;padding-bottom:1rem;border-bottom:1px solid #e5e7eb}
        .content-title{font-size:2rem;font-weight:700;color:#111827;margin:0 0 0.5rem}
        .content-subtitle{font-size:1.125rem;color:#6b7280;margin:0}
        
        .stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1.5rem;margin-bottom:2rem}
        .stat-card{background:#fff;border-radius:12px;padding:1.5rem;box-shadow:0 1px 3px rgba(0,0,0,0.06);display:flex;align-items:center;gap:1rem}
        .stat-icon{width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center}
        .stat-icon.blue{background:#dbeafe;color:#1e40af}
        .stat-icon.green{background:#d1fae5;color:#065f46}
        .stat-icon.purple{background:#e9d5ff;color:#6b21a8}
        .stat-details{display:flex;flex-direction:column;gap:0.25rem}
        .stat-label{font-size:0.875rem;color:#6b7280}
        .stat-value{font-size:1.875rem;font-weight:700;color:#111827}
        
        .content-card{background:#fff;border-radius:16px;padding:1.5rem;box-shadow:0 1px 3px rgba(0,0,0,0.06);margin-bottom:1.5rem}
        .card-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:1.25rem;padding-bottom:1rem;border-bottom:1px solid #f3f4f6}
        .card-title{font-size:1.25rem;font-weight:600;color:#111827;margin:0}
        .card-action{color:#4f46e5;font-size:0.9rem;font-weight:500;text-decoration:none}
        .card-action:hover{text-decoration:underline}
        
        .profile-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1.5rem}
        .profile-item{display:flex;flex-direction:column;gap:0.25rem}
        .profile-label{font-size:0.875rem;color:#6b7280}
        .profile-value{font-size:1rem;color:#111827;font-weight:500}
        
        .empty-state{color:#6b7280;text-align:center;padding:2rem}
        .jobs-list{display:flex;flex-direction:column;gap:1rem}
        .job-item{border:1px solid #e5e7eb;border-radius:12px;padding:1rem}
        .job-header{display:flex;justify-content:space-between;align-items:start;margin-bottom:0.75rem}
        .job-title{font-size:1rem;font-weight:600;color:#111827;margin:0 0 0.25rem}
        .job-meta{font-size:0.875rem;color:#6b7280;margin:0}
        .job-applicants{background:#eef2ff;color:#4f46e5;font-size:0.875rem;font-weight:500;padding:0.25rem 0.75rem;border-radius:9999px}
        .job-actions{display:flex;gap:0.5rem;flex-wrap:wrap}
        .job-btn{padding:0.5rem 0.875rem;border-radius:8px;font-size:0.875rem;font-weight:500;border:none;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;transition:all 0.15s}
        .job-btn.primary{background:#4f46e5;color:#fff}
        .job-btn.primary:hover{background:#4338ca}
        .job-btn.secondary{background:#f3f4f6;color:#374151}
        .job-btn.secondary:hover{background:#e5e7eb}
        .job-btn.danger{background:#fee2e2;color:#b91c1c}
        .job-btn.danger:hover{background:#fecaca}
        
        .job-edit-form{margin-top:1rem;padding:1rem;background:#f9fafb;border-radius:8px;display:flex;flex-direction:column;gap:0.75rem}
        .job-edit-form input,.job-edit-form textarea,.job-edit-form select{border:1px solid #e5e7eb;border-radius:8px;padding:0.5rem 0.75rem;font-size:0.875rem}
        .form-row-2{display:grid;grid-template-columns:1fr 1fr;gap:0.75rem}
        .form-row-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.75rem}
        .form-actions{display:flex;gap:0.5rem}
        .error-msg{color:#b91c1c;font-size:0.875rem;margin:0}
        .success-msg{color:#065f46;font-size:0.875rem;margin:0}
        
        @media (max-width:768px){
          .dashboard-sidebar{position:fixed;z-index:1000;box-shadow:2px 0 8px rgba(0,0,0,0.1)}
          .dashboard-main{padding:1rem}
          .stats-grid{grid-template-columns:1fr}
        }
      `}</style>
    </>
  );
}
