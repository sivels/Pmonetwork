import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function EmployerJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // active, paused, all
  const router = useRouter();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/employer/jobs');
      const data = await response.json();
      if (data.jobs) {
        setJobs(data.jobs);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter(job => {
    if (activeTab === 'active') return !job.paused;
    if (activeTab === 'paused') return job.paused;
    return true; // all
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <>
      <section className="container" aria-labelledby="jobs-title">
        <div className="header-section">
          <h1 id="jobs-title" className="page-title">Manage Jobs</h1>
          <Link href="/employer/post-job" className="btn-primary">
            Post New Job
          </Link>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            Active ({jobs.filter(j => !j.paused).length})
          </button>
          <button 
            className={`tab ${activeTab === 'paused' ? 'active' : ''}`}
            onClick={() => setActiveTab('paused')}
          >
            Paused ({jobs.filter(j => j.paused).length})
          </button>
          <button 
            className={`tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Jobs ({jobs.length})
          </button>
        </div>

        {loading ? (
          <div className="loading">Loading jobs...</div>
        ) : filteredJobs.length === 0 ? (
          <div className="empty-state">
            <p>No {activeTab === 'all' ? '' : activeTab} jobs found</p>
            {activeTab === 'paused' && (
              <p className="hint">Paused jobs are not visible to candidates</p>
            )}
          </div>
        ) : (
          <div className="list">
            {filteredJobs.map(job => (
              <article key={job.id} className="job-card">
                <div className="meta">
                  <h3>{job.title}</h3>
                  <p className="sub">
                    Posted {formatDate(job.createdAt)} 
                    {job.location && ` • ${job.location}`}
                    {job.paused && <span className="paused-badge">Paused</span>}
                  </p>
                </div>
                <div className="appl">
                  Applicants: <strong>{job.applications?.length || 0}</strong>
                </div>
                <div className="actions">
                  <Link href={`/employer/post-job?jobId=${job.id}`} className="btn ghost">
                    Edit
                  </Link>
                  {!job.paused && (
                    <Link href="/employer/applicants" className="btn">
                      View Applicants
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      <style jsx>{`
        .container{max-width:1000px;margin:2rem auto;padding:0 1rem}
        .header-section{display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem}
        .page-title{font-size:1.8rem;font-weight:700;color:#111827;margin:0}
        .btn-primary{display:inline-block;background:#4f46e5;color:#fff;padding:.6rem 1.2rem;border-radius:10px;text-decoration:none;font-weight:500}
        .btn-primary:hover{background:#4338ca}
        
        .tabs{display:flex;gap:0.5rem;margin-bottom:1.5rem;border-bottom:2px solid #e5e7eb;padding-bottom:0}
        .tab{background:none;border:none;padding:0.75rem 1rem;font-size:0.95rem;font-weight:500;color:#6b7280;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-2px;transition:all 0.2s}
        .tab:hover{color:#111827}
        .tab.active{color:#4f46e5;border-bottom-color:#4f46e5}
        
        .loading{text-align:center;padding:3rem;color:#6b7280}
        .empty-state{text-align:center;padding:3rem;color:#6b7280}
        .empty-state p{margin:0.5rem 0}
        .hint{font-size:0.9rem;color:#9ca3af}
        
        .list{display:flex;flex-direction:column;gap:.75rem}
        .job-card{display:grid;grid-template-columns:1fr auto auto;gap:.75rem;align-items:center;padding:1rem;border-radius:12px;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.06)}
        .meta h3{margin:0;font-size:1rem;color:#111827}
        .sub{margin:.25rem 0 0;color:#6b7280;font-size:.85rem}
        .draft-badge{display:inline-block;background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:6px;font-size:0.75rem;font-weight:600;margin-left:0.5rem}
        .appl{color:#374151}
        .actions{display:flex;gap:.5rem}
        .btn{display:inline-block;background:#4f46e5;color:#fff;padding:.45rem .7rem;border-radius:10px;text-decoration:none;font-size:0.9rem}
        .sub{margin:.25rem 0 0;color:#6b7280;font-size:.85rem}
        .paused-badge{display:inline-block;background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:6px;font-size:0.75rem;font-weight:600;margin-left:0.5rem}
        .appl{color:#374151}kground:#dbeafe}
        
        @media (max-width: 768px) {
          .job-card{grid-template-columns:1fr;gap:0.75rem}
          .actions{justify-content:flex-start}
          .header-section{flex-direction:column;gap:1rem;align-items:flex-start}
        }
      `}</style>
    </>
  );
}
