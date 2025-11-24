import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProfileOverview from '../../components/dashboard/ProfileOverviewCard';
import ProfileHealth from '../../components/dashboard/ProfileHealth';
import ApplicationsList from '../../components/dashboard/ApplicationsList';
import ProfileViews from '../../components/dashboard/ProfileViews';
import DocumentRepository from '../../components/dashboard/DocumentRepository';
import SidebarNav from '../../components/dashboard/SidebarNav';
import { getToken } from 'next-auth/jwt';
import prisma from '../../lib/prisma';

const DASHBOARD_API = '/api/dashboard/mock';

export default function CandidateDashboard({ initialData }) {
  const [data, setData] = useState(initialData || null);
  const [loading, setLoading] = useState(!initialData);

  useEffect(() => {
    // fallback client-side fetch if no initial data
    if (!initialData) {
      async function load() {
        setLoading(true);
        try {
          const res = await fetch(DASHBOARD_API);
          const json = await res.json();
          setData(json);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
      load();
    }
  }, [initialData]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">
          <aside className="w-64 hidden lg:block">
            <SidebarNav />
          </aside>

          <main className="flex-1">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
                <div className="flex gap-3">
                  <Link href="/candidate/profile" className="px-4 py-2 bg-white border rounded shadow-sm text-sm">Edit / Design Profile</Link>
                  <Link href="/candidate/profile" className="px-4 py-2 bg-blue-600 text-white rounded text-sm">Preview Profile</Link>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <ProfileOverview profile={data?.profile} />
                <ProfileHealth profile={data?.profile} />
                <ApplicationsList items={data?.applications} />
                <DocumentRepository docs={data?.documents} />
              </div>

              <div className="space-y-6">
                <ProfileViews views={data?.profile_views} />
                <div className="bg-white rounded-lg shadow p-4">
                  <h3 className="text-lg font-semibold mb-2">Quick Actions</h3>
                  <div className="flex flex-col gap-3">
                    <Link href="/candidate/profile" className="px-3 py-2 bg-blue-600 text-white rounded text-center">Edit Profile</Link>
                    <Link href="/candidate/profile" className="px-3 py-2 border rounded text-center">Preview Public Profile</Link>
                    <button className="px-3 py-2 bg-white border rounded text-left">Account Settings</button>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps(context) {
  // Verify the user is authenticated using NextAuth JWT token
  const token = await getToken({ req: context.req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false,
      },
    };
  }

  // Enforce role: only candidates should access this page
  const role = (token.role || '').toString().toLowerCase();
  if (role !== 'candidate' && role !== 'candidate') {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }
  // Try to load the real candidate profile from Prisma
  try {
    const candidate = await prisma.candidateProfile.findUnique({
      where: { userId: token.id },
      include: { documents: true },
    });

    if (!candidate) {
      // If the candidate has no profile yet, send them to the profile editor
      return {
        redirect: {
          destination: '/candidate/profile',
          permanent: false,
        },
      };
    }

    // Build a minimal dashboard payload similar to the mock API shape
    const payload = {
      profile: {
        id: candidate.id,
        name: candidate.fullName,
        title: candidate.jobTitle || '',
        location: candidate.location || '',
        summary: candidate.summary || '',
        readiness: 70,
        skills: [],
      },
      profile_views: { last_30_days: 0, trending_companies: [] },
      applications: [],
      documents: (candidate.documents || []).map(d => ({ id: d.id, name: d.filename, type: 'Document', uploadedAt: d.uploadedAt?.toISOString?.() || null })),
    };

    return { props: { initialData: payload } };
  } catch (err) {
    console.error('Error fetching candidate profile:', err);
    return { props: { initialData: null } };
  }
}
