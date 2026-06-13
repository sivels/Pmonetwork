import { useEffect, useMemo, useRef, useState } from 'react';

const MAX_RECORDING_SECONDS = 120;

const STEPS = {
  INSTRUCTIONS: 'instructions',
  RECORDING: 'recording',
  REVIEW: 'review',
  SUCCESS: 'success',
};

function formatTimer(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

function selectRecorderMimeType() {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') return '';

  const candidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4;codecs=h264,aac',
    'video/mp4',
  ];

  return candidates.find((mime) => MediaRecorder.isTypeSupported(mime)) || '';
}

async function generateThumbnailFromVideo(videoUrl) {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';

    let settled = false;
    const finish = (value) => {
      if (!settled) {
        settled = true;
        clearTimeout(timeoutId);
        resolve(value);
      }
    };

    const timeoutId = setTimeout(() => finish(null), 8000);

    const drawFrame = () => {
      try {
        if (!video.videoWidth || !video.videoHeight) {
          finish(null);
          return;
        }
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if (!context) {
          finish(null);
          return;
        }
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        finish(canvas.toDataURL('image/jpeg', 0.86));
      } catch {
        finish(null);
      }
    };

    video.onloadedmetadata = () => {
      const seekTime = 0.1;
      try {
        video.currentTime = seekTime;
      } catch {
        drawFrame();
      }
    };

    video.onseeked = drawFrame;
    video.onloadeddata = () => {
      if (!isFinite(video.duration)) {
        drawFrame();
      }
    };
    video.onerror = () => finish(null);

    video.src = videoUrl;
    video.load();
  });
}

export default function VideoIntroSection({ profile, onUpdate }) {
  const [step, setStep] = useState(profile?.videoIntroUrl ? STEPS.SUCCESS : STEPS.INSTRUCTIONS);
  const [recordingTimeLeft, setRecordingTimeLeft] = useState(MAX_RECORDING_SECONDS);
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);

  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordedUrl, setRecordedUrl] = useState(null);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState(profile?.videoIntroUrl || null);
  const [successThumbnail, setSuccessThumbnail] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const cameraVideoRef = useRef(null);
  const reviewVideoRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const recordingStartedAtRef = useRef(null);

  const countdownClass = useMemo(() => {
    if (recordingTimeLeft <= 30) return 'danger';
    if (recordingTimeLeft <= 60) return 'warning';
    return 'normal';
  }, [recordingTimeLeft]);

  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());
      if (recordedUrl?.startsWith('blob:')) URL.revokeObjectURL(recordedUrl);
    };
  }, [recordedUrl]);

  const clearCountdown = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  };

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (cameraVideoRef.current) {
      cameraVideoRef.current.srcObject = null;
    }
  };

  const resetLocalRecording = () => {
    setRecording(false);
    setRecordingTimeLeft(MAX_RECORDING_SECONDS);
    setRecordedBlob(null);
    setPreviewOpen(false);
    if (recordedUrl?.startsWith('blob:')) URL.revokeObjectURL(recordedUrl);
    setRecordedUrl(null);
    setSuccessThumbnail(null);
  };

  const goToInstructions = () => {
    clearCountdown();
    stopCameraStream();
    resetLocalRecording();
    setMessage(null);
    setStep(STEPS.INSTRUCTIONS);
  };

  const startRecording = async () => {
    setMessage(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: true,
      });

      streamRef.current = stream;

      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;
        try {
          await cameraVideoRef.current.play();
        } catch {
          // autoplay may be delayed until browser is ready
        }
      }

      const mimeType = selectRecorderMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blobType = recorder.mimeType || mimeType || 'video/webm';
        const blob = new Blob(chunksRef.current, { type: blobType });

        if (blob.size === 0) {
          setMessage({ type: 'error', text: 'Recording failed. Please try again.' });
          goToInstructions();
          return;
        }

        const localUrl = URL.createObjectURL(blob);
        if (recordedUrl?.startsWith('blob:')) URL.revokeObjectURL(recordedUrl);

        setRecordedBlob(blob);
        setRecordedUrl(localUrl);
        setStep(STEPS.REVIEW);
        setRecording(false);
        setRecordingTimeLeft(MAX_RECORDING_SECONDS);
      };

      recorder.start(250);
      recordingStartedAtRef.current = Date.now();
      setRecording(true);
      setRecordingTimeLeft(MAX_RECORDING_SECONDS);
      setStep(STEPS.RECORDING);

      clearCountdown();
      countdownIntervalRef.current = setInterval(() => {
        if (!recordingStartedAtRef.current) return;

        const elapsed = Math.floor((Date.now() - recordingStartedAtRef.current) / 1000);
        const remaining = Math.max(0, MAX_RECORDING_SECONDS - elapsed);
        setRecordingTimeLeft(remaining);

        if (remaining <= 0) {
          stopRecording();
        }
      }, 200);
    } catch (error) {
      if (error?.name === 'NotAllowedError' || error?.name === 'SecurityError') {
        setMessage({ type: 'error', text: 'Camera and microphone permission was denied. Please allow access and try again.' });
      } else if (error?.name === 'NotFoundError' || error?.name === 'DevicesNotFoundError') {
        setMessage({ type: 'error', text: 'No camera or microphone was found. Please connect a device and try again.' });
      } else {
        setMessage({ type: 'error', text: 'Unable to start recording right now. Please try again.' });
      }
      setStep(STEPS.INSTRUCTIONS);
      stopCameraStream();
    }
  };

  const stopRecording = () => {
    clearCountdown();
    setRecording(false);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    stopCameraStream();
  };

  const handleUpload = async () => {
    if (!recordedBlob || !recordedUrl) return;

    setUploading(true);
    setMessage(null);

    try {
      const extension = recordedBlob.type.includes('mp4') ? 'mp4' : 'webm';
      const file = new File([recordedBlob], `video-intro-${Date.now()}.${extension}`, {
        type: recordedBlob.type || `video/${extension}`,
      });

      const formData = new FormData();
      formData.append('video_intro', file);

      const response = await fetch('/api/candidate/upload-video', {
        method: 'POST',
        body: formData,
      });

      const responseBody = await response.json();

      if (!response.ok) {
        setMessage({ type: 'error', text: responseBody?.error || 'Upload failed. Please try again.' });
        setUploading(false);
        return;
      }

      const persistedUrl = responseBody?.videoUrl || responseBody?.url || null;
      if (persistedUrl) {
        setUploadedVideoUrl(persistedUrl);
        onUpdate({ ...profile, videoIntroUrl: persistedUrl });
      }

      const thumbnail = await generateThumbnailFromVideo(recordedUrl);
      setSuccessThumbnail(thumbnail);
      setStep(STEPS.SUCCESS);
      setMessage({ type: 'success', text: 'Your video introduction has been saved and is now visible on your profile.' });
    } catch {
      setMessage({ type: 'error', text: 'Upload failed due to a network issue. Please try again.' });
    } finally {
      setUploading(false);
    }
  };

  const openSuccessPreview = () => {
    if (!uploadedVideoUrl && !recordedUrl) return;
    setPreviewOpen(true);
  };

  return (
    <div className="profile-section video-intro-polished">
      <div className="section-header">
        <h2 className="section-title">Video Introduction</h2>
        <p className="section-description">Create a polished 2-minute introduction to help employers understand your PMO value quickly.</p>
      </div>

      <div className="section-content">
        {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

        {step === STEPS.INSTRUCTIONS && (
          <div className="intro-card">
            <h3>Record Your Video Introduction</h3>
            <p>
              This is a 2-minute video introduction shown to employers on your profile. Cover who you are, your PMO experience,
              key skills, and the types of roles you&apos;re looking for.
            </p>
            <ul>
              <li>Keep it professional and concise</li>
              <li>Speak clearly and confidently</li>
              <li>Use good lighting and a clean background</li>
              <li>Look directly at the camera</li>
              <li>Mention frameworks/tools like MSP, PRINCE2, Agile, or SAFe</li>
            </ul>
            <button type="button" className="btn-primary start-btn" onClick={startRecording}>
              Start Recording
            </button>
          </div>
        )}

        {step === STEPS.RECORDING && (
          <div className="recording-card">
            <div className="recording-header">
              <span className="recording-badge"><span className="pulse-dot" /> Recording</span>
              <div className={`countdown ${countdownClass}`}>{formatTimer(recordingTimeLeft)}</div>
            </div>

            <div className="recording-preview-wrap">
              <video ref={cameraVideoRef} autoPlay muted playsInline className="recording-preview" />
            </div>

            <div className="recording-actions">
              <button type="button" className="btn-danger" onClick={stopRecording}>
                Stop Recording
              </button>
            </div>
          </div>
        )}

        {step === STEPS.REVIEW && (
          <div className="review-card">
            <h3>Review Your Recording</h3>
            <div className="review-player-wrap">
              <video ref={reviewVideoRef} controls className="review-player" src={recordedUrl || ''} />
            </div>

            <div className="review-actions">
              <button type="button" className="btn-secondary" onClick={goToInstructions} disabled={uploading}>
                Re-record
              </button>
              <button type="button" className="btn-primary" onClick={handleUpload} disabled={uploading}>
                {uploading ? 'Uploading…' : 'Upload Video'}
              </button>
            </div>
          </div>
        )}

        {step === STEPS.SUCCESS && (
          <div className="success-card">
            <h3>Video Saved</h3>

            <div className="thumbnail-card" role="button" tabIndex={0} onClick={openSuccessPreview} onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') openSuccessPreview();
            }}>
              {successThumbnail ? (
                <img src={successThumbnail} alt="Video thumbnail" className="thumbnail-image" />
              ) : (
                <div className="thumbnail-fallback">Video ready</div>
              )}
              <div className="play-overlay">
                <svg viewBox="0 0 24 24" width="38" height="38" fill="currentColor">
                  <polygon points="6 4 20 12 6 20 6 4" />
                </svg>
              </div>
            </div>

            <p className="success-message">Your video introduction has been saved and is now visible on your profile.</p>

            <button type="button" className="btn-primary" onClick={goToInstructions}>
              Update Video
            </button>
          </div>
        )}
      </div>

      {previewOpen && (uploadedVideoUrl || recordedUrl) && (
        <div className="video-modal-overlay" onClick={() => setPreviewOpen(false)}>
          <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="video-modal-close" onClick={() => setPreviewOpen(false)}>✕</button>
            <video controls autoPlay className="video-modal-player" src={uploadedVideoUrl || recordedUrl || ''} />
          </div>
        </div>
      )}

      <style jsx>{`
        .video-intro-polished .section-content {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .intro-card,
        .recording-card,
        .review-card,
        .success-card {
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 1.2rem;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
        }

        .intro-card h3,
        .review-card h3,
        .success-card h3 {
          margin: 0 0 0.55rem;
          font-size: 1.15rem;
          color: #0f172a;
        }

        .intro-card p {
          margin: 0;
          color: #334155;
          line-height: 1.55;
        }

        .intro-card ul {
          margin: 0.9rem 0 1rem;
          padding-left: 1.1rem;
          color: #334155;
          display: grid;
          gap: 0.45rem;
        }

        .start-btn {
          min-width: 190px;
          font-weight: 700;
        }

        .recording-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.8rem;
          gap: 0.8rem;
          flex-wrap: wrap;
        }

        .recording-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          background: rgba(220, 38, 38, 0.14);
          color: #b91c1c;
          border: 1px solid rgba(220, 38, 38, 0.24);
          border-radius: 999px;
          padding: 0.35rem 0.72rem;
          font-weight: 700;
          font-size: 0.84rem;
        }

        .pulse-dot {
          width: 10px;
          height: 10px;
          background: #ef4444;
          border-radius: 999px;
          animation: pulse 1s infinite;
        }

        .countdown {
          font-size: 2rem;
          font-weight: 800;
          letter-spacing: 0.02em;
        }

        .countdown.normal {
          color: #0f172a;
        }

        .countdown.warning {
          color: #b45309;
        }

        .countdown.danger {
          color: #dc2626;
        }

        .recording-preview-wrap {
          border-radius: 14px;
          overflow: hidden;
          background: #0f172a;
          min-height: 320px;
          border: 1px solid #cbd5e1;
        }

        .recording-preview {
          width: 100%;
          display: block;
          transform: scaleX(-1);
          min-height: 320px;
          object-fit: cover;
          background: #0f172a;
        }

        .recording-actions,
        .review-actions {
          margin-top: 0.9rem;
          display: flex;
          gap: 0.7rem;
          flex-wrap: wrap;
        }

        .review-player-wrap {
          border-radius: 14px;
          overflow: hidden;
          background: #0f172a;
          border: 1px solid #cbd5e1;
          margin-top: 0.7rem;
        }

        .review-player {
          width: 100%;
          min-height: 320px;
          display: block;
          background: #0f172a;
        }

        .success-card {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }

        .thumbnail-card {
          position: relative;
          border-radius: 14px;
          overflow: hidden;
          background: #0f172a;
          border: 1px solid #cbd5e1;
          min-height: 240px;
          cursor: pointer;
        }

        .thumbnail-image {
          width: 100%;
          min-height: 240px;
          object-fit: cover;
          display: block;
        }

        .thumbnail-fallback {
          min-height: 240px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #e2e8f0;
          font-weight: 600;
        }

        .play-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          background: rgba(2, 6, 23, 0.2);
        }

        .play-overlay svg {
          width: 58px;
          height: 58px;
          padding: 11px;
          border-radius: 999px;
          background: rgba(2, 6, 23, 0.6);
          border: 2px solid rgba(255, 255, 255, 0.85);
        }

        .success-message {
          margin: 0;
          color: #166534;
          font-weight: 600;
          background: rgba(34, 197, 94, 0.12);
          border: 1px solid rgba(34, 197, 94, 0.25);
          border-radius: 10px;
          padding: 0.65rem 0.8rem;
        }

        .video-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(2, 6, 23, 0.88);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }

        .video-modal-content {
          position: relative;
          width: 100%;
          max-width: 860px;
        }

        .video-modal-close {
          position: absolute;
          top: -44px;
          right: 0;
          border: none;
          background: transparent;
          color: #fff;
          font-size: 1.5rem;
          cursor: pointer;
        }

        .video-modal-player {
          width: 100%;
          max-height: 82vh;
          border-radius: 12px;
          background: #000;
        }

        @keyframes pulse {
          0% { opacity: 1; transform: scale(0.92); }
          50% { opacity: 0.35; transform: scale(1.08); }
          100% { opacity: 1; transform: scale(0.92); }
        }
      `}</style>
    </div>
  );
}
