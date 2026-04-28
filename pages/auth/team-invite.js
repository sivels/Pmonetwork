import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { signIn, useSession } from 'next-auth/react';

export default function TeamInvitePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const token = typeof router.query.token === 'string' ? router.query.token : '';

  const handleAccept = async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/employer/team/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to accept invite');
      }
      router.push(data.redirectTo || '/dashboard/employer');
    } catch (e) {
      setError(e.message || 'Failed to accept invite');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = () => {
    const callbackUrl = `${window.location.origin}/auth/team-invite?token=${encodeURIComponent(token)}`;
    signIn(undefined, { callbackUrl });
  };

  return (
    <>
      <Head>
        <title>Team Invite – PMO Network</title>
      </Head>
      <div style={{ maxWidth: 640, margin: '80px auto', padding: 24, background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb' }}>
        <h1 style={{ marginTop: 0 }}>You’ve been invited to a company team</h1>
        <p>Accept this invitation to access your company workspace and permissions.</p>
        {!token && <p style={{ color: '#dc2626' }}>Missing invite token.</p>}

        {status !== 'authenticated' ? (
          <button onClick={handleSignIn} disabled={!token} style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer' }}>
            Sign in to accept invite
          </button>
        ) : (
          <button onClick={handleAccept} disabled={!token || loading} style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer' }}>
            {loading ? 'Accepting...' : 'Accept team invite'}
          </button>
        )}

        {status === 'authenticated' && (
          <p style={{ marginTop: 12, color: '#6b7280' }}>Signed in as {session.user?.email}</p>
        )}
        {error && <p style={{ marginTop: 12, color: '#dc2626' }}>{error}</p>}
      </div>
    </>
  );
}
