import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Register() {
  const router = useRouter();
  const [userType, setUserType] = useState('CANDIDATE');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('error');

  // Common fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Candidate fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [skills, setSkills] = useState([]);
  const [linkedIn, setLinkedIn] = useState('');

  // Employer fields
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('');
  const [hiresExpected, setHiresExpected] = useState('');
  
  // Payment fields (employer)
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [gdprConsent, setGdprConsent] = useState(false);

  // Password strength
  const [passwordStrength, setPasswordStrength] = useState('');
  const returnTo = typeof router.query.returnTo === 'string' ? router.query.returnTo : '';

  const skillOptions = [
    'PMO Setup & Governance',
    'Portfolio Management',
    'Programme Management',
    'Project Management',
    'Risk Management',
    'Change Management',
    'Agile & Scrum',
    'Waterfall Methodology',
    'PRINCE2',
    'PMI / PMP',
    'Resource Management',
    'Financial Management',
    'Stakeholder Engagement',
    'Reporting & Analytics',
    'Microsoft Project',
    'Jira / Confluence',
    'Monday.com',
    'Power BI'
  ];

  const handlePasswordChange = (value) => {
    setPassword(value);
    // Calculate password strength
    if (value.length < 6) {
      setPasswordStrength('weak');
    } else if (value.length < 10) {
      setPasswordStrength('medium');
    } else if (value.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)) {
      setPasswordStrength('strong');
    } else {
      setPasswordStrength('medium');
    }
  };

  const handleSkillToggle = (skill) => {
    setSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const handleUserTypeSwitch = (type) => {
    setUserType(type);
    setMessage(null);
  };

  const validateForm = () => {
    // Common validation
    if (!email || !password || !confirmPassword) {
      setMessage('Please fill in all required fields');
      return false;
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      return false;
    }

    if (password.length < 8) {
      setMessage('Password must be at least 8 characters');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage('Please enter a valid email address');
      return false;
    }

    if (!termsAccepted) {
      setMessage('You must accept the Terms & Conditions');
      return false;
    }

    if (!gdprConsent) {
      setMessage('You must provide GDPR consent to proceed');
      return false;
    }

    // Candidate validation
    if (userType === 'CANDIDATE') {
      if (!firstName || !lastName || !jobTitle) {
        setMessage('Please fill in all required candidate fields');
        return false;
      }
    }

    // Employer validation
    if (userType === 'EMPLOYER') {
      if (!companyName || !contactName || !contactPhone) {
        setMessage('Please fill in all required company fields');
        return false;
      }
      // Payment validation for trial start
      if (!cardholderName || !cardNumber || !expiryDate || !cvv) {
        setMessage('Please complete payment details to start your free trial');
        return false;
      }
      if (cardNumber.replace(/\s/g, '').length < 15) {
        setMessage('Please enter a valid card number');
        return false;
      }
      if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
        setMessage('Expiry date must be in MM/YY format');
        return false;
      }
      if (!/^\d{3,4}$/.test(cvv)) {
        setMessage('Please enter a valid CVV');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!validateForm()) {
      setMessageType('error');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        email,
        password,
        role: userType,
        termsAccepted,
        gdprConsent,
        ...(userType === 'CANDIDATE' ? {
          firstName,
          lastName,
          phone,
          jobTitle,
          yearsExperience: parseInt(yearsExperience) || null,
          skills,
          linkedIn
        } : {
          companyName,
          contactName,
          contactPhone,
          website,
          industry,
          hiresExpected,
          payment: {
            cardholderName,
            cardLast4: cardNumber.slice(-4),
            expiryDate
            // In production, use Stripe.js to tokenize card before sending
          }
        })
      };

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessageType('error');
        setMessage(data.error || 'Registration failed. Please try again.');
      } else {
        setMessageType('success');
        setMessage(
          userType === 'CANDIDATE' 
            ? 'Registration successful! Check your email to verify your account.' 
            : 'Your free trial has started! Check your email for confirmation. Your $1,000/month subscription will begin after 7 days.'
        );
        
        // Redirect after success
        setTimeout(() => {
          if (returnTo) {
            router.push(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
          } else {
            router.push('/auth/login');
          }
        }, 3000);
      }
    } catch (err) {
      setMessageType('error');
      setMessage('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Register – Join PMO Network</title>
        <meta name="description" content="Join PMO Network – Free for PMO professionals, premium for employers. Create your profile or start hiring today and access the best PMO talent." />
        <meta name="keywords" content="PMO Network registration, PMO jobs signup, PMO recruitment register, hire PMO talent, PMO careers" />
        <link rel="canonical" href="https://www.pmonetwork.example/auth/register" />
      </Head>

      <div className="register-page">
        {/* Hero Section */}
        <div className="register-hero-section">
          <div className="register-hero-content">
            <h1 className="register-hero-title">Join PMO Network</h1>
            <p className="register-hero-subtitle">
              Free for Candidates, Premium for Employers
            </p>
            <p className="register-hero-description">
              Create your profile or start hiring today and access the best PMO talent.
            </p>
            
            {/* Visual Illustration Placeholder */}
            <div className="register-hero-visual">
              <div className="hero-side candidate-side">
                <svg className="hero-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <p className="hero-label">PMO Professionals</p>
              </div>
              <div className="hero-divider">→</div>
              <div className="hero-side employer-side">
                <svg className="hero-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <p className="hero-label">Hiring Companies</p>
              </div>
            </div>
          </div>
        </div>

        {/* Registration Form Container */}
        <div className="register-form-container">
          {/* User Type Selector */}
          <div className="user-type-selector">
            <button
              type="button"
              className={`user-type-btn ${userType === 'CANDIDATE' ? 'active candidate' : ''}`}
              onClick={() => handleUserTypeSwitch('CANDIDATE')}
              aria-pressed={userType === 'CANDIDATE'}
            >
              <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              I'm a Candidate
            </button>
            <button
              type="button"
              className={`user-type-btn ${userType === 'EMPLOYER' ? 'active employer' : ''}`}
              onClick={() => handleUserTypeSwitch('EMPLOYER')}
              aria-pressed={userType === 'EMPLOYER'}
            >
              <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              I'm an Employer
            </button>
          </div>

          {/* Message Display */}
          {message && (
            <div className={`register-message ${messageType}`} role="alert">
              <div className="message-icon">
                {messageType === 'success' ? '✓' : '⚠'}
              </div>
              <p>{message}</p>
            </div>
          )}

          {/* Dynamic Form */}
          <form onSubmit={handleSubmit} className="register-form" noValidate>
            {userType === 'CANDIDATE' ? (
              // CANDIDATE FORM
              <div className="form-section candidate-form animate-fadeIn">
                <h2 className="form-section-title">Create Your Free PMO Profile</h2>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">First Name <span className="required">*</span></label>
                    <input
                      type="text"
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="lastName">Last Name <span className="required">*</span></label>
                    <input
                      type="text"
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address <span className="required">*</span></label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="password">Password <span className="required">*</span></label>
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      required
                      className="form-input"
                      minLength={8}
                    />
                    {password && (
                      <div className={`password-strength ${passwordStrength}`}>
                        <div className="strength-bar"></div>
                        <span className="strength-label">{passwordStrength}</span>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm Password <span className="required">*</span></label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone Number <span className="optional">(optional)</span></label>
                  <input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="jobTitle">PMO Role / Current Job Title <span className="required">*</span></label>
                  <input
                    type="text"
                    id="jobTitle"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g., Senior PMO Analyst, Programme Manager"
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="yearsExperience">Years of PMO Experience</label>
                  <select
                    id="yearsExperience"
                    value={yearsExperience}
                    onChange={(e) => setYearsExperience(e.target.value)}
                    className="form-input"
                  >
                    <option value="">Select years</option>
                    <option value="0">0-1 years</option>
                    <option value="2">2-3 years</option>
                    <option value="4">4-5 years</option>
                    <option value="6">6-10 years</option>
                    <option value="11">11+ years</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Key Skills / Specializations</label>
                  <p className="field-hint">Select all that apply</p>
                  <div className="skills-grid">
                    {skillOptions.map(skill => (
                      <button
                        key={skill}
                        type="button"
                        className={`skill-tag ${skills.includes(skill) ? 'selected' : ''}`}
                        onClick={() => handleSkillToggle(skill)}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="linkedIn">LinkedIn Profile <span className="optional">(optional)</span></label>
                  <input
                    type="url"
                    id="linkedIn"
                    value={linkedIn}
                    onChange={(e) => setLinkedIn(e.target.value)}
                    placeholder="https://linkedin.com/in/yourprofile"
                    className="form-input"
                  />
                </div>

                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      required
                    />
                    <span>I accept the <a href="/terms" target="_blank">Terms & Conditions</a> <span className="required">*</span></span>
                  </label>
                </div>

                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={gdprConsent}
                      onChange={(e) => setGdprConsent(e.target.checked)}
                      required
                    />
                    <span>I consent to PMO Network processing my personal data as outlined in the <a href="/privacy" target="_blank">Privacy Policy</a> <span className="required">*</span></span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="submit-btn candidate-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <svg className="spinner" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Account...
                    </>
                  ) : 'Create My Free Profile'}
                </button>
              </div>
            ) : (
              // EMPLOYER FORM
              <div className="form-section employer-form animate-fadeIn">
                <h2 className="form-section-title">Start Your 7-Day Free Trial</h2>
                <p className="trial-info">
                  Enter your details and payment information to start your free trial. Your $1,000/month subscription will begin automatically after 7 days.
                </p>

                <h3 className="subsection-title">Company Information</h3>

                <div className="form-group">
                  <label htmlFor="companyName">Company Name <span className="required">*</span></label>
                  <input
                    type="text"
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="companyEmail">Company Email <span className="required">*</span></label>
                  <input
                    type="email"
                    id="companyEmail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="contactName">Contact Name <span className="required">*</span></label>
                    <input
                      type="text"
                      id="contactName"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      required
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="contactPhone">Contact Phone <span className="required">*</span></label>
                    <input
                      type="tel"
                      id="contactPhone"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      required
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="password">Password <span className="required">*</span></label>
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      required
                      className="form-input"
                      minLength={8}
                    />
                    {password && (
                      <div className={`password-strength ${passwordStrength}`}>
                        <div className="strength-bar"></div>
                        <span className="strength-label">{passwordStrength}</span>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm Password <span className="required">*</span></label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="website">Company Website</label>
                    <input
                      type="url"
                      id="website"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://yourcompany.com"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="industry">Industry / Sector</label>
                    <input
                      type="text"
                      id="industry"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      placeholder="e.g., Financial Services, Technology"
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="hiresExpected">Monthly Expected Hires <span className="optional">(optional)</span></label>
                  <select
                    id="hiresExpected"
                    value={hiresExpected}
                    onChange={(e) => setHiresExpected(e.target.value)}
                    className="form-input"
                  >
                    <option value="">Select monthly estimate</option>
                    <option value="1-3">1–3 / month</option>
                    <option value="4-10">4–10 / month</option>
                    <option value="11-20">11–20 / month</option>
                    <option value="20+">20+ / month</option>
                  </select>
                  <p className="field-hint">Used to tailor candidate recommendations to your hiring velocity.</p>
                </div>

                <h3 className="subsection-title payment-section-title">Payment Information</h3>
                <div className="payment-notice">
                  <svg className="info-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <p>Your card will not be charged during the 7-day free trial. Subscription billing begins automatically at $1,000/month after trial period.</p>
                </div>

                <div className="form-group">
                  <label htmlFor="cardholderName">Cardholder Name <span className="required">*</span></label>
                  <input
                    type="text"
                    id="cardholderName"
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="cardNumber">Card Number <span className="required">*</span></label>
                  <input
                    type="text"
                    id="cardNumber"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    required
                    className="form-input"
                  />
                  <p className="field-hint">In production, this will use Stripe.js for secure tokenization</p>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="expiryDate">Expiry Date <span className="required">*</span></label>
                    <input
                      type="text"
                      id="expiryDate"
                      value={expiryDate}
                      onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, '');
                        if (val.length >= 2) val = val.slice(0, 2) + '/' + val.slice(2, 4);
                        setExpiryDate(val);
                      }}
                      placeholder="MM/YY"
                      maxLength={5}
                      required
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="cvv">CVV <span className="required">*</span></label>
                    <input
                      type="text"
                      id="cvv"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                      placeholder="123"
                      maxLength={4}
                      required
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      required
                    />
                    <span>I accept the <a href="/terms" target="_blank">Terms & Conditions</a> <span className="required">*</span></span>
                  </label>
                </div>

                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={gdprConsent}
                      onChange={(e) => setGdprConsent(e.target.checked)}
                      required
                    />
                    <span>I consent to PMO Network processing my data as outlined in the <a href="/privacy" target="_blank">Privacy Policy</a> <span className="required">*</span></span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="submit-btn employer-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <svg className="spinner" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Starting Trial...
                    </>
                  ) : 'Start Free Trial'}
                </button>
              </div>
            )}

            <p className="form-footer">
              Already have an account? <a href={`/auth/login${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`}>Sign in here</a>
            </p>
          </form>
        </div>
      </div>
    </>
  );
}
