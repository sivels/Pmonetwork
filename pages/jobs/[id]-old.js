import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]';
import { prisma } from '../../lib/prisma';
import { useRouter } from 'next/router';
import { 
  MapPin, Briefcase, Calendar, Clock, DollarSign, Users, 
  Building2, Globe, Bookmark, Share2, CheckCircle2, 
  TrendingUp, Award, Heart, Linkedin, Mail, ExternalLink,
  ChevronRight, Star, Home
} from 'lucide-react';

export async function getServerSideProps(ctx) {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  const { id } = ctx.params;
  const job = await prisma.job.findUnique({
    where: { id },
    include: { 
      employer: { 
        select: { 
          companyName: true,
          companyLogoUrl: true,
          website: true,
          companySize: true,
          industry: true,
          headquarters: true,
          description: true
        } 
      },
      applications: {
        select: { id: true }
      }
    }
  });
  if (!job || job.paused) return { notFound: true };
  const isCandidate = !!session && (session.user.role || '').toLowerCase() === 'candidate';
  const isEmployer = !!session && (session.user.role || '').toLowerCase() === 'employer';
  const isEmployerOwner = isEmployer && session.user.email;
  let owner = false;
  let hasApplied = false;
  if (isEmployerOwner) {
    const user = await prisma.user.findUnique({ where: { email: session.user.email }, include: { employerEmployerProfile: true } });
    owner = !!user?.employerEmployerProfile && user.employerEmployerProfile.id === job.employerId;
  }
  if (isCandidate && session.user.email) {
    const user = await prisma.user.findUnique({ 
      where: { email: session.user.email }, 
      include: { candidateCandidateProfile: true } 
    });
    if (user?.candidateCandidateProfile) {
      const application = await prisma.application.findFirst({
        where: {
          jobId: job.id,
          candidateId: user.candidateCandidateProfile.id
        }
      });
      hasApplied = !!application;
    }
  }
  
  // Get related jobs (same specialism or employment type)
  const relatedJobs = await prisma.job.findMany({
    where: {
      id: { not: job.id },
      paused: false,
      OR: [
        { specialism: job.specialism },
        { employmentType: job.employmentType }
      ]
    },
    take: 3,
    include: {
      employer: { select: { companyName: true, companyLogoUrl: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
  
  return { 
    props: { 
      job: JSON.parse(JSON.stringify(job)), 
      relatedJobs: JSON.parse(JSON.stringify(relatedJobs)),
      isCandidate, 
      isOwner: owner, 
      isEmployer,
      hasApplied
    } 
  };
}

export default function JobDetailPage({ job, relatedJobs, isCandidate, isOwner, isEmployer, hasApplied }) {
  const router = useRouter();
  const showApply = router.query.apply === '1' && isCandidate;
  const [modalOpen, setModalOpen] = useState(showApply);
  const [coverLetter, setCoverLetter] = useState('');
  const [availability, setAvailability] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [manageForm, setManageForm] = useState({
    title: job.title,
    shortDescription: job.shortDescription || '',
    location: job.location || '',
    employmentType: job.employmentType || '',
    salaryMin: job.salaryMin ?? '',
    salaryMax: job.salaryMax ?? '',
    currency: job.currency || 'GBP',
    isRemote: job.isRemote,
    specialism: job.specialism || '',
    seniority: job.seniority || '',
    isFeatured: job.isFeatured,
    isUrgent: job.isUrgent
  });
  const [manageSaving, setManageSaving] = useState(false);
  const [manageMsg, setManageMsg] = useState(null);

  async function saveManage(e) {
    e.preventDefault();
    setManageSaving(true); setManageMsg(null);
    try {
      const res = await fetch('/api/jobs/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: job.id, ...{
          ...manageForm,
          salaryMin: manageForm.salaryMin === '' ? null : Number(manageForm.salaryMin),
          salaryMax: manageForm.salaryMax === '' ? null : Number(manageForm.salaryMax)
        } })
      });
      const data = await res.json();
      if (res.ok) setManageMsg('Saved'); else setManageMsg(data.error || 'Save failed');
    } catch(err) {
      setManageMsg('Network error');
    } finally {
      setManageSaving(false);
    }
  }

  async function togglePause() {
    try {
      const res = await fetch('/api/jobs/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: job.id, paused: !job.paused })
      });
      if (res.ok) {
        router.replace(router.asPath); // refresh SSR state
      }
    } catch(e) { console.error(e); }
  }

  async function deleteJob() {
    if (!confirm('Delete this job?')) return;
    try {
      const res = await fetch('/api/jobs/delete?id='+job.id, { method: 'DELETE' });
      if (res.ok) router.replace('/dashboard/employer');
    } catch(e) { console.error(e); }
  }

  useEffect(()=>{ if (showApply) setModalOpen(true); }, [showApply]);

  async function submitApplication(e) {
    e.preventDefault();
    setError(null); setSuccess(false);
    if (coverLetter.trim().length < 20) { setError('Cover letter must be at least 20 characters.'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/jobs/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id, coverLetter, availability })
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || 'Failed to apply'); else { setSuccess(true); }
    } catch (e) {
      setError('Network error');
    } finally { setSubmitting(false); }
  }

  return (
    <>
      <Head>
        <title>{`${job.title} | PMO Careers`}</title>
        <meta name="description" content={`Apply for ${job.title} at ${job.employer?.companyName || 'Company'} – PMO jobs & project management roles.`} />
      </Head>
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-semibold mb-2">{job.title}</h1>
          <p className="text-gray-700 mb-1">{job.employer?.companyName || 'Company'} • {job.location || (job.isRemote ? 'Remote' : 'Location TBC')}</p>
          <p className="text-gray-600 mb-4 text-sm">{job.employmentType} {job.isRemote && '· Remote'} {job.salaryMin ? `· ${job.currency || 'GBP'} ${job.salaryMin}${job.salaryMax?'-'+job.salaryMax:''}` : ''}</p>
          {job.isUrgent && <span className="text-xs bg-red-600 text-white px-2 py-1 rounded">Urgent</span>}
          {job.isFeatured && <span className="ml-2 text-xs bg-indigo-600 text-white px-2 py-1 rounded">Featured</span>}
          <div className="prose max-w-none mt-6 mb-8">
            <p className="font-medium">Role Overview</p>
            <p>{job.shortDescription || 'PMO role opportunity.'}</p>
            <p className="whitespace-pre-line text-gray-800 mt-4">{job.description}</p>
          </div>
          <div className="flex gap-4">
            {isCandidate && (
              <button onClick={()=>setModalOpen(true)} className="px-5 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Apply Now</button>
            )}
            {!isCandidate && !isEmployer && (
              <a href={`/auth/register?returnTo=/jobs/${job.id}`} className="px-5 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Apply</a>
            )}
            <a href="/jobs" className="px-5 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">Back</a>
            {isOwner && (
              <button onClick={()=>setManageOpen(o=>!o)} className="px-5 py-2 bg-gray-900 text-white rounded-md hover:bg-black">{manageOpen ? 'Hide Manage' : 'Manage'}</button>
            )}
          </div>
          {isOwner && manageOpen && (
            <div className="mt-8 bg-white border border-gray-200 rounded-md p-5 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Manage Job</h2>
              <form onSubmit={saveManage} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                    <input value={manageForm.title} onChange={e=>setManageForm(f=>({...f,title:e.target.value}))} className="w-full rounded border-gray-300 focus:border-indigo-500 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
                    <input value={manageForm.location} onChange={e=>setManageForm(f=>({...f,location:e.target.value}))} className="w-full rounded border-gray-300 focus:border-indigo-500 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Employment Type</label>
                    <select value={manageForm.employmentType} onChange={e=>setManageForm(f=>({...f,employmentType:e.target.value}))} className="w-full rounded border-gray-300 focus:border-indigo-500 focus:ring-indigo-500">
                      <option value="">Select</option>
                      <option value="contract">Contract</option>
                      <option value="full-time">Full-Time</option>
                      <option value="part-time">Part-Time</option>
                      <option value="temporary">Temporary</option>
                      <option value="internship">Internship</option>
                      <option value="fractional">Fractional</option>
                    </select>
                  </div>
                  <div className="flex items-end gap-4">
                    <label className="inline-flex items-center text-xs text-gray-700">
                      <input type="checkbox" checked={manageForm.isRemote} onChange={e=>setManageForm(f=>({...f,isRemote:e.target.checked}))} className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                      <span className="ml-1">Remote</span>
                    </label>
                    <label className="inline-flex items-center text-xs text-gray-700">
                      <input type="checkbox" checked={manageForm.isFeatured} onChange={e=>setManageForm(f=>({...f,isFeatured:e.target.checked}))} className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                      <span className="ml-1">Featured</span>
                    </label>
                    <label className="inline-flex items-center text-xs text-gray-700">
                      <input type="checkbox" checked={manageForm.isUrgent} onChange={e=>setManageForm(f=>({...f,isUrgent:e.target.checked}))} className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                      <span className="ml-1">Urgent</span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Specialism</label>
                    <input value={manageForm.specialism} onChange={e=>setManageForm(f=>({...f,specialism:e.target.value}))} className="w-full rounded border-gray-300 focus:border-indigo-500 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Seniority</label>
                    <input value={manageForm.seniority} onChange={e=>setManageForm(f=>({...f,seniority:e.target.value}))} className="w-full rounded border-gray-300 focus:border-indigo-500 focus:ring-indigo-500" />
                  </div>
                  <div className="flex gap-2">
                    <input type="number" placeholder="Salary Min" value={manageForm.salaryMin} onChange={e=>setManageForm(f=>({...f,salaryMin:e.target.value}))} className="w-32 rounded border-gray-300 focus:border-indigo-500 focus:ring-indigo-500" />
                    <input type="number" placeholder="Salary Max" value={manageForm.salaryMax} onChange={e=>setManageForm(f=>({...f,salaryMax:e.target.value}))} className="w-32 rounded border-gray-300 focus:border-indigo-500 focus:ring-indigo-500" />
                    <input placeholder="Currency" value={manageForm.currency} onChange={e=>setManageForm(f=>({...f,currency:e.target.value}))} className="w-24 rounded border-gray-300 focus:border-indigo-500 focus:ring-indigo-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Short Description</label>
                  <textarea rows={3} value={manageForm.shortDescription} onChange={e=>setManageForm(f=>({...f,shortDescription:e.target.value}))} className="w-full rounded border-gray-300 focus:border-indigo-500 focus:ring-indigo-500" />
                </div>
                {manageMsg && <p className="text-xs {manageMsg==='Saved' ? 'text-green-600' : 'text-red-600'}">{manageMsg}</p>}
                <div className="flex gap-3">
                  <button type="submit" disabled={manageSaving} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 text-sm">{manageSaving ? 'Saving…' : 'Save Changes'}</button>
                  <button type="button" onClick={togglePause} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm">{job.paused ? 'Unpause' : 'Pause'}</button>
                  <button type="button" onClick={deleteJob} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm">Delete</button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      {modalOpen && isCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <div className="bg-white w-full max-w-lg rounded-lg shadow-lg p-6 relative">
            <button onClick={()=>setModalOpen(false)} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" aria-label="Close">×</button>
            <h2 className="text-xl font-semibold mb-4">Apply for {job.title}</h2>
            <form onSubmit={submitApplication} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cover Letter</label>
                <textarea value={coverLetter} onChange={e=>setCoverLetter(e.target.value)} rows={6} className="w-full rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Highlight relevant PMO experience, frameworks (e.g. P3O, MSP), achievements..." />
                <p className="mt-1 text-xs text-gray-500">Minimum 20 characters.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
                <input value={availability} onChange={e=>setAvailability(e.target.value)} className="w-full rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g. Immediate, 2 weeks, 1 month" />
              </div>
              {error && <div className="text-sm text-red-600">{error}</div>}
              {success && <div className="text-sm text-green-600">Application submitted successfully.</div>}
              <div className="flex gap-3">
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50">{submitting ? 'Submitting…' : 'Submit Application'}</button>
                <button type="button" onClick={()=>setModalOpen(false)} className="px-5 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
