import { useSession } from 'next-auth/react';

export default function SessionDebug() {
  const { data: session, status } = useSession();
  
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Session Debug</h1>
      <p><strong>Status:</strong> {status}</p>
      {session && (
        <>
          <p><strong>Email:</strong> {session.user?.email}</p>
          <p><strong>Role:</strong> {session.user?.role}</p>
          <p><strong>Role Type:</strong> {typeof session.user?.role}</p>
          <p><strong>Role toLowerCase:</strong> {session.user?.role?.toLowerCase()}</p>
          <p><strong>Onboarding Needed:</strong> {String(session.user?.onboardingNeeded)}</p>
          <hr />
          <p><strong>Dashboard Link Would Be:</strong></p>
          <p>{session.user?.role?.toLowerCase() === 'employer' ? '/dashboard/employer' : '/dashboard/candidate'}</p>
          <hr />
          <pre>{JSON.stringify(session, null, 2)}</pre>
        </>
      )}
    </div>
  );
}
