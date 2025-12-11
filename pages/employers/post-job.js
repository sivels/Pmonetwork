import React, { useState } from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]';
import Head from 'next/head';

export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session || session.user?.role !== 'employer') {
    return {
      redirect: {
        destination: '/auth/login?role=employer',
        permanent: false
      }
    };
  }
  return { props: { } };
}

const employmentTypeOptions = [
  { value: 'full-time', label: 'Full-Time' },
  { value: 'part-time', label: 'Part-Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'temporary', label: 'Temporary' },
  { value: 'internship', label: 'Internship' },
  { value: 'fractional', label: 'Fractional' }
];

export default function PostJobPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [employmentType, setEmploymentType] = useState('contract');
  const [isRemote, setIsRemote] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (title.trim().length < 4) { setError('Title must be at least 4 characters'); return; }
    if (description.trim().length < 20) { setError('Description must be at least 20 characters'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/jobs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, location, employmentType, isRemote })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create job');
      } else {
        setSuccess('Job created successfully');
        setTitle('');
        setDescription('');
        setLocation('');
        setEmploymentType('contract');
        setIsRemote(false);
      }
    } catch (err) {
      setError('Network or server error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Head><title>Post a Job | PMO Board</title></Head>
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-3xl mx-auto bg-white shadow-sm border border-gray-200 rounded-lg p-8">
          <h1 className="text-2xl font-semibold mb-6">Post a PMO Role</h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="e.g. PMO Analyst"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={6}
                className="w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Responsibilities, required skills, contract length, etc."
                required
              />
              <p className="mt-1 text-xs text-gray-500">Min 20 characters</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type</label>
                <select
                  value={employmentType}
                  onChange={e => setEmploymentType(e.target.value)}
                  className="w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                >
                  {employmentTypeOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="City / Region"
                />
              </div>
              <div className="md:col-span-1 flex items-end">
                <label className="inline-flex items-center text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={isRemote}
                    onChange={e => setIsRemote(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="ml-2">Remote Friendly</span>
                </label>
              </div>
            </div>
            {error && <div className="text-sm text-red-600">{error}</div>}
            {success && <div className="text-sm text-green-600">{success}</div>}
            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {submitting ? 'Posting…' : 'Post Job'}
              </button>
              <a href="/dashboard/employer" className="text-sm text-gray-600 hover:text-gray-800">Back to Dashboard</a>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
