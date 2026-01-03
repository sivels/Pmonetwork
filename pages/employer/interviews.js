import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function EmployerInterviews() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, upcoming, past

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/employer-login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchInterviews();
    }
  }, [status]);

  const fetchInterviews = async () => {
    try {
      const res = await fetch('/api/interviews/employer');
      if (res.ok) {
        const data = await res.json();
        setInterviews(data);
      }
    } catch (error) {
      console.error('Error fetching interviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getTimeUntil = (startTime) => {
    const now = new Date();
    const start = new Date(startTime);
    const diffMs = start - now;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMs < 0) return null; // Past
    if (diffMins < 60) return `in ${diffMins} min`;
    if (diffHours < 24) return `in ${diffHours}h`;
    return `in ${diffDays}d`;
  };

  const isPast = (startTime) => {
    return new Date(startTime) < new Date();
  };

  const filteredInterviews = interviews.filter((interview) => {
    if (filter === 'upcoming') return !isPast(interview.startTime);
    if (filter === 'past') return isPast(interview.startTime);
    return true;
  });

  const upcomingCount = interviews.filter((i) => !isPast(i.startTime)).length;
  const pastCount = interviews.filter((i) => isPast(i.startTime)).length;

  if (status === 'loading' || loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading interviews...</p>
      </div>
    );
  }

  return (
      <Head>
        <title>Scheduled Interviews | PMO Network</title>
      </Head>

      <div className="interviews-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Scheduled Interviews</h1>
            <p className="page-subtitle">Manage all your scheduled candidate interviews</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({interviews.length})
          </button>
          <button
            className={`filter-tab ${filter === 'upcoming' ? 'active' : ''}`}
            onClick={() => setFilter('upcoming')}
          >
            Upcoming ({upcomingCount})
          </button>
          <button
            className={`filter-tab ${filter === 'past' ? 'active' : ''}`}
            onClick={() => setFilter('past')}
          >
            Past ({pastCount})
          </button>
        </div>

        {/* Interviews List */}
        <div className="interviews-container">
          {filteredInterviews.length === 0 ? (
            <div className="empty-state">
              <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <h3>No interviews {filter !== 'all' ? filter : 'scheduled'}</h3>
              <p>
                {filter === 'upcoming'
                  ? "You don't have any upcoming interviews scheduled."
                  : filter === 'past'
                  ? "You don't have any past interviews."
                  : "You haven't scheduled any interviews yet. Click 'Interview' on an application to get started."}
              </p>
            </div>
          ) : (
            <div className="interviews-grid">
              {filteredInterviews.map((interview) => {
                const isUpcoming = !isPast(interview.startTime);
                const timeUntil = getTimeUntil(interview.startTime);

                return (
                  <div key={interview.id} className={`interview-card ${!isUpcoming ? 'past' : ''}`}>
                    <div className="interview-header">
                      <div className="candidate-info">
                        <img
                          src={interview.candidate?.user?.profilePhotoUrl || '/images/avatar-placeholder.svg'}
                          alt={interview.candidate?.user?.fullName}
                          className="candidate-avatar"
                        />
                        <div>
                          <h3 className="candidate-name">{interview.candidate?.user?.fullName || 'Candidate'}</h3>
                          <p className="job-title">{interview.application?.job?.title}</p>
                        </div>
                      </div>
                      <div className={`status-badge ${interview.status}`}>
                        {interview.status}
                      </div>
                    </div>

                    <div className="interview-details">
                      <div className="detail-row">
                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span className="detail-text">
                          {formatDate(interview.startTime)} at {formatTime(interview.startTime)}
                        </span>
                        {isUpcoming && timeUntil && (
                          <span className="time-badge">{timeUntil}</span>
                        )}
                      </div>

                      <div className="detail-row">
                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="detail-text">{interview.duration} minutes</span>
                      </div>

                      {interview.meetingUrl && (
                        <div className="detail-row">
                          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                            />
                          </svg>
                          <a href={interview.meetingUrl} target="_blank" rel="noopener noreferrer" className="meeting-link">
                            {interview.meetingUrl.length > 50 
                              ? interview.meetingUrl.substring(0, 50) + '...' 
                              : interview.meetingUrl}
                          </a>
                        </div>
                      )}

                      {interview.message && (
                        <div className="interview-message">
                          <p className="message-label">Your message to candidate:</p>
                          <p className="message-text">{interview.message}</p>
                        </div>
                      )}
                    </div>

                    <div className="interview-actions">
                      {interview.meetingUrl && isUpcoming && (
                        <a
                          href={interview.meetingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="join-btn"
                        >
                          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                          Join Meeting
                        </a>
                      )}
                      <a
                        href={`/employer/jobs/${interview.application?.jobId}/applications`}
                        className="view-app-btn"
                      >
                        View Application
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .interviews-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .page-header {
          margin-bottom: 2rem;
        }

        .page-title {
          font-size: 2rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 0.5rem;
        }

        .page-subtitle {
          font-size: 1rem;
          color: #6b7280;
          margin: 0;
        }

        .filter-tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 2rem;
          border-bottom: 2px solid #e5e7eb;
        }

        .filter-tab {
          padding: 0.75rem 1.5rem;
          background: transparent;
          border: none;
          border-bottom: 3px solid transparent;
          font-size: 0.95rem;
          font-weight: 500;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: -2px;
        }

        .filter-tab:hover {
          color: #4f46e5;
        }

        .filter-tab.active {
          color: #4f46e5;
          border-bottom-color: #4f46e5;
          font-weight: 600;
        }

        .interviews-container {
          min-height: 400px;
        }

        .interviews-grid {
          display: grid;
          gap: 1.5rem;
        }

        .interview-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 1.5rem;
          transition: all 0.2s;
        }

        .interview-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          border-color: #d1d5db;
        }

        .interview-card.past {
          opacity: 0.7;
          background: #f9fafb;
        }

        .interview-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 1.25rem;
          padding-bottom: 1.25rem;
          border-bottom: 1px solid #f3f4f6;
        }

        .candidate-info {
          display: flex;
          gap: 1rem;
          align-items: start;
        }

        .candidate-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #e5e7eb;
        }

        .candidate-name {
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 0.25rem;
        }

        .job-title {
          font-size: 0.95rem;
          color: #6b7280;
          margin: 0;
        }

        .status-badge {
          padding: 0.375rem 0.75rem;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: capitalize;
        }

        .status-badge.scheduled {
          background: #dbeafe;
          color: #1e40af;
        }

        .status-badge.completed {
          background: #d1fae5;
          color: #065f46;
        }

        .status-badge.cancelled {
          background: #fee2e2;
          color: #991b1b;
        }

        .interview-details {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .detail-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #6b7280;
        }

        .detail-row svg {
          flex-shrink: 0;
        }

        .detail-text {
          font-size: 0.95rem;
          color: #374151;
        }

        .time-badge {
          margin-left: auto;
          padding: 0.25rem 0.625rem;
          background: #fef3c7;
          color: #92400e;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .meeting-link {
          font-size: 0.9rem;
          color: #4f46e5;
          text-decoration: none;
          word-break: break-all;
        }

        .meeting-link:hover {
          text-decoration: underline;
        }

        .interview-message {
          background: #f9fafb;
          border-left: 3px solid #4f46e5;
          padding: 1rem;
          border-radius: 6px;
        }

        .message-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: #6b7280;
          margin: 0 0 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .message-text {
          font-size: 0.95rem;
          color: #374151;
          margin: 0;
          line-height: 1.5;
        }

        .interview-actions {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .join-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: #4f46e5;
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.95rem;
          transition: all 0.2s;
        }

        .join-btn:hover {
          background: #4338ca;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
        }

        .view-app-btn {
          display: flex;
          align-items: center;
          padding: 0.75rem 1.5rem;
          background: white;
          color: #4f46e5;
          text-decoration: none;
          border: 1px solid #4f46e5;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.95rem;
          transition: all 0.2s;
        }

        .view-app-btn:hover {
          background: #eef2ff;
        }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          color: #6b7280;
        }

        .empty-state svg {
          margin: 0 auto 1rem;
          color: #d1d5db;
        }

        .empty-state h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #374151;
          margin: 0 0 0.5rem;
        }

        .empty-state p {
          font-size: 1rem;
          color: #6b7280;
          margin: 0;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          gap: 1rem;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #e5e7eb;
          border-top-color: #4f46e5;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 768px) {
          .interviews-page {
            padding: 1rem;
          }

          .page-title {
            font-size: 1.5rem;
          }

          .filter-tabs {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }

          .filter-tab {
            white-space: nowrap;
          }

          .interview-card {
            padding: 1rem;
          }

          .candidate-info {
            flex-direction: row;
            gap: 0.75rem;
          }

          .interview-actions {
            flex-direction: column;
          }

          .join-btn,
          .view-app-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </>
  );
}
