import { useState } from 'react';

export default function PersonalDetailsSection({ profile, onUpdate }) {
  const [form, setForm] = useState({
    fullName: profile?.fullName || '',
    jobTitle: profile?.jobTitle || '',
    location: profile?.location || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    summary: profile?.summary || '',
    yearsExperience: profile?.yearsExperience ?? '',
    sector: profile?.sector || '',
    dayRate: profile?.dayRate ?? '',
    salaryExpectation: profile?.salaryExpectation ?? '',
    availability: profile?.availability || '',
    remotePreference: profile?.remotePreference || 'remote',
    employmentType: profile?.employmentType || 'contract',
    rightToWork: profile?.rightToWork || ''
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const updateField = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/candidate/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          yearsExperience: form.yearsExperience === '' ? null : Number(form.yearsExperience),
          dayRate: form.dayRate === '' ? null : Number(form.dayRate),
          salaryExpectation: form.salaryExpectation === '' ? null : Number(form.salaryExpectation)
        })
      });

      if (res.ok) {
        const updated = await res.json();
        onUpdate(updated);
        setMessage({ type: 'success', text: 'Personal details saved successfully!' });
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
        <h2 className="section-title">Personal Details</h2>
        <p className="section-description">
          Your core professional information visible to employers
        </p>
      </div>

      <form onSubmit={handleSubmit} className="section-form">
        {message && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="form-grid">
          {/* Full Name */}
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              className="form-input"
              value={form.fullName}
              onChange={e => updateField('fullName', e.target.value)}
              required
            />
          </div>

          {/* Job Title */}
          <div className="form-group">
            <label className="form-label">Professional Title / Headline *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., Senior PMO Analyst"
              value={form.jobTitle}
              onChange={e => updateField('jobTitle', e.target.value)}
              required
            />
            <p className="form-hint">This appears as your main job title on your profile</p>
          </div>

          {/* Location */}
          <div className="form-group">
            <label className="form-label">Location *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., London, UK"
              value={form.location}
              onChange={e => updateField('location', e.target.value)}
              required
            />
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={form.email}
              onChange={e => updateField('email', e.target.value)}
            />
          </div>

          {/* Phone */}
          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              type="tel"
              className="form-input"
              placeholder="+44 7XXX XXXXXX"
              value={form.phone}
              onChange={e => updateField('phone', e.target.value)}
              onBlur={() => {
                if (!form.phone) return;
                // simple UK formatting pseudo
                const digits = form.phone.replace(/\D/g, '');
                if (digits.length >= 10) {
                  const prefixed = digits.startsWith('44') ? '+' + digits : '+44' + (digits.startsWith('0') ? digits.slice(1) : digits);
                  updateField('phone', prefixed);
                }
              }}
            />
          </div>

          {/* Years of Experience */}
          <div className="form-group">
            <label className="form-label">Years of Experience</label>
            <input
              type="number"
              min="0"
              max="60"
              className="form-input"
              value={form.yearsExperience}
              onChange={e => updateField('yearsExperience', e.target.value)}
            />
          </div>

          {/* PMO Sector */}
          <div className="form-group form-group-full">
            <label className="form-label">PMO Specialism / Sector</label>
            <select
              className="form-select"
              value={form.sector}
              onChange={e => updateField('sector', e.target.value)}
            >
              <option value="">Select a sector...</option>
              <option value="Financial Services">Financial Services</option>
              <option value="Technology">Technology & Software</option>
              <option value="Healthcare">Healthcare & Pharmaceuticals</option>
              <option value="Government">Government & Public Sector</option>
              <option value="Retail">Retail & E-commerce</option>
              <option value="Construction">Construction & Infrastructure</option>
              <option value="Energy">Energy & Utilities</option>
              <option value="Telecoms">Telecommunications</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Education">Education</option>
              <option value="Professional Services">Professional Services</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Professional Summary */}
          <div className="form-group form-group-full">
            <label className="form-label">Professional Summary</label>
            <textarea
              className="form-textarea"
              rows="5"
              placeholder="Brief overview of your PMO experience, key achievements, and what you're looking for..."
              value={form.summary}
              onChange={e => updateField('summary', e.target.value)}
            />
            <p className="form-hint">{form.summary.length} / 500 characters</p>
          </div>

          {/* Work Preference */}
          <div className="form-group">
            <label className="form-label">Work Preference</label>
            <select
              className="form-select"
              value={form.remotePreference}
              onChange={e => updateField('remotePreference', e.target.value)}
            >
              <option value="remote">Fully Remote</option>
              <option value="hybrid">Hybrid (Remote + Office)</option>
              <option value="onsite">Onsite / Office-based</option>
              <option value="flexible">Flexible</option>
            </select>
          </div>

          {/* Employment Type */}
          <div className="form-group">
            <label className="form-label">Employment Type Preference</label>
            <select
              className="form-select"
              value={form.employmentType}
              onChange={e => updateField('employmentType', e.target.value)}
            >
              <option value="contract">Contract / Freelance</option>
              <option value="permanent">Permanent</option>
              <option value="fixed-term">Fixed-Term</option>
              <option value="both">Open to Both</option>
            </select>
          </div>

          {/* Right to work */}
          <div className="form-group">
            <label className="form-label">Right to work (UK)</label>
            <select
              className="form-select"
              value={form.rightToWork}
              onChange={e => updateField('rightToWork', e.target.value)}
            >
              <option value="">Select status…</option>
              <option value="Yes">Yes</option>
              <option value="Require sponsorship">Require sponsorship</option>
              <option value="No">No</option>
            </select>
          </div>

          {/* Day Rate */}
          <div className="form-group">
            <label className="form-label">Day Rate (£)</label>
            <input
              type="number"
              min="0"
              step="50"
              className="form-input"
              placeholder="e.g., 650"
              value={form.dayRate}
              onChange={e => updateField('dayRate', e.target.value)}
            />
            <p className="form-hint">For contract roles</p>
          </div>

          {/* Salary Expectation */}
          <div className="form-group">
            <label className="form-label">Annual Salary Expectation (£)</label>
            <input
              type="number"
              min="0"
              step="1000"
              className="form-input"
              placeholder="e.g., 65000"
              value={form.salaryExpectation}
              onChange={e => updateField('salaryExpectation', e.target.value)}
            />
            <p className="form-hint">For permanent roles</p>
          </div>

          {/* Availability */}
          <div className="form-group">
            <label className="form-label">Availability</label>
            <select
              className="form-select"
              value={form.availability}
              onChange={e => updateField('availability', e.target.value)}
            >
              <option value="">Select availability...</option>
              <option value="Immediate">Immediate</option>
              <option value="1 week">1 Week Notice</option>
              <option value="2 weeks">2 Weeks Notice</option>
              <option value="1 month">1 Month Notice</option>
              <option value="2 months">2 Months Notice</option>
              <option value="3+ months">3+ Months Notice</option>
            </select>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary-lg" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
