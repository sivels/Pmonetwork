import { useState } from 'react';

const DEFAULT_MESSAGE = `We regret to inform you that we need to cancel the scheduled interview. 

We apologize for any inconvenience this may cause. If you have any questions, please don't hesitate to reach out.

Best regards`;

export default function CancelInterviewModal({ interview, onClose, onSuccess }) {
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Cancel the interview
      const res = await fetch(`/api/interviews/${interview.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to cancel interview');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Cancel Interview</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="warning-box">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <div className="warning-title">Are you sure you want to cancel this interview?</div>
              <div className="warning-text">
                The candidate will be notified via in-app message. This action cannot be undone.
              </div>
            </div>
          </div>

          <div className="interview-details">
            <div className="detail-item">
              <strong>Candidate:</strong> {interview.candidate?.user?.fullName || 'Unknown'}
            </div>
            <div className="detail-item">
              <strong>Job:</strong> {interview.application?.job?.title || 'Unknown'}
            </div>
            <div className="detail-item">
              <strong>Scheduled:</strong> {new Date(interview.startTime).toLocaleString()}
            </div>
          </div>

          <div className="form-group">
            <label>Message to Candidate</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              required
            />
            <div className="help-text">
              This message will be sent to the candidate explaining the cancellation.
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Keep Interview
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-danger">
              {isSubmitting ? 'Cancelling...' : 'Cancel Interview'}
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
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          max-width: 550px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #111827;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          color: #6b7280;
          cursor: pointer;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
        }

        .close-btn:hover {
          background: #f3f4f6;
        }

        form {
          padding: 1.5rem;
        }

        .warning-box {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          background: #fef3c7;
          border: 1px solid #fbbf24;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }

        .warning-box svg {
          flex-shrink: 0;
          color: #d97706;
        }

        .warning-title {
          font-weight: 600;
          color: #92400e;
          margin-bottom: 0.25rem;
        }

        .warning-text {
          font-size: 0.875rem;
          color: #78350f;
        }

        .interview-details {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1.5rem;
        }

        .detail-item {
          font-size: 0.875rem;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .detail-item:last-child {
          margin-bottom: 0;
        }

        .detail-item strong {
          color: #111827;
        }

        .form-group {
          margin-bottom: 1.25rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
        }

        .form-group textarea {
          width: 100%;
          padding: 0.625rem 0.875rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.95rem;
          font-family: inherit;
          resize: vertical;
        }

        .form-group textarea:focus {
          outline: none;
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        .help-text {
          margin-top: 0.5rem;
          font-size: 0.8rem;
          color: #6b7280;
        }

        .error-message {
          background: #fee2e2;
          color: #991b1b;
          padding: 0.75rem;
          border-radius: 6px;
          font-size: 0.875rem;
          margin-bottom: 1rem;
        }

        .modal-actions {
          display: flex;
          gap: 0.75rem;
          justify-content: flex-end;
          padding-top: 1rem;
          border-top: 1px solid #e5e7eb;
        }

        .btn-secondary,
        .btn-danger {
          padding: 0.625rem 1.25rem;
          border-radius: 6px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-secondary {
          background: white;
          border: 1px solid #d1d5db;
          color: #374151;
        }

        .btn-secondary:hover {
          background: #f9fafb;
        }

        .btn-danger {
          background: #dc2626;
          border: none;
          color: white;
        }

        .btn-danger:hover {
          background: #b91c1c;
        }

        .btn-danger:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
