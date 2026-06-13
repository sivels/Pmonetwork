import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';

const MAX_RECORDING_SECONDS = 120;

export default function VideoIntroSection({ profile, onUpdate }) {
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [message, setMessage] = useState(null);
  const [videoPreview, setVideoPreview] = useState(profile?.videoIntroUrl || null);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [cameraStream, setCameraStream] = useState(null);
  const [recordingTimeLeft, setRecordingTimeLeft] = useState(0);
  
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const videoChunksRef = useRef([]);
  const cameraVideoRef = useRef(null);
  const recordingTimeoutRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const recordingStartedAtRef = useRef(null);

  useEffect(() => {
    if (cameraVideoRef.current && cameraStream) {
      cameraVideoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  useEffect(() => {
    return () => {
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  const clearRecordingTimers = () => {
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      setMessage({ type: 'error', text: 'Please select a video file' });
      return;
    }

    // Validate file size (100MB max with Supabase Storage)
    if (file.size > 100 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Video must be smaller than 100MB.' });
      return;
    }

    await uploadVideo(file);
  };

  const uploadVideo = async (file) => {
    setUploading(true);
    setMessage(null);

    try {
      // Debug: Check if Supabase is configured
      console.log('Supabase client:', supabase);
      console.log('Supabase URL:', supabase.supabaseUrl);
      console.log('Storage client:', supabase.storage);
      
      // Test: List all buckets first
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      console.log('Available buckets:', buckets);
      if (bucketsError) console.error('Buckets error:', bucketsError);
      
      // Generate unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}/${Date.now()}.${fileExt}`;

      console.log('Uploading to bucket: Videos, file:', fileName);

      // Upload directly to Supabase Storage from client
      const { data, error: uploadError } = await supabase.storage
        .from('Videos')
        .upload(fileName, file, {
          contentType: file.type,
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        setMessage({ type: 'error', text: uploadError.message || 'Upload failed' });
        setUploading(false);
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('Videos')
        .getPublicUrl(fileName);

      // Update profile via API
      const res = await fetch('/api/candidate/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoIntroUrl: publicUrl })
      });

      if (res.ok) {
        setVideoPreview(publicUrl);
        onUpdate({ ...profile, videoIntroUrl: publicUrl });
        setMessage({ type: 'success', text: 'Video introduction uploaded successfully!' });
        setRecordedBlob(null);
      } else {
        const error = await res.json();
        setMessage({ type: 'error', text: error.error || 'Failed to update profile' });
      }
    } catch (err) {
      console.error('Upload error:', err);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const startRecording = async () => {
    if (recording) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true,
      });

      setCameraStream(stream);
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

        stream.getTracks().forEach((track) => track.stop());
        setCameraStream(null);
        setRecording(false);
        recordingStartedAtRef.current = null;
        setRecordingTimeLeft(MAX_RECORDING_SECONDS);
        clearRecordingTimers();
      };

      mediaRecorder.start();
      setRecording(true);
      setRecordingTimeLeft(MAX_RECORDING_SECONDS);
      recordingStartedAtRef.current = Date.now();
      setMessage({ type: 'info', text: 'Recording... Click Stop when finished (max 2 minutes)' });

      recordingIntervalRef.current = setInterval(() => {
        if (!recordingStartedAtRef.current) return;

        const elapsed = Math.floor((Date.now() - recordingStartedAtRef.current) / 1000);
        const remaining = Math.max(0, MAX_RECORDING_SECONDS - elapsed);
        setRecordingTimeLeft(remaining);

        if (remaining <= 0) {
          stopRecording();
        }
      }, 250);

      recordingTimeoutRef.current = setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          stopRecording();
        }
      }, MAX_RECORDING_SECONDS * 1000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Camera access denied or unavailable' });
    }
  };

  const stopRecording = () => {
    clearRecordingTimers();

    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      setMessage({ type: 'success', text: 'Recording complete! Click "Upload Recording" to save.' });
    }
  };

  const renderOverlayControls = () => (
    <div className="video-overlay-controls">
      {!recording ? (
        <button
          type="button"
          onClick={startRecording}
          className="btn-primary overlay-btn"
          disabled={uploading}
        >
          <span className="dot" /> Start Recording
        </button>
      ) : (
        <button
          type="button"
          onClick={stopRecording}
          className="btn-danger overlay-btn"
        >
          <span className="square" /> Stop Recording
        </button>
      )}
    </div>
  );

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
            {recording && cameraStream ? (
              <div className="camera-preview-wrap">
                <video
                  ref={cameraVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="video-preview camera-preview"
                />
                <div className={`camera-countdown-badge ${recordingTimeLeft <= 30 ? 'warning' : ''}`}>
                  {Math.floor(recordingTimeLeft / 60)}:{String(recordingTimeLeft % 60).padStart(2, '0')}
                </div>
                <div className="camera-live-badge">Live camera preview</div>
                {renderOverlayControls()}
              </div>
            ) : videoPreview ? (
              <div className="camera-preview-wrap">
                <video controls className="video-preview" src={videoPreview}>
                  Your browser does not support video playback.
                </video>
                {renderOverlayControls()}
              </div>
            ) : (
              <div className="camera-preview-wrap">
                <div className="video-placeholder">
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
                  </svg>
                  <p>No video uploaded</p>
                </div>
                {renderOverlayControls()}
              </div>
            )}
          </div>

          <div className="video-upload-actions">
            {!recording && (
              <>
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
              <li>✓ MP4, WebM, or MOV format, max 100MB</li>
            </ul>
          </div>
        </div>
      </div>

      <style jsx>{`
        .camera-preview-wrap {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 280px;
          overflow: hidden;
          border-radius: 14px;
        }

        .camera-preview {
          background: #111827;
        }

        .camera-live-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          padding: 0.35rem 0.6rem;
          border-radius: 999px;
          background: rgba(17, 24, 39, 0.82);
          color: #fff;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.02em;
        }

        .camera-countdown-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          padding: 0.35rem 0.6rem;
          border-radius: 999px;
          background: rgba(220, 38, 38, 0.88);
          color: #fff;
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.02em;
          min-width: 3.6rem;
          text-align: center;
        }

        .camera-countdown-badge.warning {
          background: rgba(249, 115, 22, 0.92);
        }

        .video-overlay-controls {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 14px;
          display: flex;
          justify-content: center;
          pointer-events: none;
        }

        .overlay-btn {
          pointer-events: auto;
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.22);
        }

        .dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: #fff;
        }

        .square {
          width: 10px;
          height: 10px;
          background: #fff;
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
}
