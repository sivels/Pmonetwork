import "../styles/globals.css";
import Layout from '../components/Layout';
import { SessionProvider } from 'next-auth/react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

// Suppress hydration mismatch warnings for authenticated layouts
if (typeof window !== 'undefined') {
  const originalError = console.error;
  console.error = function(...args) {
    if (
      args[0]?.includes?.('Hydration failed') ||
      args[0]?.includes?.('hydration mismatch')
    ) {
      return;
    }
    originalError.apply(console, args);
  };
}

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
