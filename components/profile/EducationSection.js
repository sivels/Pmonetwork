import { useState, useEffect } from 'react';

export default function EducationSection({ profile, onUpdate }) {
  const [educations, setEducations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEdu, setEditingEdu] = useState(null);
  const [form, setForm] = useState({
    institution: '',
    degree: '',
    fieldOfStudy: '',
    grade: '',
    startDate: '',
    endDate: '',
    current: false,
    description: ''
  });

  useEffect(() => {
    fetchEducation();
  }, []);

  const fetchEducation = async () => {
    try {
      const res = await fetch('/api/candidate/education');
      if (res.ok) {
        const data = await res.json();
        setEducations(data.education || []);
      }
    } catch (err) {
      console.error('Failed to fetch education:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      institution: '',
      degree: '',
      fieldOfStudy: '',
      grade: '',
      startDate: '',
      endDate: '',
      current: false,
      description: ''
    });
    setEditingEdu(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (edu) => {
    setForm({
      institution: edu.institution || '',
      degree: edu.degree || '',
      fieldOfStudy: edu.fieldOfStudy || '',
      grade: edu.grade || '',
      startDate: edu.startDate ? edu.startDate.split('T')[0] : '',
      endDate: edu.endDate ? edu.endDate.split('T')[0] : '',
      current: edu.current || false,
      description: edu.description || ''
    });
    setEditingEdu(edu);
    setShowAddModal(true);
  };

  const handleSubmit = async () => {
    if (!form.institution.trim() || !form.degree.trim()) {
      setMessage({ type: 'error', text: 'Institution and Degree are required' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const method = editingEdu ? 'PUT' : 'POST';
      const body = editingEdu ? { ...form, id: editingEdu.id } : form;

      const res = await fetch('/api/candidate/education', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        const data = await res.json();
        if (editingEdu) {
          setEducations(educations.map(e => e.id === editingEdu.id ? data.education : e));
          setMessage({ type: 'success', text: 'Education updated!' });
        } else {
          setEducations([data.education, ...educations]);
          setMessage({ type: 'success', text: 'Education added!' });
        }
        setShowAddModal(false);
        resetForm();
      } else {
        const error = await res.json();
        setMessage({ type: 'error', text: error.error || 'Failed to save education' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (eduId) => {
    if (!confirm('Remove this education entry from your profile?')) return;

    try {
      const res = await fetch(`/api/candidate/education?id=${eduId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setEducations(educations.filter(e => e.id !== eduId));
        setMessage({ type: 'success', text: 'Education entry removed' });
      } else {
        setMessage({ type: 'error', text: 'Failed to remove education' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Present';
    return new Date(dateStr).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  };

  if (loading) {
    return <div className="section-loading">Loading education...</div>;
  }

  return (
    <div className="profile-section">
      <div className="section-header">
        <h2 className="section-title">Education</h2>
        <p className="section-description">
          Add your academic qualifications and training
        </p>
        <button onClick={openAddModal} className="btn-primary">
          + Add Education
        </button>
      </div>

      <div className="section-content">
        {message && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        {educations.length === 0 ? (
          <div className="empty-state">
            <p>No education entries yet. Add your academic background!</p>
          </div>
        ) : (
          <div className="education-list">
            {educations.map(edu => (
              <div key={edu.id} className="education-card">
                <div className="edu-icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M6 12v5c3 3 9 3 12 0v-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="edu-details">
                  <h3 className="edu-degree">{edu.degree}</h3>
                  <p className="edu-institution">{edu.institution}</p>
                  {edu.fieldOfStudy && (
                    <p className="edu-field">{edu.fieldOfStudy}</p>
                  )}
                  <p className="edu-dates">
                    {formatDate(edu.startDate)} - {edu.current ? 'Present' : formatDate(edu.endDate)}
                  </p>
                  {edu.grade && (
                    <p className="edu-grade">Grade: {edu.grade}</p>
                  )}
                  {edu.description && (
                    <p className="edu-description">{edu.description}</p>
                  )}
                </div>
                <div className="edu-actions">
                  <button onClick={() => openEditModal(edu)} className="edu-edit-btn">Edit</button>
                  <button onClick={() => handleDelete(edu.id)} className="edu-delete-btn">Delete</button>
                </div>
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
              <h3>{editingEdu ? 'Edit Education' : 'Add Education'}</h3>
              <button onClick={() => setShowAddModal(false)} className="modal-close">×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Institution *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., University of London"
                  value={form.institution}
                  onChange={(e) => setForm({ ...form, institution: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Degree / Qualification *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., BSc, MSc, MBA, Diploma"
                  value={form.degree}
                  onChange={(e) => setForm({ ...form, degree: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Field of Study</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Business Management, Project Management"
                  value={form.fieldOfStudy}
                  onChange={(e) => setForm({ ...form, fieldOfStudy: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Grade / Achievement</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., First Class, 2:1, Distinction"
                  value={form.grade}
                  onChange={(e) => setForm({ ...form, grade: e.target.value })}
                />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Start Date</label>
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
                    Currently studying
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  placeholder="Additional details, courses, achievements..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowAddModal(false)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleSubmit} className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : editingEdu ? 'Update' : 'Add Education'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
