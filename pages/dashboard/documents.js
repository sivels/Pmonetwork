import Head from 'next/head';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]';
import { prisma } from '../../lib/prisma';
import Link from 'next/link';
import { useState } from 'react';

export async function getServerSideProps(ctx) {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session) {
    return { redirect: { destination: '/auth/login', permanent: false } };
  }
  if ((session.user.role || '').toLowerCase() !== 'candidate') {
    return { redirect: { destination: '/dashboard/employer', permanent: false } };
  }
  
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { 
      candidateCandidateProfile: { 
        include: { 
          documents: true 
        } 
      } 
    }
  });

  const profile = user?.candidateCandidateProfile || null;
  const documents = profile?.documents || [];

  return { 
    props: { 
      documents: JSON.parse(JSON.stringify(documents)),
      profileId: profile?.id || null
    } 
  };
}

export default function DocumentRepository({ documents: initialDocuments, profileId }) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [renameDoc, setRenameDoc] = useState(null);
  const [newName, setNewName] = useState('');

  const categories = {
    identity: {
      label: 'Identity & Compliance',
      icon: '🔒',
      description: 'Private documents for verification only',
      subcategories: ['Passport', 'Driving License', 'National ID', 'Right-to-Work', 'Visa/Work Permit', 'P45']
    },
    professional: {
      label: 'Professional Documents',
      icon: '📄',
      description: 'Documents you can share with employers',
      subcategories: ['CV/Resume', 'Cover Letter', 'Reference', 'Certificate', 'Training Record', 'Portfolio', 'Case Study']
    },
    other: {
      label: 'Additional Documents',
      icon: '📎',
      description: 'Miscellaneous files and supporting documents',
      subcategories: ['Miscellaneous', 'Notes', 'Supporting Document']
    }
  };

  const getDocumentsByCategory = (category) => {
    if (category === 'all') return documents;
    return documents.filter(doc => doc.documentType === category);
  };

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return '📕';
    if (['doc', 'docx'].includes(ext)) return '📘';
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return '🖼️';
    if (['xls', 'xlsx'].includes(ext)) return '📗';
    return '📄';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (date) => {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  async function deleteDocument(docId) {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    const res = await fetch(`/api/candidate/documents/${docId}`, {
      method: 'DELETE'
    });

    if (res.ok) {
      setDocuments(documents.filter(d => d.id !== docId));
    } else {
      alert('Failed to delete document');
    }
  }

  async function renameDocument(docId) {
    if (!newName.trim()) return;

    const res = await fetch(`/api/candidate/documents/${docId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: newName })
    });

    if (res.ok) {
      setDocuments(documents.map(d => d.id === docId ? { ...d, filename: newName } : d));
      setRenameDoc(null);
      setNewName('');
    } else {
      alert('Failed to rename document');
    }
  }

  const isIdentityDoc = (docType) => docType === 'identity';

  return (
    <>
      <Head>
        <title>Document Repository – PMO Network</title>
        <meta name="description" content="Manage your professional and compliance documents" />
      </Head>

      <div className="document-repository-page">
        {/* Header */}
        <header className="repo-header">
          <div className="repo-header-left">
            <Link href="/dashboard/profile?section=documents" className="back-link">
              ← Back to Profile
            </Link>
            <div className="repo-title-section">
              <h1>Document Repository</h1>
              <p className="subtitle">Manage and upload documents for your applications</p>
            </div>
          </div>
          <div className="repo-header-right">
            <button className="btn primary" onClick={() => setShowUploadModal(true)}>
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Upload New Document
            </button>
          </div>
        </header>

        {/* Category Filter */}
        <div className="category-filter">
          <button 
            className={`filter-btn ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            All Documents ({documents.length})
          </button>
          {Object.keys(categories).map(cat => (
            <button 
              key={cat}
              className={`filter-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {categories[cat].icon} {categories[cat].label} ({getDocumentsByCategory(cat).length})
            </button>
          ))}
        </div>

        {/* Document Categories */}
        <div className="document-categories">
          {Object.keys(categories).map(categoryKey => {
            const category = categories[categoryKey];
            const categoryDocs = getDocumentsByCategory(categoryKey);
            
            if (selectedCategory !== 'all' && selectedCategory !== categoryKey) return null;

            return (
              <section key={categoryKey} className="category-section">
                <div className="category-header">
                  <div className="category-title">
                    <span className="category-icon">{category.icon}</span>
                    <div>
                      <h2>{category.label}</h2>
                      <p className="category-description">{category.description}</p>
                    </div>
                  </div>
                  <span className="category-count">{categoryDocs.length} document{categoryDocs.length !== 1 ? 's' : ''}</span>
                </div>

                {categoryDocs.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📭</div>
                    <p className="empty-text">You haven't uploaded any {category.label.toLowerCase()} yet.</p>
                    <button className="btn secondary" onClick={() => setShowUploadModal(true)}>
                      Upload Document
                    </button>
                  </div>
                ) : (
                  <div className="document-grid">
                    {categoryDocs.map(doc => (
                      <div key={doc.id} className="document-card">
                        <div className="doc-card-header">
                          <span className="file-icon">{getFileIcon(doc.filename)}</span>
                          {isIdentityDoc(doc.documentType) && (
                            <span className="doc-badge private">
                              🔒 Private
                            </span>
                          )}
                          {doc.isPublic && !isIdentityDoc(doc.documentType) && (
                            <span className="doc-badge shared">
                              ✓ Shareable
                            </span>
                          )}
                        </div>
                        
                        <div className="doc-card-body">
                          {renameDoc === doc.id ? (
                            <div className="rename-input-group">
                              <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="New document name"
                                className="rename-input"
                                autoFocus
                              />
                              <div className="rename-actions">
                                <button className="btn-icon success" onClick={() => renameDocument(doc.id)}>✓</button>
                                <button className="btn-icon cancel" onClick={() => { setRenameDoc(null); setNewName(''); }}>✕</button>
                              </div>
                            </div>
                          ) : (
                            <h3 className="doc-name" title={doc.filename}>{doc.filename}</h3>
                          )}
                          <div className="doc-meta">
                            <span className="doc-category">{doc.title || categoryKey}</span>
                            <span className="doc-divider">•</span>
                            <span className="doc-date">{formatDate(doc.uploadedAt)}</span>
                            {doc.fileSize && (
                              <>
                                <span className="doc-divider">•</span>
                                <span className="doc-size">{formatFileSize(doc.fileSize)}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="doc-card-actions">
                          <a href={doc.url} target="_blank" rel="noopener noreferrer" className="doc-action-btn" title="View">
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </a>
                          <button className="doc-action-btn" title="Rename" onClick={() => { setRenameDoc(doc.id); setNewName(doc.filename); }}>
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <a href={doc.url} download className="doc-action-btn" title="Download">
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </a>
                          <button className="doc-action-btn danger" title="Delete" onClick={() => deleteDocument(doc.id)}>
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <UploadModal 
            profileId={profileId}
            categories={categories}
            onClose={() => setShowUploadModal(false)} 
            onUploadSuccess={(newDoc) => {
              setDocuments([...documents, newDoc]);
              setShowUploadModal(false);
            }}
          />
        )}
      </div>

      <style jsx>{`
        .document-repository-page {
          max-width: 1400px;
          margin: 0 auto;
          padding: 24px;
          background: #f8f9fa;
          min-height: 100vh;
        }

        .repo-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 32px;
          background: white;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .repo-header-left {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .back-link {
          color: #6366f1;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: color 0.2s;
        }

        .back-link:hover {
          color: #4f46e5;
        }

        .repo-title-section h1 {
          font-size: 28px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .subtitle {
          color: #64748b;
          font-size: 14px;
          margin: 4px 0 0 0;
        }

        .btn {
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          border: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .btn.primary {
          background: #6366f1;
          color: white;
        }

        .btn.primary:hover {
          background: #4f46e5;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .btn.secondary {
          background: white;
          color: #6366f1;
          border: 2px solid #6366f1;
        }

        .btn.secondary:hover {
          background: #f0f9ff;
        }

        .category-filter {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          padding: 16px;
          background: white;
          border-radius: 12px;
          overflow-x: auto;
        }

        .filter-btn {
          padding: 8px 16px;
          border-radius: 8px;
          border: 2px solid #e2e8f0;
          background: white;
          color: #64748b;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
        }

        .filter-btn:hover {
          border-color: #cbd5e1;
          background: #f8fafc;
        }

        .filter-btn.active {
          border-color: #6366f1;
          background: #eef2ff;
          color: #6366f1;
        }

        .document-categories {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .category-section {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .category-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 2px solid #f1f5f9;
        }

        .category-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .category-icon {
          font-size: 28px;
        }

        .category-title h2 {
          font-size: 20px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .category-description {
          font-size: 13px;
          color: #64748b;
          margin: 4px 0 0 0;
        }

        .category-count {
          font-size: 14px;
          font-weight: 600;
          color: #64748b;
          background: #f1f5f9;
          padding: 6px 12px;
          border-radius: 20px;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
        }

        .empty-icon {
          font-size: 64px;
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .empty-text {
          color: #64748b;
          font-size: 16px;
          margin-bottom: 20px;
        }

        .document-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }

        .document-card {
          background: #fafbfc;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          padding: 16px;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .document-card:hover {
          border-color: #cbd5e1;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }

        .doc-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .file-icon {
          font-size: 32px;
        }

        .doc-badge {
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .doc-badge.private {
          background: #fee2e2;
          color: #991b1b;
        }

        .doc-badge.shared {
          background: #dcfce7;
          color: #166534;
        }

        .doc-card-body {
          flex: 1;
        }

        .doc-name {
          font-size: 15px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .doc-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 8px;
          font-size: 12px;
          color: #64748b;
        }

        .doc-divider {
          color: #cbd5e1;
        }

        .doc-card-actions {
          display: flex;
          gap: 8px;
          padding-top: 12px;
          border-top: 1px solid #e2e8f0;
        }

        .doc-action-btn {
          flex: 1;
          padding: 8px;
          border: 1px solid #e2e8f0;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          color: #64748b;
          text-decoration: none;
        }

        .doc-action-btn:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #475569;
        }

        .doc-action-btn.danger:hover {
          background: #fef2f2;
          border-color: #fecaca;
          color: #dc2626;
        }

        .rename-input-group {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .rename-input {
          flex: 1;
          padding: 6px 10px;
          border: 2px solid #6366f1;
          border-radius: 6px;
          font-size: 14px;
          outline: none;
        }

        .rename-actions {
          display: flex;
          gap: 4px;
        }

        .btn-icon {
          width: 28px;
          height: 28px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          transition: all 0.2s;
        }

        .btn-icon.success {
          background: #dcfce7;
          color: #166534;
        }

        .btn-icon.success:hover {
          background: #bbf7d0;
        }

        .btn-icon.cancel {
          background: #fee2e2;
          color: #991b1b;
        }

        .btn-icon.cancel:hover {
          background: #fecaca;
        }

        @media (max-width: 768px) {
          .repo-header {
            flex-direction: column;
            gap: 16px;
          }

          .category-filter {
            flex-wrap: wrap;
          }

          .document-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}

function UploadModal({ profileId, categories, onClose, onUploadSuccess }) {
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    documentName: '',
    category: 'professional',
    expiryDate: '',
    title: ''
  });
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Validate file size (10MB max)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Unsupported file format. Please upload PDF, DOC, DOCX, JPG, or PNG files.');
      return;
    }

    setError('');
    setFile(selectedFile);
    if (!formData.documentName) {
      setFormData({ ...formData, documentName: selectedFile.name });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    if (!formData.category) {
      setError('Please select a document category');
      return;
    }

    setUploading(true);
    setError('');

    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('documentName', formData.documentName || file.name);
    uploadFormData.append('category', formData.category);
    uploadFormData.append('title', formData.title);
    if (formData.expiryDate) {
      uploadFormData.append('expiryDate', formData.expiryDate);
    }

    try {
      const res = await fetch('/api/candidate/documents/upload', {
        method: 'POST',
        body: uploadFormData
      });

      if (res.ok) {
        const newDoc = await res.json();
        onUploadSuccess(newDoc);
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Failed to upload document');
      }
    } catch (err) {
      setError('An error occurred while uploading');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Upload New Document</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label className="form-label">Choose File *</label>
              <div className="file-upload-area">
                <input 
                  type="file" 
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  id="file-input"
                  style={{ display: 'none' }}
                />
                <label htmlFor="file-input" className="file-upload-label">
                  <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span>{file ? file.name : 'Click to browse or drag and drop'}</span>
                  <span className="file-hint">PDF, DOC, DOCX, JPG, PNG (max 10MB)</span>
                </label>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Document Name *</label>
              <input
                type="text"
                className="form-input"
                value={formData.documentName}
                onChange={(e) => setFormData({ ...formData, documentName: e.target.value })}
                placeholder="e.g., John_Smith_CV_2025.pdf"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category *</label>
              <select
                className="form-input"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              >
                {Object.keys(categories).map(key => (
                  <option key={key} value={key}>{categories[key].label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Subcategory / Title</label>
              <input
                type="text"
                className="form-input"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., CV/Resume, Passport, Certificate"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Expiry Date (Optional)</label>
              <input
                type="date"
                className="form-input"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              />
              <span className="form-hint">For visas, passports, certifications, etc.</span>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn primary" disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload Document'}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          background: white;
          border-radius: 16px;
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          border-bottom: 2px solid #f1f5f9;
        }

        .modal-header h2 {
          font-size: 22px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 24px;
          color: #64748b;
          cursor: pointer;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .modal-close:hover {
          background: #f1f5f9;
          color: #1e293b;
        }

        .modal-body {
          padding: 24px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 8px;
        }

        .form-input {
          width: 100%;
          padding: 10px 14px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.2s;
          box-sizing: border-box;
        }

        .form-input:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .form-hint {
          display: block;
          font-size: 12px;
          color: #64748b;
          margin-top: 6px;
        }

        .file-upload-area {
          border: 2px dashed #cbd5e1;
          border-radius: 12px;
          padding: 32px;
          text-align: center;
          transition: all 0.2s;
          cursor: pointer;
        }

        .file-upload-area:hover {
          border-color: #6366f1;
          background: #f8fafc;
        }

        .file-upload-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          color: #64748b;
        }

        .file-upload-label svg {
          color: #6366f1;
        }

        .file-upload-label span:first-of-type {
          font-weight: 600;
          color: #1e293b;
        }

        .file-hint {
          font-size: 12px;
          color: #94a3b8;
        }

        .error-message {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 12px;
          border-radius: 8px;
          font-size: 14px;
          margin-bottom: 20px;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 24px;
          border-top: 2px solid #f1f5f9;
        }

        .btn {
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn.primary {
          background: #6366f1;
          color: white;
        }

        .btn.primary:hover:not(:disabled) {
          background: #4f46e5;
        }

        .btn.secondary {
          background: white;
          color: #6366f1;
          border: 2px solid #6366f1;
        }

        .btn.secondary:hover {
          background: #f0f9ff;
        }
      `}</style>
    </div>
  );
}
