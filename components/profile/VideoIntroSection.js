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
  const [recordingTimeLeft, setRecordingTimeLeft] = useState(MAX_RECORDING_SECONDS);
  const [thumbnailUrl, setThumbnailUrl] = useState(null);
  const [thumbnailLoading, setThumbnailLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);

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
      if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current);
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      if (cameraStream) cameraStream.getTracks().forEach((t) => t.stop());
    };
  }, [cameraStream]);

  useEffect(() => {
    if (!recording) return;
    recordingIntervalRef.current = setInterval(() => {
      if (!recordingStartedAtRef.current) return;
      const elapsed = Math.floor((Date.now() - recordingStartedAtRef.current) / 1000);
      const remaining = Math.max(0, MAX_RECORDING_SECONDS - elapsed);
      setRecordingTimeLeft(remaining);
      if (remaining <= 0 && mediaRecorderRef.current?.state === 'recording') stopRecording();
    }, 250);
    return () => {
      if (recordingIntervalRef.current) { clearInterval(recordingIntervalRef.current); recordingIntervalRef.current = null; }
    };
  }, [recording]);

  const clearRecordingTimers = () => {
    if (recordingTimeoutRef.current) { clearTimeout(recordingTimeoutRef.current); recordingTimeoutRef.current = null; }
    if (recordingIntervalRef.current) { clearInterval(recordingIntervalRef.current); recordingIntervalRef.current = null; }
  };

  const captureCurrentCameraFrame = () => {
    const cameraVideo = cameraVideoRef.current;
    if (!cameraVideo || !cameraVideo.videoWidth || !cameraVideo.videoHeight) return null;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = cameraVideo.videoWidth;
      canvas.height = cameraVideo.videoHeight;
      const context = canvas.getContext('2d');
      if (!context) return null;
      context.drawImage(cameraVideo, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.82);
    } catch {
      return null;
    }
  };

  // Generate a JPEG thumbnail from any video URL.
  // Handles webm blobs from MediaRecorder which report Infinity duration.
  const generateThumbnail = (videoUrl) =>
    new Promise((resolve) => {
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;

      let settled = false;
      const done = (val) => {
        if (!settled) { settled = true; clearTimeout(timer); resolve(val); }
      };

      // Never hang forever
      const timer = setTimeout(() => done(null), 8000);

      const captureFrame = () => {
        if (!video.videoWidth) { done(null); return; }
        try {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          canvas.getContext('2d').drawImage(video, 0, 0);
          done(canvas.toDataURL('image/jpeg', 0.8));
        } catch { done(null); }
      };

      video.onseeked = captureFrame;

      video.onloadeddata = () => {
        if (isFinite(video.duration) && video.duration > 0) {
          video.currentTime = Math.min(1, video.duration / 2);
        } else {
          // webm from MediaRecorder has Infinity duration — grab first decoded frame
          captureFrame();
        }
      };

      video.onerror = () => done(null);
      video.src = videoUrl;
      video.load();
    });

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) { setMessage({ type: 'error', text: 'Please select a video file' }); return; }
    if (file.size > 100 * 1024 * 1024) { setMessage({ type: 'error', text: 'Video must be smaller than 100MB.' }); return; }

    const url = URL.createObjectURL(file);
    setPendingFile(file);
    setRecordedBlob(null);
    setVideoPreview(url);
    setThumbnailUrl(null);
    setThumbnailLoading(true);
    setMessage({ type: 'info', text: 'Video selected — preview it or upload.' });

    try {
      const thumb = await generateThumbnail(url);
      setThumbnailUrl(thumb);
    } finally {
      setThumbnailLoading(false);
    }
  };

  const uploadVideo = async (file) => {
    setUploading(true);
    setMessage(null);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('Videos')
        .upload(fileName, file, { contentType: file.type, upsert: false });

      if (uploadError) {
        setMessage({ type: 'error', text: uploadError.message || 'Upload failed' });
        setUploading(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage.from('Videos').getPublicUrl(fileName);

      const res = await fetch('/api/candidate/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoIntroUrl: publicUrl }),
      });

      if (res.ok) {
        setVideoPreview(publicUrl);
        onUpdate({ ...profile, videoIntroUrl: publicUrl });
        setMessage({ type: 'success', text: 'Video introduction uploaded successfully!' });
        setRecordedBlob(null);
        setPendingFile(null);
        setThumbnailUrl(null);
        setThumbnailLoading(false);
        setShowPreview(false);
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
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: true });
      setCameraStream(stream);
      videoChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) videoChunksRef.current.push(e.data); };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(videoChunksRef.current, { type: 'video/webm' });
        setRecordedBlob(blob);
        const url = URL.createObjectURL(blob);
        setVideoPreview(url);
        setShowPreview(true);

        const instantThumbnail = captureCurrentCameraFrame();
        if (instantThumbnail) {
          setThumbnailUrl(instantThumbnail);
          setThumbnailLoading(false);
        } else {
          setThumbnailUrl(null);
          setThumbnailLoading(true);
        }

        stream.getTracks().forEach((t) => t.stop());
        setCameraStream(null);
        setRecording(false);
        recordingStartedAtRef.current = null;
        setRecordingTimeLeft(MAX_RECORDING_SECONDS);
        clearRecordingTimers();

        if (!instantThumbnail) {
          try {
            const thumb = await generateThumbnail(url);
            if (thumb) {
              setThumbnailUrl(thumb);
            }
          } finally {
            setThumbnailLoading(false);
          }
        }

        setMessage({ type: 'success', text: 'Recording complete! Preview opened. Upload when ready.' });
      };

      mediaRecorder.start();
      setRecording(true);
      setRecordingTimeLeft(MAX_RECORDING_SECONDS);
      recordingStartedAtRef.current = Date.now();
      setMessage({ type: 'info', text: 'Recording... Click Stop when finished (max 2 minutes)' });

      recordingTimeoutRef.current = setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') stopRecording();
      }, MAX_RECORDING_SECONDS * 1000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Camera access denied or unavailable' });
    }
  };

  const stopRecording = () => {
    clearRecordingTimers();
    setRecording(false);
    if (mediaRecorderRef.current?.state === 'recording') {
      const preStopThumbnail = captureCurrentCameraFrame();
      if (preStopThumbnail) {
        setThumbnailUrl(preStopThumbnail);
        setThumbnailLoading(false);
      }
      mediaRecorderRef.current.stop();
      setMessage({ type: 'info', text: 'Finalizing recording… preparing instant preview.' });
    }
  };

  const renderOverlayControls = () => (
    <div className="video-overlay-controls">
      {!recording ? (
        <button type="button" onClick={startRecording} className="btn-primary overlay-btn" disabled={uploading}>
          <span className="dot" /> Start Recording
        </button>
      ) : (
        <button type="button" onClick={stopRecording} className="btn-danger overlay-btn">
          <span className="square" /> Stop Recording
        </button>
      )}
    </div>
  );

  const handleUploadPending = async () => {
    if (recordedBlob) await uploadVideo(new File([recordedBlob], 'video-intro.webm', { type: 'video/webm' }));
    else if (pendingFile) await uploadVideo(pendingFile);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to remove your video introduction?')) return;
    setUploading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/candidate/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoIntroUrl: null }),
      });
      if (res.ok) {
        setVideoPreview(null); setRecordedBlob(null); setPendingFile(null); setThumbnailUrl(null); setThumbnailLoading(false); setShowPreview(false);
        onUpdate({ ...profile, videoIntroUrl: null });
        setMessage({ type: 'success', text: 'Video removed' });
      } else {
        setMessage({ type: 'error', text: 'Failed to remove video' });
      }
    } catch { setMessage({ type: 'error', text: 'Network error. Please try again.' }); }
    finally { setUploading(false); }
  };

  const hasPending = !!(recordedBlob || pendingFile);

  return (
    <div className="profile-section">
      <div className="section-header">
        <h2 className="section-title">Video Introduction</h2>
        <p className="section-description">
          Stand out with a 60-120 second video introduction. Profiles with videos get 3x more employer views.
        </p>
      </div>

      <div className="section-content">
        {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

        <div className="video-upload-container">
          <div className="video-preview-area">
            {recording && cameraStream ? (
              /* Live camera */
              <div className="camera-preview-wrap">
                <video ref={cameraVideoRef} autoPlay muted playsInline className="video-preview camera-preview" />
                <div className={`camera-countdown-badge ${recordingTimeLeft <= 30 ? 'warning' : ''}`}>
                  {Math.floor(recordingTimeLeft / 60)}:{String(recordingTimeLeft % 60).padStart(2, '0')}
                </div>
                <div className="camera-live-badge">Live camera preview</div>
                {renderOverlayControls()}
              </div>
            ) : hasPending ? (
              /* Thumbnail / pending */
              <div className="camera-preview-wrap">
                {thumbnailLoading ? (
                  <div className="thumbnail-loading-wrap">
                    <div className="thumbnail-spinner" />
                    <p>Generating preview…</p>
                  </div>
                ) : thumbnailUrl ? (
                  <img src={thumbnailUrl} className="video-thumbnail" alt="Video preview thumbnail" />
                ) : (
                  <div className="thumbnail-fallback-wrap">
                    <p>Preview image unavailable</p>
                    <small>Use Preview Video to watch before upload.</small>
                  </div>
                )}
                {/* Play button always visible so user can preview even while thumbnail loads */}
                <button className="thumbnail-play-btn" onClick={() => setShowPreview(true)} aria-label="Preview video">
                  <svg viewBox="0 0 24 24" fill="white" width="40" height="40">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </button>
                <div className="thumbnail-ready-badge">Ready to upload</div>
                {renderOverlayControls()}
              </div>
            ) : videoPreview ? (
              /* Already uploaded */
              <div className="camera-preview-wrap">
                <video controls className="video-preview" src={videoPreview}>
                  Your browser does not support video playback.
                </video>
                {renderOverlayControls()}
              </div>
            ) : (
              /* Empty */
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
            )}

            {hasPending && (
              <>
                <button type="button" onClick={() => setShowPreview(true)} className="btn-secondary" disabled={uploading}>
                  ▶ Preview Video
                </button>
                <button type="button" onClick={handleUploadPending} className="btn-primary" disabled={uploading}>
                  {uploading ? 'Uploading...' : recordedBlob ? 'Upload Recording' : 'Upload Video'}
                </button>
              </>
            )}

            {videoPreview && profile?.videoIntroUrl && (
              <button type="button" onClick={handleDelete} className="btn-danger-outline" disabled={uploading}>
                Remove Video
              </button>
            )}
          </div>

          <div className="video-upload-tips">
            <h4>Video Tips:</h4>
            <ul>
              <li>✓ Keep it between 60-120 seconds</li>
              <li>✓ Introduce yourself and your PMO experience</li>
              <li>✓ Mention key skills and what you&apos;re looking for</li>
              <li>✓ Good lighting and clear audio</li>
              <li>✓ Professional background</li>
              <li>✓ Dress professionally</li>
              <li>✓ MP4, WebM, or MOV format, max 100MB</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Preview modal */}
      {showPreview && videoPreview && (
        <div className="video-modal-overlay" onClick={() => setShowPreview(false)}>
          <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="video-modal-close" onClick={() => setShowPreview(false)}>✕</button>
            <video controls autoPlay className="video-modal-player" src={videoPreview} />
          </div>
        </div>
      )}

      <style jsx>{`
        .camera-preview-wrap {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 280px;
          overflow: hidden;
          border-radius: 14px;
        }
        .camera-preview { background: #111827; }
        .camera-live-badge {
          position: absolute; top: 12px; left: 12px;
          padding: 0.35rem 0.6rem; border-radius: 999px;
          background: rgba(17,24,39,0.82); color: #fff;
          font-size: 0.75rem; font-weight: 700; letter-spacing: 0.02em;
        }
        .camera-countdown-badge {
          position: absolute; top: 12px; right: 12px;
          padding: 0.35rem 0.6rem; border-radius: 999px;
          background: rgba(220,38,38,0.88); color: #fff;
          font-size: 0.75rem; font-weight: 800; letter-spacing: 0.02em;
          min-width: 3.6rem; text-align: center;
        }
        .camera-countdown-badge.warning { background: rgba(249,115,22,0.92); }
        .video-overlay-controls {
          position: absolute; left: 0; right: 0; bottom: 14px;
          display: flex; justify-content: center; pointer-events: none;
        }
        .overlay-btn {
          pointer-events: auto;
          display: inline-flex; align-items: center; gap: 0.45rem;
          box-shadow: 0 8px 25px rgba(0,0,0,0.22);
        }
        .dot { width: 10px; height: 10px; border-radius: 999px; background: #fff; }
        .square { width: 10px; height: 10px; background: #fff; border-radius: 2px; }

        .video-thumbnail {
          width: 100%; height: 100%; min-height: 280px;
          object-fit: cover; display: block; border-radius: 14px;
        }
        .thumbnail-play-btn {
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0,0,0,0.6);
          border: 3px solid rgba(255,255,255,0.8);
          border-radius: 50%; width: 72px; height: 72px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s; padding-left: 5px;
        }
        .thumbnail-play-btn:hover {
          background: rgba(0,0,0,0.85);
          transform: translate(-50%, -50%) scale(1.06);
        }
        .thumbnail-ready-badge {
          position: absolute; top: 12px; left: 12px;
          padding: 0.35rem 0.6rem; border-radius: 999px;
          background: rgba(34,197,94,0.88); color: #fff;
          font-size: 0.75rem; font-weight: 700;
        }
        .thumbnail-loading-wrap {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          min-height: 280px; background: #111827;
          border-radius: 14px; color: #9ca3af; gap: 0.75rem;
        }
        .thumbnail-fallback-wrap {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          min-height: 280px; background: #111827;
          border-radius: 14px; color: #d1d5db; gap: 0.5rem;
          text-align: center;
          padding: 1rem;
        }
        .thumbnail-fallback-wrap small {
          color: #9ca3af;
        }
        .thumbnail-spinner {
          width: 36px; height: 36px;
          border: 3px solid rgba(255,255,255,0.15);
          border-top-color: #fff; border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .video-modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.88); z-index: 9999;
          display: flex; align-items: center; justify-content: center;
          padding: 1rem;
        }
        .video-modal-content { position: relative; width: 100%; max-width: 820px; }
        .video-modal-close {
          position: absolute; top: -44px; right: 0;
          background: none; border: none; color: white;
          font-size: 1.6rem; cursor: pointer; line-height: 1;
          padding: 0.25rem 0.5rem;
        }
        .video-modal-close:hover { opacity: 0.7; }
        .video-modal-player {
          width: 100%; border-radius: 12px;
          max-height: 80vh; background: #000;
        }
      `}</style>
    </div>
  );
}
