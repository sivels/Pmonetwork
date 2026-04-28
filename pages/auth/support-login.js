import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { signIn, getSession } from 'next-auth/react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]';

export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions);
  const adminRoles = ['SUPER_ADMIN', 'ADMIN', 'SUPPORT_MANAGER', 'SUPPORT_AGENT'];
  if (session && adminRoles.includes(session.user?.role)) {
    return { redirect: { destination: '/dashboard/admin', permanent: false } };
  }
  return { props: {} };
}

export default function SupportLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn('credentials', {
      redirect: false,
      email,
      password,
      callbackUrl: '/dashboard/admin',
    });

    if (res?.error) {
      setError(
        res.error === 'CredentialsSignin'
          ? 'Invalid email or password.'
          : res.error
      );
      setLoading(false);
      return;
    }

    // Verify the session has an admin/support role
    const session = await getSession();
    const adminRoles = ['SUPER_ADMIN', 'ADMIN', 'SUPPORT_MANAGER', 'SUPPORT_AGENT'];
    if (!session || !adminRoles.includes(session.user?.role)) {
      setError('Access denied. This portal is for support staff only.');
      setLoading(false);
      return;
    }

    router.push('/dashboard/admin');
  };

  return (
    <>
      <Head>
        <title>Support Portal Login – PMO Network</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div style={styles.page}>
        <div style={styles.card}>
          {/* Logo / Branding */}
          <div style={styles.header}>
            <div style={styles.shieldIcon}>
              <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955
                     11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824
                     10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h1 style={styles.title}>Support Portal</h1>
            <p style={styles.subtitle}>PMO Network · Staff Access Only</p>
          </div>

          {/* Error */}
          {error && (
            <div style={styles.errorBox} role="alert">
              <span style={styles.errorIcon}>⚠</span>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            <div style={styles.field}>
              <label style={styles.label} htmlFor="email">Staff Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                style={styles.input}
                placeholder="you@pmonetwork.com"
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label} htmlFor="password">Password</label>
              <div style={styles.passwordWrapper}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{ ...styles.input, paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  style={styles.eyeBtn}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={loading ? { ...styles.submitBtn, ...styles.submitBtnDisabled } : styles.submitBtn}
            >
              {loading ? (
                <span style={styles.loadingRow}>
                  <span style={styles.spinner} /> Authenticating…
                </span>
              ) : (
                'Sign In to Support Portal'
              )}
            </button>
          </form>

          {/* Footer */}
          <div style={styles.footer}>
            <a href="/auth/forgot-password" style={styles.footerLink}>Forgot password?</a>
            <span style={styles.footerDot}>·</span>
            <a href="/auth/login" style={styles.footerLink}>Back to main login</a>
          </div>

          <p style={styles.notice}>
            Unauthorised access attempts are logged and monitored.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
    padding: '1rem',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  card: {
    background: '#fff',
    borderRadius: '16px',
    padding: '2.5rem',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  shieldIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #1e40af, #7c3aed)',
    color: '#fff',
    marginBottom: '1rem',
  },
  title: {
    fontSize: '1.6rem',
    fontWeight: 700,
    color: '#0f172a',
    margin: '0 0 0.25rem',
  },
  subtitle: {
    fontSize: '0.85rem',
    color: '#64748b',
    margin: 0,
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#dc2626',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    marginBottom: '1.25rem',
    fontSize: '0.9rem',
  },
  errorIcon: {
    fontSize: '1rem',
    flexShrink: 0,
  },
  field: {
    marginBottom: '1.25rem',
  },
  label: {
    display: 'block',
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '0.4rem',
  },
  input: {
    width: '100%',
    padding: '0.65rem 0.875rem',
    border: '1.5px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '0.95rem',
    color: '#111827',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  },
  passwordWrapper: {
    position: 'relative',
  },
  eyeBtn: {
    position: 'absolute',
    right: '0.75rem',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    padding: '0',
    lineHeight: 1,
  },
  submitBtn: {
    width: '100%',
    padding: '0.8rem',
    background: 'linear-gradient(135deg, #1e40af, #7c3aed)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '0.5rem',
    transition: 'opacity 0.15s',
  },
  submitBtnDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  loadingRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
  },
  spinner: {
    display: 'inline-block',
    width: '14px',
    height: '14px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },
  footer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '0.5rem',
    marginTop: '1.5rem',
    fontSize: '0.85rem',
  },
  footerLink: {
    color: '#4f46e5',
    textDecoration: 'none',
  },
  footerDot: {
    color: '#9ca3af',
  },
  notice: {
    textAlign: 'center',
    fontSize: '0.72rem',
    color: '#9ca3af',
    marginTop: '1.25rem',
    marginBottom: 0,
  },
};
