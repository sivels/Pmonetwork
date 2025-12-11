import "../styles/globals.css";
import Layout from '../components/Layout';
import { SessionProvider } from 'next-auth/react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

const ToastContainer = dynamic(() => import('../components/realtime/toast').then(m => ({ default: m.ToastContainer })), { ssr: false });

export default function App({ Component, pageProps }) {
  const router = useRouter();
  
  // Pages that manage their own layout (full-page editors)
  const noLayoutPaths = [
    '/dashboard/profile', 
    '/employer/profile'
  ];
  const skipLayout = noLayoutPaths.includes(router.pathname);

  return (
    <SessionProvider session={pageProps.session}>
      <ToastContainer />
      {skipLayout ? (
        <Component {...pageProps} />
      ) : (
        <Layout>
          <Component {...pageProps} />
        </Layout>
      )}
    </SessionProvider>
  );
}
