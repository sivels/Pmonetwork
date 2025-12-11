import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]';
import { prisma } from '../../lib/prisma';
import { useRouter } from 'next/router';
import ApplyModal from '../../components/jobs/ApplyModal';
import { 
  MapPin, Briefcase, Calendar, Clock, DollarSign, Users, 
  Building2, Globe, Bookmark, Share2, CheckCircle2, 
  TrendingUp, Award, Heart, Linkedin, Mail, ExternalLink,
  ChevronRight, Star, Home, ArrowLeft
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
          website: true
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
  let candidateProfile = null;
  if (isCandidate && session.user.email) {
    const user = await prisma.user.findUnique({ 
      where: { email: session.user.email }, 
      include: { 
        candidateCandidateProfile: {
          include: {
            skills: true
          }
        }
      } 
    });
    if (user?.candidateCandidateProfile) {
      candidateProfile = user.candidateCandidateProfile;
      const application = await prisma.application.findFirst({
        where: {
          jobId: job.id,
          candidateId: user.candidateCandidateProfile.id
        }
      });
      hasApplied = !!application;
    }
  }
  
  // Get related jobs
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
      employer: { select: { companyName: true } }
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
      hasApplied,
      candidateProfile: candidateProfile ? JSON.parse(JSON.stringify(candidateProfile)) : null
    } 
  };
}

export default function JobDetailPage({ job, relatedJobs, isCandidate, isOwner, isEmployer, hasApplied, candidateProfile }) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleApplicationSubmit(applicationData) {
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
  }

  const handleShare = (platform) => {
    const url = window.location.href;
    const text = `Check out this job: ${job.title} at ${job.employer?.companyName}`;
    
    if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'email') {
      window.location.href = `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`;
    }
  };

  const formatSalary = () => {
    if (!job.salaryMin && !job.salaryMax) return null;
    const currency = job.currency || 'GBP';
    const symbol = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€';
    
    if (job.salaryMin && job.salaryMax) {
      return `${symbol}${job.salaryMin.toLocaleString()} - ${symbol}${job.salaryMax.toLocaleString()}`;
    }
    if (job.salaryMin) return `${symbol}${job.salaryMin.toLocaleString()}+`;
    return `Up to ${symbol}${job.salaryMax.toLocaleString()}`;
  };

  const getWorkMode = () => {
    if (job.isRemote) return 'Remote';
    if (job.location && job.location.toLowerCase().includes('hybrid')) return 'Hybrid';
    return 'Onsite';
  };

  const daysAgo = Math.floor((Date.now() - new Date(job.createdAt).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <>
      <Head>
        <title>{`${job.title} at ${job.employer?.companyName || 'Company'} | PMO Network`}</title>
        <meta name="description" content={job.shortDescription || `Apply for ${job.title} at ${job.employer?.companyName}. ${job.employmentType} opportunity.`} />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
        {/* Back Navigation */}
        <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <Link href="/jobs" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back to Jobs
            </Link>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            {/* Main Content - Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Hero Header Card */}
              <div className="bg-gradient-to-br from-white to-blue-50/50 rounded-2xl shadow-lg border border-gray-200 p-8 relative overflow-hidden">
                {/* Decorative gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 pointer-events-none" />
                
                <div className="relative">
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Company Logo */}
                      <div className="flex-shrink-0">
                        <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center ring-2 ring-white shadow-md">
                          <Building2 className="h-8 w-8 text-white" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Badges */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {job.isUrgent && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 ring-1 ring-red-200">
                              <TrendingUp className="h-3 w-3" />
                              Urgent
                            </span>
                          )}
                          {job.isFeatured && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 ring-1 ring-purple-200">
                              <Star className="h-3 w-3 fill-current" />
                              Featured
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 ring-1 ring-green-200">
                            {daysAgo === 0 ? 'Posted today' : `Posted ${daysAgo}d ago`}
                          </span>
                        </div>

                        {/* Job Title */}
                        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                          {job.title}
                        </h1>

                        {/* Company Name */}
                        <p className="text-lg text-gray-700 font-medium mb-4">
                          {job.employer?.companyName || 'Company Name'}
                        </p>

                        {/* Key Info Row */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          {job.location && (
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              {job.location}
                            </span>
                          )}
                          {formatSalary() && (
                            <span className="inline-flex items-center gap-1.5 font-semibold text-green-700">
                              <DollarSign className="h-4 w-4" />
                              {formatSalary()}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1.5">
                            <Briefcase className="h-4 w-4 text-gray-400" />
                            {job.employmentType || 'Full-time'}
                          </span>
                          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${
                            getWorkMode() === 'Remote' ? 'bg-green-100 text-green-700' :
                            getWorkMode() === 'Hybrid' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            <Home className="h-3 w-3" />
                            {getWorkMode()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Share Icons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleShare('linkedin')}
                        className="p-2 rounded-lg hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition-colors"
                        title="Share on LinkedIn"
                      >
                        <Linkedin className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleShare('email')}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
                        title="Share via Email"
                      >
                        <Mail className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* CTA Buttons */}
                  <div className="flex flex-wrap gap-3">
                    {isCandidate && !hasApplied && (
                      <button
                        onClick={() => setModalOpen(true)}
                        className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all"
                      >
                        <CheckCircle2 className="h-5 w-5" />
                        Apply Now
                      </button>
                    )}
                    {isCandidate && hasApplied && (
                      <div className="inline-flex items-center gap-2 px-8 py-3 bg-green-100 text-green-700 font-semibold rounded-xl ring-1 ring-green-200">
                        <CheckCircle2 className="h-5 w-5" />
                        Already Applied
                      </div>
                    )}
                    {!isCandidate && !isEmployer && (
                      <Link
                        href={`/auth/register?returnTo=/jobs/${job.id}`}
                        className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all"
                      >
                        <CheckCircle2 className="h-5 w-5" />
                        Sign up to Apply
                      </Link>
                    )}
                    <button
                      onClick={() => setSaved(!saved)}
                      className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                        saved
                          ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-200'
                          : 'bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {saved ? <Heart className="h-5 w-5 fill-current" /> : <Heart className="h-5 w-5" />}
                      {saved ? 'Saved' : 'Save Job'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Key Highlights Bar */}
              <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  Key Highlights
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {formatSalary() && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <DollarSign className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Salary</p>
                        <p className="text-sm font-semibold text-gray-900 mt-0.5">{formatSalary()}</p>
                      </div>
                    </div>
                  )}
                  {job.location && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <MapPin className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Location</p>
                        <p className="text-sm font-semibold text-gray-900 mt-0.5">{job.location}</p>
                      </div>
                    </div>
                  )}
                  {job.seniority && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Experience</p>
                        <p className="text-sm font-semibold text-gray-900 mt-0.5">{job.seniority}</p>
                      </div>
                    </div>
                  )}
                  {job.employmentType && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Briefcase className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Type</p>
                        <p className="text-sm font-semibold text-gray-900 mt-0.5">{job.employmentType}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <Home className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Work Mode</p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">{getWorkMode()}</p>
                    </div>
                  </div>
                  {job.specialism && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-pink-100 rounded-lg">
                        <Award className="h-5 w-5 text-pink-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Sector</p>
                        <p className="text-sm font-semibold text-gray-900 mt-0.5">{job.specialism}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* About the Role */}
              <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">About the Role</h2>
                {job.shortDescription && (
                  <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                    {job.shortDescription}
                  </p>
                )}
                <div className="prose prose-gray max-w-none">
                  <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {job.description}
                  </div>
                </div>
              </div>

              {/* Company Overview Card */}
              {job.employer && (
                <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-md border border-gray-200 p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">About the Company</h2>
                  <div className="flex items-start gap-6">
                    <div className="h-20 w-20 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center ring-2 ring-white shadow-lg flex-shrink-0">
                      <Building2 className="h-10 w-10 text-gray-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{job.employer.companyName}</h3>
                      <div className="grid sm:grid-cols-2 gap-4 mt-4">
                        {job.employer.website && (
                          <a 
                            href={job.employer.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                          >
                            <Globe className="h-4 w-4" />
                            Visit Website
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Related Jobs */}
              {relatedJobs && relatedJobs.length > 0 && (
                <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Similar Jobs You May Like</h2>
                  <div className="space-y-4">
                    {relatedJobs.map((relJob) => (
                      <Link
                        key={relJob.id}
                        href={`/jobs/${relJob.id}`}
                        className="block p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group"
                      >
                        <div className="flex items-start gap-4">
                          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {relJob.title}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {relJob.employer?.companyName} • {relJob.location || 'Remote'}
                            </p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Sidebar - Right Column */}
            <div className="lg:col-span-1 mt-6 lg:mt-0">
              <div className="sticky top-24 space-y-6">
                {/* Quick Apply Card */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Quick Apply</h3>
                  
                  {isCandidate && !hasApplied && (
                    <button
                      onClick={() => setModalOpen(true)}
                      className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all mb-3"
                    >
                      Apply Now
                    </button>
                  )}
                  {isCandidate && hasApplied && (
                    <div className="w-full px-6 py-3 bg-green-100 text-green-700 font-semibold rounded-xl ring-1 ring-green-200 text-center mb-3">
                      ✓ Already Applied
                    </div>
                  )}
                  {!isCandidate && !isEmployer && (
                    <Link
                      href={`/auth/register?returnTo=/jobs/${job.id}`}
                      className="block w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all text-center mb-3"
                    >
                      Sign up to Apply
                    </Link>
                  )}
                  
                  <button
                    onClick={() => setSaved(!saved)}
                    className={`w-full px-6 py-3 rounded-xl font-medium transition-all ${
                      saved
                        ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
                        : 'bg-gray-50 text-gray-700 ring-1 ring-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {saved ? '♥ Saved' : '♡ Save Job'}
                  </button>

                  <div className="mt-6 pt-6 border-t border-gray-200 space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Posted</span>
                      <span className="font-medium text-gray-900">
                        {new Date(job.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Applications</span>
                      <span className="font-medium text-gray-900">{job.applications?.length || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Job Stats Card */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border border-blue-100 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Is this role right for you?</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      <span>Active hiring</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                      <span>High response rate</span>
                    </div>
                    {job.isUrgent && (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                        <span>Urgent fill</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Application Modal */}
      <ApplyModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        job={job}
        candidateProfile={candidateProfile}
        onSubmit={handleApplicationSubmit}
      />
    </>
  );
}
