import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]';

export async function getServerSideProps(ctx) {
  try {
    const session = await getServerSession(ctx.req, ctx.res, authOptions);

    if (!session) {
      return { redirect: { destination: '/auth/login', permanent: false } };
    }

    const role = (session.user?.role || '').toLowerCase();

    if (role !== 'candidate') {
      return { redirect: { destination: '/dashboard', permanent: false } };
    }

    return {
      redirect: {
        destination: '/candidate/interviews',
        permanent: false,
      },
    };
  } catch (error) {
    console.error('Error in getServerSideProps for interviews:', error);
    return { redirect: { destination: '/auth/login', permanent: false } };
  }
}

export default function DashboardInterviewsRedirect() {
  return null;
}
