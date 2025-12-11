import { useState, useEffect } from 'react';

const PMO_CERTIFICATION_BODIES = [
  'AXELOS (PRINCE2)',
  'APM (Association for Project Management)',
  'PMI (Project Management Institute)',
  'APMG International',
  'Scrum Alliance',
  'Scrum.org',
  'Scaled Agile (SAFe)',
  'IPMA (International Project Management Association)',
  'ILM (Institute of Leadership & Management)',
  'BCS (British Computer Society)',
  'ISEB',
  'Other'
];

const COMMON_PMO_CERTIFICATIONS = [
  'PRINCE2 Foundation',
  'PRINCE2 Practitioner',
  'PRINCE2 Agile',
  'APM PMQ (Project Management Qualification)',
  'APM PFQ (Project Fundamentals Qualification)',
  'MSP Foundation (Managing Successful Programmes)',
  'MSP Practitioner',
  'MoP Foundation (Management of Portfolios)',
  'MoR Foundation (Management of Risk)',
  'PMP (Project Management Professional)',
  'CAPM (Certified Associate in Project Management)',
  'PMI-ACP (PMI Agile Certified Practitioner)',
  'Certified Scrum Master (CSM)',
  'Professional Scrum Master (PSM I)',
  'SAFe Agilist (SA)',
  'SAFe Program Consultant (SPC)',
  'Agile PM Foundation',
  'Agile PM Practitioner',
  'Change Management Practitioner',
  'P3O Foundation (Portfolio, Programme and Project Offices)',
  'IPMA Level D',
  'IPMA Level C',
  'IPMA Level B'
];

export default function CertificationsSection({ profile, onUpdate }) {
  const [certifications, setCertifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCert, setEditingCert] = useState(null);
  const [form, setForm] = useState({
    title: '',
    issuingBody: '',
    issueDate: '',
    expiryDate: '',
    credentialId: '',
    verificationUrl: ''
  });

  useEffect(() => {
    fetchCertifications();
  }, []);

  const fetchCertifications = async () => {
    try {
      const res = await fetch('/api/candidate/certifications');
      if (res.ok) {
        const data = await res.json();
        setCertifications(data.certifications || []);
      }
    } catch (err) {
      console.error('Failed to fetch certifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      title: '',
      issuingBody: '',
      issueDate: '',
      expiryDate: '',
      credentialId: '',
      verificationUrl: ''
    });
    setEditingCert(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (cert) => {
    setForm({
      title: cert.title || '',
      issuingBody: cert.issuingBody || '',
      issueDate: cert.issueDate ? cert.issueDate.split('T')[0] : '',
      expiryDate: cert.expiryDate ? cert.expiryDate.split('T')[0] : '',
      credentialId: cert.credentialId || '',
      verificationUrl: cert.verificationUrl || ''
    });
    setEditingCert(cert);
    setShowAddModal(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.issuingBody.trim()) {
      setMessage({ type: 'error', text: 'Title and Issuing Body are required' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const method = editingCert ? 'PUT' : 'POST';
      const body = editingCert ? { ...form, id: editingCert.id } : form;

      const res = await fetch('/api/candidate/certifications', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        const data = await res.json();
        if (editingCert) {
          setCertifications(certifications.map(c => c.id === editingCert.id ? data.certification : c));
          setMessage({ type: 'success', text: 'Certification updated!' });
        } else {
          setCertifications([...certifications, data.certification]);
          setMessage({ type: 'success', text: 'Certification added!' });
        }
        setShowAddModal(false);
        resetForm();
      } else {
        const error = await res.json();
        setMessage({ type: 'error', text: error.error || 'Failed to save certification' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (certId) => {
    if (!confirm('Remove this certification from your profile?')) return;

    try {
      const res = await fetch(`/api/candidate/certifications?id=${certId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setCertifications(certifications.filter(c => c.id !== certId));
        setMessage({ type: 'success', text: 'Certification removed' });
      } else {
        setMessage({ type: 'error', text: 'Failed to remove certification' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    }
  };

  const isExpired = (expiryDate) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  };

  if (loading) {
    return <div className="section-loading">Loading certifications...</div>;
  }

  return (
    <div className="profile-section">
      <div className="section-header">
        <h2 className="section-title">Certifications & Qualifications</h2>
        <p className="section-description">
          Showcase your professional PMO certifications to boost your credibility
        </p>
        <button onClick={openAddModal} className="btn-primary">
          + Add Certification
        </button>
      </div>

      <div className="section-content">
        {message && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        {certifications.length === 0 ? (
          <div className="empty-state">
            <p>No certifications added yet. Add your PMO certifications to stand out!</p>
          </div>
        ) : (
          <div className="certifications-list">
            {certifications.map(cert => (
              <div key={cert.id} className="cert-card">
                <div className="cert-icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#8b5cf6" stroke="#8b5cf6" strokeWidth="2"/>
                  </svg>
                </div>
                <div className="cert-details">
                  <h3 className="cert-title">{cert.title}</h3>
                  <p className="cert-issuer">{cert.issuingBody}</p>
                  <div className="cert-dates">
                    <span>Issued: {formatDate(cert.issueDate)}</span>
                    {cert.expiryDate && (
                      <span className={isExpired(cert.expiryDate) ? 'cert-expired' : ''}>
                        {isExpired(cert.expiryDate) ? 'Expired' : 'Expires'}: {formatDate(cert.expiryDate)}
                      </span>
                    )}
                  </div>
                  {cert.credentialId && (
                    <p className="cert-credential">Credential ID: {cert.credentialId}</p>
                  )}
                  {cert.verificationUrl && (
                    <a href={cert.verificationUrl} target="_blank" rel="noopener noreferrer" className="cert-verify-link">
                      Verify Credential →
                    </a>
                  )}
                </div>
                <div className="cert-actions">
                  <button onClick={() => openEditModal(cert)} className="cert-edit-btn">Edit</button>
                  <button onClick={() => handleDelete(cert.id)} className="cert-delete-btn">Delete</button>
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
              <h3>{editingCert ? 'Edit Certification' : 'Add New Certification'}</h3>
              <button onClick={() => setShowAddModal(false)} className="modal-close">×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Certification Title *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., PRINCE2 Practitioner"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  list="cert-suggestions"
                />
                <datalist id="cert-suggestions">
                  {COMMON_PMO_CERTIFICATIONS.map(cert => (
                    <option key={cert} value={cert} />
                  ))}
                </datalist>
              </div>

              <div className="form-group">
                <label className="form-label">Issuing Body *</label>
                <select
                  className="form-select"
                  value={form.issuingBody}
                  onChange={(e) => setForm({ ...form, issuingBody: e.target.value })}
                >
                  <option value="">Select issuing body...</option>
                  {PMO_CERTIFICATION_BODIES.map(body => (
                    <option key={body} value={body}>{body}</option>
                  ))}
                </select>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Issue Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={form.issueDate}
                    onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Expiry Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={form.expiryDate}
                    onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                  />
                  <p className="form-hint">Leave blank if certification doesn't expire</p>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Credential ID</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Certificate number or ID"
                  value={form.credentialId}
                  onChange={(e) => setForm({ ...form, credentialId: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Verification URL</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://..."
                  value={form.verificationUrl}
                  onChange={(e) => setForm({ ...form, verificationUrl: e.target.value })}
                />
                <p className="form-hint">Link to verify this certification online</p>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowAddModal(false)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleSubmit} className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : editingCert ? 'Update' : 'Add Certification'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
