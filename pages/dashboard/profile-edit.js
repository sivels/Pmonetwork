import React, { useState } from 'react';
import Head from 'next/head';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]';
import { prisma } from '../../lib/prisma';
import Link from 'next/link';

export async function getServerSideProps(ctx) {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session) return { redirect: { destination: '/auth/login', permanent: false } };
  if ((session.user.role || '').toLowerCase() !== 'candidate') {
    return { redirect: { destination: '/dashboard/employer', permanent: false } };
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { candidateCandidateProfile: true }
  });
  const profile = user?.candidateCandidateProfile || null;
  if (!profile) return { redirect: { destination: '/dashboard/candidate', permanent: false } };
  return { props: { profile } };
}

export default function ProfileEditPage({ profile }) {
  const [form, setForm] = useState({
    fullName: profile.fullName || '',
    jobTitle: profile.jobTitle || '',
    summary: profile.summary || '',
    yearsExperience: profile.yearsExperience ?? '',
    sector: profile.sector || '',
    location: profile.location || '',
    remotePreference: profile.remotePreference || false,
    dayRate: profile.dayRate ?? ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  function updateField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true); setError(null); setSuccess(false);
    try {
      const res = await fetch('/api/candidate/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          yearsExperience: form.yearsExperience === '' ? null : Number(form.yearsExperience),
          dayRate: form.dayRate === '' ? null : Number(form.dayRate)
        })
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Update failed');
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Head><title>Edit Profile – PMO Network</title></Head>
      <main className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-3xl mx-auto bg-white border border-gray-200 shadow-sm rounded-lg p-8">
          <h1 className="text-2xl font-semibold mb-6">Edit Profile</h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input value={form.fullName} onChange={e=>updateField('fullName', e.target.value)} className="w-full rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                <input value={form.jobTitle} onChange={e=>updateField('jobTitle', e.target.value)} className="w-full rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Years Experience</label>
                <input type="number" min="0" max="60" value={form.yearsExperience} onChange={e=>updateField('yearsExperience', e.target.value)} className="w-full rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sector</label>
                <input value={form.sector} onChange={e=>updateField('sector', e.target.value)} className="w-full rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input value={form.location} onChange={e=>updateField('location', e.target.value)} className="w-full rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"/>
              </div>
              <div className="flex items-end">
                <label className="inline-flex items-center text-sm text-gray-700">
                  <input type="checkbox" checked={form.remotePreference} onChange={e=>updateField('remotePreference', e.target.checked)} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"/>
                  <span className="ml-2">Remote Preference</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Day Rate (GBP)</label>
                <input type="number" min="0" value={form.dayRate} onChange={e=>updateField('dayRate', e.target.value)} className="w-full rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"/>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Professional Summary</label>
              <textarea rows={6} value={form.summary} onChange={e=>updateField('summary', e.target.value)} className="w-full rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Describe your PMO experience, key achievements, methodologies..." />
              <p className="mt-1 text-xs text-gray-500">Aim for at least 60 characters for better visibility.</p>
            </div>
            {error && <div className="text-sm text-red-600">{error}</div>}
            {success && <div className="text-sm text-green-600">Profile updated successfully.</div>}
            <div className="flex items-center gap-4">
              <button disabled={saving} className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Saving…' : 'Save Changes'}</button>
              <Link href="/dashboard/candidate" className="text-sm text-gray-600 hover:text-gray-800">Back to Dashboard</Link>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
