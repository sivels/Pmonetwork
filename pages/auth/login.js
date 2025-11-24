import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (router.query?.verified) {
      setVerified(true);
    }
  }, [router.query]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn('credentials', { redirect: false, email, password });
    setLoading(false);
    if (res?.error) {
      setError(res.error);
    } else {
      // After successful sign-in, take the user to their candidate dashboard
      router.push('/candidate/dashboard');
    }
  }

  return (
    <div style={{ maxWidth: 560, margin: '48px auto', padding: 16 }}>
      <h1>Sign in</h1>
      {verified && (
        <div style={{ background: '#e6ffed', border: '1px solid #b7f2c7', padding: 10, borderRadius: 6, marginBottom: 12 }}>
          Email verified — you can now sign in. Welcome!
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <label>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />

        <label>Password</label>
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />

        <div style={{ marginTop: 12 }}>
          <button type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
        </div>
      </form>
      <div style={{ marginTop: 12 }}>
        <a href="/auth/register">Create an account</a> · <a href="/reset">Forgot password?</a>
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div style={{ marginTop: 32, textAlign: 'center' }}>
        <img src="/E5855767-DEB2-4D3B-8C0C-99C4E79163C4.PNG" alt="Login illustration" style={{ maxWidth: '100%', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }} />
      </div>
    </div>
  );
}
