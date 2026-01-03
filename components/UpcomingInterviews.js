import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './UpcomingInterviews.module.css';

export default function UpcomingInterviews({ userRole }) {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      const response = await fetch('/api/interviews/upcoming');
      const data = await response.json();
      setInterviews(data.interviews || []);
    } catch (error) {
      console.error('Failed to fetch interviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getTimeUntil = (dateString) => {
    const now = new Date();
    const interviewDate = new Date(dateString);
    const diffInHours = Math.floor((interviewDate - now) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((interviewDate - now) / (1000 * 60));
      return `in ${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''}`;
    } else if (diffInHours < 24) {
      return `in ${diffInHours} hour${diffInHours !== 1 ? 's' : ''}`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `in ${diffInDays} day${diffInDays !== 1 ? 's' : ''}`;
    }
  };

  if (loading) {
    return (
      <div className={styles.card}>
        <h3 className={styles.title}>Upcoming Interviews</h3>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>Upcoming Interviews</h3>
        {interviews.length > 0 && (
          <span className={styles.badge}>{interviews.length}</span>
        )}
      </div>

      {interviews.length === 0 ? (
        <div className={styles.empty}>
          <svg className={styles.emptyIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className={styles.emptyText}>No upcoming interviews</p>
          <p className={styles.emptySubtext}>
            {userRole === 'EMPLOYER' 
              ? 'Schedule interviews from your applications'
              : 'Check back when employers invite you to interviews'}
          </p>
        </div>
      ) : (
        <div className={styles.list}>
          {interviews.map((interview) => (
            <div key={interview.id} className={styles.interview}>
              <div className={styles.interviewHeader}>
                <div className={styles.interviewInfo}>
                  <h4 className={styles.interviewTitle}>
                    {userRole === 'EMPLOYER' 
                      ? interview.candidate.fullName
                      : interview.application.job.title}
                  </h4>
                  <p className={styles.interviewSubtitle}>
                    {userRole === 'EMPLOYER'
                      ? interview.application.job.title
                      : interview.employer.companyName}
                  </p>
                </div>
                <div className={styles.timeUntil}>
                  {getTimeUntil(interview.startTime)}
                </div>
              </div>

              <div className={styles.interviewDetails}>
                <div className={styles.detail}>
                  <svg className={styles.detailIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{formatDateTime(interview.startTime)}</span>
                </div>
                <div className={styles.detail}>
                  <svg className={styles.detailIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{interview.duration} minutes</span>
                </div>
              </div>

              {interview.meetingUrl && (
                <a
                  href={interview.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.joinButton}
                >
                  <svg className={styles.buttonIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Join Google Meet
                </a>
              )}

              {interview.message && (
                <div className={styles.message}>
                  <p className={styles.messageLabel}>Message:</p>
                  <p className={styles.messageText}>{interview.message}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
