import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]';

export async function getServerSideProps(ctx) {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  // Fetch initial page server-side for SEO
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `http://${ctx.req.headers.host}`;
  const res = await fetch(`${baseUrl}/api/jobs/list?page=1&pageSize=15`);
  const initial = res.ok ? await res.json() : { jobs: [], page:1, pageSize:15, total:0, totalPages:0 };
  const isCandidate = !!session && (session.user.role || '').toLowerCase() === 'candidate';
  const isEmployer = !!session && (session.user.role || '').toLowerCase() === 'employer';
  return { props: { initial, isCandidate, isEmployer, session: session ? { user: { role: session.user.role } } : null } };
}

export default function JobBoardPage({ initial, isCandidate, isEmployer }) {
  const [jobs, setJobs] = useState(initial.jobs || []);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initial.totalPages || 0);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ search:'', location:'', employmentType:'', specialism:'', seniority:'', remote:false });
  const [savedJobs, setSavedJobs] = useState(new Set());

  async function load(pageToLoad = 1, replace = false) {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(pageToLoad),
      pageSize: '15',
      search: filters.search,
      location: filters.location,
      employmentType: filters.employmentType,
      specialism: filters.specialism,
      seniority: filters.seniority,
      remote: filters.remote ? 'true' : ''
    });
    const res = await fetch(`/api/jobs/list?${params.toString()}`);
    const data = await res.json();
    if (res.ok) {
      setPage(data.page);
      setTotalPages(data.totalPages);
      setJobs(replace ? data.jobs : [...jobs, ...data.jobs]);
    }
    setLoading(false);
  }

  function applyFilters(e) {
    e.preventDefault();
    load(1, true);
  }

  function toggleSave(jobId) {
    const newSaved = new Set(savedJobs);
    if (newSaved.has(jobId)) {
      newSaved.delete(jobId);
    } else {
      newSaved.add(jobId);
    }
    setSavedJobs(newSaved);
    // TODO: Call API: POST/DELETE /api/jobs/{jobId}/save
  }

  useEffect(() => {
    // initial already loaded
  }, []);

  return (
    <>
      <Head>
        <title>PMO Job Board | PMO Careers & Project Management Roles</title>
        <meta name="description" content="Browse PMO jobs, PMO careers, project management roles and PMO contractor opportunities." />
        <meta name="keywords" content="PMO jobs, PMO careers, project management roles, PMO contractors" />
      </Head>
        <main className="min-h-screen py-8" style={{ background: isCandidate ? 'transparent' : '#f9fafb' }}>
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-semibold mb-6">PMO Job Board</h1>
          <form onSubmit={applyFilters} className="grid gap-4 md:grid-cols-6 mb-8 bg-white p-4 rounded-md border border-gray-200">
            <input placeholder="Search role" value={filters.search} onChange={e=>setFilters(f=>({...f,search:e.target.value}))} className="rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 md:col-span-2" />
            <input placeholder="Location" value={filters.location} onChange={e=>setFilters(f=>({...f,location:e.target.value}))} className="rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500" />
            <input placeholder="Specialism" value={filters.specialism} onChange={e=>setFilters(f=>({...f,specialism:e.target.value}))} className="rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500" />
            <input placeholder="Seniority" value={filters.seniority} onChange={e=>setFilters(f=>({...f,seniority:e.target.value}))} className="rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500" />
            <select value={filters.employmentType} onChange={e=>setFilters(f=>({...f,employmentType:e.target.value}))} className="rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500">
              <option value="">Type</option>
              <option value="contract">Contract</option>
              <option value="full-time">Full-Time</option>
              <option value="part-time">Part-Time</option>
              <option value="temporary">Temporary</option>
              <option value="internship">Internship</option>
              <option value="fractional">Fractional</option>
            </select>
            <label className="flex items-center text-sm text-gray-700">
              <input type="checkbox" checked={filters.remote} onChange={e=>setFilters(f=>({...f,remote:e.target.checked}))} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
              <span className="ml-2">Remote</span>
            </label>
            <div className="md:col-span-6 flex gap-3">
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Apply Filters</button>
              <button type="button" onClick={()=>{setFilters({search:'',location:'',employmentType:'',specialism:'',seniority:'',remote:false}); load(1,true);}} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">Reset</button>
            </div>
          </form>
          <div className="grid gap-4">
            {jobs.map(job => (
              <article key={job.id} className={`bg-white border rounded-md p-5 shadow-sm hover:shadow-md transition relative ${job.isFeatured ? 'ring-2 ring-indigo-300' : ''}`}>
                {job.isUrgent && <span className="absolute top-2 right-2 text-xs bg-red-600 text-white px-2 py-1 rounded">Urgent</span>}
                {isCandidate && (
                  <button
                    onClick={() => toggleSave(job.id)}
                    className={`absolute top-2 ${job.isUrgent ? 'right-20' : 'right-2'} p-2 rounded-full transition hover:bg-gray-100`}
                    title={savedJobs.has(job.id) ? 'Remove from saved jobs' : 'Save for later'}
                  >
                    <svg width="20" height="20" fill={savedJobs.has(job.id) ? '#eab308' : 'none'} stroke={savedJobs.has(job.id) ? '#eab308' : '#9ca3af'} strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                  </button>
                )}
                <h2 className="text-xl font-semibold mb-1">
                  <Link href={`/jobs/${job.id}`} className="hover:text-indigo-600">{job.title}</Link>
                </h2>
                <p className="text-sm text-gray-600 mb-1">{job.employer?.companyName || 'Company'} • {job.location || (job.isRemote ? 'Remote' : 'Location TBC')}</p>
                <p className="text-sm text-gray-600 mb-2">{job.employmentType} {job.isRemote && '· Remote'} {job.salaryMin ? `· ${job.currency || 'GBP'} ${job.salaryMin}${job.salaryMax?'-'+job.salaryMax:''}` : ''}</p>
                <p className="text-gray-700 mb-4">{job.shortDescription || 'PMO role – description coming soon.'}</p>
                <div className="flex items-center gap-3">
                  <Link href={`/jobs/${job.id}`} className="text-sm text-indigo-600 hover:underline">View Details</Link>
                  {isCandidate && (
                    <Link href={`/jobs/${job.id}?apply=1`} className="text-sm px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Apply</Link>
                  )}
                  {!isCandidate && !isEmployer && (
                    <Link href={`/auth/register?returnTo=/jobs/${job.id}`} className="text-sm px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Apply</Link>
                  )}
                </div>
              </article>
            ))}
            {jobs.length === 0 && <p className="text-gray-600">No jobs found – adjust filters.</p>}
          </div>
          {page < totalPages && (
            <div className="mt-8 flex justify-center">
              <button disabled={loading} onClick={()=>load(page+1)} className="px-6 py-2 bg-gray-900 text-white rounded-md hover:bg-black disabled:opacity-50">{loading ? 'Loading…' : 'Load More'}</button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
