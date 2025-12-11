import Head from 'next/head';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export async function getServerSideProps(ctx) {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session) {
    return { redirect: { destination: '/employer-login', permanent: false } };
  }
  if ((session.user.role || '').toLowerCase() !== 'employer') {
    return { redirect: { destination: '/dashboard/candidate', permanent: false } };
  }
  return { props: {} };
}

export default function EmployerPostJob() {
  const router = useRouter();
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [toast, setToast] = useState('');
  const autoSaveTimer = useRef(null);
  const [newSkill, setNewSkill] = useState({ name: '', level: 'Intermediate', years: '' });
  const [newPrefSkill, setNewPrefSkill] = useState({ name: '', level: 'Intermediate', years: '' });

  const [formData, setFormData] = useState({
    jobTitle: '',
    department: '',
    seniorityLevel: '',
    employmentType: '',
    workArrangement: '',
    country: '',
    city: '',
    postalCode: '',
    address: '',
    remoteScope: '',
    salaryType: 'Annual',
    salaryMin: '',
    salaryMax: '',
    salaryVisibility: 'show',
    hasBonus: false,
    hasCommission: false,
    hasEquity: false,
    compensationRemarks: '',
    jobSummary: '',
    responsibilities: '',
    keyObjectives: '',
    dayToDay: '',
    certifications: '',
    toolsSoftware: '',
    reportsTo: '',
    directReports: '',
    teamSize: '',
    travelRequirement: '0',
    requiredSkills: [],
    preferredSkills: [],
    totalExperience: '',
    domainExperience: '',
    degreeLevel: '',
    fieldOfStudy: '',
    requiredCertifications: '',
    workingHours: '',
    shiftPattern: '',
    contractLength: '',
    startDate: 'ASAP',
    specificDate: '',
    benefits: [],
    screeningQuestions: [],
    applicationMode: 'platform',
    externalLink: '',
    requireCV: true,
    allowCoverLetter: true,
    companyLogo: '',
    companyBanner: '',
    brandTagline: '',
    companyMission: '',
    cultureStatement: '',
    diversityMessage: '',
    jobVisibility: 'public',
    postDuration: '30',
    customDuration: '',
    allowReposting: true
  });

  const [errors, setErrors] = useState({});
  const [collapsedSections, setCollapsedSections] = useState([]);

  const benefitsList = [
    'Pension', 'Health Insurance', 'Dental', 'Vision', 'Life Insurance',
    'Wellness Budget', 'Learning & Development', 'Paid Time Off', 'Parental Leave',
    'Remote Working Budget', 'Gym Membership', 'Flexible Hours', 'Stock Options'
  ];

  const sections = [
    { id: 1, title: 'Job Basics', icon: '📋', fields: ['jobTitle', 'employmentType'] },
    { id: 2, title: 'Location & Work Style', icon: '📍', fields: ['workArrangement'] },
    { id: 3, title: 'Compensation', icon: '💰', fields: ['salaryMin', 'salaryMax'] },
    { id: 4, title: 'Role Details', icon: '📝', fields: ['jobSummary', 'responsibilities'] },
    { id: 5, title: 'Skills & Experience', icon: '🎯', fields: ['requiredSkills'] },
    { id: 6, title: 'Employment Details', icon: '📅', fields: ['startDate'] },
    { id: 7, title: 'Screening & Applications', icon: '✅', fields: ['applicationMode'] },
    { id: 8, title: 'Company Branding', icon: '🎨', fields: [] },
    { id: 9, title: 'Review & Publish', icon: '🚀', fields: [] }
  ];

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: null }));
    triggerAutoSave();
  };

  const triggerAutoSave = () => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => saveDraft(), 5000);
  };

  const saveDraft = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/employer/jobs/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.jobTitle.trim()) newErrors.jobTitle = 'Job title is required';
    if (!formData.employmentType) newErrors.employmentType = 'Employment type is required';
    if (!formData.workArrangement) newErrors.workArrangement = 'Work arrangement is required';
    if (formData.workArrangement !== 'Remote' && !formData.city) newErrors.city = 'Location required for non-remote jobs';
    if (formData.salaryMin && formData.salaryMax && parseFloat(formData.salaryMax) <= parseFloat(formData.salaryMin)) {
      newErrors.salaryMax = 'Max salary must be greater than min';
    }
    if (!formData.jobSummary || formData.jobSummary.length < 250) {
      newErrors.jobSummary = 'Job summary must be at least 250 characters';
    }
    const respLines = formData.responsibilities.split('\n').filter(l => l.trim());
    if (respLines.length < 3) {
      newErrors.responsibilities = 'Must include at least 3 responsibilities';
    }
    if (formData.requiredSkills.length < 5) {
      newErrors.requiredSkills = 'Must specify at least 5 required skills';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePublish = async () => {
    if (!validateForm()) {
      showToast('Please fix validation errors before publishing');
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch('/api/employer/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, status: 'published' })
      });
      if (res.ok) {
        showToast('Job posted successfully!');
        setTimeout(() => router.push('/employer/jobs'), 1500);
      } else {
        showToast('Failed to publish job');
      }
    } catch (error) {
      showToast('Error publishing job');
    } finally {
      setIsSaving(false);
    }
  };

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };

  const toggleSection = (id) => {
    setCollapsedSections(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const addSkill = (type) => {
    const skill = type === 'required' ? newSkill : newPrefSkill;
    if (skill.name.trim()) {
      updateField(type === 'required' ? 'requiredSkills' : 'preferredSkills',
        [...formData[type === 'required' ? 'requiredSkills' : 'preferredSkills'], { ...skill }]
      );
      if (type === 'required') {
        setNewSkill({ name: '', level: 'Intermediate', years: '' });
      } else {
        setNewPrefSkill({ name: '', level: 'Intermediate', years: '' });
      }
    }
  };

  const removeSkill = (type, index) => {
    const field = type === 'required' ? 'requiredSkills' : 'preferredSkills';
    updateField(field, formData[field].filter((_, i) => i !== index));
  };

  const addScreeningQuestion = () => {
    updateField('screeningQuestions', [
      ...formData.screeningQuestions,
      { id: Date.now(), question: '', type: 'short', required: false }
    ]);
  };

  const updateScreeningQuestion = (index, field, value) => {
    const updated = [...formData.screeningQuestions];
    updated[index][field] = value;
    updateField('screeningQuestions', updated);
  };

  const removeScreeningQuestion = (index) => {
    updateField('screeningQuestions', formData.screeningQuestions.filter((_, i) => i !== index));
  };

  const toggleBenefit = (benefit) => {
    const current = formData.benefits;
    updateField('benefits',
      current.includes(benefit) ? current.filter(b => b !== benefit) : [...current, benefit]
    );
  };

  const progress = () => {
    let completed = 0;
    if (formData.jobTitle && formData.employmentType) completed++;
    if (formData.workArrangement) completed++;
    if (formData.salaryMin && formData.salaryMax) completed++;
    if (formData.jobSummary && formData.responsibilities) completed++;
    if (formData.requiredSkills.length >= 5) completed++;
    if (formData.startDate) completed++;
    if (formData.applicationMode) completed++;
    return Math.round((completed / 7) * 100);
  };

  return (
    <>
      <Head>
        <title>Post a New Job – Employer Dashboard</title>
      </Head>

      <div className="post-job-page">
        <header className="page-header">
          <div className="header-content">
            <Link href="/employer/jobs" className="back-link">← Back to Jobs</Link>
            <div className="header-title">
              <h1>Post a New Job</h1>
              <p>Create a detailed job posting to attract top talent</p>
            </div>
            <div className="save-status">
              {isSaving && <span className="saving">💾 Saving...</span>}
              {lastSaved && !isSaving && (
                <span className="saved">✓ Saved at {lastSaved.toLocaleTimeString()}</span>
              )}
            </div>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress()}%` }}></div>
            <span className="progress-text">{progress()}% Complete</span>
          </div>
        </header>

        {toast && <div className="toast">{toast}</div>}

        <div className="content-wrapper">
          <form onSubmit={(e) => { e.preventDefault(); handlePublish(); }}>
            {/* Section 1: Job Basics */}
            <section className="form-section">
              <div className="section-header" onClick={() => toggleSection(1)}>
                <div className="header-left">
                  <span className="section-icon">📋</span>
                  <h2>Job Basics</h2>
                </div>
                <button type="button" className="collapse-btn">
                  {collapsedSections.includes(1) ? '▼' : '▲'}
                </button>
              </div>
              {!collapsedSections.includes(1) && (
                <div className="section-content">
                  <div className="form-group">
                    <label className="required">Job Title</label>
                    <input
                      type="text"
                      value={formData.jobTitle}
                      onChange={(e) => updateField('jobTitle', e.target.value)}
                      placeholder="e.g., Senior Full Stack Developer"
                      className={errors.jobTitle ? 'error' : ''}
                    />
                    {errors.jobTitle && <span className="error-text">{errors.jobTitle}</span>}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Department / Team</label>
                      <select value={formData.department} onChange={(e) => updateField('department', e.target.value)}>
                        <option value="">Select department</option>
                        <option value="Engineering">Engineering</option>
                        <option value="Product">Product</option>
                        <option value="Design">Design</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Sales">Sales</option>
                        <option value="Operations">Operations</option>
                        <option value="HR">Human Resources</option>
                        <option value="Finance">Finance</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Seniority Level</label>
                      <select value={formData.seniorityLevel} onChange={(e) => updateField('seniorityLevel', e.target.value)}>
                        <option value="">Select level</option>
                        <option value="Entry">Entry</option>
                        <option value="Mid">Mid</option>
                        <option value="Senior">Senior</option>
                        <option value="Lead">Lead</option>
                        <option value="Director">Director</option>
                        <option value="VP">VP</option>
                        <option value="Executive">Executive</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="required">Employment Type</label>
                    <div className="radio-grid">
                      {['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship', 'Volunteer'].map(type => (
                        <label key={type} className="radio-card">
                          <input
                            type="radio"
                            name="employmentType"
                            value={type}
                            checked={formData.employmentType === type}
                            onChange={(e) => updateField('employmentType', e.target.value)}
                          />
                          <span>{type}</span>
                        </label>
                      ))}
                    </div>
                    {errors.employmentType && <span className="error-text">{errors.employmentType}</span>}
                  </div>
                </div>
              )}
            </section>

            {/* Section 2: Location & Work Style */}
            <section className="form-section">
              <div className="section-header" onClick={() => toggleSection(2)}>
                <div className="header-left">
                  <span className="section-icon">📍</span>
                  <h2>Location & Work Style</h2>
                </div>
                <button type="button" className="collapse-btn">
                  {collapsedSections.includes(2) ? '▼' : '▲'}
                </button>
              </div>
              {!collapsedSections.includes(2) && (
                <div className="section-content">
                  <div className="form-group">
                    <label className="required">Work Arrangement</label>
                    <div className="radio-grid">
                      {['On-site', 'Hybrid', 'Remote'].map(type => (
                        <label key={type} className="radio-card">
                          <input
                            type="radio"
                            name="workArrangement"
                            value={type}
                            checked={formData.workArrangement === type}
                            onChange={(e) => updateField('workArrangement', e.target.value)}
                          />
                          <span>{type}</span>
                        </label>
                      ))}
                    </div>
                    {errors.workArrangement && <span className="error-text">{errors.workArrangement}</span>}
                  </div>

                  {formData.workArrangement !== 'Remote' && (
                    <>
                      <div className="form-row">
                        <div className="form-group">
                          <label className="required">Country</label>
                          <input
                            type="text"
                            value={formData.country}
                            onChange={(e) => updateField('country', e.target.value)}
                            placeholder="United Kingdom"
                          />
                        </div>
                        <div className="form-group">
                          <label className="required">City / Town</label>
                          <input
                            type="text"
                            value={formData.city}
                            onChange={(e) => updateField('city', e.target.value)}
                            placeholder="London"
                            className={errors.city ? 'error' : ''}
                          />
                          {errors.city && <span className="error-text">{errors.city}</span>}
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Postal Code</label>
                          <input
                            type="text"
                            value={formData.postalCode}
                            onChange={(e) => updateField('postalCode', e.target.value)}
                            placeholder="SW1A 1AA"
                          />
                        </div>
                        <div className="form-group">
                          <label>Address (Optional)</label>
                          <input
                            type="text"
                            value={formData.address}
                            onChange={(e) => updateField('address', e.target.value)}
                            placeholder="123 Main Street"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {formData.workArrangement === 'Remote' && (
                    <div className="form-group">
                      <label>Accept Candidates From</label>
                      <select value={formData.remoteScope} onChange={(e) => updateField('remoteScope', e.target.value)}>
                        <option value="">Select scope</option>
                        <option value="country">Country-wide</option>
                        <option value="region">Region (e.g., Europe)</option>
                        <option value="global">Global</option>
                      </select>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Section 3: Compensation */}
            <section className="form-section">
              <div className="section-header" onClick={() => toggleSection(3)}>
                <div className="header-left">
                  <span className="section-icon">💰</span>
                  <h2>Compensation</h2>
                </div>
                <button type="button" className="collapse-btn">
                  {collapsedSections.includes(3) ? '▼' : '▲'}
                </button>
              </div>
              {!collapsedSections.includes(3) && (
                <div className="section-content">
                  <div className="form-group">
                    <label>Salary Type</label>
                    <select value={formData.salaryType} onChange={(e) => updateField('salaryType', e.target.value)}>
                      <option value="Annual">Annual</option>
                      <option value="Monthly">Monthly</option>
                      <option value="Daily">Daily Rate</option>
                      <option value="Hourly">Hourly Rate</option>
                    </select>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Minimum Salary (£)</label>
                      <input
                        type="number"
                        value={formData.salaryMin}
                        onChange={(e) => updateField('salaryMin', e.target.value)}
                        placeholder="50000"
                        min="0"
                      />
                    </div>
                    <div className="form-group">
                      <label>Maximum Salary (£)</label>
                      <input
                        type="number"
                        value={formData.salaryMax}
                        onChange={(e) => updateField('salaryMax', e.target.value)}
                        placeholder="70000"
                        min="0"
                        className={errors.salaryMax ? 'error' : ''}
                      />
                      {errors.salaryMax && <span className="error-text">{errors.salaryMax}</span>}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Salary Visibility</label>
                    <select value={formData.salaryVisibility} onChange={(e) => updateField('salaryVisibility', e.target.value)}>
                      <option value="show">Show salary publicly</option>
                      <option value="hide">Hide salary</option>
                      <option value="application">Show only on application</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Additional Compensation</label>
                    <div className="checkbox-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.hasBonus}
                          onChange={(e) => updateField('hasBonus', e.target.checked)}
                        />
                        Performance Bonus
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.hasCommission}
                          onChange={(e) => updateField('hasCommission', e.target.checked)}
                        />
                        Commission
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.hasEquity}
                          onChange={(e) => updateField('hasEquity', e.target.checked)}
                        />
                        Equity / Stock Options
                      </label>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Compensation Remarks</label>
                    <textarea
                      value={formData.compensationRemarks}
                      onChange={(e) => updateField('compensationRemarks', e.target.value)}
                      placeholder="Explain how pay is structured, bonus structure, etc."
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </section>

            {/* Section 4: Role Details */}
            <section className="form-section">
              <div className="section-header" onClick={() => toggleSection(4)}>
                <div className="header-left">
                  <span className="section-icon">📝</span>
                  <h2>Role Details</h2>
                </div>
                <button type="button" className="collapse-btn">
                  {collapsedSections.includes(4) ? '▼' : '▲'}
                </button>
              </div>
              {!collapsedSections.includes(4) && (
                <div className="section-content">
                  <div className="form-group">
                    <label className="required">Job Summary</label>
                    <textarea
                      value={formData.jobSummary}
                      onChange={(e) => updateField('jobSummary', e.target.value)}
                      placeholder="Write a compelling 1-2 paragraph introduction to the role..."
                      rows={5}
                      className={errors.jobSummary ? 'error' : ''}
                    />
                    <div className="char-count">{formData.jobSummary.length} / 250 characters minimum</div>
                    {errors.jobSummary && <span className="error-text">{errors.jobSummary}</span>}
                  </div>

                  <div className="form-group">
                    <label className="required">Responsibilities</label>
                    <textarea
                      value={formData.responsibilities}
                      onChange={(e) => updateField('responsibilities', e.target.value)}
                      placeholder="• Manage project deliverables&#10;• Lead team meetings&#10;• Develop strategic plans&#10;• Monitor KPIs"
                      rows={8}
                      className={errors.responsibilities ? 'error' : ''}
                    />
                    <span className="help-text">List at least 3 key responsibilities (one per line)</span>
                    {errors.responsibilities && <span className="error-text">{errors.responsibilities}</span>}
                  </div>

                  <div className="form-group">
                    <label>Key Objectives / Goals</label>
                    <textarea
                      value={formData.keyObjectives}
                      onChange={(e) => updateField('keyObjectives', e.target.value)}
                      placeholder="What should this person achieve in the first 90 days?"
                      rows={4}
                    />
                  </div>

                  <div className="form-group">
                    <label>Day-to-Day Activities</label>
                    <textarea
                      value={formData.dayToDay}
                      onChange={(e) => updateField('dayToDay', e.target.value)}
                      placeholder="Describe a typical day in this role..."
                      rows={4}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Tools & Software Used</label>
                      <input
                        type="text"
                        value={formData.toolsSoftware}
                        onChange={(e) => updateField('toolsSoftware', e.target.value)}
                        placeholder="Jira, Slack, Figma, etc."
                      />
                    </div>
                    <div className="form-group">
                      <label>Required Certifications</label>
                      <input
                        type="text"
                        value={formData.certifications}
                        onChange={(e) => updateField('certifications', e.target.value)}
                        placeholder="PMP, AWS, etc."
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Reports To</label>
                      <input
                        type="text"
                        value={formData.reportsTo}
                        onChange={(e) => updateField('reportsTo', e.target.value)}
                        placeholder="e.g., VP of Engineering"
                      />
                    </div>
                    <div className="form-group">
                      <label>Team Size</label>
                      <input
                        type="text"
                        value={formData.teamSize}
                        onChange={(e) => updateField('teamSize', e.target.value)}
                        placeholder="e.g., 5-10 people"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Travel Requirement (%)</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={formData.travelRequirement}
                      onChange={(e) => updateField('travelRequirement', e.target.value)}
                    />
                    <span className="range-value">{formData.travelRequirement}%</span>
                  </div>
                </div>
              )}
            </section>

            {/* Section 5: Skills & Experience */}
            <section className="form-section">
              <div className="section-header" onClick={() => toggleSection(5)}>
                <div className="header-left">
                  <span className="section-icon">🎯</span>
                  <h2>Skills & Experience</h2>
                </div>
                <button type="button" className="collapse-btn">
                  {collapsedSections.includes(5) ? '▼' : '▲'}
                </button>
              </div>
              {!collapsedSections.includes(5) && (
                <div className="section-content">
                  <div className="form-group">
                    <label className="required">Required Skills (minimum 5)</label>
                    <div className="skills-input-row">
                      <input
                        type="text"
                        value={newSkill.name}
                        onChange={(e) => setNewSkill({...newSkill, name: e.target.value})}
                        placeholder="Skill name"
                      />
                      <select value={newSkill.level} onChange={(e) => setNewSkill({...newSkill, level: e.target.value})}>
                        <option value="Basic">Basic</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                      <input
                        type="number"
                        value={newSkill.years}
                        onChange={(e) => setNewSkill({...newSkill, years: e.target.value})}
                        placeholder="Years"
                        min="0"
                        style={{ width: '100px' }}
                      />
                      <button type="button" onClick={() => addSkill('required')} className="add-btn">+ Add</button>
                    </div>
                    <div className="skills-list">
                      {formData.requiredSkills.map((skill, idx) => (
                        <div key={idx} className="skill-tag">
                          <span>{skill.name} ({skill.level}{skill.years ? `, ${skill.years}y` : ''})</span>
                          <button type="button" onClick={() => removeSkill('required', idx)}>×</button>
                        </div>
                      ))}
                    </div>
                    {errors.requiredSkills && <span className="error-text">{errors.requiredSkills}</span>}
                  </div>

                  <div className="form-group">
                    <label>Preferred Skills (Optional)</label>
                    <div className="skills-input-row">
                      <input
                        type="text"
                        value={newPrefSkill.name}
                        onChange={(e) => setNewPrefSkill({...newPrefSkill, name: e.target.value})}
                        placeholder="Skill name"
                      />
                      <select value={newPrefSkill.level} onChange={(e) => setNewPrefSkill({...newPrefSkill, level: e.target.value})}>
                        <option value="Basic">Basic</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                      <input
                        type="number"
                        value={newPrefSkill.years}
                        onChange={(e) => setNewPrefSkill({...newPrefSkill, years: e.target.value})}
                        placeholder="Years"
                        min="0"
                        style={{ width: '100px' }}
                      />
                      <button type="button" onClick={() => addSkill('preferred')} className="add-btn">+ Add</button>
                    </div>
                    <div className="skills-list">
                      {formData.preferredSkills.map((skill, idx) => (
                        <div key={idx} className="skill-tag preferred">
                          <span>{skill.name} ({skill.level}{skill.years ? `, ${skill.years}y` : ''})</span>
                          <button type="button" onClick={() => removeSkill('preferred', idx)}>×</button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Total Years of Experience</label>
                      <input
                        type="text"
                        value={formData.totalExperience}
                        onChange={(e) => updateField('totalExperience', e.target.value)}
                        placeholder="e.g., 5-7 years"
                      />
                    </div>
                    <div className="form-group">
                      <label>Domain / Industry Experience</label>
                      <input
                        type="text"
                        value={formData.domainExperience}
                        onChange={(e) => updateField('domainExperience', e.target.value)}
                        placeholder="e.g., FinTech, Healthcare"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Degree Level</label>
                      <select value={formData.degreeLevel} onChange={(e) => updateField('degreeLevel', e.target.value)}>
                        <option value="">Not required</option>
                        <option value="Associate">Associate Degree</option>
                        <option value="Bachelor">Bachelor's Degree</option>
                        <option value="Master">Master's Degree</option>
                        <option value="PhD">PhD</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Field of Study</label>
                      <input
                        type="text"
                        value={formData.fieldOfStudy}
                        onChange={(e) => updateField('fieldOfStudy', e.target.value)}
                        placeholder="e.g., Computer Science"
                      />
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Section 6: Employment Details */}
            <section className="form-section">
              <div className="section-header" onClick={() => toggleSection(6)}>
                <div className="header-left">
                  <span className="section-icon">📅</span>
                  <h2>Employment Details</h2>
                </div>
                <button type="button" className="collapse-btn">
                  {collapsedSections.includes(6) ? '▼' : '▲'}
                </button>
              </div>
              {!collapsedSections.includes(6) && (
                <div className="section-content">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Working Hours</label>
                      <input
                        type="text"
                        value={formData.workingHours}
                        onChange={(e) => updateField('workingHours', e.target.value)}
                        placeholder="e.g., 9am - 5pm"
                      />
                    </div>
                    <div className="form-group">
                      <label>Shift Pattern</label>
                      <input
                        type="text"
                        value={formData.shiftPattern}
                        onChange={(e) => updateField('shiftPattern', e.target.value)}
                        placeholder="e.g., Rotating"
                      />
                    </div>
                  </div>

                  {formData.employmentType === 'Contract' && (
                    <div className="form-group">
                      <label>Contract Length</label>
                      <input
                        type="text"
                        value={formData.contractLength}
                        onChange={(e) => updateField('contractLength', e.target.value)}
                        placeholder="e.g., 6 months"
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label>Start Date</label>
                    <div className="radio-grid">
                      <label className="radio-card">
                        <input type="radio" name="startDate" value="ASAP" checked={formData.startDate === 'ASAP'} onChange={(e) => updateField('startDate', e.target.value)} />
                        <span>ASAP</span>
                      </label>
                      <label className="radio-card">
                        <input type="radio" name="startDate" value="Specific" checked={formData.startDate === 'Specific'} onChange={(e) => updateField('startDate', e.target.value)} />
                        <span>Specific Date</span>
                      </label>
                    </div>
                    {formData.startDate === 'Specific' && (
                      <input type="date" value={formData.specificDate} onChange={(e) => updateField('specificDate', e.target.value)} style={{ marginTop: '0.5rem' }} />
                    )}
                  </div>

                  <div className="form-group">
                    <label>Benefits</label>
                    <div className="benefits-grid">
                      {benefitsList.map(benefit => (
                        <label key={benefit} className="checkbox-label">
                          <input type="checkbox" checked={formData.benefits.includes(benefit)} onChange={() => toggleBenefit(benefit)} />
                          {benefit}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Section 7: Screening & Applications */}
            <section className="form-section">
              <div className="section-header" onClick={() => toggleSection(7)}>
                <div className="header-left">
                  <span className="section-icon">✅</span>
                  <h2>Screening & Applications</h2>
                </div>
                <button type="button" className="collapse-btn">
                  {collapsedSections.includes(7) ? '▼' : '▲'}
                </button>
              </div>
              {!collapsedSections.includes(7) && (
                <div className="section-content">
                  <div className="form-group">
                    <label>Screening Questions</label>
                    <button type="button" onClick={addScreeningQuestion} className="secondary-btn">+ Add Question</button>
                    {formData.screeningQuestions.map((q, idx) => (
                      <div key={q.id} className="screening-question">
                        <input type="text" value={q.question} onChange={(e) => updateScreeningQuestion(idx, 'question', e.target.value)} placeholder="Enter your question" />
                        <div className="question-options">
                          <select value={q.type} onChange={(e) => updateScreeningQuestion(idx, 'type', e.target.value)}>
                            <option value="short">Short Answer</option>
                            <option value="multiple">Multiple Choice</option>
                            <option value="yesno">Yes/No</option>
                          </select>
                          <label className="checkbox-label">
                            <input type="checkbox" checked={q.required} onChange={(e) => updateScreeningQuestion(idx, 'required', e.target.checked)} />
                            Required
                          </label>
                          <button type="button" onClick={() => removeScreeningQuestion(idx)} className="remove-btn">Remove</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="form-group">
                    <label>Application Mode</label>
                    <div className="radio-grid">
                      <label className="radio-card">
                        <input type="radio" name="applicationMode" value="platform" checked={formData.applicationMode === 'platform'} onChange={(e) => updateField('applicationMode', e.target.value)} />
                        <span>Apply via Platform</span>
                      </label>
                      <label className="radio-card">
                        <input type="radio" name="applicationMode" value="external" checked={formData.applicationMode === 'external'} onChange={(e) => updateField('applicationMode', e.target.value)} />
                        <span>External Link</span>
                      </label>
                    </div>
                  </div>

                  {formData.applicationMode === 'external' && (
                    <div className="form-group">
                      <label>External Application URL</label>
                      <input type="url" value={formData.externalLink} onChange={(e) => updateField('externalLink', e.target.value)} placeholder="https://company.com/apply" />
                    </div>
                  )}

                  {formData.applicationMode === 'platform' && (
                    <div className="form-group">
                      <div className="checkbox-group">
                        <label className="checkbox-label">
                          <input type="checkbox" checked={formData.requireCV} onChange={(e) => updateField('requireCV', e.target.checked)} />
                          Require CV/Resume
                        </label>
                        <label className="checkbox-label">
                          <input type="checkbox" checked={formData.allowCoverLetter} onChange={(e) => updateField('allowCoverLetter', e.target.checked)} />
                          Allow Cover Letter
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Section 8: Company Branding */}
            <section className="form-section">
              <div className="section-header" onClick={() => toggleSection(8)}>
                <div className="header-left">
                  <span className="section-icon">🎨</span>
                  <h2>Company Branding</h2>
                </div>
                <button type="button" className="collapse-btn">
                  {collapsedSections.includes(8) ? '▼' : '▲'}
                </button>
              </div>
              {!collapsedSections.includes(8) && (
                <div className="section-content">
                  <div className="form-group">
                    <label>Employer Brand Tagline</label>
                    <input type="text" value={formData.brandTagline} onChange={(e) => updateField('brandTagline', e.target.value)} placeholder="e.g., Building the future of work" />
                  </div>
                  <div className="form-group">
                    <label>Company Mission</label>
                    <textarea value={formData.companyMission} onChange={(e) => updateField('companyMission', e.target.value)} placeholder="What is your company's mission?" rows={3} />
                  </div>
                  <div className="form-group">
                    <label>Culture Statement</label>
                    <textarea value={formData.cultureStatement} onChange={(e) => updateField('cultureStatement', e.target.value)} placeholder="Describe your company culture" rows={3} />
                  </div>
                  <div className="form-group">
                    <label>Diversity & Inclusion Message</label>
                    <textarea value={formData.diversityMessage} onChange={(e) => updateField('diversityMessage', e.target.value)} placeholder="Your commitment to diversity" rows={3} />
                  </div>
                </div>
              )}
            </section>

            {/* Section 9: Review & Publish */}
            <section className="form-section">
              <div className="section-header" onClick={() => toggleSection(9)}>
                <div className="header-left">
                  <span className="section-icon">��</span>
                  <h2>Review & Publish</h2>
                </div>
                <button type="button" className="collapse-btn">
                  {collapsedSections.includes(9) ? '▼' : '▲'}
                </button>
              </div>
              {!collapsedSections.includes(9) && (
                <div className="section-content">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Job Visibility</label>
                      <select value={formData.jobVisibility} onChange={(e) => updateField('jobVisibility', e.target.value)}>
                        <option value="public">Public</option>
                        <option value="logged-in">Logged-in candidates only</option>
                        <option value="internal">Internal only</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Post Duration (Days)</label>
                      <select value={formData.postDuration} onChange={(e) => updateField('postDuration', e.target.value)}>
                        <option value="7">7 days</option>
                        <option value="14">14 days</option>
                        <option value="30">30 days</option>
                        <option value="60">60 days</option>
                      </select>
                    </div>
                  </div>

                  <div className="preview-card">
                    <h3>Job Preview</h3>
                    <div className="preview-content">
                      <h4>{formData.jobTitle || 'Job Title'}</h4>
                      <div className="preview-meta">
                        <span>📍 {formData.city || 'Location'}</span>
                        <span>💼 {formData.employmentType || 'Type'}</span>
                        {formData.salaryMin && formData.salaryMax && <span>💰 £{formData.salaryMin} - £{formData.salaryMax}</span>}
                      </div>
                      <p>{formData.jobSummary ? formData.jobSummary.substring(0, 200) + '...' : 'Job summary will appear here'}</p>
                      <div className="preview-skills">
                        {formData.requiredSkills.slice(0, 5).map((skill, idx) => (
                          <span key={idx} className="preview-skill">{skill.name}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {Object.keys(errors).length > 0 && (
                    <div className="validation-errors">
                      <h4>⚠️ Please fix the following errors:</h4>
                      <ul>
                        {Object.entries(errors).map(([field, error]) => (
                          <li key={field}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Sticky Footer */}
            <div className="sticky-footer">
              <button type="button" onClick={saveDraft} className="secondary-btn" disabled={isSaving}>💾 Save Draft</button>
              <button type="button" onClick={() => setShowPreview(!showPreview)} className="secondary-btn">👁️ Preview</button>
              <button type="submit" className="primary-btn" disabled={isSaving}>🚀 Publish Job</button>
            </div>
          </form>
        </div>
      </div>

      <style jsx>{`
        .post-job-page { min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .page-header { background: white; padding: 1.5rem 2rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header-content { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .back-link { color: #6b7280; text-decoration: none; font-size: 0.875rem; }
        .back-link:hover { color: #111827; }
        .header-title h1 { font-size: 1.875rem; font-weight: 700; margin: 0 0 0.25rem 0; color: #111827; }
        .header-title p { color: #6b7280; margin: 0; }
        .save-status { font-size: 0.875rem; color: #6b7280; }
        .saving { color: #f59e0b; }
        .saved { color: #10b981; }
        .progress-bar { max-width: 1200px; margin: 0 auto; height: 8px; background: #e5e7eb; border-radius: 4px; position: relative; overflow: hidden; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); transition: width 0.3s; }
        .progress-text { position: absolute; top: -1.5rem; right: 0; font-size: 0.75rem; color: #6b7280; font-weight: 500; }
        .toast { position: fixed; top: 2rem; right: 2rem; background: #10b981; color: white; padding: 1rem 1.5rem; border-radius: 0.5rem; box-shadow: 0 10px 25px rgba(0,0,0,0.1); z-index: 1000; animation: slideIn 0.3s; }
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .content-wrapper { max-width: 1200px; margin: 2rem auto; padding: 0 2rem 6rem; }
        .form-section { background: white; border-radius: 1rem; margin-bottom: 1.5rem; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .section-header { padding: 1.25rem 1.5rem; background: #f9fafb; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
        .section-header:hover { background: #f3f4f6; }
        .header-left { display: flex; align-items: center; gap: 0.75rem; }
        .section-icon { font-size: 1.5rem; }
        .section-header h2 { font-size: 1.125rem; font-weight: 600; margin: 0; color: #111827; }
        .collapse-btn { background: none; border: none; color: #6b7280; font-size: 1rem; cursor: pointer; padding: 0.25rem 0.5rem; }
        .section-content { padding: 1.5rem; }
        .form-group { margin-bottom: 1.5rem; }
        .form-group label { display: block; font-weight: 500; color: #374151; font-size: 0.875rem; margin-bottom: 0.5rem; }
        .form-group label.required::after { content: ' *'; color: #ef4444; }
        .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem; font-size: 0.9375rem; transition: border-color 0.2s; }
        .form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline: none; border-color: #667eea; }
        .form-group input.error, .form-group textarea.error { border-color: #ef4444; }
        .error-text { display: block; color: #ef4444; font-size: 0.8125rem; margin-top: 0.25rem; }
        .help-text { display: block; color: #6b7280; font-size: 0.8125rem; margin-top: 0.25rem; }
        .char-count { font-size: 0.8125rem; color: #6b7280; margin-top: 0.25rem; }
        .range-value { display: inline-block; margin-left: 0.5rem; font-weight: 500; color: #667eea; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .radio-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.75rem; }
        .radio-card { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem; border: 2px solid #e5e7eb; border-radius: 0.5rem; cursor: pointer; transition: all 0.2s; }
        .radio-card:hover { border-color: #667eea; background: #f0f4ff; }
        .radio-card input:checked + span, .radio-card:has(input:checked) { border-color: #667eea; background: #eef2ff; }
        .checkbox-group { display: flex; flex-direction: column; gap: 0.75rem; }
        .checkbox-label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9375rem; color: #374151; cursor: pointer; }
        .checkbox-label input { width: auto; cursor: pointer; }
        .benefits-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.75rem; }
        .skills-input-row { display: grid; grid-template-columns: 1fr auto 100px auto; gap: 0.5rem; margin-bottom: 1rem; }
        .skills-list { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 1rem; }
        .skill-tag { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 9999px; font-size: 0.875rem; }
        .skill-tag.preferred { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
        .skill-tag button { background: none; border: none; color: white; font-size: 1.25rem; cursor: pointer; padding: 0; margin-left: 0.25rem; line-height: 1; }
        .add-btn { background: #667eea; color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer; font-weight: 500; }
        .add-btn:hover { background: #5568d3; }
        .secondary-btn { background: white; color: #374151; border: 1px solid #d1d5db; padding: 0.75rem 1.5rem; border-radius: 0.5rem; cursor: pointer; font-weight: 500; }
        .secondary-btn:hover:not(:disabled) { background: #f9fafb; }
        .secondary-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .primary-btn { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 0.75rem 2rem; border-radius: 0.5rem; cursor: pointer; font-weight: 600; font-size: 1rem; }
        .primary-btn:hover:not(:disabled) { opacity: 0.9; }
        .primary-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .screening-question { background: #f9fafb; padding: 1rem; border-radius: 0.5rem; margin-top: 1rem; }
        .question-options { display: flex; gap: 1rem; margin-top: 0.75rem; align-items: center; }
        .remove-btn { background: #ef4444; color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer; font-size: 0.875rem; }
        .preview-card { background: #f9fafb; border: 2px solid #e5e7eb; border-radius: 1rem; padding: 1.5rem; margin-top: 1.5rem; }
        .preview-card h3 { margin: 0 0 1rem 0; font-size: 1.125rem; color: #111827; }
        .preview-content h4 { font-size: 1.5rem; font-weight: 700; margin: 0 0 1rem 0; color: #111827; }
        .preview-meta { display: flex; gap: 1.5rem; margin-bottom: 1rem; font-size: 0.875rem; color: #6b7280; }
        .preview-content p { color: #374151; line-height: 1.6; margin: 0 0 1rem 0; }
        .preview-skills { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .preview-skill { padding: 0.375rem 0.75rem; background: #e0e7ff; color: #4338ca; border-radius: 9999px; font-size: 0.8125rem; font-weight: 500; }
        .validation-errors { background: #fef2f2; border: 2px solid #fecaca; border-radius: 0.5rem; padding: 1rem; margin-top: 1rem; }
        .validation-errors h4 { margin: 0 0 0.75rem 0; color: #991b1b; font-size: 1rem; }
        .validation-errors ul { margin: 0; padding-left: 1.25rem; color: #dc2626; }
        .validation-errors li { margin-bottom: 0.5rem; }
        .sticky-footer { position: fixed; bottom: 0; left: 0; right: 0; background: white; border-top: 2px solid #e5e7eb; padding: 1rem 2rem; display: flex; justify-content: flex-end; gap: 1rem; box-shadow: 0 -4px 12px rgba(0,0,0,0.1); z-index: 100; }
        @media (max-width: 768px) {
          .header-content { flex-direction: column; align-items: flex-start; gap: 1rem; }
          .form-row, .skills-input-row { grid-template-columns: 1fr; }
          .radio-grid { grid-template-columns: 1fr; }
          .sticky-footer { flex-wrap: wrap; }
        }
      `}</style>
    </>
  );
}
