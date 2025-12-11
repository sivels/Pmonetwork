import { useState, useRef } from 'react';

export default function PhotoUploadSection({ profile, onUpdate }) {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const [preview, setPreview] = useState(profile?.profilePhotoUrl || null);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file' });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image must be smaller than 5MB' });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('photo', file);

      const res = await fetch('/api/candidate/upload-photo', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setPreview(data.photoUrl);
        onUpdate({ ...profile, profilePhotoUrl: data.photoUrl });
        setMessage({ type: 'success', text: 'Profile photo updated successfully!' });
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

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to remove your profile photo?')) return;

    setUploading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/candidate/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profilePhotoUrl: null })
      });

      if (res.ok) {
        setPreview(null);
        onUpdate({ ...profile, profilePhotoUrl: null });
        setMessage({ type: 'success', text: 'Profile photo removed' });
      } else {
        setMessage({ type: 'error', text: 'Failed to remove photo' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="profile-section">
      <div className="section-header">
        <h2 className="section-title">Profile Photo</h2>
        <p className="section-description">
          A professional photo helps employers recognize you and increases profile views by 40%
        </p>
      </div>

      <div className="section-content">
        {message && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="photo-upload-container">
          <div className="photo-preview-area">
            {preview ? (
              <div className="photo-preview-wrapper">
                <img src={preview} alt="Profile photo" className="photo-preview-large" />
              </div>
            ) : (
              <div className="photo-placeholder">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="7" r="4" strokeWidth="2"/>
                </svg>
                <p>No photo uploaded</p>
              </div>
            )}
          </div>

          <div className="photo-upload-actions">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="file-input-hidden"
              id="photo-upload-input"
              disabled={uploading}
            />
            <label htmlFor="photo-upload-input" className={`btn-primary ${uploading ? 'btn-disabled' : ''}`}>
              {uploading ? 'Uploading...' : preview ? 'Change Photo' : 'Upload Photo'}
            </label>

            {preview && (
              <button
                type="button"
                onClick={handleDelete}
                className="btn-secondary"
                disabled={uploading}
              >
                Remove Photo
              </button>
            )}
          </div>

          <div className="photo-upload-tips">
            <h4>Photo Tips:</h4>
            <ul>
              <li>✓ Use a recent, professional headshot</li>
              <li>✓ Face clearly visible with good lighting</li>
              <li>✓ Plain or professional background</li>
              <li>✓ Square format works best (1:1 ratio)</li>
              <li>✓ JPG or PNG format, max 5MB</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
