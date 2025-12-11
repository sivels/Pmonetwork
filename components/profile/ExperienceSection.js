import { useState, useEffect } from 'react';

export default function ExperienceSection({ profile, onUpdate }) {
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExp, setEditingExp] = useState(null);
  const [form, setForm] = useState({
    jobTitle: '',
    company: '',
    location: '',
    startDate: '',
    endDate: '',
    current: false,
    description: '',
    achievements: '',
    projectType: '',
    projectValue: '',
    teamSize: ''
  });

  useEffect(() => {
    fetchExperiences();
  }, []);

  const fetchExperiences = async () => {
    try {
      const res = await fetch('/api/candidate/experience');
      if (res.ok) {
        const data = await res.json();
        setExperiences(data.experiences || []);
      }
    } catch (err) {
      console.error('Failed to fetch experiences:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      jobTitle: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: '',
      achievements: '',
      projectType: '',
      projectValue: '',
      teamSize: ''
    });
    setEditingExp(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (exp) => {
    setForm({
      jobTitle: exp.jobTitle || '',
      company: exp.company || '',
      location: exp.location || '',
      startDate: exp.startDate ? exp.startDate.split('T')[0] : '',
      endDate: exp.endDate ? exp.endDate.split('T')[0] : '',
      current: exp.current || false,
      description: exp.description || '',
      achievements: exp.achievements || '',
      projectType: exp.projectType || '',
      projectValue: exp.projectValue || '',
      teamSize: exp.teamSize || ''
    });
    setEditingExp(exp);
    setShowAddModal(true);
  };

  const handleSubmit = async () => {
    if (!form.jobTitle.trim() || !form.company.trim() || !form.startDate) {
      setMessage({ type: 'error', text: 'Job Title, Company, and Start Date are required' });
      return;
    }

    if (!form.current && !form.endDate) {
      setMessage({ type: 'error', text: 'Please provide an End Date or mark as current position' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const method = editingExp ? 'PUT' : 'POST';
      const body = editingExp ? { ...form, id: editingExp.id } : form;

      const res = await fetch('/api/candidate/experience', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        const data = await res.json();
        if (editingExp) {
          setExperiences(experiences.map(e => e.id === editingExp.id ? data.experience : e));
          setMessage({ type: 'success', text: 'Experience updated!' });
        } else {
          setExperiences([data.experience, ...experiences]);
          setMessage({ type: 'success', text: 'Experience added!' });
        }
        setShowAddModal(false);
        resetForm();
      } else {
        const error = await res.json();
        setMessage({ type: 'error', text: error.error || 'Failed to save experience' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (expId) => {
    if (!confirm('Remove this experience from your profile?')) return;

    try {
      const res = await fetch(`/api/candidate/experience?id=${expId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setExperiences(experiences.filter(e => e.id !== expId));
        setMessage({ type: 'success', text: 'Experience removed' });
      } else {
        setMessage({ type: 'error', text: 'Failed to remove experience' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Present';
    return new Date(dateStr).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  };

  const calculateDuration = (start, end, current) => {
    const startDate = new Date(start);
    const endDate = current ? new Date() : new Date(end);
    const months = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24 * 30));
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    if (years > 0 && remainingMonths > 0) {
      return `${years} yr${years > 1 ? 's' : ''} ${remainingMonths} mo${remainingMonths > 1 ? 's' : ''}`;
    } else if (years > 0) {
      return `${years} yr${years > 1 ? 's' : ''}`;
    } else {
      return `${remainingMonths} mo${remainingMonths > 1 ? 's' : ''}`;
    }
  };

  if (loading) {
    return <div className="section-loading">Loading experience...</div>;
  }

  return (
    <div className="profile-section">
      <div className="section-header">
        <h2 className="section-title">Work Experience & Projects</h2>
        <p className="section-description">
          Detail your PMO roles, projects, and achievements
        </p>
        <button onClick={openAddModal} className="btn-primary">
          + Add Experience
        </button>
      </div>

      <div className="section-content">
        {message && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        {experiences.length === 0 ? (
          <div className="empty-state">
            <p>No work experience added yet. Add your roles and projects to showcase your background!</p>
          </div>
        ) : (
          <div className="experience-timeline">
            {experiences.map(exp => (
              <div key={exp.id} className="experience-card">
                <div className="exp-header">
                  <div className="exp-title-section">
                    <h3 className="exp-job-title">{exp.jobTitle}</h3>
                    <p className="exp-company">{exp.company} {exp.location && `• ${exp.location}`}</p>
                    <p className="exp-dates">
                      {formatDate(exp.startDate)} - {exp.current ? 'Present' : formatDate(exp.endDate)}
                      <span className="exp-duration"> • {calculateDuration(exp.startDate, exp.endDate, exp.current)}</span>
                    </p>
                  </div>
                  <div className="exp-actions">
                    <button onClick={() => openEditModal(exp)} className="exp-edit-btn">Edit</button>
                    <button onClick={() => handleDelete(exp.id)} className="exp-delete-btn">Delete</button>
                  </div>
                </div>

                {exp.description && (
                  <p className="exp-description">{exp.description}</p>
                )}

                {exp.achievements && (
                  <div className="exp-achievements">
                    <strong>Key Achievements:</strong>
                    <p>{exp.achievements}</p>
                  </div>
                )}

                {(exp.projectType || exp.projectValue || exp.teamSize) && (
                  <div className="exp-metadata">
                    {exp.projectType && <span className="exp-tag">📋 {exp.projectType}</span>}
                    {exp.projectValue && <span className="exp-tag">💰 {exp.projectValue}</span>}
                    {exp.teamSize && <span className="exp-tag">👥 {exp.teamSize} team</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingExp ? 'Edit Experience' : 'Add New Experience'}</h3>
              <button onClick={() => setShowAddModal(false)} className="modal-close">×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Job Title / Role *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Senior PMO Analyst"
                  value={form.jobTitle}
                  onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
                />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Company *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Company name"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., London, UK"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Start Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    disabled={form.current}
                  />
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={form.current}
                      onChange={(e) => setForm({ ...form, current: e.target.checked, endDate: e.target.checked ? '' : form.endDate })}
                    />
                    I currently work here
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  rows="4"
                  placeholder="Describe your role, responsibilities, and key activities..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Key Achievements</label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  placeholder="Highlight specific achievements, metrics, or impact you delivered..."
                  value={form.achievements}
                  onChange={(e) => setForm({ ...form, achievements: e.target.value })}
                />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Project Type</label>
                  <select
                    className="form-select"
                    value={form.projectType}
                    onChange={(e) => setForm({ ...form, projectType: e.target.value })}
                  >
                    <option value="">Select type...</option>
                    <option value="Transformation">Transformation</option>
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="IT Implementation">IT Implementation</option>
                    <option value="Digital">Digital</option>
                    <option value="Change Programme">Change Programme</option>
                    <option value="Product Development">Product Development</option>
                    <option value="BAU Support">BAU Support</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Project Value</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., £5M+"
                    value={form.projectValue}
                    onChange={(e) => setForm({ ...form, projectValue: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Team Size</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., 10-15"
                    value={form.teamSize}
                    onChange={(e) => setForm({ ...form, teamSize: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowAddModal(false)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleSubmit} className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : editingExp ? 'Update' : 'Add Experience'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
