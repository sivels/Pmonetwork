import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { signIn } from 'next-auth/react';

export default function OneClick() {
  const router = useRouter();
  const { token } = router.query;
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    if (!token) return;
    async function doSignIn() {
      setStatus('signing-in');
      const res = await signIn('credentials', { redirect: false, token });
      if (res?.error) {
        setStatus('error');
      } else {
        setStatus('done');
        router.replace('/candidate/dashboard');
      }
    }
    doSignIn();
  }, [token]);

  return (
    <div style={{ maxWidth: 720, margin: '64px auto', padding: 20, textAlign: 'center' }}>
      {status === 'loading' && <p>Preparing one-click sign in…</p>}
      {status === 'signing-in' && <p>Signing you in…</p>}
      {status === 'error' && (
        <div>
          <p style={{ color: 'red' }}>One-click sign-in failed or the token has expired.</p>
          <p><a href="/auth/login">Sign in manually</a></p>
        </div>
      )}
    </div>
  );
}
