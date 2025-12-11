import Head from 'next/head';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../api/auth/[...nextauth]';
import { prisma } from '../../../lib/prisma';
import React, { useState } from 'react';

export async function getServerSideProps(ctx) {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session) return { redirect: { destination: '/auth/login', permanent: false } };
  if ((session.user.role || '').toLowerCase() !== 'employer') return { redirect: { destination: '/dashboard/candidate', permanent: false } };
  const { id } = ctx.params;
  const user = await prisma.user.findUnique({ where: { email: session.user.email }, include: { employerEmployerProfile: true } });
  const employerProfile = user?.employerEmployerProfile;
  if (!employerProfile) return { redirect: { destination: '/dashboard/employer', permanent: false } };
  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      employer: true,
      applications: {
        orderBy: { createdAt: 'desc' },
        include: {
          candidate: { select: { id: true, fullName: true, jobTitle: true, yearsExperience: true, location: true, dayRate: true } }
        }
      }
    }
  });
  if (!job || job.employerId !== employerProfile.id) return { notFound: true };
  return { props: { job: JSON.parse(JSON.stringify(job)) } };
}

export default function ApplicantsPage({ job }) {
  const [applications, setApplications] = useState(job.applications);
  const [updatingId, setUpdatingId] = useState(null);
  const statusOptions = ['SUBMITTED','REVIEW','INTERVIEW','OFFER','REJECTED'];

  async function updateStatus(id, status) {
    setUpdatingId(id);
    try {
      const res = await fetch('/api/employer/application-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: id, status })
      });
      const data = await res.json();
      if (res.ok) {
        setApplications(applications.map(a => a.id === id ? { ...a, status: data.status } : a));
      } else {
        console.error(data.error);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <>
      <Head><title>Applicants – {job.title}</title></Head>
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4">
          <h1 className="text-2xl font-semibold mb-2">Applicants for {job.title}</h1>
          <p className="text-sm text-gray-600 mb-6">Total applications: {applications.length}</p>
          <div className="overflow-x-auto bg-white border border-gray-200 rounded-md shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left font-medium px-3 py-2">Candidate</th>
                  <th className="text-left font-medium px-3 py-2">Role</th>
                  <th className="text-left font-medium px-3 py-2">Experience</th>
                  <th className="text-left font-medium px-3 py-2">Location</th>
                  <th className="text-left font-medium px-3 py-2">Day Rate</th>
                  <th className="text-left font-medium px-3 py-2">Status</th>
                  <th className="text-left font-medium px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map(app => (
                  <tr key={app.id} className="border-t">
                    <td className="px-3 py-2">{app.candidate.fullName || '—'}</td>
                    <td className="px-3 py-2">{app.candidate.jobTitle || '—'}</td>
                    <td className="px-3 py-2">{app.candidate.yearsExperience ?? '—'}</td>
                    <td className="px-3 py-2">{app.candidate.location || (app.job?.isRemote ? 'Remote' : '—')}</td>
                    <td className="px-3 py-2">{app.candidate.dayRate ? `£${app.candidate.dayRate}` : '—'}</td>
                    <td className="px-3 py-2">
                      <span className="inline-block px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs">{app.status}</span>
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={app.status}
                        disabled={updatingId === app.id}
                        onChange={e=>updateStatus(app.id, e.target.value)}
                        className="text-xs border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
                {applications.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center text-gray-500">No applications yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-6 flex gap-4">
            <a href="/dashboard/employer" className="text-sm px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200 text-gray-700">Back to Dashboard</a>
            <a href={`/jobs/${job.id}`} className="text-sm px-4 py-2 bg-indigo-600 rounded-md hover:bg-indigo-700 text-white">View Public Listing</a>
          </div>
        </div>
      </main>
    </>
  );
}
