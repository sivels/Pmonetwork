import { useState, useRef } from 'react';

export default function VideoIntroSection({ profile, onUpdate }) {
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [message, setMessage] = useState(null);
  const [videoPreview, setVideoPreview] = useState(profile?.videoIntroUrl || null);
  const [recordedBlob, setRecordedBlob] = useState(null);
  
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const videoChunksRef = useRef([]);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      setMessage({ type: 'error', text: 'Please select a video file' });
      return;
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Video must be smaller than 50MB' });
      return;
    }

    await uploadVideo(file);
  };

  const uploadVideo = async (file) => {
    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('video', file);

      const res = await fetch('/api/candidate/upload-video', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setVideoPreview(data.videoUrl);
        onUpdate({ ...profile, videoIntroUrl: data.videoUrl });
        setMessage({ type: 'success', text: 'Video introduction uploaded successfully!' });
        setRecordedBlob(null);
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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720 }, 
        audio: true 
      });
      
      videoChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          videoChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(videoChunksRef.current, { type: 'video/webm' });
        setRecordedBlob(blob);
        const url = URL.createObjectURL(blob);
        setVideoPreview(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setRecording(true);
      setMessage({ type: 'info', text: 'Recording... Click Stop when finished (max 2 minutes)' });

      // Auto-stop after 2 minutes
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          stopRecording();
        }
      }, 120000);

    } catch (err) {
      setMessage({ type: 'error', text: 'Camera access denied or unavailable' });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      setRecording(false);
      setMessage({ type: 'success', text: 'Recording complete! Click "Upload Recording" to save.' });
    }
  };

  const handleUploadRecording = async () => {
    if (!recordedBlob) return;
    const file = new File([recordedBlob], 'video-intro.webm', { type: 'video/webm' });
    await uploadVideo(file);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to remove your video introduction?')) return;

    setUploading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/candidate/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoIntroUrl: null })
      });

      if (res.ok) {
        setVideoPreview(null);
        setRecordedBlob(null);
        onUpdate({ ...profile, videoIntroUrl: null });
        setMessage({ type: 'success', text: 'Video removed' });
      } else {
        setMessage({ type: 'error', text: 'Failed to remove video' });
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
        <h2 className="section-title">Video Introduction</h2>
        <p className="section-description">
          Stand out with a 60-120 second video introduction. Profiles with videos get 3x more employer views.
        </p>
      </div>

      <div className="section-content">
        {message && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="video-upload-container">
          <div className="video-preview-area">
            {videoPreview ? (
              <video controls className="video-preview" src={videoPreview}>
                Your browser does not support video playback.
              </video>
            ) : (
              <div className="video-placeholder">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
                </svg>
                <p>No video uploaded</p>
              </div>
            )}
          </div>

          <div className="video-upload-actions">
            {!recording && (
              <>
                <button
                  type="button"
                  onClick={startRecording}
                  className="btn-primary"
                  disabled={uploading}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ marginRight: '8px' }}>
                    <circle cx="12" cy="12" r="10" strokeWidth="2" />
                    <circle cx="12" cy="12" r="3" fill="currentColor" />
                  </svg>
                  Record Video
                </button>

                <div className="file-upload-option">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="file-input-hidden"
                    id="video-upload-input"
                    disabled={uploading}
                  />
                  <label htmlFor="video-upload-input" className={`btn-secondary ${uploading ? 'btn-disabled' : ''}`}>
                    {uploading ? 'Uploading...' : 'Upload Video File'}
                  </label>
                </div>
              </>
            )}

            {recording && (
              <button
                type="button"
                onClick={stopRecording}
                className="btn-danger"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '8px' }}>
                  <rect x="6" y="6" width="12" height="12" />
                </svg>
                Stop Recording
              </button>
            )}

            {recordedBlob && !profile?.videoIntroUrl && (
              <button
                type="button"
                onClick={handleUploadRecording}
                className="btn-primary"
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Upload Recording'}
              </button>
            )}

            {videoPreview && profile?.videoIntroUrl && (
              <button
                type="button"
                onClick={handleDelete}
                className="btn-danger-outline"
                disabled={uploading}
              >
                Remove Video
              </button>
            )}
          </div>

          <div className="video-upload-tips">
            <h4>Video Tips:</h4>
            <ul>
              <li>✓ Keep it between 60-120 seconds</li>
              <li>✓ Introduce yourself and your PMO experience</li>
              <li>✓ Mention key skills and what you're looking for</li>
              <li>✓ Good lighting and clear audio</li>
              <li>✓ Professional background</li>
              <li>✓ Dress professionally</li>
              <li>✓ MP4, WebM, or MOV format, max 50MB</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
