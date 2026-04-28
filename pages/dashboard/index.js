import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'SUPPORT_MANAGER', 'SUPPORT_AGENT'];

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) router.replace('/auth/login');
    else if (ADMIN_ROLES.includes((session.user.role || '').toUpperCase())) router.replace('/dashboard/admin');
    else if ((session.user.role || '').toUpperCase() === 'EMPLOYER') router.replace('/dashboard/employer');
    else router.replace('/dashboard/candidate');
  }, [session, status, router]);

  return <div>Redirecting...</div>;
}
