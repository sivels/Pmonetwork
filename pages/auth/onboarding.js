import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';

export default function Onboarding() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [role, setRole] = useState('CANDIDATE');
  const [fullName, setFullName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('info');

  const returnTo = typeof router.query.returnTo === 'string' ? router.query.returnTo : '';

  // If user already onboarded, redirect to appropriate dashboard or returnTo
  useEffect(() => {
    if (status === 'authenticated' && session && !session.user.onboardingNeeded) {
      const userRole = (session.user.role || '').toLowerCase();
      
      // Only use returnTo if it's a job URL and user is a candidate
      if (returnTo && returnTo.includes('/jobs/') && userRole === 'candidate') {
        router.replace(`${returnTo}?apply=1`);
      } else if (userRole === 'employer') {
        router.replace('/dashboard/employer');
      } else if (userRole === 'candidate') {
        router.replace('/dashboard/candidate');
      } else {
        router.replace('/');
      }
    }
  }, [status, session, returnTo, router]);

  if (status === 'loading') return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, fullName, jobTitle, companyName, contactName })
      });
      const data = await res.json();
      if (!res.ok) {
        setMessageType('error');
        setMessage(data.error || 'Could not complete onboarding');
      } else {
        setMessageType('success');
        setMessage('Profile created. Redirecting...');
        setTimeout(() => {
          // Only redirect to returnTo if it's a job URL and user is a candidate
          if (returnTo && returnTo.includes('/jobs/') && role === 'CANDIDATE') {
            router.push(`${returnTo}?apply=1`);
          } else if (role === 'EMPLOYER') {
            router.push('/dashboard/employer');
          } else {
            router.push('/dashboard/candidate');
          }
        }, 1200);
      }
    } catch (err) {
      setMessageType('error');
      setMessage('Network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Onboarding – PMO Network</title>
        <meta name="description" content="Complete your PMO Network profile to get started." />
      </Head>
      <div className="register-page login-page">
        <div className="register-hero-section login-hero-section">
          <div className="register-hero-content">
            <h1 className="register-hero-title">Finish Setting Up Your Account</h1>
            <p className="register-hero-subtitle">Choose your role and add basic profile details.</p>
            <p className="register-hero-description">This quick step helps tailor your experience.</p>
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
              <h2 className="form-section-title">Select Account Type</h2>
              <div className="user-type-selector" style={{ marginBottom: '1.25rem' }}>
                <button type="button" className={`user-type-btn ${role === 'CANDIDATE' ? 'active candidate' : ''}`} onClick={() => setRole('CANDIDATE')}>Candidate</button>
                <button type="button" className={`user-type-btn ${role === 'EMPLOYER' ? 'active employer' : ''}`} onClick={() => setRole('EMPLOYER')}>Hiring Company</button>
              </div>

              {role === 'CANDIDATE' ? (
                <>
                  <div className="form-group">
                    <label htmlFor="fullName">Full Name <span className="required">*</span></label>
                    <input id="fullName" className="form-input" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="jobTitle">PMO Role / Job Title</label>
                    <input id="jobTitle" className="form-input" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label htmlFor="companyName">Company Name <span className="required">*</span></label>
                    <input id="companyName" className="form-input" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="contactName">Primary Contact Name <span className="required">*</span></label>
                    <input id="contactName" className="form-input" value={contactName} onChange={(e) => setContactName(e.target.value)} required />
                  </div>
                </>
              )}

              <button type="submit" className={`submit-btn ${role === 'EMPLOYER' ? 'employer-btn' : 'candidate-btn'}`} disabled={loading || (role === 'CANDIDATE' ? !fullName : (!companyName || !contactName))}>
                {loading ? 'Saving…' : 'Complete Onboarding'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
