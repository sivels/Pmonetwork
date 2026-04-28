import Head from 'next/head';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]';
import { prisma } from '../../lib/prisma';
import Link from 'next/link';
import { useState } from 'react';
import ApplyModal from '../../components/jobs/ApplyModal';

export async function getServerSideProps(ctx) {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session) {
    return { redirect: { destination: '/auth/login', permanent: false } };
  }
  if ((session.user.role || '').toLowerCase() !== 'candidate') {
    return { redirect: { destination: '/dashboard', permanent: false } };
  }
  
  // Fetch candidate profile with skills
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      candidateCandidateProfile: {
        include: {
          skills: true,
          savedJobs: {
            include: {
              job: {
                include: {
                  employer: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      }
    }
  });
  const candidateProfile = user?.candidateCandidateProfile || null;
  
  // Extract saved jobs from the candidate profile
  const savedJobs = candidateProfile?.savedJobs || [];

  return { 
    props: { 
      savedJobs: JSON.parse(JSON.stringify(savedJobs)),
      candidateProfile: candidateProfile ? JSON.parse(JSON.stringify(candidateProfile)) : null
    } 
  };
}

export default function SavedJobs({ savedJobs, candidateProfile }) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterContract, setFilterContract] = useState('');
  const [filterJobType, setFilterJobType] = useState('');
  const [unsavedJobs, setUnsavedJobs] = useState(new Set());
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  const handleUnsave = async (jobId) => {
    setUnsavedJobs(prev => new Set(prev).add(jobId));
    
    try {
      await fetch(`/api/jobs/${jobId}/save`, { method: 'DELETE' });
    } catch (error) {
      console.error('Error unsaving job:', error);
      // Revert the UI change on error
      setUnsavedJobs(prev => {
        const newSet = new Set(prev);
        newSet.delete(jobId);
        return newSet;
      });
    }
  };

  const handleApplyClick = (job) => {
    // job is already in the correct format from the database
    setSelectedJob(job);
    setApplyModalOpen(true);
  };

  const handleApplicationSubmit = async (applicationData) => {
    const res = await fetch('/api/applications/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(applicationData)
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.error || 'Failed to submit application');
    }
    
    return data;
  };

  const filteredJobs = savedJobs
    .filter(sj => !unsavedJobs.has(sj.jobId))
    .filter(sj => {
      if (search) {
        const s = search.toLowerCase();
        return sj.job.title.toLowerCase().includes(s) || 
               (sj.job.employer?.companyName || '').toLowerCase().includes(s) || 
               (sj.job.location || '').toLowerCase().includes(s);
      }
      return true;
    })
    .filter(sj => !filterLocation || (sj.job.location || '').includes(filterLocation))
    .filter(sj => !filterContract || sj.job.employmentType === filterContract)
    .filter(sj => {
      if (!filterJobType) return true;
      if (filterJobType === 'Remote') return sj.job.isRemote;
      if (filterJobType === 'Hybrid') return false; // Not in schema yet
      if (filterJobType === 'Onsite') return !sj.job.isRemote;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'recent') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'salaryHigh') return (b.job.salaryMax || 0) - (a.job.salaryMax || 0);
      if (sortBy === 'salaryLow') return (a.job.salaryMin || 0) - (b.job.salaryMin || 0);
      return 0;
    });

  return (
    <>
      <Head>
        <title>Saved Jobs – PMO Network</title>
      </Head>
      <div className="saved-jobs-page">
        <div className="page-header">
          <div className="header-content">
            <h1 className="page-title">Saved Jobs</h1>
            <p className="page-subtitle">Jobs you've saved to review or apply to later.</p>
          </div>
          <div className="header-search">
            <input
              type="text"
              placeholder="Search saved jobs…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="filter-bar">
          <div className="filter-group">
            <label>Sort by</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="recent">Most Recent</option>
              <option value="oldest">Oldest</option>
              <option value="salaryHigh">Salary High → Low</option>
              <option value="salaryLow">Salary Low → High</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Location</label>
            <select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)}>
              <option value="">All Locations</option>
              <option value="London">London</option>
              <option value="Manchester">Manchester</option>
              <option value="Birmingham">Birmingham</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Contract Type</label>
            <select value={filterContract} onChange={(e) => setFilterContract(e.target.value)}>
              <option value="">All Types</option>
              <option value="Permanent">Permanent</option>
              <option value="Contract">Contract</option>
              <option value="Freelance">Freelance</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Job Type</label>
            <select value={filterJobType} onChange={(e) => setFilterJobType(e.target.value)}>
              <option value="">All</option>
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Onsite">Onsite</option>
            </select>
          </div>
        </div>

        {filteredJobs.length > 0 ? (
          <div className="jobs-grid">
            {filteredJobs.map(savedJob => (
              <div key={savedJob.id} className="job-card">
                <div className="card-header">
                  {savedJob.job.employer?.logoUrl ? (
                    <img src={savedJob.job.employer.logoUrl} alt={savedJob.job.employer?.companyName || 'Company'} className="company-logo" />
                  ) : (
                    <div className="company-logo-placeholder">{(savedJob.job.employer?.companyName || 'C')[0]}</div>
                  )}
                  <button
                    className="unsave-btn"
                    onClick={() => handleUnsave(savedJob.jobId)}
                    title="Remove from saved jobs"
                  >
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                <div className="card-body">
                  <h3 className="job-title">{savedJob.job.title}</h3>
                  <p className="company-name">{savedJob.job.employer?.companyName || 'Company'}</p>
                  <p className="job-location">{savedJob.job.location || (savedJob.job.isRemote ? 'Remote' : 'Location TBC')}</p>
                  {savedJob.job.salaryMin && savedJob.job.salaryMax && (
                    <p className="job-salary">
                      {savedJob.job.employmentType === 'Contract' || savedJob.job.employmentType === 'Freelance' 
                        ? `£${savedJob.job.salaryMin} - £${savedJob.job.salaryMax} per day`
                        : `£${savedJob.job.salaryMin.toLocaleString()} - £${savedJob.job.salaryMax.toLocaleString()}`
                      }
                    </p>
                  )}
                  <div className="job-tags">
                    <span className="tag">{savedJob.job.employmentType}</span>
                    {savedJob.job.isRemote && <span className="tag remote">Remote</span>}
                    {!savedJob.job.isRemote && <span className="tag onsite">Onsite</span>}
                  </div>
                  <p className="saved-date">Saved on {new Date(savedJob.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <div className="card-footer">
                  <Link href={`/jobs/${savedJob.jobId}`} className="btn-view">View Job</Link>
                  <button 
                    onClick={() => handleApplyClick(savedJob.job)} 
                    className="btn-apply"
                  >
                    Apply Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <svg width="80" height="80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <h2 className="empty-title">No saved jobs yet</h2>
            <p className="empty-message">Browse the job board and tap 'Save for Later' to build your shortlist.</p>
            <Link href="/jobs" className="btn-browse">Browse Jobs</Link>
          </div>
        )}
      </div>

      {/* Application Modal */}
      <ApplyModal
        isOpen={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        job={selectedJob}
        candidateProfile={candidateProfile}
        onSubmit={handleApplicationSubmit}
      />

      <style jsx>{`
        .saved-jobs-page { min-height:100vh; background:#f8f9fc; padding:2rem; }
        .page-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem; flex-wrap:wrap; gap:1rem; }
        .header-content { flex:1; }
        .page-title { font-size:1.75rem; font-weight:700; color:#1f2937; margin:0 0 0.5rem; }
        .page-subtitle { font-size:0.95rem; color:#6b7280; margin:0; }
        .header-search { flex:0 0 auto; min-width:280px; }
        .search-input { width:100%; padding:0.75rem 1rem; border:1px solid #d1d5db; border-radius:12px; font-size:0.9rem; background:#ffffff; }
        .search-input:focus { outline:none; border-color:#6366f1; box-shadow:0 0 0 3px rgba(99,102,241,0.1); }

        .filter-bar { display:flex; gap:1rem; margin-bottom:2rem; flex-wrap:wrap; background:#ffffff; padding:1rem 1.25rem; border-radius:16px; box-shadow:0 1px 3px rgba(0,0,0,0.05); }
        .filter-group { display:flex; flex-direction:column; gap:0.4rem; min-width:150px; }
        .filter-group label { font-size:0.7rem; font-weight:600; color:#6b7280; text-transform:uppercase; letter-spacing:0.5px; }
        .filter-group select { padding:0.6rem 0.75rem; border:1px solid #d1d5db; border-radius:10px; font-size:0.85rem; background:#f9fafb; cursor:pointer; }
        .filter-group select:focus { outline:none; border-color:#6366f1; background:#ffffff; }

        .jobs-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:1.5rem; }
        .job-card { background:#ffffff; border:1px solid #e5e7eb; border-radius:16px; padding:1.25rem; transition:all 0.2s; cursor:pointer; display:flex; flex-direction:column; }
        .job-card:hover { box-shadow:0 8px 24px rgba(0,0,0,0.08); transform:translateY(-2px); }
        .card-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1rem; }
        .company-logo { width:56px; height:56px; border-radius:12px; object-fit:contain; border:1px solid #e5e7eb; background:#ffffff; padding:0.25rem; }
        .company-logo-placeholder { width:56px; height:56px; border-radius:12px; border:1px solid #e5e7eb; background:#f3f4f6; display:flex; align-items:center; justify-content:center; font-size:1.5rem; font-weight:700; color:#6b7280; }
        .unsave-btn { background:transparent; border:none; color:#ef4444; cursor:pointer; padding:0.4rem; transition:all 0.15s; }
        .unsave-btn:hover { color:#dc2626; transform:scale(1.1); }
        .card-body { flex:1; }
        .job-title { font-size:1.1rem; font-weight:600; color:#1f2937; margin:0 0 0.4rem; }
        .company-name { font-size:0.85rem; color:#6b7280; margin:0 0 0.3rem; font-weight:500; }
        .job-location { font-size:0.8rem; color:#9ca3af; margin:0 0 0.5rem; display:flex; align-items:center; gap:0.3rem; }
        .job-salary { font-size:0.9rem; color:#4f46e5; font-weight:600; margin:0 0 0.75rem; }
        .job-tags { display:flex; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.75rem; }
        .tag { font-size:0.65rem; padding:0.3rem 0.6rem; border-radius:8px; font-weight:500; background:#f3f4f6; color:#374151; }
        .tag.remote { background:#d1fae5; color:#065f46; }
        .tag.hybrid { background:#dbeafe; color:#1e40af; }
        .tag.onsite { background:#fef3c7; color:#92400e; }
        .saved-date { font-size:0.7rem; color:#9ca3af; margin:0; font-style:italic; }
        .card-footer { display:flex; gap:0.75rem; margin-top:1rem; padding-top:1rem; border-top:1px solid #f3f4f6; }
        .btn-view, .btn-apply { flex:1; padding:0.65rem 1rem; border-radius:10px; font-size:0.8rem; font-weight:600; text-align:center; text-decoration:none; transition:all 0.15s; border:none; cursor:pointer; }
        .btn-view { background:#f3f4f6; color:#374151; }
        .btn-view:hover { background:#e5e7eb; }
        .btn-apply { background:#4f46e5; color:#ffffff; }
        .btn-apply:hover { background:#4338ca; }

        .empty-state { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:4rem 2rem; text-align:center; }
        .empty-icon { width:120px; height:120px; background:linear-gradient(135deg, #eef2ff, #e0e7ff); border-radius:50%; display:flex; align-items:center; justify-content:center; margin-bottom:1.5rem; color:#6366f1; }
        .empty-title { font-size:1.5rem; font-weight:600; color:#1f2937; margin:0 0 0.75rem; }
        .empty-message { font-size:1rem; color:#6b7280; margin:0 0 2rem; max-width:400px; }
        .btn-browse { display:inline-block; padding:0.85rem 2rem; background:#4f46e5; color:#ffffff; border-radius:12px; font-size:0.9rem; font-weight:600; text-decoration:none; transition:all 0.15s; }
        .btn-browse:hover { background:#4338ca; transform:translateY(-1px); box-shadow:0 4px 12px rgba(79,70,229,0.3); }

        @media (max-width:768px) {
          .saved-jobs-page { padding:1rem; }
          .page-header { flex-direction:column; align-items:stretch; }
          .header-search { min-width:100%; }
          .filter-bar { flex-direction:column; }
          .filter-group { min-width:100%; }
          .jobs-grid { grid-template-columns:1fr; }
        }

        @keyframes fadeOut { from { opacity:1; transform:scale(1); } to { opacity:0; transform:scale(0.95); } }
        .job-card.removing { animation:fadeOut 0.3s forwards; }
      `}</style>
    </>
  );
}
