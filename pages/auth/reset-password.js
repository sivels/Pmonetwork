import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function ResetPassword() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('info');

  useEffect(() => {
    if (router.query.token && typeof router.query.token === 'string') {
      setToken(router.query.token);
    }
  }, [router.query]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (!token) {
      setMessageType('error');
      setMessage('Missing reset token. Use the link from your email.');
      return;
    }
    if (password !== confirm) {
      setMessageType('error');
      setMessage('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setMessageType('error');
      setMessage('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessageType('error');
        setMessage(data.error || 'Reset failed');
      } else {
        setMessageType('success');
        setMessage('Password updated. Redirecting to login...');
        setTimeout(() => router.push('/auth/login'), 1500);
      }
    } catch (err) {
      setMessageType('error');
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Reset Password – PMO Network</title>
        <meta name="description" content="Enter a new password to complete your PMO Network password reset." />
        <link rel="canonical" href="https://www.pmonetwork.example/auth/reset-password" />
      </Head>
      <div className="register-page login-page">
        <div className="register-hero-section login-hero-section">
          <div className="register-hero-content">
            <h1 className="register-hero-title">Set a New Password</h1>
            <p className="register-hero-subtitle">Choose a strong password to secure your account.</p>
            <p className="register-hero-description">Password must be at least 8 characters. Avoid reuse of old passwords.</p>
          </div>
        </div>
        <div className="register-form-container login-form-container">
          {message && (
            <div className={`register-message ${messageType}`} role="alert">
              <div className="message-icon">{messageType === 'success' ? '✓' : messageType === 'error' ? '⚠' : 'ℹ'}</div>
              <p>{message}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="register-form" noValidate>
            <div className="form-section candidate-form animate-fadeIn">
              <h2 className="form-section-title">Enter New Password</h2>
              <div className="form-group">
                <label htmlFor="password">New Password <span className="required">*</span></label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="form-input"
                  minLength={8}
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirm">Confirm Password <span className="required">*</span></label>
                <input
                  type="password"
                  id="confirm"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  className="form-input"
                  minLength={8}
                />
              </div>
              <button type="submit" className="submit-btn candidate-btn" disabled={loading}>{loading ? 'Updating…' : 'Update Password'}</button>
              <p className="form-footer"><a href="/auth/login">Return to Login</a></p>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
