import { useState } from 'react';

export default function SocialLinksSection({ profile, onUpdate }) {
  const [form, setForm] = useState({
    linkedinUrl: profile?.linkedinUrl || '',
    portfolioUrl: profile?.portfolioUrl || '',
    githubUrl: profile?.githubUrl || '',
    twitterUrl: profile?.twitterUrl || '',
    websiteUrl: profile?.websiteUrl || ''
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const updateField = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const validateUrl = (url) => {
    if (!url) return true; // Empty is valid
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    // Validate all URLs
    for (const [key, value] of Object.entries(form)) {
      if (value && !validateUrl(value)) {
        setMessage({ type: 'error', text: `Invalid URL for ${key.replace('Url', '')}` });
        setSaving(false);
        return;
      }
    }

    try {
      const res = await fetch('/api/candidate/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (res.ok) {
        const updated = await res.json();
        onUpdate(updated.profile);
        setMessage({ type: 'success', text: 'Social links saved successfully!' });
      } else {
        const error = await res.json();
        setMessage({ type: 'error', text: error.error || 'Failed to save' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-section">
      <div className="section-header">
        <h2 className="section-title">Social Links & Online Presence</h2>
        <p className="section-description">
          Link your professional profiles to help employers learn more about you
        </p>
      </div>

      <form onSubmit={handleSubmit} className="section-form">
        {message && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="social-links-grid">
          {/* LinkedIn */}
          <div className="social-link-item">
            <div className="social-icon" style={{ background: '#0077B5' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"/>
              </svg>
            </div>
            <div className="social-input-wrapper">
              <label className="form-label">LinkedIn Profile</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://linkedin.com/in/yourprofile"
                value={form.linkedinUrl}
                onChange={(e) => updateField('linkedinUrl', e.target.value)}
              />
            </div>
          </div>

          {/* Portfolio */}
          <div className="social-link-item">
            <div className="social-icon" style={{ background: '#6366F1' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                <polyline points="7.5 4.21 12 6.81 16.5 4.21"/>
                <polyline points="7.5 19.79 7.5 14.6 3 12"/>
                <polyline points="21 12 16.5 14.6 16.5 19.79"/>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                <line x1="12" y1="22.08" x2="12" y2="12"/>
              </svg>
            </div>
            <div className="social-input-wrapper">
              <label className="form-label">Portfolio / Personal Website</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://yourportfolio.com"
                value={form.portfolioUrl}
                onChange={(e) => updateField('portfolioUrl', e.target.value)}
              />
            </div>
          </div>

          {/* GitHub */}
          <div className="social-link-item">
            <div className="social-icon" style={{ background: '#181717' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M12 2A10 10 0 002 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z"/>
              </svg>
            </div>
            <div className="social-input-wrapper">
              <label className="form-label">GitHub</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://github.com/yourusername"
                value={form.githubUrl}
                onChange={(e) => updateField('githubUrl', e.target.value)}
              />
            </div>
          </div>

          {/* Twitter */}
          <div className="social-link-item">
            <div className="social-icon" style={{ background: '#1DA1F2' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
              </svg>
            </div>
            <div className="social-input-wrapper">
              <label className="form-label">Twitter / X</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://twitter.com/yourusername"
                value={form.twitterUrl}
                onChange={(e) => updateField('twitterUrl', e.target.value)}
              />
            </div>
          </div>

          {/* Personal Website */}
          <div className="social-link-item">
            <div className="social-icon" style={{ background: '#10B981' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
              </svg>
            </div>
            <div className="social-input-wrapper">
              <label className="form-label">Personal Website / Blog</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://yourwebsite.com"
                value={form.websiteUrl}
                onChange={(e) => updateField('websiteUrl', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary-lg" disabled={saving}>
            {saving ? 'Saving...' : 'Save Social Links'}
          </button>
        </div>

        <div className="social-tips">
          <h4>Why add social links?</h4>
          <ul>
            <li>✓ Employers can verify your professional background</li>
            <li>✓ Showcase your work, projects, and thought leadership</li>
            <li>✓ Complete profiles get 2x more views</li>
            <li>✓ Build trust and credibility with hiring managers</li>
          </ul>
        </div>
      </form>
    </div>
  );
}
