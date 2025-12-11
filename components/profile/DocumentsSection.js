import { useState, useEffect, useRef } from 'react';

export default function DocumentsSection({ profile, onUpdate }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/candidate/documents');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e, documentType = 'other') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File must be smaller than 10MB' });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('documentType', documentType);
      formData.append('title', file.name);

      const res = await fetch('/api/candidate/upload-document', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setDocuments([data.document, ...documents]);
        setMessage({ type: 'success', text: 'Document uploaded successfully!' });
      } else {
        const error = await res.json();
        setMessage({ type: 'error', text: error.error || 'Upload failed' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCVUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'CV must be smaller than 10MB' });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('cv', file);

      const res = await fetch('/api/candidate/upload-cv', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        onUpdate({ ...profile, cvUrl: data.cvUrl });
        // Also add to documents list
        fetchDocuments();
        setMessage({ type: 'success', text: 'CV uploaded successfully!' });
      } else {
        const error = await res.json();
        setMessage({ type: 'error', text: error.error || 'Upload failed' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!confirm('Delete this document permanently?')) return;

    try {
      const res = await fetch(`/api/candidate/delete-document?id=${docId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setDocuments(documents.filter(d => d.id !== docId));
        setMessage({ type: 'success', text: 'Document deleted' });
      } else {
        setMessage({ type: 'error', text: 'Failed to delete document' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    if (ext === 'pdf') return '📄';
    if (['doc', 'docx'].includes(ext)) return '📝';
    if (['xls', 'xlsx'].includes(ext)) return '📊';
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return '🖼️';
    return '📎';
  };

  const cvDocuments = documents.filter(d => d.documentType === 'cv');
  const otherDocuments = documents.filter(d => d.documentType !== 'cv');

  if (loading) {
    return <div className="section-loading">Loading documents...</div>;
  }

  return (
    <div className="profile-section">
      <div className="section-header">
        <h2 className="section-title">Documents & CV Repository</h2>
        <p className="section-description">
          Upload your CV, certificates, and supporting documents
        </p>
      </div>

      <div className="section-content">
        {message && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        {/* CV Upload Section */}
        <div className="cv-upload-section">
          <h3 className="subsection-title">Your CV</h3>
          <p className="subsection-description">
            Keep your CV up to date. Upload new versions anytime - we'll keep a history.
          </p>
          
          <div className="cv-upload-area">
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleCVUpload}
              className="file-input-hidden"
              id="cv-upload-input"
              disabled={uploading}
            />
            <label htmlFor="cv-upload-input" className={`btn-primary-lg ${uploading ? 'btn-disabled' : ''}`}>
              {uploading ? 'Uploading...' : profile?.cvUrl ? 'Upload New CV Version' : 'Upload CV'}
            </label>
            <p className="upload-hint">PDF, DOC, or DOCX • Max 10MB</p>
          </div>

          {cvDocuments.length > 0 && (
            <div className="cv-versions-list">
              <h4>CV Versions ({cvDocuments.length})</h4>
              {cvDocuments.map((doc, index) => (
                <div key={doc.id} className="document-item cv-item">
                  <div className="doc-icon">{getFileIcon(doc.filename)}</div>
                  <div className="doc-details">
                    <p className="doc-title">
                      {doc.title || doc.filename}
                      {index === 0 && <span className="cv-current-badge">Current</span>}
                    </p>
                    <p className="doc-meta">
                      Uploaded {formatDate(doc.uploadedAt)} • {formatFileSize(doc.fileSize)}
                    </p>
                  </div>
                  <div className="doc-actions">
                    <a href={doc.url} target="_blank" rel="noopener noreferrer" className="doc-view-btn">
                      View
                    </a>
                    <button onClick={() => handleDelete(doc.id)} className="doc-delete-btn">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Other Documents Section */}
        <div className="other-documents-section">
          <h3 className="subsection-title">Other Documents</h3>
          <p className="subsection-description">
            Upload certificates, references, portfolios, or any supporting documents
          </p>

          <div className="document-upload-area">
            <input
              ref={fileInputRef}
              type="file"
              onChange={(e) => handleFileUpload(e, 'other')}
              className="file-input-hidden"
              id="doc-upload-input"
              disabled={uploading}
            />
            <label htmlFor="doc-upload-input" className={`btn-secondary ${uploading ? 'btn-disabled' : ''}`}>
              {uploading ? 'Uploading...' : '+ Upload Document'}
            </label>
          </div>

          {otherDocuments.length === 0 ? (
            <div className="empty-state-small">
              <p>No documents uploaded yet</p>
            </div>
          ) : (
            <div className="documents-list">
              {otherDocuments.map(doc => (
                <div key={doc.id} className="document-item">
                  <div className="doc-icon">{getFileIcon(doc.filename)}</div>
                  <div className="doc-details">
                    <p className="doc-title">{doc.title || doc.filename}</p>
                    <p className="doc-meta">
                      Uploaded {formatDate(doc.uploadedAt)} • {formatFileSize(doc.fileSize)}
                    </p>
                  </div>
                  <div className="doc-actions">
                    <a href={doc.url} target="_blank" rel="noopener noreferrer" className="doc-view-btn">
                      View
                    </a>
                    <button onClick={() => handleDelete(doc.id)} className="doc-delete-btn">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="documents-tips">
          <h4>Document Tips:</h4>
          <ul>
            <li>✓ Keep your CV updated with latest experience</li>
            <li>✓ Upload certificates for all your qualifications</li>
            <li>✓ Include references or recommendation letters</li>
            <li>✓ Add portfolio samples or case studies</li>
            <li>✓ All documents are private and only shared when you apply</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
