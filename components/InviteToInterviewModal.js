import { useState } from 'react';
import styles from './InviteToInterviewModal.module.css';

export default function InviteToInterviewModal({ application, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [needsGoogleAuth, setNeedsGoogleAuth] = useState(false);
  
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    duration: 60,
    provider: 'google_meet',
    message: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNeedsGoogleAuth(false);

    try {
      // Combine date and time into ISO string
      const startTime = new Date(`${formData.date}T${formData.time}`).toISOString();

      const response = await fetch('/api/interviews/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: application.id,
          startTime,
          duration: parseInt(formData.duration),
          provider: formData.provider,
          message: formData.message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.needsGoogleAuth) {
          setNeedsGoogleAuth(true);
        }
        throw new Error(data.error || 'Failed to schedule interview');
      }

      onSuccess(data.interview);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const connectGoogleAccount = () => {
    // Redirect to NextAuth Google signin
    window.location.href = '/api/auth/signin/google';
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];
  
  // Get minimum time if date is today
  const minTime = formData.date === today 
    ? new Date().toTimeString().slice(0, 5) 
    : '00:00';

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Invite to Interview</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <div className={styles.applicationInfo}>
          <p><strong>Candidate:</strong> {application.candidate.fullName}</p>
          <p><strong>Position:</strong> {application.job.title}</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="date">Interview Date *</label>
            <input
              type="date"
              id="date"
              name="date"
              min={today}
              value={formData.date}
              onChange={handleChange}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="time">Interview Time *</label>
            <input
              type="time"
              id="time"
              name="time"
              min={minTime}
              value={formData.time}
              onChange={handleChange}
              required
              className={styles.input}
            />
            <small className={styles.hint}>Your local time</small>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="duration">Duration *</label>
            <select
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              required
              className={styles.select}
            >
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
              <option value={120}>2 hours</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="provider">Interview Type *</label>
            <select
              id="provider"
              name="provider"
              value={formData.provider}
              onChange={handleChange}
              required
              className={styles.select}
            >
              <option value="google_meet">Video – Google Meet</option>
              <option value="phone">Phone Call</option>
            </select>
            {formData.provider === 'google_meet' && (
              <small className={styles.hint}>
                A Google Meet link will be automatically generated and sent to the candidate
              </small>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="message">Message to Candidate (Optional)</label>
            <textarea
              id="message"
              name="message"
              rows={4}
              value={formData.message}
              onChange={handleChange}
              placeholder="Add any additional information for the candidate..."
              className={styles.textarea}
            />
          </div>

          {error && (
            <div className={styles.error}>
              {error}
              {needsGoogleAuth && (
                <button
                  type="button"
                  onClick={connectGoogleAccount}
                  className={styles.connectButton}
                >
                  Connect Google Account
                </button>
              )}
            </div>
          )}

          <div className={styles.modalFooter}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Scheduling...' : 'Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
