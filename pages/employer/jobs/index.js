export default function EmployerJobs() {
  const jobs = [
    { id: '1', title: 'Senior PM', applicants: 8, date: '2025-11-01', status: 'Active' },
    { id: '2', title: 'Project Analyst', applicants: 3, date: '2025-10-20', status: 'Active' },
    { id: '3', title: 'Scrum Master', applicants: 0, date: '2025-09-15', status: 'Closed' },
  ];
  return (
    <>
      <section className="container" aria-labelledby="jobs-title">
        <h1 id="jobs-title" className="page-title">Jobs Overview</h1>
        <div className="list">
          {jobs.map(job => (
            <article key={job.id} className="job-card">
              <div className="meta">
                <h3>{job.title}</h3>
                <p className="sub">Posted {job.date} • {job.status}</p>
              </div>
              <div className="appl">Applicants: <strong>{job.applicants}</strong></div>
              <div className="actions">
                <a href={`/employer/jobs/${job.id}/edit`} className="btn ghost">Edit</a>
                <button className="btn ghost">Close</button>
                <a href="/employer/applicants" className="btn">View Applicants</a>
              </div>
            </article>
          ))}
        </div>
      </section>
      <style jsx>{`
        .container{max-width:1000px;margin:2rem auto;padding:0 1rem}
        .page-title{font-size:1.4rem;font-weight:700;color:#111827;margin-bottom:1rem}
        .list{display:flex;flex-direction:column;gap:.75rem}
        .job-card{display:grid;grid-template-columns:1fr auto auto;gap:.75rem;align-items:center;padding:1rem;border-radius:12px;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.06)}
        .meta h3{margin:0;font-size:1rem;color:#111827}
        .sub{margin:.25rem 0 0;color:#6b7280;font-size:.85rem}
        .appl{color:#374151}
        .actions{display:flex;gap:.5rem}
        .btn{display:inline-block;background:#4f46e5;color:#fff;padding:.45rem .7rem;border-radius:10px;text-decoration:none}
        .btn:hover{background:#4338ca}
        .btn.ghost{background:#eef2ff;color:#4f46e5}
      `}</style>
    </>
  );
}
