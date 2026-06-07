import Head from 'next/head';
import Link from 'next/link';
import { useState, useCallback, useEffect } from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]';
import { prisma } from '../../lib/prisma';

export async function getServerSideProps(ctx) {
  try {
    const session = await getServerSession(ctx.req, ctx.res, authOptions);
    if (!session) {
      return { redirect: { destination: '/auth/login', permanent: false } };
    }
    if ((session.user.role || '').toLowerCase() !== 'candidate') {
      return { redirect: { destination: '/dashboard', permanent: false } };
    }

    const lookupClauses = [];
    if (session?.user?.id) lookupClauses.push({ id: session.user.id });
    if (session?.user?.email) lookupClauses.push({ email: session.user.email });

    const user = lookupClauses.length > 0
      ? await prisma.user.findFirst({
          where: { OR: lookupClauses },
          include: { candidateCandidateProfile: true },
        })
      : null;

    const candidateProfile = user?.candidateCandidateProfile;
    let applications = [];

    if (candidateProfile?.id) {
      applications = await prisma.application.findMany({
        where: { candidateId: candidateProfile.id },
        orderBy: { createdAt: 'desc' },
        include: {
          job: {
            include: { employer: true },
          },
          statusHistory: {
            orderBy: { createdAt: 'asc' },
          },
          interviews: {
            orderBy: { startTime: 'asc' },
          },
        },
      });
    } else if (session?.user?.id) {
      applications = await prisma.application.findMany({
        where: {
          candidate: {
            userId: session.user.id,
          },
        },
        orderBy: { createdAt: 'desc' },
        include: {
          job: {
            include: { employer: true },
          },
          statusHistory: {
            orderBy: { createdAt: 'asc' },
          },
          interviews: {
            orderBy: { startTime: 'asc' },
          },
        },
      });
    }

    const serialize = (obj) => JSON.parse(JSON.stringify(obj));
    return { props: { applications: serialize(applications) } };
  } catch (error) {
    console.error('Error in getServerSideProps for applications:', error);
    return { props: { applications: [] } };
  }
}

// Status pipeline order for progress tracker
const PIPELINE = [
  { key: 'APPLIED',     label: 'Applied' },
  { key: 'REVIEWED',    label: 'Reviewed' },
  { key: 'SHORTLISTED', label: 'Shortlisted' },
  { key: 'INTERVIEW',   label: 'Interview' },
  { key: 'OFFER',       label: 'Offer' },
  { key: 'HIRED',       label: 'Hired' },
];

const STATUS_META = {
  APPLIED:     { color: '#6b7280', bg: '#f3f4f6',  label: 'Applied' },
  REVIEWED:    { color: '#92400e', bg: '#fef3c7',  label: 'Reviewed' },
  SHORTLISTED: { color: '#1e40af', bg: '#dbeafe',  label: 'Shortlisted' },
  INTERVIEW:   { color: '#6d28d9', bg: '#ede9fe',  label: 'Interview' },
  FEEDBACK_GIVEN: { color: '#155e75', bg: '#cffafe', label: 'Feedback Given' },
  OFFER:       { color: '#065f46', bg: '#d1fae5',  label: 'Offer' },
  HIRED:       { color: '#166534', bg: '#dcfce7',  label: 'Hired' },
  REJECTED:    { color: '#991b1b', bg: '#fee2e2',  label: 'Unsuccessful' },
  WITHDRAWN:   { color: '#9a3412', bg: '#ffedd5',  label: 'Withdrawn' },
};

function getStatusMeta(status) {
  const key = (status || 'APPLIED').toUpperCase();
  return STATUS_META[key] || STATUS_META.APPLIED;
}

function getPipelineStep(status) {
  const key = (status || '').toUpperCase();
  if (key === 'REJECTED' || key === 'WITHDRAWN') return -1;
  if (key === 'PENDING' || key === 'SUBMITTED') return 0;
  if (key === 'FEEDBACK_GIVEN') return PIPELINE.findIndex((step) => step.key === 'INTERVIEW');
  const pipelineIndex = PIPELINE.findIndex(s => s.key === key);
  return pipelineIndex >= 0 ? pipelineIndex : 0;
}

function formatDate(dateStr, opts = {}) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', ...opts
  });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function ApplicationCard({ application, onWithdraw }) {
  const [expanded, setExpanded] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState(null);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState(null);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState('');

  const now = new Date();
  const meta = getStatusMeta(application.status);
  const pipelineStep = getPipelineStep(application.status);
  const isRejected = (application.status || '').toUpperCase() === 'REJECTED';
  const isWithdrawn = (application.status || '').toUpperCase() === 'WITHDRAWN';
  const isFeedbackGiven = (application.status || '').toUpperCase() === 'FEEDBACK_GIVEN';
  const canWithdraw = !['REJECTED', 'HIRED', 'WITHDRAWN'].includes((application.status || '').toUpperCase());

  // Split interviews: truly upcoming (in future), expired scheduled (past but still 'scheduled'), and past (completed/cancelled)
  const upcomingInterview = application.interviews?.find(
    i => i.status === 'scheduled' && new Date(i.startTime) > now
  ) || null;
  const expiredInterviews = application.interviews?.filter(
    i => i.status === 'scheduled' && new Date(i.startTime) <= now
  ) || [];
  const pastInterviews = application.interviews?.filter(i => i.status !== 'scheduled') || [];
  const hasExpiredInterview = expiredInterviews.length > 0;
  const isAwaitingFeedback = hasExpiredInterview && !isRejected && !isWithdrawn && !isFeedbackGiven;

  const latestNote = application.statusHistory?.filter(h => h.note).slice(-1)[0];

  const sendFeedbackRequest = useCallback(async () => {
    setFeedbackLoading(true);
    setFeedbackError(null);
    try {
      const res = await fetch('/api/applications/feedback-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: application.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send');
      setFeedbackSent(true);
    } catch (err) {
      setFeedbackError(err.message);
    } finally {
      setFeedbackLoading(false);
    }
  }, [application.id]);

  const handleWithdraw = useCallback(async () => {
    setWithdrawLoading(true);
    setWithdrawError(null);
    try {
      const res = await fetch('/api/applications/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: application.id,
          reason: withdrawReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to withdraw application');
      onWithdraw?.(data.application);
    } catch (error) {
      setWithdrawError(error.message);
    } finally {
      setWithdrawLoading(false);
    }
  }, [application.id, onWithdraw, withdrawReason]);

  return (
    <article className={`app-card ${expanded ? 'expanded' : ''}`}>
      {/* Card header – always visible */}
      <button className="card-header" onClick={() => setExpanded(v => !v)} aria-expanded={expanded}>
        <div className="card-header-left">
          <div className="company-logo-placeholder">
            {(application.job?.employer?.companyName || 'C').charAt(0).toUpperCase()}
          </div>
          <div className="card-title-block">
            <h2 className="job-title">{application.job?.title || 'Untitled role'}</h2>
            <p className="company-name">{application.job?.employer?.companyName || 'Company'}</p>
            <p className="job-meta">
              {application.job?.location || (application.job?.isRemote ? 'Remote' : 'Location TBC')}
              {application.job?.employmentType ? ` · ${application.job.employmentType}` : ''}
            </p>
          </div>
        </div>
        <div className="card-header-right">
          <span className="status-pill" style={{ color: meta.color, background: meta.bg }}>
            {meta.label}
          </span>
          {upcomingInterview && (
            <span className="interview-alert">
              📅 {formatDate(upcomingInterview.startTime)}
            </span>
          )}
          {isAwaitingFeedback && !upcomingInterview && (
            <span className="awaiting-badge">⏳ Awaiting Feedback</span>
          )}
          <span className="applied-date">Applied {formatDate(application.createdAt)}</span>
          <span className="chevron">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {/* Expanded detail panel */}
      {expanded && (
        <div className="card-detail">

          {/* Progress pipeline */}
          {!isRejected && !isWithdrawn ? (
            <div className="pipeline-section">
              <h3 className="section-label">Application Progress</h3>
              <div className="pipeline">
                {PIPELINE.map((step, idx) => {
                  const done = idx <= pipelineStep;
                  const current = idx === pipelineStep;
                  return (
                    <div key={step.key} className={`pipeline-step ${done ? 'done' : ''} ${current ? 'current' : ''}`}>
                      <div className="pipeline-dot">
                        {done ? (
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <circle cx="7" cy="7" r="7" fill={current ? '#4f46e5' : '#6ee7b7'}/>
                            <path d="M4 7l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ) : (
                          <div className="dot-empty" />
                        )}
                      </div>
                      {idx < PIPELINE.length - 1 && <div className={`pipeline-line ${done && idx < pipelineStep ? 'done' : ''}`} />}
                      <span className={`pipeline-label ${current ? 'current' : ''}`}>{step.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : isWithdrawn ? (
            <div className="withdrawn-banner">
              <span className="withdrawn-icon">↩</span>
              <div>
                <strong>Application Withdrawn</strong>
                <p>You withdrew this application and it is no longer active.</p>
              </div>
            </div>
          ) : (
            <div className="rejected-banner">
              <span className="rejected-icon">✕</span>
              <div>
                <strong>Unsuccessful</strong>
                <p>Your application was not taken forward for this role.</p>
              </div>
            </div>
          )}

          {/* Employer feedback / note */}
          {latestNote && (
            <div className="feedback-section">
              <h3 className="section-label">Employer Feedback</h3>
              <div className="feedback-box">
                <p>{latestNote.note}</p>
                <span className="feedback-date">{formatDate(latestNote.createdAt)}</span>
              </div>
            </div>
          )}

          {isFeedbackGiven && (
            <div className="feedback-given-banner">
              <span className="feedback-given-icon">💬</span>
              <div>
                <strong>Feedback Given</strong>
                <p>The employer has replied to your feedback request in messages.</p>
              </div>
            </div>
          )}

          {/* Awaiting feedback banner (interview has passed) */}
          {isAwaitingFeedback && (
            <div className="awaiting-feedback-banner">
              <span className="awaiting-icon">⏳</span>
              <div className="awaiting-body">
                <strong>Awaiting Feedback</strong>
                <p>Your interview has taken place. You can send a polite follow-up to request feedback from the employer.</p>
                {feedbackSent ? (
                  <span className="feedback-sent-msg">✓ Feedback request sent to employer via messages.</span>
                ) : (
                  <>
                    <button
                      className="feedback-request-btn"
                      onClick={sendFeedbackRequest}
                      disabled={feedbackLoading}
                    >
                      {feedbackLoading ? 'Sending…' : 'Request Feedback'}
                    </button>
                    {feedbackError && <span className="feedback-error">{feedbackError}</span>}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Upcoming interview */}
          {upcomingInterview && (
            <div className="interview-section">
              <h3 className="section-label">Upcoming Interview</h3>
              <div className="interview-card upcoming">
                <div className="interview-icon">📅</div>
                <div className="interview-detail">
                  <strong>{formatDateTime(upcomingInterview.startTime)}</strong>
                  <span>{upcomingInterview.duration} min · {upcomingInterview.provider === 'phone' ? 'Phone call' : 'Video call'}</span>
                  {upcomingInterview.message && <p className="interview-message">&ldquo;{upcomingInterview.message}&rdquo;</p>}
                  {upcomingInterview.meetingUrl && (
                    <a href={upcomingInterview.meetingUrl} target="_blank" rel="noreferrer" className="join-btn">
                      Join Meeting →
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Expired (past-due scheduled) interviews */}
          {expiredInterviews.length > 0 && (
            <div className="interview-section">
              <h3 className="section-label">Recent Interview{expiredInterviews.length > 1 ? 's' : ''}</h3>
              {expiredInterviews.map(iv => (
                <div key={iv.id} className="interview-card past">
                  <div className="interview-icon">✓</div>
                  <div className="interview-detail">
                    <strong>{formatDateTime(iv.startTime)}</strong>
                    <span>{iv.duration} min · {iv.provider === 'phone' ? 'Phone call' : 'Video call'}</span>
                    <span className="iv-status-chip completed">Completed</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Past interviews */}
          {pastInterviews.length > 0 && (
            <div className="interview-section">
              <h3 className="section-label">Past Interviews</h3>
              {pastInterviews.map(iv => (
                <div key={iv.id} className={`interview-card past ${iv.status}`}>
                  <div className="interview-icon">{iv.status === 'cancelled' ? '✕' : '✓'}</div>
                  <div className="interview-detail">
                    <strong>{formatDateTime(iv.startTime)}</strong>
                    <span className="iv-status-chip">{iv.status.charAt(0).toUpperCase() + iv.status.slice(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Status history timeline */}
          {application.statusHistory?.length > 0 && (
            <div className="timeline-section">
              <h3 className="section-label">Timeline</h3>
              <ul className="timeline">
                {application.statusHistory.map((h, i) => (
                  <li key={h.id} className="timeline-item">
                    <div className="tl-dot" />
                    <div className="tl-body">
                      <span className="tl-status">{h.toStatus.replace(/_/g, ' ')}</span>
                      {h.note && <p className="tl-note">{h.note}</p>}
                      <span className="tl-date">{formatDate(h.createdAt)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Footer actions */}
          <div className="card-actions">
            {application.job?.id && (
              <Link href={`/jobs/${application.job.id}`} className="action-btn outline">View Job</Link>
            )}
            <Link href="/dashboard/messages" className="action-btn outline">Messages</Link>
            {canWithdraw && (
              <button
                type="button"
                className="action-btn danger"
                onClick={() => {
                  setShowWithdrawForm((value) => !value);
                  setWithdrawError(null);
                }}
                disabled={withdrawLoading}
              >
                {showWithdrawForm ? 'Cancel' : 'Withdraw'}
              </button>
            )}
          </div>
          {showWithdrawForm && canWithdraw && (
            <div className="withdraw-form">
              <label className="withdraw-label" htmlFor={`withdraw-reason-${application.id}`}>
                Optional message to employer
              </label>
              <textarea
                id={`withdraw-reason-${application.id}`}
                className="withdraw-textarea"
                value={withdrawReason}
                onChange={(event) => setWithdrawReason(event.target.value)}
                placeholder="Let the employer know why you're withdrawing. This will be sent as a message."
                rows={4}
                maxLength={600}
              />
              <div className="withdraw-helper-row">
                <span className="withdraw-helper">Scheduled interviews will be cancelled when you withdraw.</span>
                <span className="withdraw-count">{withdrawReason.length}/600</span>
              </div>
              <div className="withdraw-actions">
                <button type="button" className="action-btn outline" onClick={() => { setShowWithdrawForm(false); setWithdrawReason(''); setWithdrawError(null); }} disabled={withdrawLoading}>
                  Keep Application
                </button>
                <button type="button" className="action-btn danger" onClick={handleWithdraw} disabled={withdrawLoading}>
                  {withdrawLoading ? 'Withdrawing…' : 'Confirm Withdraw'}
                </button>
              </div>
            </div>
          )}
          {withdrawError && <p className="action-error">{withdrawError}</p>}
        </div>
      )}
    </article>
  );
}

export default function CandidateApplicationsPage({ applications: initialApplications }) {
  const [applications, setApplications] = useState(initialApplications || []);
  const active = applications.filter(a => !['REJECTED', 'HIRED', 'WITHDRAWN'].includes((a.status || '').toUpperCase()));
  const closed = applications.filter(a => ['REJECTED', 'HIRED', 'WITHDRAWN'].includes((a.status || '').toUpperCase()));
  const [tab, setTab] = useState(() => {
    const initial = initialApplications || [];
    const hasActive = initial.some((application) => !['REJECTED', 'HIRED', 'WITHDRAWN'].includes((application.status || '').toUpperCase()));
    const hasClosed = initial.some((application) => ['REJECTED', 'HIRED', 'WITHDRAWN'].includes((application.status || '').toUpperCase()));
    if (hasActive) return 'active';
    if (hasClosed) return 'closed';
    return 'active';
  });
  const shown = tab === 'active' ? active : closed;

  useEffect(() => {
    if (tab === 'active' && active.length === 0 && closed.length > 0) {
      setTab('closed');
    }
    if (tab === 'closed' && closed.length === 0 && active.length > 0) {
      setTab('active');
    }
  }, [tab, active.length, closed.length]);

  const handleWithdrawUpdate = useCallback((updatedApplication) => {
    setApplications((currentApplications) => currentApplications.map((application) => (
      application.id === updatedApplication.id ? updatedApplication : application
    )));
    setTab('closed');
  }, []);

  useEffect(() => {
    let cancelled = false;

    const refreshApplications = async () => {
      try {
        const response = await fetch('/api/candidate/applications', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
        });

        if (!response.ok) return;

        const data = await response.json();
        if (cancelled || !Array.isArray(data.applications)) return;

        setApplications(data.applications);
      } catch (error) {
        console.error('Failed to refresh applications:', error);
      }
    };

    const intervalId = setInterval(() => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') {
        refreshApplications();
      }
    }, 10000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshApplications();
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      cancelled = true;
      clearInterval(intervalId);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, []);

  return (
    <>
      <Head>
        <title>My Applications – PMO Network</title>
        <meta name="description" content="Track your submitted job applications." />
      </Head>

      <div className="applications-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">My Applications</h1>
            <p className="page-subtitle">Click any application to see your progress, interview details and feedback.</p>
          </div>
          <Link href="/jobs" className="browse-btn">Find Jobs</Link>
        </div>

        {applications.length === 0 ? (
          <section className="empty-state">
            <div className="empty-icon">📋</div>
            <h2>No applications yet</h2>
            <p>Start applying to opportunities that match your profile.</p>
            <Link href="/jobs" className="browse-btn">Browse Jobs</Link>
          </section>
        ) : (
          <>
            <div className="tabs">
              <button className={`tab ${tab === 'active' ? 'active' : ''}`} onClick={() => setTab('active')}>
                Active <span className="tab-count">{active.length}</span>
              </button>
              <button className={`tab ${tab === 'closed' ? 'active' : ''}`} onClick={() => setTab('closed')}>
                Closed <span className="tab-count">{closed.length}</span>
              </button>
            </div>

            {shown.length === 0 ? (
              <p className="empty-tab">No {tab} applications.</p>
            ) : (
              <section className="applications-list">
                {shown.map(app => <ApplicationCard key={app.id} application={app} onWithdraw={handleWithdrawUpdate} />)}
              </section>
            )}
          </>
        )}
      </div>

      <style jsx global>{`
        /* ---- Page layout ---- */
        .applications-page { max-width: 860px; margin: 0 auto; padding: 2rem 1.25rem 3rem; }
        .page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 1.75rem; flex-wrap: wrap; }
        .page-title { font-size: 1.875rem; font-weight: 700; margin: 0 0 0.25rem; color: #111827; }
        .page-subtitle { margin: 0; color: #6b7280; font-size: 0.9rem; }
        .browse-btn { display: inline-flex; align-items: center; justify-content: center; text-decoration: none; background: #4f46e5; color: #fff; border-radius: 10px; padding: 0.6rem 1.1rem; font-weight: 600; font-size: 0.875rem; white-space: nowrap; }
        .browse-btn:hover { background: #4338ca; }

        /* ---- Tabs ---- */
        .tabs { display: flex; gap: 0.25rem; margin-bottom: 1.25rem; border-bottom: 1px solid #e5e7eb; }
        .tab { background: none; border: none; padding: 0.625rem 1rem; font-size: 0.9rem; font-weight: 500; color: #6b7280; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; display: flex; align-items: center; gap: 0.4rem; }
        .tab.active { color: #4f46e5; border-bottom-color: #4f46e5; }
        .tab-count { background: #e5e7eb; color: #374151; border-radius: 9999px; font-size: 0.75rem; padding: 0.1rem 0.5rem; }
        .tab.active .tab-count { background: #e0e7ff; color: #4f46e5; }
        .empty-tab { color: #6b7280; padding: 2rem 0; text-align: center; }

        /* ---- Application card ---- */
        .applications-list { display: flex; flex-direction: column; gap: 0.75rem; }
        .app-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; overflow: hidden; transition: box-shadow 0.15s; }
        .app-card:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.07); }
        .app-card.expanded { border-color: #c7d2fe; box-shadow: 0 2px 16px rgba(79,70,229,0.08); }

        .card-header { width: 100%; background: none; border: none; cursor: pointer; display: flex; align-items: flex-start; justify-content: space-between; padding: 1rem 1.25rem; gap: 1rem; text-align: left; }
        .card-header:hover { background: #f9fafb; }
        .card-header-left { display: flex; align-items: flex-start; gap: 0.875rem; min-width: 0; flex: 1; }
        .company-logo-placeholder { width: 40px; height: 40px; min-width: 40px; border-radius: 10px; background: #e0e7ff; color: #4f46e5; font-weight: 700; font-size: 1rem; display: flex; align-items: center; justify-content: center; }
        .card-title-block { min-width: 0; }
        .job-title { font-size: 1rem; font-weight: 600; margin: 0 0 0.2rem; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .company-name { margin: 0 0 0.15rem; color: #4b5563; font-size: 0.875rem; font-weight: 500; }
        .job-meta { margin: 0; color: #9ca3af; font-size: 0.8rem; }
        .card-header-right { display: flex; flex-direction: column; align-items: flex-end; gap: 0.35rem; min-width: fit-content; }
        .status-pill { padding: 0.25rem 0.7rem; border-radius: 9999px; font-size: 0.775rem; font-weight: 700; white-space: nowrap; }
        .interview-alert { font-size: 0.775rem; color: #6d28d9; background: #ede9fe; padding: 0.2rem 0.6rem; border-radius: 9999px; white-space: nowrap; }
        .applied-date { font-size: 0.775rem; color: #9ca3af; }
        .chevron { font-size: 0.65rem; color: #9ca3af; margin-top: 0.25rem; }

        /* ---- Expanded detail ---- */
        .card-detail { border-top: 1px solid #f3f4f6; padding: 1.25rem 1.25rem 1rem; display: flex; flex-direction: column; gap: 1.25rem; }
        .section-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; margin: 0 0 0.75rem; }

        /* Pipeline */
        .pipeline { display: flex; align-items: flex-start; gap: 0; }
        .pipeline-step { display: flex; flex-direction: column; align-items: center; position: relative; flex: 1; }
        .pipeline-dot { width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; z-index: 1; }
        .dot-empty { width: 14px; height: 14px; border-radius: 50%; border: 2px solid #d1d5db; background: #fff; }
        .pipeline-step.done .dot-empty { border-color: #6ee7b7; background: #6ee7b7; }
        .pipeline-line { position: absolute; top: 11px; left: 50%; width: 100%; height: 2px; background: #e5e7eb; z-index: 0; }
        .pipeline-line.done { background: #6ee7b7; }
        .pipeline-label { font-size: 0.7rem; color: #9ca3af; margin-top: 0.35rem; text-align: center; }
        .pipeline-step.current .pipeline-label { color: #4f46e5; font-weight: 700; }

        /* Rejected banner */
        .rejected-banner { background: #fff1f2; border: 1px solid #fecdd3; border-radius: 10px; padding: 0.875rem 1rem; display: flex; align-items: center; gap: 0.875rem; }
        .rejected-icon { width: 32px; height: 32px; min-width: 32px; background: #fee2e2; color: #b91c1c; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; }
        .rejected-banner strong { display: block; color: #991b1b; margin-bottom: 0.2rem; }
        .rejected-banner p { margin: 0; color: #b91c1c; font-size: 0.875rem; }

        .withdrawn-banner { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 10px; padding: 0.875rem 1rem; display: flex; align-items: center; gap: 0.875rem; }
        .withdrawn-icon { width: 32px; height: 32px; min-width: 32px; background: #ffedd5; color: #9a3412; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; }
        .withdrawn-banner strong { display: block; color: #9a3412; margin-bottom: 0.2rem; }
        .withdrawn-banner p { margin: 0; color: #9a3412; font-size: 0.875rem; }

        /* Awaiting feedback banner */
        .awaiting-badge { font-size: 0.75rem; color: #92400e; background: #fef3c7; padding: 0.2rem 0.6rem; border-radius: 9999px; white-space: nowrap; font-weight: 600; }
        .awaiting-feedback-banner { background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 0.875rem 1rem; display: flex; align-items: flex-start; gap: 0.875rem; }
        .awaiting-icon { font-size: 1.25rem; margin-top: 0.1rem; }
        .awaiting-body { display: flex; flex-direction: column; gap: 0.4rem; }
        .awaiting-body strong { display: block; color: #92400e; }
        .awaiting-body p { margin: 0; color: #78350f; font-size: 0.875rem; }
        .feedback-request-btn { display: inline-flex; align-items: center; background: #d97706; color: #fff; border: none; border-radius: 8px; padding: 0.45rem 1rem; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: background 0.15s; margin-top: 0.25rem; width: fit-content; }
        .feedback-request-btn:hover:not(:disabled) { background: #b45309; }
        .feedback-request-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .feedback-sent-msg { font-size: 0.85rem; color: #065f46; font-weight: 600; }
        .feedback-error { font-size: 0.8rem; color: #b91c1c; }
        .feedback-given-banner { background: #ecfeff; border: 1px solid #a5f3fc; border-radius: 10px; padding: 0.875rem 1rem; display: flex; align-items: center; gap: 0.875rem; }
        .feedback-given-icon { width: 32px; height: 32px; min-width: 32px; background: #cffafe; color: #155e75; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .feedback-given-banner strong { display: block; color: #155e75; margin-bottom: 0.2rem; }
        .feedback-given-banner p { margin: 0; color: #0f766e; font-size: 0.875rem; }
        .iv-status-chip.completed { color: #065f46; background: #d1fae5; border-radius: 9999px; font-size: 0.75rem; padding: 0.1rem 0.5rem; font-weight: 600; margin-left: 0.5rem; }

        /* Feedback */
        .feedback-box { background: #f9fafb; border-left: 3px solid #4f46e5; border-radius: 0 8px 8px 0; padding: 0.75rem 1rem; }
        .feedback-box p { margin: 0 0 0.4rem; color: #374151; font-size: 0.9rem; }
        .feedback-date { font-size: 0.775rem; color: #9ca3af; }

        /* Interviews */
        .interview-card { display: flex; gap: 0.875rem; align-items: flex-start; padding: 0.875rem 1rem; border-radius: 10px; margin-bottom: 0.5rem; }
        .interview-card.upcoming { background: #f5f3ff; border: 1px solid #ddd6fe; }
        .interview-card.past { background: #f9fafb; border: 1px solid #e5e7eb; }
        .interview-card.past.cancelled { opacity: 0.6; }
        .interview-icon { font-size: 1.25rem; margin-top: 0.1rem; }
        .interview-detail { display: flex; flex-direction: column; gap: 0.2rem; }
        .interview-detail strong { color: #111827; font-size: 0.9rem; }
        .interview-detail span { color: #6b7280; font-size: 0.825rem; }
        .interview-message { margin: 0.4rem 0 0; font-style: italic; color: #4b5563; font-size: 0.85rem; }
        .join-btn { display: inline-flex; align-items: center; margin-top: 0.5rem; background: #4f46e5; color: #fff; text-decoration: none; font-size: 0.825rem; font-weight: 600; padding: 0.4rem 0.9rem; border-radius: 8px; }
        .join-btn:hover { background: #4338ca; }
        .iv-status-chip { display: inline-block; margin-left: 0.5rem; }

        /* Timeline */
        .timeline { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0; }
        .timeline-item { display: flex; gap: 0.75rem; position: relative; padding-bottom: 1rem; }
        .timeline-item:last-child { padding-bottom: 0; }
        .timeline-item:not(:last-child)::before { content: ''; position: absolute; left: 6px; top: 14px; bottom: 0; width: 1px; background: #e5e7eb; }
        .tl-dot { width: 13px; height: 13px; min-width: 13px; border-radius: 50%; background: #4f46e5; margin-top: 3px; }
        .tl-body { display: flex; flex-direction: column; gap: 0.1rem; }
        .tl-status { font-weight: 600; font-size: 0.875rem; color: #111827; text-transform: capitalize; }
        .tl-note { margin: 0.25rem 0 0; font-size: 0.85rem; color: #4b5563; }
        .tl-date { font-size: 0.775rem; color: #9ca3af; }

        /* Actions */
        .card-actions { display: flex; gap: 0.75rem; padding-top: 0.25rem; border-top: 1px solid #f3f4f6; flex-wrap: wrap; }
        .action-btn { display: inline-flex; align-items: center; padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.875rem; font-weight: 600; text-decoration: none; transition: all 0.15s; }
        .action-btn.outline { border: 1px solid #d1d5db; color: #374151; background: #fff; }
        .action-btn.outline:hover { border-color: #4f46e5; color: #4f46e5; background: #f0f4ff; }
        .action-btn.danger { border: 1px solid #fecaca; background: #fff5f5; color: #b91c1c; cursor: pointer; }
        .action-btn.danger:hover:not(:disabled) { border-color: #f87171; background: #fee2e2; }
        .action-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .withdraw-form { border: 1px solid #fecaca; background: #fffaf9; border-radius: 12px; padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; }
        .withdraw-label { font-size: 0.875rem; font-weight: 600; color: #7f1d1d; }
        .withdraw-textarea { width: 100%; min-height: 110px; border: 1px solid #fca5a5; border-radius: 10px; padding: 0.8rem 0.9rem; font: inherit; resize: vertical; color: #374151; background: #fff; }
        .withdraw-textarea:focus { outline: none; border-color: #ef4444; box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.12); }
        .withdraw-helper-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
        .withdraw-helper { font-size: 0.8rem; color: #7f1d1d; }
        .withdraw-count { font-size: 0.78rem; color: #9ca3af; }
        .withdraw-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }
        .action-error { margin: -0.5rem 0 0; color: #b91c1c; font-size: 0.825rem; }

        /* Empty state */
        .empty-state { background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; text-align: center; padding: 3rem 1.25rem; }
        .empty-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
        .empty-state h2 { margin: 0 0 0.5rem; color: #111827; }
        .empty-state p { margin: 0 0 1.25rem; color: #6b7280; }

        @media (max-width: 640px) {
          .card-header { flex-direction: column; }
          .card-header-right { flex-direction: row; align-items: center; flex-wrap: wrap; }
          .pipeline-label { font-size: 0.6rem; }
        }
      `}</style>
    </>
  );
}

