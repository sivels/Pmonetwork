import { useState } from 'react';
import Head from 'next/head';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('info');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessageType('error');
        setMessage(data.error || 'Unable to process request');
      } else {
        setMessageType('success');
        setMessage(data.message);
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
        <title>Forgot Password – PMO Network</title>
        <meta name="description" content="Reset your PMO Network password – request a secure email link." />
        <link rel="canonical" href="https://www.pmonetwork.example/auth/forgot-password" />
      </Head>
      <div className="register-page login-page">
        <div className="register-hero-section login-hero-section">
          <div className="register-hero-content">
            <h1 className="register-hero-title">Forgot Your Password?</h1>
            <p className="register-hero-subtitle">Enter your email to receive a secure reset link.</p>
            <p className="register-hero-description">For security, we’ll only say a link was sent if the email exists.</p>
          </div>
        </div>
        <div className="register-form-container login-form-container">
          {message && (
            <div className={`register-message ${messageType}`} role="alert">
              <div className="message-icon">{messageType === 'success' ? '✓' : 'ℹ'}</div>
              <p>{message}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="register-form" noValidate>
            <div className="form-section candidate-form animate-fadeIn">
              <h2 className="form-section-title">Request Password Reset</h2>
              <div className="form-group">
                <label htmlFor="email">Email Address <span className="required">*</span></label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="form-input"
                  autoComplete="email"
                />
              </div>
              <button type="submit" className="submit-btn candidate-btn" disabled={loading}>{loading ? 'Sending…' : 'Send Reset Link'}</button>
              <p className="form-footer">Remembered? <a href="/auth/login">Return to Login</a></p>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
