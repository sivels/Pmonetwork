import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]';
import { prisma } from '../../lib/prisma';
import Link from 'next/link';

function formatDate(dateString) {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export async function getServerSideProps(ctx) {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session || (session.user.role || '').toLowerCase() !== 'employer') {
    return { redirect: { destination: '/auth/login', permanent: false } };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      employerEmployerProfile: {
        include: {
          jobs: {
            include: {
              applications: {
                include: {
                  candidate: {
                    select: {
                      fullName: true,
                      profilePhotoUrl: true,
                      location: true,
                      yearsExperience: true,
                    }
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

  const profile = user?.employerEmployerProfile || null;
  const jobs = profile?.jobs || [];

  const totalApplications = jobs.reduce((sum, job) => sum + (job.applications?.length || 0), 0);
  const newApplications = jobs.reduce((sum, job) => 
    sum + (job.applications?.filter(a => a.status === 'APPLIED').length || 0), 0);
  const shortlisted = jobs.reduce((sum, job) => 
    sum + (job.applications?.filter(a => a.status === 'SHORTLISTED').length || 0), 0);

  const serializedJobs = JSON.parse(JSON.stringify(jobs));

  return {
    props: {
      jobs: serializedJobs,
      stats: { totalApplications, newApplications, shortlisted }
    }
  };
}

export default function EmployerApplicants({ jobs, stats }) {
  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Applicants Centre</h1>
            <p className="mt-2 text-gray-600">Manage all candidates who applied to your jobs</p>
          </div>

          <div className="mb-8 grid gap-6 sm:grid-cols-3">
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-gray-500">Total Applications</div>
              <div className="mt-2 text-3xl font-bold text-gray-900">{stats.totalApplications}</div>
            </div>
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-gray-500">New Applications</div>
              <div className="mt-2 text-3xl font-bold text-blue-600">{stats.newApplications}</div>
            </div>
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-gray-500">Shortlisted</div>
              <div className="mt-2 text-3xl font-bold text-green-600">{stats.shortlisted}</div>
            </div>
          </div>

          <div className="rounded-lg border bg-white shadow-sm">
            <div className="border-b p-6">
              <h2 className="text-xl font-semibold">Your Job Posts</h2>
            </div>
            <div className="divide-y">
              {jobs.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-gray-500">No jobs posted yet</p>
                  <Link href="/employer/post-job" className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                    Post a Job
                  </Link>
                </div>
              ) : (
                jobs.map((job) => (
                  <div key={job.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                        <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                          <span>{job.location || 'Remote'}</span>
                          <span>•</span>
                          <span>{job.employmentType || 'Full-time'}</span>
                          <span>•</span>
                          <span>Posted {formatDate(job.createdAt)}</span>
                        </div>
                        <div className="mt-3 flex items-center gap-4">
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                            {job.applications?.length || 0} Applications
                          </span>
                          {job.applications?.filter(a => a.status === 'APPLIED').length > 0 && (
                            <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-700">
                              {job.applications.filter(a => a.status === 'APPLIED').length} New
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="ml-6 flex gap-2">
                        <Link
                          href={`/employer/jobs/${job.id}/applications`}
                          className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Applicants
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-8 rounded-lg border bg-blue-50 p-6">
            <h3 className="font-semibold text-blue-900">Need Help?</h3>
            <p className="mt-2 text-sm text-blue-700">
              Click "View Applicants" on any job to see all candidates, manage applications, send messages, and update statuses in real-time.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
