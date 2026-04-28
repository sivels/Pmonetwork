import { useState } from 'react';

export default function SendOfferModal({ interview = null, application = null, onClose, onSuccess }) {
  const sourceApplication = application || interview?.application || null;
  const applicationId = application?.id || interview?.applicationId || null;
  const interviewId = interview?.id || null;
  const candidateName = application?.candidate?.fullName || interview?.candidate?.user?.fullName || interview?.candidate?.fullName || 'Candidate';
  const roleTitle = sourceApplication?.job?.title || 'Role';

  const [title, setTitle] = useState(`Offer for ${roleTitle}`);
  const [salary, setSalary] = useState('');
  const [probationCompletionBonus, setProbationCompletionBonus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (event) => {
    setFiles(Array.from(event.target.files || []));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!applicationId) {
      setError('Missing application context for this offer.');
      return;
    }

    if (!title.trim()) {
      setError('Offer title is required.');
      return;
    }

    setSubmitting(true);

    try {
      const uploadedAttachments = [];

      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('applicationId', applicationId);

        const uploadRes = await fetch('/api/offers/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          const uploadError = await uploadRes.json().catch(() => ({}));
          throw new Error(uploadError.error || 'Failed to upload one of the attachments');
        }

        const uploadJson = await uploadRes.json();
        if (uploadJson?.file) {
          uploadedAttachments.push(uploadJson.file);
        }
      }

      const offerRes = await fetch('/api/offers/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationId,
          interviewId,
          title: title.trim(),
          salary: salary.trim() || null,
          probationCompletionBonus: probationCompletionBonus.trim() || null,
          startDate: startDate || null,
          message: message.trim() || null,
          attachments: uploadedAttachments,
        }),
      });

      const offerJson = await offerRes.json().catch(() => ({}));

      if (!offerRes.ok) {
        throw new Error(offerJson.error || 'Failed to send offer');
      }

      if (onSuccess) {
        onSuccess(offerJson.offer);
      }

      onClose();
    } catch (submitError) {
      setError(submitError.message || 'Failed to send offer');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="offer-modal-overlay" onClick={onClose}>
      <div className="offer-modal" onClick={(e) => e.stopPropagation()}>
        <div className="offer-modal-header">
          <h3>Send Job Offer</h3>
          <button type="button" className="close-btn" onClick={onClose}>×</button>
        </div>

        <p className="modal-subtitle">
          Candidate: <strong>{candidateName}</strong>
          {' · '}
          Role: <strong>{roleTitle || 'Job'}</strong>
        </p>

        <form onSubmit={handleSubmit} className="offer-form">
          <label>
            Offer title
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Senior Project Manager Offer"
              required
            />
          </label>

          <div className="form-row">
            <label>
              Salary / Compensation
              <input
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="e.g. £75,000 + benefits"
              />
            </label>
            <label>
              Probation completion bonus
              <input
                value={probationCompletionBonus}
                onChange={(e) => setProbationCompletionBonus(e.target.value)}
                placeholder="e.g. £2,000 after probation"
              />
            </label>
          </div>

          <div className="form-row">
            <label>
              Proposed start date
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </label>
          </div>

          <label>
            Message
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder="We were impressed by your interview and would like to offer you..."
            />
          </label>

          <label>
            Attach contract or supporting files
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt"
            />
          </label>

          {files.length > 0 && (
            <ul className="file-list">
              {files.map((file) => (
                <li key={`${file.name}-${file.size}`}>{file.name}</li>
              ))}
            </ul>
          )}

          {error && <p className="error-text">{error}</p>}

          <div className="actions">
            <button type="button" className="secondary" onClick={onClose} disabled={submitting}>Cancel</button>
            <button type="submit" className="primary" disabled={submitting}>
              {submitting ? 'Sending...' : 'Send Offer'}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .offer-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(17, 24, 39, 0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1500;
          padding: 1rem;
        }

        .offer-modal {
          width: 100%;
          max-width: 680px;
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 20px 45px rgba(15, 23, 42, 0.25);
          padding: 1.25rem;
        }

        .offer-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .offer-modal-header h3 {
          margin: 0;
          font-size: 1.2rem;
          color: #111827;
        }

        .close-btn {
          border: none;
          background: transparent;
          font-size: 1.4rem;
          cursor: pointer;
          color: #6b7280;
        }

        .modal-subtitle {
          margin: 0 0 1rem;
          color: #4b5563;
          font-size: 0.9rem;
        }

        .offer-form {
          display: flex;
          flex-direction: column;
          gap: 0.9rem;
        }

        .offer-form label {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          font-size: 0.9rem;
          font-weight: 600;
          color: #374151;
        }

        .offer-form input,
        .offer-form textarea {
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 0.65rem 0.75rem;
          font-size: 0.95rem;
          color: #111827;
        }

        .offer-form textarea {
          resize: vertical;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }

        .file-list {
          margin: 0;
          padding-left: 1rem;
          color: #4b5563;
          font-size: 0.85rem;
        }

        .error-text {
          margin: 0;
          color: #dc2626;
          font-size: 0.9rem;
        }

        .actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.7rem;
        }

        .secondary,
        .primary {
          border-radius: 8px;
          padding: 0.6rem 1rem;
          border: 1px solid transparent;
          cursor: pointer;
          font-weight: 600;
        }

        .secondary {
          background: #fff;
          color: #374151;
          border-color: #d1d5db;
        }

        .primary {
          background: #4f46e5;
          color: #fff;
        }

        .primary:disabled,
        .secondary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        @media (max-width: 640px) {
          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
