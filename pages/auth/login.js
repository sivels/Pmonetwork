import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { signIn } from 'next-auth/react';

export default function Login() {
  const router = useRouter();
  const [userType, setUserType] = useState('CANDIDATE');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('error');
  const returnTo = typeof router.query.returnTo === 'string' ? router.query.returnTo : '';

  // If we arrived via a returnTo, persist it in sessionStorage to survive OAuth round trips
  useEffect(() => {
    if (returnTo) {
      try { sessionStorage.setItem('pmo_returnTo', returnTo); } catch(_) {}
    }
  }, [returnTo]);

  const handleUserTypeSwitch = (type) => {
    setUserType(type);
    setMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    // Build callbackUrl toward onboarding carrying returnTo (onboarding will decide final redirect)
    const rt = returnTo || sessionStorage.getItem('pmo_returnTo') || '';
    const callbackUrl = rt ? `${window.location.origin}/auth/onboarding?returnTo=${encodeURIComponent(rt)}` : `${window.location.origin}/auth/onboarding`;
    try {
      const res = await signIn('credentials', { redirect: true, email, password, callbackUrl });
      // next-auth handles redirect; if error returned as string in URL we surface message
      if (res && res.error) {
        setMessageType('error');
        setMessage(res.error === 'CredentialsSignin' ? 'Invalid email or password' : res.error);
      } else {
        setMessageType('success');
        setMessage('Authenticating…');
      }
    } catch (err) {
      setMessageType('error');
      setMessage('Network error. Please try again.');
      setLoading(false);
    }
  };

  const oauthSignIn = (provider) => {
    const rt = returnTo || sessionStorage.getItem('pmo_returnTo') || '';
    const callbackUrl = rt ? `${window.location.origin}/auth/onboarding?returnTo=${encodeURIComponent(rt)}` : `${window.location.origin}/auth/onboarding`;
    signIn(provider, { callbackUrl });
  };

  return (
    <>
      <Head>
        <title>Login – PMO Network</title>
        <meta name="description" content="Sign in to PMO Network – access your candidate profile or manage your employer hiring dashboard." />
        <link rel="canonical" href="https://www.pmonetwork.example/auth/login" />
      </Head>
      <div className="register-page login-page">{/* Reuse register styles for consistency */}
        {/* Hero Section */}
        <div className="register-hero-section login-hero-section">
          <div className="register-hero-content">
            <h1 className="register-hero-title">Welcome Back to PMO Network</h1>
            <p className="register-hero-subtitle">Sign in to access your profile or manage your hiring dashboard.</p>
            <p className="register-hero-description">Select your account type below and enter your credentials to continue.</p>
            <div className="register-hero-visual">
              <div className="hero-side candidate-side" aria-hidden="true">
                <svg className="hero-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                <p className="hero-label">Candidates</p>
              </div>
              <div className="hero-divider">↔</div>
              <div className="hero-side employer-side" aria-hidden="true">
                <svg className="hero-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                <p className="hero-label">Hiring Companies</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Container */}
        <div className="register-form-container login-form-container">
          {/* User Type Selector */}
          <div className="user-type-selector">
            <button
              type="button"
              className={`user-type-btn ${userType === 'CANDIDATE' ? 'active candidate' : ''}`}
              onClick={() => handleUserTypeSwitch('CANDIDATE')}
              aria-pressed={userType === 'CANDIDATE'}
            >
              <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              Candidate
            </button>
            <button
              type="button"
              className={`user-type-btn ${userType === 'EMPLOYER' ? 'active employer' : ''}`}
              onClick={() => handleUserTypeSwitch('EMPLOYER')}
              aria-pressed={userType === 'EMPLOYER'}
            >
              <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              Hiring Company
            </button>
          </div>

          {/* Message */}
            {message && (
              <div className={`register-message ${messageType}`} role="alert">
                <div className="message-icon">{messageType === 'success' ? '✓' : '⚠'}</div>
                <p>{message}</p>
              </div>
            )}

          <form onSubmit={handleSubmit} className="register-form" noValidate>
            <div className={`form-section ${userType === 'EMPLOYER' ? 'employer-form' : 'candidate-form'} animate-fadeIn`}>
              <h2 className="form-section-title">Sign In – {userType === 'EMPLOYER' ? 'Employer Account' : 'Candidate Account'}</h2>
              {userType === 'EMPLOYER' ? (
                <p className="trial-info">Access your hiring dashboard, manage postings and view candidate shortlists.</p>
              ) : (
                <p className="trial-info">Access your PMO profile, applications and personalised role matches.</p>
              )}

              <div className="form-group">
                <label htmlFor="email" title={userType === 'EMPLOYER' ? 'Use the company login email you registered with' : 'Use the email you registered your candidate profile with'}>
                  {userType === 'EMPLOYER' ? 'Company Email' : 'Email Address'} <span className="required">*</span>
                </label>
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

              <div className="form-group">
                <label htmlFor="password">Password <span className="required">*</span></label>
                <div className="password-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="form-input"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="password-toggle"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span>Remember me</span>
                  </label>
                </div>
                <div className="form-group forgot-link">
                  <a href="/auth/forgot-password" className="text-sm">Forgot Password?</a>
                </div>
              </div>

              {/* Social Login Placeholders */}
              <div className="social-login-group">
                <p className="social-login-label">Or sign in with</p>
                <div className="social-buttons">
                  <button
                    type="button"
                    className="social-btn linkedin"
                    aria-label="Sign in with LinkedIn"
                    onClick={() => oauthSignIn('linkedin')}
                  >LinkedIn</button>
                  <button
                    type="button"
                    className="social-btn google"
                    aria-label="Sign in with Google"
                    onClick={() => oauthSignIn('google')}
                  >Google</button>
                  {userType === 'EMPLOYER' && (
                    <button
                      type="button"
                      className="social-btn microsoft"
                      aria-label="Sign in with Microsoft"
                      onClick={() => oauthSignIn('azure-ad')}
                    >Microsoft</button>
                  )}
                </div>
              </div>

              <button type="submit" className={`submit-btn ${userType === 'EMPLOYER' ? 'employer-btn' : 'candidate-btn'}`} disabled={loading}>
                {loading ? 'Authenticating…' : 'Sign In'}
              </button>
              <p className="form-footer">Don't have an account? <a href={`/auth/register${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`}>Register here</a></p>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
