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

    if (!gdprConsent) {
      setMessage('You must provide consent to proceed');
      return false;
    }

    // Candidate validation
    if (userType === 'CANDIDATE') {
      if (!termsAccepted) {
        setMessage('You must accept the Terms & Conditions');
        return false;
      }
      if (!firstName || !lastName || !jobTitle) {
        setMessage('Please fill in all required candidate fields');
        return false;
      }
    }

    // Employer contact validation
    if (userType === 'EMPLOYER') {
      if (!companyName || !contactName || !contactPhone) {
        setMessage('Please fill in all required fields');
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
          message: website,
          industry,
          hiresExpected
        })
      };

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Server error' }));
        setMessageType('error');
        setMessage(data.error || data.details || 'Registration failed. Please try again.');
        return;
      }

      const data = await res.json();
      setMessageType('success');
      setMessage(
        userType === 'CANDIDATE' 
          ? 'Registration successful! Check your email to verify your account.' 
          : 'Thank you for your enquiry! Our team will be in touch with you shortly to discuss your hiring needs.'
      );
      
      // Redirect after success
      setTimeout(() => {
        if (returnTo) {
          router.push(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
        } else {
          router.push('/auth/login');
        }
      }, 3000);
    } catch (err) {
      console.error('Registration error:', err);
      setMessageType('error');
      setMessage(`Network error: ${err.message}. Please check your connection and try again.`);
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
              // EMPLOYER CONTACT FORM
              <div className="form-section employer-form animate-fadeIn">
                <h2 className="form-section-title">Interested in Hiring PMO Talent?</h2>
                <p className="trial-info">
                  We'd love to hear from you! Please fill out the contact form below and our team will get in touch to discuss how PMO Network can help you find the perfect candidates.
                </p>

                <div className="form-group">
                  <label htmlFor="contactName">Your Name <span className="required">*</span></label>
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
                  <label htmlFor="contactPhone">Phone Number <span className="required">*</span></label>
                  <input
                    type="tel"
                    id="contactPhone"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="industry">Industry / Sector <span className="optional">(optional)</span></label>
                  <input
                    type="text"
                    id="industry"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="e.g., Financial Services, Technology"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="hiresExpected">Hiring Needs <span className="optional">(optional)</span></label>
                  <select
                    id="hiresExpected"
                    value={hiresExpected}
                    onChange={(e) => setHiresExpected(e.target.value)}
                    className="form-input"
                  >
                    <option value="">Select your hiring needs</option>
                    <option value="1-3">1–3 positions</option>
                    <option value="4-10">4–10 positions</option>
                    <option value="11-20">11–20 positions</option>
                    <option value="20+">20+ positions</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="message">Message <span className="optional">(optional)</span></label>
                  <textarea
                    id="message"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="Tell us about your hiring requirements..."
                    rows="5"
                    className="form-input"
                  />
                </div>

                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={gdprConsent}
                      onChange={(e) => setGdprConsent(e.target.checked)}
                      required
                    />
                    <span>I consent to PMO Network contacting me about their services <span className="required">*</span></span>
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
                      Sending...
                    </>
                  ) : 'Submit Enquiry'}
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
