import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) router.replace('/auth/login');
    else if (session.user.role === 'CANDIDATE') router.replace('/dashboard/candidate');
    else if (session.user.role === 'EMPLOYER') router.replace('/dashboard/employer');
    else if (session.user.role === 'ADMIN') router.replace('/dashboard/admin');
  }, [session, status, router]);

  return <div>Redirecting...</div>;
}
