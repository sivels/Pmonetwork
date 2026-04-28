import { useEffect, useState } from 'react';
import Head from 'next/head';
import { getServerSession } from 'next-auth/next';
import { useRouter } from 'next/router';
import { authOptions } from '../api/auth/[...nextauth]';
import { prisma } from '../../lib/prisma';

const SUPPORT_SEEN_STORAGE_KEY = 'pmo_support_ticket_seen_map';

function getLatestExternalReplyAt(ticket, userEmail) {
  const externalNotes = (ticket?.notes || []).filter((note) => note.author?.email !== userEmail);
  if (externalNotes.length === 0) return null;
  return externalNotes[externalNotes.length - 1]?.createdAt || null;
}

function getUnreadReplyCount(ticket, userEmail, seenMap) {
  const lastSeenAt = seenMap?.[ticket.id];
  return (ticket?.notes || []).filter((note) => {
    if (note.author?.email === userEmail) return false;
    if (!lastSeenAt) return true;
    return new Date(note.createdAt).getTime() > new Date(lastSeenAt).getTime();
  }).length;
}

export async function getServerSideProps(ctx) {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session) {
    return { redirect: { destination: '/auth/login', permanent: false } };
  }

  // Fetch support tickets for this user
  const tickets = await prisma.supportTicket.findMany({
    where: {
      OR: [
        { createdByUserId: session.user.id },
        { targetUserId: session.user.id },
      ],
    },
    include: {
      createdBy: {
        select: { id: true, email: true },
      },
      notes: {
        where: { isInternal: false },
        orderBy: { createdAt: 'asc' },
        include: {
          author: { select: { email: true } },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return {
    props: {
      userEmail: session.user.email,
      initialTickets: JSON.parse(JSON.stringify(tickets)),
    },
  };
}

export default function SupportMessages({ userEmail, initialTickets }) {
  const router = useRouter();
  const [tickets, setTickets] = useState(initialTickets || []);
  const [activeTicketId, setActiveTicketId] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [replyMessage, setReplyMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [lastSeenByTicket, setLastSeenByTicket] = useState({});

  const activeTicket = tickets.find(t => t.id === activeTicketId);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = window.localStorage.getItem(SUPPORT_SEEN_STORAGE_KEY);
      if (stored) {
        setLastSeenByTicket(JSON.parse(stored));
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(SUPPORT_SEEN_STORAGE_KEY, JSON.stringify(lastSeenByTicket));
    } catch {}
  }, [lastSeenByTicket]);

  useEffect(() => {
    if (!activeTicketId && tickets.length > 0) {
      setActiveTicketId(tickets[0].id);
    }
  }, [activeTicketId, tickets]);

  useEffect(() => {
    if (!router.isReady) return;
    const requestedTicketId = typeof router.query.ticketId === 'string' ? router.query.ticketId : '';
    if (!requestedTicketId) return;
    if (tickets.some((ticket) => ticket.id === requestedTicketId)) {
      setActiveTicketId(requestedTicketId);
    }
  }, [router.isReady, router.query.ticketId, tickets]);

  useEffect(() => {
    if (!activeTicket?.id) return;

    const latestExternalReplyAt = getLatestExternalReplyAt(activeTicket, userEmail);
    if (!latestExternalReplyAt) return;

    setLastSeenByTicket((current) => {
      const existing = current[activeTicket.id];
      if (existing && new Date(existing).getTime() >= new Date(latestExternalReplyAt).getTime()) {
        return current;
      }

      return {
        ...current,
        [activeTicket.id]: latestExternalReplyAt,
      };
    });
  }, [activeTicket, userEmail]);

  const refreshTickets = async (preferredTicketId) => {
    const refreshRes = await fetch('/api/candidate/support-message', { method: 'GET' });
    if (!refreshRes.ok) {
      const data = await refreshRes.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to refresh tickets');
    }

    const refreshData = await refreshRes.json();
    const nextTickets = refreshData.tickets || [];
    setTickets(nextTickets);

    const nextActiveId = preferredTicketId || activeTicketId;
    if (nextActiveId && nextTickets.some((ticket) => ticket.id === nextActiveId)) {
      setActiveTicketId(nextActiveId);
    } else if (nextTickets[0]?.id) {
      setActiveTicketId(nextTickets[0].id);
    }

    return nextTickets;
  };

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const poll = async () => {
      if (document.hidden || loading || replyLoading) return;
      try {
        await refreshTickets();
      } catch {}
    };

    const intervalId = window.setInterval(poll, 15000);
    document.addEventListener('visibilitychange', poll);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', poll);
    };
  }, [activeTicketId, loading, replyLoading]);

  const handleNewMessage = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !newMessage.trim()) {
      setError('Subject and message are required');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/candidate/support-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message: newMessage }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send message');
      }

      const data = await res.json();
      await refreshTickets(data.ticket.id);
      
      setSubject('');
      setNewMessage('');
      setShowNewForm(false);
      setSuccess(`✓ Support ticket ${data.ticket.reference} created successfully!`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();

    if (!activeTicket?.id) {
      setError('Select a ticket first');
      return;
    }

    if (!replyMessage.trim()) {
      setError('Reply message is required');
      return;
    }

    setReplyLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/candidate/support-message', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: activeTicket.id, message: replyMessage }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send reply');
      }

      await refreshTickets(activeTicket.id);
      setReplyMessage('');
      setSuccess(`✓ Reply added to ${activeTicket.reference}`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setReplyLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Support Messages – PMO Network</title>
      </Head>

      <div style={styles.page}>
        <div style={styles.container}>
          {/* Header */}
          <div style={styles.header}>
            <h1 style={styles.title}>Support Messages</h1>
            <p style={styles.subtitle}>Chat with the PMO Network support team</p>
          </div>

          {/* Success Message */}
          {success && (
            <div style={styles.successBox}>{success}</div>
          )}

          <div style={styles.liveStatusRow}>
            <span style={styles.liveDot} />
            Auto-refreshing replies every 15 seconds
          </div>

          {error && !showNewForm && (
            <div style={styles.errorBoxGlobal}>{error}</div>
          )}

          <div style={styles.mainContent}>
            {/* Left Panel - Tickets List */}
            <div style={styles.leftPanel}>
              <button
                onClick={() => setShowNewForm(!showNewForm)}
                style={{
                  ...styles.newMessageBtn,
                  background: showNewForm ? '#7c3aed' : '#4f46e5',
                }}
              >
                {showNewForm ? '✕ Cancel' : '+ New Message'}
              </button>

              {/* New Message Form */}
              {showNewForm && (
                <form onSubmit={handleNewMessage} style={styles.newForm}>
                  {error && <div style={styles.errorBox}>{error}</div>}
                  <input
                    type="text"
                    placeholder="Subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    style={styles.input}
                  />
                  <textarea
                    placeholder="Describe your issue..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    style={{ ...styles.input, minHeight: '100px' }}
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      ...styles.submitBtn,
                      opacity: loading ? 0.6 : 1,
                      cursor: loading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {loading ? 'Sending…' : 'Send Message'}
                  </button>
                </form>
              )}

              {/* Tickets List */}
              <div style={styles.ticketsList}>
                {tickets.length === 0 ? (
                  <p style={styles.emptyText}>No support tickets yet</p>
                ) : (
                  tickets.map((ticket) => {
                    const unreadCount = getUnreadReplyCount(ticket, userEmail, lastSeenByTicket);

                    return (
                      <button
                        key={ticket.id}
                        onClick={() => setActiveTicketId(ticket.id)}
                        style={{
                          ...styles.ticketItem,
                          background:
                            activeTicketId === ticket.id ? '#f5f3ff' : '#fff',
                          borderColor:
                            activeTicketId === ticket.id ? '#4f46e5' : '#e5e7eb',
                        }}
                      >
                        <div>
                          <div style={styles.ticketRef}>{ticket.reference}</div>
                          <div style={styles.ticketSubject}>{ticket.subject}</div>
                          <div style={styles.ticketStatus}>
                            Status: <strong>{ticket.status}</strong>
                          </div>
                          {ticket.createdBy?.email && ticket.createdBy.email !== userEmail && (
                            <div style={styles.ticketMetaLine}>Opened by {ticket.createdBy.email}</div>
                          )}
                        </div>
                        <div style={styles.ticketBadges}>
                          {ticket.notes?.length > 0 && (
                            <span style={styles.replyCountBadge}>
                              {ticket.notes.length} replies
                            </span>
                          )}
                          {unreadCount > 0 && (
                            <span style={styles.unreadBadge}>
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Panel - Conversation */}
            <div style={styles.rightPanel}>
              {!activeTicket ? (
                <div style={styles.emptyState}>
                  <svg
                    width="64"
                    height="64"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    style={{ color: '#d1d5db' }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p>Select a ticket or create a new message to get started</p>
                </div>
              ) : (
                <div style={styles.ticketDetail}>
                  <div style={styles.ticketHeader}>
                    <div>
                      <h2 style={styles.ticketTitle}>{activeTicket.subject}</h2>
                      <p style={styles.ticketMeta}>
                        {activeTicket.reference} • Status: <strong>{activeTicket.status}</strong>
                      </p>
                      {activeTicket.createdBy?.email && activeTicket.createdBy.email !== userEmail && (
                        <p style={styles.ticketMetaSecondary}>Opened by {activeTicket.createdBy.email}</p>
                      )}
                    </div>
                  </div>

                  {/* Messages Thread */}
                  <div style={styles.messagesThread}>
                    {activeTicket.notes?.length === 0 ? (
                      <p style={styles.noMessages}>
                        No replies yet. Send a follow-up below and we’ll keep the thread updated here.
                      </p>
                    ) : (
                      activeTicket.notes.map((note) => (
                        <div
                          key={note.id}
                          style={{
                            ...styles.messageBlock,
                            background: note.isInternal
                              ? '#fef3c7'
                              : userEmail === note.author.email
                                ? '#eef2ff'
                                : '#f3f4f6',
                            borderLeft: note.isInternal
                              ? '4px solid #f59e0b'
                              : userEmail === note.author.email
                                ? '4px solid #4f46e5'
                                : '4px solid #9ca3af',
                          }}
                        >
                          <div style={styles.messageAuthor}>
                            <strong>{note.author.email}</strong>
                            {userEmail === note.author.email && (
                              <span style={styles.youBadge}>You</span>
                            )}
                          </div>
                          <p style={styles.messageText}>{note.note}</p>
                          <div style={styles.messageTime}>
                            {new Date(note.createdAt).toLocaleString()}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <form onSubmit={handleReply} style={styles.replyForm}>
                    <label style={styles.replyLabel} htmlFor="ticket-reply">
                      Reply to this ticket
                    </label>
                    <textarea
                      id="ticket-reply"
                      placeholder="Add more details or respond to PMO Support…"
                      value={replyMessage}
                      onChange={(event) => setReplyMessage(event.target.value)}
                      style={{ ...styles.input, minHeight: '120px' }}
                    />
                    <div style={styles.replyActions}>
                      <button
                        type="button"
                        onClick={() => setReplyMessage('')}
                        style={styles.secondaryBtn}
                        disabled={replyLoading || !replyMessage}
                      >
                        Clear
                      </button>
                      <button
                        type="submit"
                        disabled={replyLoading}
                        style={{
                          ...styles.submitBtn,
                          opacity: replyLoading ? 0.6 : 1,
                          cursor: replyLoading ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {replyLoading ? 'Sending…' : 'Send Reply'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        * {
          box-sizing: border-box;
        }
        body {
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          background: #f9fafb;
        }
      `}</style>
    </>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f9fafb',
    padding: '1.5rem',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '2rem',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 700,
    color: '#1f2937',
    margin: '0 0 0.5rem',
  },
  subtitle: {
    fontSize: '1rem',
    color: '#6b7280',
    margin: 0,
  },
  mainContent: {
    display: 'grid',
    gridTemplateColumns: '320px 1fr',
    gap: '1.5rem',
    minHeight: '500px',
  },
  leftPanel: {
    background: '#fff',
    borderRadius: '0.75rem',
    padding: '1rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  newMessageBtn: {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: '0.6rem',
    border: 'none',
    color: '#fff',
    fontWeight: 600,
    cursor: 'pointer',
    marginBottom: '1rem',
    transition: 'background 0.2s',
  },
  newForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginBottom: '1rem',
    padding: '1rem',
    background: '#f9fafb',
    borderRadius: '0.6rem',
    border: '1px solid #e5e7eb',
  },
  input: {
    padding: '0.6rem 0.8rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.5rem',
    fontSize: '0.9rem',
    fontFamily: 'inherit',
  },
  submitBtn: {
    padding: '0.6rem 1rem',
    background: '#4f46e5',
    color: '#fff',
    border: 'none',
    borderRadius: '0.5rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  errorBox: {
    background: '#fef2f2',
    color: '#dc2626',
    padding: '0.75rem',
    borderRadius: '0.5rem',
    fontSize: '0.9rem',
    marginBottom: '0.5rem',
  },
  errorBoxGlobal: {
    background: '#fef2f2',
    color: '#dc2626',
    padding: '1rem',
    borderRadius: '0.6rem',
    marginBottom: '1rem',
    border: '1px solid #fecaca',
    fontWeight: 500,
  },
  ticketsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    maxHeight: '600px',
    overflowY: 'auto',
  },
  ticketItem: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '0.6rem',
    padding: '0.75rem',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '0.75rem',
  },
  liveStatusRow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: '#6b7280',
    fontSize: '0.82rem',
    marginBottom: '1rem',
  },
  liveDot: {
    width: '8px',
    height: '8px',
    borderRadius: '999px',
    background: '#22c55e',
    boxShadow: '0 0 0 4px rgba(34, 197, 94, 0.15)',
  },
  ticketRef: {
    fontSize: '0.75rem',
    color: '#9ca3af',
    fontWeight: 600,
    marginBottom: '0.25rem',
  },
  ticketSubject: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#1f2937',
    marginBottom: '0.25rem',
  },
  ticketStatus: {
    fontSize: '0.8rem',
    color: '#6b7280',
  },
  ticketMetaLine: {
    fontSize: '0.76rem',
    color: '#9ca3af',
    marginTop: '0.2rem',
  },
  ticketBadges: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '0.35rem',
    flexShrink: 0,
  },
  replyCountBadge: {
    background: '#e0e7ff',
    color: '#4f46e5',
    borderRadius: '999px',
    padding: '2px 8px',
    fontSize: '0.75rem',
    fontWeight: 600,
  },
  unreadBadge: {
    background: '#dc2626',
    color: '#fff',
    borderRadius: '999px',
    padding: '2px 8px',
    fontSize: '0.72rem',
    fontWeight: 700,
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    padding: '1rem 0',
  },
  rightPanel: {
    background: '#fff',
    borderRadius: '0.75rem',
    padding: '1.5rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    gap: '1rem',
    color: '#9ca3af',
  },
  ticketDetail: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  ticketHeader: {
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: '1rem',
  },
  ticketTitle: {
    fontSize: '1.3rem',
    fontWeight: 700,
    color: '#1f2937',
    margin: '0 0 0.5rem',
  },
  ticketMeta: {
    fontSize: '0.9rem',
    color: '#6b7280',
    margin: 0,
  },
  ticketMetaSecondary: {
    fontSize: '0.82rem',
    color: '#9ca3af',
    margin: '0.35rem 0 0',
  },
  messagesThread: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    maxHeight: '400px',
    overflowY: 'auto',
  },
  messageBlock: {
    padding: '0.75rem 1rem',
    borderRadius: '0.6rem',
  },
  messageAuthor: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.5rem',
    fontSize: '0.85rem',
  },
  youBadge: {
    background: '#c7d2fe',
    color: '#4338ca',
    padding: '2px 6px',
    borderRadius: '999px',
    fontSize: '0.7rem',
    fontWeight: 700,
  },
  internalBadge: {
    background: '#f59e0b',
    color: '#fff',
    padding: '2px 6px',
    borderRadius: '3px',
    fontSize: '0.7rem',
    fontWeight: 600,
  },
  messageText: {
    margin: '0 0 0.5rem',
    lineHeight: 1.5,
    color: '#374151',
  },
  messageTime: {
    fontSize: '0.75rem',
    color: '#9ca3af',
  },
  noMessages: {
    textAlign: 'center',
    color: '#9ca3af',
    padding: '2rem 1rem',
  },
  replyForm: {
    borderTop: '1px solid #e5e7eb',
    paddingTop: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  replyLabel: {
    fontSize: '0.92rem',
    fontWeight: 600,
    color: '#374151',
  },
  replyActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
  },
  secondaryBtn: {
    padding: '0.6rem 1rem',
    background: '#fff',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '0.5rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  successBox: {
    background: '#dcfce7',
    color: '#16a34a',
    padding: '1rem',
    borderRadius: '0.6rem',
    marginBottom: '1.5rem',
    border: '1px solid #bbf7d0',
    fontWeight: 500,
  },
};
