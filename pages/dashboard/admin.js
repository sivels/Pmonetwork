import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) router.replace('/auth/login');
    else if (session.user.role !== 'ADMIN') router.replace('/dashboard');
  }, [session, status, router]);

  return (
    <div style={{ maxWidth: 800, margin: '48px auto', padding: 16 }}>
      <h1>Admin Dashboard</h1>
      <p>Welcome, admin user!</p>
      <button onClick={() => signOut()}>Sign out</button>
    </div>
  );
}
