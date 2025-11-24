import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function CandidateDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) router.replace('/auth/login');
    else if (session.user.role !== 'CANDIDATE') router.replace('/dashboard');
    else fetchProfile();
    // eslint-disable-next-line
  }, [session, status]);

  async function fetchProfile() {
    setLoading(true);
    const res = await fetch('/api/candidate/profile');
    if (res.ok) setProfile(await res.json());
    setLoading(false);
  }

  if (loading) return <div>Loading...</div>;
  if (!profile) return <div>No profile found.</div>;

  return (
    <div style={{ maxWidth: 800, margin: '48px auto', padding: 16 }}>
      <h1>Candidate Dashboard</h1>
      <p>Welcome, {profile.fullName || session.user.email}!</p>
      <pre style={{ background: '#f4f4f4', padding: 12 }}>{JSON.stringify(profile, null, 2)}</pre>
      <button onClick={() => signOut()}>Sign out</button>
    </div>
  );
}
