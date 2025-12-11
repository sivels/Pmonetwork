import Head from 'next/head';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]';
import { prisma } from '../../lib/prisma';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

export async function getServerSideProps(ctx) {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session) {
    return { redirect: { destination: '/auth/login', permanent: false } };
  }
  if ((session.user.role || '').toLowerCase() !== 'candidate') {
    return { redirect: { destination: '/dashboard/employer', permanent: false } };
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      candidateCandidateProfile: {
        include: { applications: { include: { job: true }, orderBy: { createdAt: 'desc' } } }
      }
    }
  });
  const profile = user?.candidateCandidateProfile || null;
  return { props: { profile: profile ? JSON.parse(JSON.stringify(profile)) : null, userEmail: session.user.email } };
}

export default function CandidateMessages({ profile, userEmail }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [bookmarkedConversations, setBookmarkedConversations] = useState(new Set());
  const [reportedConversations, setReportedConversations] = useState(new Set());

  // Placeholder conversations data (stateful for unread updates)
  const [conversations, setConversations] = useState([
    { id: 'c1', name: 'Jane Smith', company: 'AlphaPMO', jobTitle: 'PMO Analyst', lastMessage: 'Thanks for sharing your CV, we will review and get back to you shortly.', timestamp: Date.now() - 1000 * 60 * 5, unread: 2, type: 'company', avatarUrl: '/images/avatar-placeholder.svg', applicationId: 'app1' },
    { id: 'c2', name: 'PMO Support', company: 'Platform Support', jobTitle: null, lastMessage: 'Your application status changed to Shortlisted.', timestamp: Date.now() - 1000 * 60 * 60, unread: 0, type: 'support', avatarUrl: '/images/avatar-placeholder.svg' },
    { id: 'c3', name: 'Michael Lee', company: 'DeltaCorp', jobTitle: 'Senior PMO Specialist', lastMessage: 'Can you confirm availability for next week?', timestamp: Date.now() - 1000 * 60 * 90, unread: 1, type: 'company', avatarUrl: '/images/avatar-placeholder.svg', applicationId: 'app2' },
    { id: 'c4', name: 'Recruiter Bot', company: 'System', jobTitle: null, lastMessage: 'System message: Interview scheduled for 12 Dec 10:00 AM GMT.', timestamp: Date.now() - 1000 * 60 * 120, unread: 0, type: 'system', avatarUrl: '/images/avatar-placeholder.svg' }
  ]);

  // Placeholder messages per conversation
  const messagesMap = {
    c1: [
      { id: 'm1', sender: 'Jane Smith', senderType: 'company', text: 'Hi, thanks for applying. Can you send your latest CV?', timestamp: Date.now() - 1000 * 60 * 60 * 5, readAt: Date.now() - 1000 * 60 * 60 * 4 },
      { id: 'm2', sender: 'You', senderType: 'candidate', text: 'Sure, just uploaded it.', timestamp: Date.now() - 1000 * 60 * 60 * 4, readAt: Date.now() - 1000 * 60 * 60 * 3 },
      { id: 'm3', sender: 'Jane Smith', senderType: 'company', text: 'Thanks for sharing your CV, we will review and get back to you shortly.', timestamp: Date.now() - 1000 * 60 * 5, readAt: null }
    ],
    c2: [
      { id: 'm4', sender: 'System', senderType: 'system', text: 'Application status updated to Shortlisted.', timestamp: Date.now() - 1000 * 60 * 60, system: true },
      { id: 'm5', sender: 'PMO Support', senderType: 'support', text: 'Let us know if you have any questions about next steps.', timestamp: Date.now() - 1000 * 60 * 55 }
    ],
    c3: [
      { id: 'm6', sender: 'Michael Lee', senderType: 'company', text: 'We liked your background. Are you available next week for a quick call?', timestamp: Date.now() - 1000 * 60 * 100 },
      { id: 'm7', sender: 'You', senderType: 'candidate', text: 'Yes, Wednesday or Thursday morning works.', timestamp: Date.now() - 1000 * 60 * 95 }
    ],
    c4: [
      { id: 'm8', sender: 'System', senderType: 'system', text: 'Interview scheduled for 12 Dec 10:00 AM GMT.', timestamp: Date.now() - 1000 * 60 * 120, system: true }
    ]
  };

  // Publish unread count to candidate header (localStorage + custom event)
  useEffect(() => {
    const unread = conversations.reduce((sum, c) => sum + (c.unread || 0), 0);
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('unreadMessagesCount', String(unread));
        window.dispatchEvent(new CustomEvent('unreadMessages', { detail: unread }));
      }
    } catch {}
  }, [conversations]);

  useEffect(() => {
    if (!activeConversationId && conversations.length > 0) {
      setActiveConversationId(conversations[0].id);
    }
  }, [activeConversationId, conversations]);

  // Mark conversation as read when opened
  useEffect(() => {
    if (!activeConversationId) return;
    setConversations(prev => prev.map(c => c.id === activeConversationId ? { ...c, unread: 0 } : c));
  }, [activeConversationId]);

  const activeMessages = activeConversationId ? messagesMap[activeConversationId] || [] : [];
  const activeConversation = conversations.find(c => c.id === activeConversationId) || null;

  const filteredConversations = conversations.filter(c => {
    if (filter === 'unread' && c.unread === 0) return false;
    if (filter === 'company' && c.type !== 'company') return false;
    if (filter === 'support' && c.type !== 'support') return false;
    if (filter === 'bookmarked' && !bookmarkedConversations.has(c.id)) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!c.name.toLowerCase().includes(s) && !(c.jobTitle || '').toLowerCase().includes(s) && !(c.company || '').toLowerCase().includes(s)) {
        return false;
      }
    }
    return true;
  });

  const handleLoadMore = () => {
    setLoadingMore(true);
    setTimeout(() => setLoadingMore(false), 800); // placeholder
  };

  const handleBookmark = (conversationId) => {
    const newBookmarks = new Set(bookmarkedConversations);
    if (newBookmarks.has(conversationId)) {
      newBookmarks.delete(conversationId);
      showToast('Bookmark removed');
    } else {
      newBookmarks.add(conversationId);
      showToast('Conversation bookmarked');
    }
    setBookmarkedConversations(newBookmarks);
    // TODO: Call API: POST/DELETE /api/conversation/{id}/bookmark
  };

  const handleReport = () => {
    setReportModalOpen(true);
  };

  const submitReport = (reason, comment) => {
    // TODO: Call API: POST /api/conversation/{id}/report
    setReportedConversations(prev => new Set(prev).add(activeConversationId));
    setReportModalOpen(false);
    showToast('Thank you — your report has been submitted.');
  };

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const composerRef = useRef(null);
  const [draft, setDraft] = useState('');
  const fileInputRef = useRef(null);

  const sendMessage = () => {
    if (!draft.trim()) return;
    // Placeholder send logic (would call API)
    messagesMap[activeConversationId] = [
      ...(messagesMap[activeConversationId] || []),
      { id: 'local-' + Date.now(), sender: 'You', senderType: 'candidate', text: draft, timestamp: Date.now(), readAt: null }
    ];
    setDraft('');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // TODO: Upload file to server
      showToast(`Document "${file.name}" shared successfully`);
    }
  };

  return (
    <div className="messages-page">      
      <Head>
        <title>Messages – PMO Network</title>
      </Head>
      <header className="messages-topbar">
        <div className="left">
          <Link href="/dashboard/candidate" className="back-btn">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
        <div className="center">
          <h1 className="page-title">Messages</h1>
        </div>
        <div className="right"></div>
      </header>
      <div className="messages-layout">
        {/* Left Sidebar */}
        <aside className="conversations-sidebar">
          <div className="search-box">
            <input
              placeholder="Search messages…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button className="new-msg-btn">New Message</button>
          </div>
          <div className="filters">
            <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All</button>
            <button className={filter === 'unread' ? 'active' : ''} onClick={() => setFilter('unread')}>Unread</button>
            <button className={filter === 'bookmarked' ? 'active' : ''} onClick={() => setFilter('bookmarked')}>Bookmarked</button>
            <button className={filter === 'company' ? 'active' : ''} onClick={() => setFilter('company')}>Companies</button>
            <button className={filter === 'support' ? 'active' : ''} onClick={() => setFilter('support')}>Support</button>
          </div>
          <div className="conversation-list">
            {filteredConversations.map(conv => (
              <div
                key={conv.id}
                className={`conversation-card ${conv.id === activeConversationId ? 'active' : ''}`}
                onClick={() => setActiveConversationId(conv.id)}
              >
                <div className="avatar">
                  <img src={conv.avatarUrl} alt={conv.name} />
                  {conv.unread > 0 && <span className="unread-dot" />}
                </div>
                <div className="meta">
                  <div className="top-row">
                    <span className="name">
                      {conv.name}
                      {bookmarkedConversations.has(conv.id) && (
                        <svg width="12" height="12" fill="#f59e0b" viewBox="0 0 20 20" style={{ marginLeft: '0.3rem', verticalAlign: 'middle' }}>
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      )}
                    </span>
                    <span className="time">{new Date(conv.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  {conv.jobTitle && <div className="job-title">{conv.jobTitle}</div>}
                  <div className="preview">{conv.lastMessage.split(' ').slice(0, 15).join(' ')}{conv.lastMessage.split(' ').length > 15 ? '…' : ''}</div>
                </div>
                {conv.unread > 0 && <span className="badge">{conv.unread}</span>}
              </div>
            ))}
            {filteredConversations.length === 0 && (
              <div className="empty-conv">No conversations match your filters.</div>
            )}
          </div>
          <div className="load-more">
            <button onClick={handleLoadMore} disabled={loadingMore}>{loadingMore ? 'Loading…' : 'Load More'}</button>
          </div>
        </aside>

        {/* Middle Chat Panel */}
        <section className="chat-panel">
          {activeConversation ? (
            <>
              <div className="chat-header">
                <div className="chat-header-left">
                  <img src={activeConversation.avatarUrl} alt={activeConversation.name} />
                  <div className="chat-header-meta">
                    <h2>{activeConversation.name}</h2>
                    <div className="sub">
                      {activeConversation.jobTitle && <span className="job-ref">{activeConversation.jobTitle}</span>}
                      {activeConversation.type === 'company' && <span className="online-indicator">Online</span>}
                    </div>
                  </div>
                </div>
              </div>
              <div className="chat-thread" id="chatThread">
                {activeMessages.map(msg => (
                  <div key={msg.id} className={`msg-row ${msg.senderType} ${msg.system ? 'system' : ''}`}>
                    <div className="bubble">
                      {msg.system ? (
                        <span className="system-text">{msg.text}</span>
                      ) : (
                        <>
                          <p>{msg.text}</p>
                          <div className="meta-line">
                            <span className="timestamp">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {msg.senderType === 'candidate' && <span className="read-receipt">{msg.readAt ? 'Read' : 'Sent'}</span>}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="composer">
                <div className="composer-inner">
                  <button className="attach-btn" title="Attach file">📎</button>
                  <button className="emoji-btn" title="Emoji">😊</button>
                  <input
                    ref={composerRef}
                    className="message-input"
                    placeholder="Type a message..."
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  />
                  <button className="send-btn" onClick={sendMessage}>Send</button>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-chat">Select a conversation to start messaging.</div>
          )}
        </section>

        {/* Right Context Panel */}
        <aside className="context-panel">
          {activeConversation ? (
            <>
              <div className="context-section conversation-summary">
                <h3>Conversation Summary</h3>
                <div className="contact-card">
                  <img src={activeConversation.avatarUrl} alt={activeConversation.name} className="contact-avatar" />
                  <div className="contact-info">
                    <h4 className="contact-name">{activeConversation.name}</h4>
                    <p className="contact-role">{activeConversation.jobTitle || 'Contact'}</p>
                    {activeConversation.type === 'company' && (
                      <span className="status-indicator online">● Online</span>
                    )}
                    {activeConversation.type !== 'company' && activeConversation.type !== 'system' && (
                      <span className="status-indicator offline">● Offline</span>
                    )}
                  </div>
                </div>
                {activeConversation.company && activeConversation.type === 'company' && (
                  <div className="company-info">
                    <div className="company-logo">
                      <span>{activeConversation.company.charAt(0)}</span>
                    </div>
                    <div className="company-meta">
                      <strong>{activeConversation.company}</strong>
                      <p className="company-sector">Consulting</p>
                    </div>
                  </div>
                )}
                {activeConversation.company && (
                  <Link href={`/companies/${(activeConversation.company || '').toLowerCase()}`} className="panel-link-primary">
                    View Company Profile →
                  </Link>
                )}
              </div>

              {activeConversation?.applicationId && (
                <div className="context-section application-details">
                  <h3>Application Details</h3>
                  <div className="app-detail-row">
                    <span className="label">Reference</span>
                    <span className="value">{activeConversation.applicationId}</span>
                  </div>
                  <div className="app-detail-row">
                    <span className="label">Job Title</span>
                    <span className="value">{activeConversation.jobTitle || 'N/A'}</span>
                  </div>
                  <div className="app-detail-row">
                    <span className="label">Status</span>
                    <span className="status-badge shortlisted">Shortlisted</span>
                  </div>
                  <Link href={`/applications/${activeConversation.applicationId}`} className="panel-link-primary">
                    View Full Application →
                  </Link>
                </div>
              )}

              <div className="context-section conversation-actions">
                <h3>Conversation Actions</h3>
                <div className="actions-list">
                  <button className="action-item" onClick={() => handleBookmark(activeConversationId)}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    <span>{bookmarkedConversations.has(activeConversationId) ? 'Remove Bookmark' : 'Bookmark Conversation'}</span>
                  </button>
                  <button className="action-item" onClick={() => document.getElementById('file-upload-input')?.click()}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Share Document</span>
                  </button>
                  <button className="action-item" onClick={() => showToast('Meeting scheduler coming soon')}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Schedule Meeting</span>
                  </button>
                  <button 
                    className={`action-item danger ${reportedConversations.has(activeConversationId) ? 'disabled' : ''}`}
                    onClick={handleReport}
                    disabled={reportedConversations.has(activeConversationId)}
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                    </svg>
                    <span>{reportedConversations.has(activeConversationId) ? 'Reported' : 'Report Conversation'}</span>
                  </button>
                </div>
              </div>

              <div className="context-section shared-files">
                <h3>Shared Files</h3>
                <p className="empty-files">No files shared in this conversation yet.</p>
              </div>
            </>
          ) : (
            <div className="empty-context">
              <p>Select a conversation to view details</p>
            </div>
          )}
        </aside>
      </div>

      {/* Report Modal */}
      {reportModalOpen && (
        <ReportModal
          conversationName={activeConversation?.name || 'Conversation'}
          onSubmit={submitReport}
          onCancel={() => setReportModalOpen(false)}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="toast-notification">
          <span>{toast}</span>
        </div>
      )}

      {/* Hidden file input for document sharing */}
      <input
        id="file-upload-input"
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
      />

      <style jsx>{`
        .messages-page { display:flex; flex-direction:column; min-height:100vh; background:#f8f9fc; color:#1f2937; }
        .messages-topbar { position:sticky; top:0; display:flex; align-items:center; justify-content:space-between; padding:0.75rem 1.25rem; background:#ffffff; border-bottom:1px solid #e5e7eb; border-radius:16px; margin:0.5rem; z-index:20; }
        .back-btn { display:flex; align-items:center; gap:0.5rem; font-weight:500; font-size:0.85rem; color:#6b7280; text-decoration:none; transition:color 0.15s; }
        .back-btn:hover { color:#4f46e5; }
        .center { position:absolute; left:50%; transform:translateX(-50%); }
        .page-title { font-size:1rem; font-weight:600; }

        .messages-layout { flex:1; display:grid; grid-template-columns:280px 1fr 300px; gap:1rem; padding:1rem; }
        @media (max-width:1200px){ .messages-layout { grid-template-columns:240px 1fr 260px; } }
        @media (max-width:1000px){ .messages-layout { grid-template-columns:240px 1fr; } .context-panel { display:none; } }
        @media (max-width:700px){ .messages-layout { grid-template-columns:1fr; } .conversations-sidebar { display:none; } }

        .conversations-sidebar { background:#ffffff; border:1px solid #e5e7eb; border-radius:16px; display:flex; flex-direction:column; overflow:hidden; }
        .search-box { padding:0.75rem; display:flex; flex-direction:column; gap:0.5rem; }
        .search-box input { width:100%; padding:0.55rem 0.75rem; border:1px solid #d1d5db; border-radius:10px; font-size:0.85rem; background:#f9fafb; }
        .new-msg-btn { width:100%; background:#4f46e5; color:#fff; border:none; padding:0.55rem 0.75rem; border-radius:10px; font-size:0.75rem; cursor:pointer; }
        .filters { display:flex; gap:0.4rem; padding:0 0.75rem 0.5rem; flex-wrap:wrap; }
        .filters button { flex:1; border:none; background:#eef2ff; color:#4f46e5; padding:0.4rem 0.5rem; border-radius:8px; font-size:0.65rem; cursor:pointer; font-weight:500; }
        .filters button.active { background:#4f46e5; color:#fff; }

        .conversation-list { flex:1; overflow-y:auto; padding:0.25rem 0.5rem 0.75rem; display:flex; flex-direction:column; gap:0.5rem; }
        .conversation-card { display:flex; position:relative; gap:0.6rem; background:#f9fafb; border:1px solid #e5e7eb; border-radius:12px; padding:0.55rem 0.6rem; cursor:pointer; transition:background 0.15s, box-shadow 0.15s; }
        .conversation-card.active { background:#eef2ff; box-shadow:0 0 0 2px #4f46e5 inset; }
        .conversation-card:hover { background:#ffffff; }
        .avatar { position:relative; }
        .avatar img { width:40px; height:40px; border-radius:10px; object-fit:cover; }
        .unread-dot { position:absolute; bottom:-2px; right:-2px; width:12px; height:12px; background:#ef4444; border:2px solid #fff; border-radius:50%; animation:pulse 1.4s infinite; }
        @keyframes pulse { 0% { transform:scale(1); } 50% { transform:scale(1.3); } 100% { transform:scale(1); } }
        .meta { flex:1; display:flex; flex-direction:column; gap:0.15rem; }
        .top-row { display:flex; justify-content:space-between; align-items:center; }
        .name { font-size:0.8rem; font-weight:600; color:#1f2937; }
        .time { font-size:0.6rem; color:#6b7280; }
        .job-title { font-size:0.65rem; color:#4f46e5; font-weight:500; }
        .preview { font-size:0.65rem; color:#374151; line-height:1.2; }
        .badge { position:absolute; top:6px; right:6px; background:#4f46e5; color:#fff; font-size:0.55rem; padding:0.2rem 0.4rem; border-radius:6px; }
        .empty-conv { font-size:0.7rem; text-align:center; padding:1rem; color:#6b7280; }
        .load-more { padding:0.5rem; }
        .load-more button { width:100%; background:#ffffff; border:1px solid #d1d5db; padding:0.5rem; border-radius:10px; font-size:0.7rem; cursor:pointer; }

        .chat-panel { background:#ffffff; border:1px solid #e5e7eb; border-radius:16px; display:flex; flex-direction:column; position:relative; }
        .chat-header { position:sticky; top:0; display:flex; justify-content:space-between; align-items:center; padding:0.75rem 1rem; background:#ffffff; border-bottom:1px solid #e5e7eb; z-index:10; }
        .chat-header-left { display:flex; gap:0.75rem; align-items:center; }
        .chat-header-left img { width:44px; height:44px; border-radius:12px; object-fit:cover; }
        .chat-header-meta h2 { font-size:0.95rem; margin:0; font-weight:600; }
        .chat-header-meta .sub { display:flex; gap:0.5rem; align-items:center; flex-wrap:wrap; }
        .job-ref { font-size:0.6rem; background:#eef2ff; color:#4f46e5; padding:0.25rem 0.4rem; border-radius:6px; }
        .online-indicator { font-size:0.55rem; background:#10b981; color:#fff; padding:0.2rem 0.4rem; border-radius:6px; }
        .app-link { font-size:0.6rem; color:#4f46e5; text-decoration:none; }

        .chat-thread { flex:1; overflow-y:auto; padding:1rem; display:flex; flex-direction:column; gap:0.75rem; }
        .msg-row { display:flex; }
        .msg-row.company { justify-content:flex-start; }
        .msg-row.candidate { justify-content:flex-end; }
        .msg-row.support { justify-content:center; }
        .msg-row.system { justify-content:center; }
        .bubble { max-width:65%; padding:0.6rem 0.75rem; border-radius:14px; font-size:0.7rem; line-height:1.35; background:#eef2ff; color:#1f2937; position:relative; }
        .msg-row.candidate .bubble { background:#4f46e5; color:#ffffff; }
        .msg-row.system .bubble, .msg-row.support .bubble { background:#f3f4f6; color:#374151; font-style:italic; }
        .bubble .meta-line { display:flex; gap:0.5rem; margin-top:0.3rem; font-size:0.55rem; opacity:0.7; }
        .system-text { font-size:0.6rem; }

        .composer { position:sticky; bottom:0; background:#ffffff; border-top:1px solid #e5e7eb; padding:0.5rem; }
        .composer-inner { display:flex; gap:0.5rem; align-items:center; }
        .message-input { flex:1; padding:0.55rem 0.7rem; border:1px solid #d1d5db; border-radius:12px; font-size:0.7rem; background:#f9fafb; }
        .attach-btn, .emoji-btn, .send-btn { background:#4f46e5; color:#fff; border:none; padding:0.5rem 0.7rem; font-size:0.65rem; border-radius:10px; cursor:pointer; }
        .attach-btn, .emoji-btn { background:#eef2ff; color:#4f46e5; }

        .empty-chat { display:flex; align-items:center; justify-content:center; flex:1; font-size:0.8rem; color:#6b7280; }

        .context-panel { background:#ffffff; border:1px solid #e5e7eb; border-radius:16px; padding:0.9rem 0.9rem 1.25rem; display:flex; flex-direction:column; gap:1rem; overflow-y:auto; box-shadow:0 2px 8px rgba(0,0,0,0.04); }
        .context-section { padding-bottom:0.75rem; border-bottom:1px solid #f3f4f6; }
        .context-section:last-child { border-bottom:none; }
        .context-section h3 { font-size:0.7rem; font-weight:700; margin:0 0 0.65rem; text-transform:uppercase; letter-spacing:0.8px; color:#6366f1; }
        
        .conversation-summary .contact-card { display:flex; gap:0.75rem; align-items:center; margin-bottom:0.75rem; }
        .contact-avatar { width:56px; height:56px; border-radius:14px; object-fit:cover; border:2px solid #eef2ff; }
        .contact-info { flex:1; }
        .contact-name { font-size:0.9rem; font-weight:600; margin:0 0 0.2rem; color:#1f2937; }
        .contact-role { font-size:0.65rem; color:#6b7280; margin:0 0 0.3rem; }
        .status-indicator { font-size:0.6rem; font-weight:500; }
        .status-indicator.online { color:#10b981; }
        .status-indicator.offline { color:#9ca3af; }

        .company-info { display:flex; gap:0.6rem; align-items:center; background:#f9fafb; padding:0.65rem; border-radius:12px; margin-bottom:0.65rem; }
        .company-logo { width:36px; height:36px; background:linear-gradient(135deg, #6366f1, #8b5cf6); border-radius:10px; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:700; font-size:0.9rem; }
        .company-meta strong { display:block; font-size:0.75rem; color:#1f2937; margin-bottom:0.1rem; }
        .company-sector { font-size:0.6rem; color:#6b7280; margin:0; }

        .application-details .app-detail-row { display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem; }
        .app-detail-row .label { font-size:0.65rem; color:#6b7280; font-weight:500; }
        .app-detail-row .value { font-size:0.65rem; color:#1f2937; font-weight:600; }
        .status-badge { font-size:0.6rem; padding:0.25rem 0.6rem; border-radius:8px; font-weight:600; }
        .status-badge.shortlisted { background:#dbeafe; color:#1e40af; }
        .status-badge.interview { background:#fef3c7; color:#92400e; }
        .status-badge.rejected { background:#fee2e2; color:#991b1b; }

        .panel-link-primary { display:inline-block; font-size:0.65rem; color:#6366f1; text-decoration:none; font-weight:600; margin-top:0.5rem; transition:color 0.15s; }
        .panel-link-primary:hover { color:#4f46e5; }

        .conversation-actions .actions-list { display:flex; flex-direction:column; gap:0.4rem; }
        .action-item { display:flex; align-items:center; gap:0.5rem; background:#f9fafb; border:1px solid #e5e7eb; padding:0.55rem 0.65rem; border-radius:10px; font-size:0.65rem; color:#374151; cursor:pointer; transition:all 0.15s; text-align:left; width:100%; }
        .action-item:hover { background:#eef2ff; border-color:#c7d2fe; color:#4f46e5; }
        .action-item svg { flex-shrink:0; }
        .action-item.danger { color:#dc2626; }
        .action-item.danger:hover { background:#fee2e2; border-color:#fca5a5; }
        .action-item.disabled, .action-item:disabled { opacity:0.5; cursor:not-allowed; background:#f3f4f6; }
        .action-item.disabled:hover, .action-item:disabled:hover { background:#f3f4f6; border-color:#e5e7eb; color:#374151; }

        .shared-files .empty-files { font-size:0.65rem; color:#9ca3af; margin:0; font-style:italic; }
        .empty-context { display:flex; align-items:center; justify-content:center; height:100%; font-size:0.7rem; color:#9ca3af; text-align:center; }

        /* Scrollbar styling */
        .conversation-list::-webkit-scrollbar, .chat-thread::-webkit-scrollbar, .context-panel::-webkit-scrollbar { width:6px; }
        .conversation-list::-webkit-scrollbar-track, .chat-thread::-webkit-scrollbar-track, .context-panel::-webkit-scrollbar-track { background:transparent; }
        .conversation-list::-webkit-scrollbar-thumb, .chat-thread::-webkit-scrollbar-thumb, .context-panel::-webkit-scrollbar-thumb { background:#d1d5db; border-radius:10px; }

        /* Toast Notification */
        .toast-notification { position:fixed; bottom:2rem; left:50%; transform:translateX(-50%); background:#1f2937; color:#fff; padding:0.75rem 1.5rem; border-radius:12px; font-size:0.75rem; box-shadow:0 4px 12px rgba(0,0,0,0.15); animation:slideUp 0.3s ease; z-index:100; }
        @keyframes slideUp { from { opacity:0; transform:translate(-50%, 20px); } to { opacity:1; transform:translate(-50%, 0); } }
      `}</style>
    </div>
  );
}

// Report Modal Component
function ReportModal({ conversationName, onSubmit, onCancel }) {
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const reasons = [
    'Spam or irrelevant messages',
    'Inappropriate content',
    'Harassment or discrimination',
    'Suspicious job or recruiter',
    'Other'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason) {
      setError('Please select a reason');
      return;
    }
    if (comment.length > 500) {
      setError('Comment must be 500 characters or less');
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      onSubmit(reason, comment);
      setSubmitting(false);
    }, 800);
  };

  return (
    <>
      <div className="modal-overlay" onClick={onCancel} />
      <div className="modal-container">
        <div className="modal-header">
          <h2>Report Conversation</h2>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>
        <div className="modal-body">
          <p className="modal-subtitle">Report inappropriate behavior from <strong>{conversationName}</strong></p>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Reason for Report *</label>
              <select value={reason} onChange={(e) => { setReason(e.target.value); setError(''); }} required disabled={submitting}>
                <option value="">Select a reason...</option>
                {reasons.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Additional Comments ({comment.length}/500)</label>
              <textarea 
                value={comment} 
                onChange={(e) => { setComment(e.target.value); setError(''); }} 
                placeholder="Provide any additional details..."
                maxLength={500}
                rows={4}
                disabled={submitting}
              />
            </div>
            {error && <div className="error-message">{error}</div>}
            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={onCancel} disabled={submitting}>Cancel</button>
              <button type="submit" className="btn-submit" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <style jsx>{`
        .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:200; animation:fadeIn 0.2s; }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        .modal-container { position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); background:#fff; border-radius:16px; width:90%; max-width:480px; box-shadow:0 20px 40px rgba(0,0,0,0.2); z-index:201; animation:scaleIn 0.2s; }
        @keyframes scaleIn { from { opacity:0; transform:translate(-50%, -50%) scale(0.9); } to { opacity:1; transform:translate(-50%, -50%) scale(1); } }
        .modal-header { display:flex; justify-content:space-between; align-items:center; padding:1.25rem 1.5rem; border-bottom:1px solid #e5e7eb; }
        .modal-header h2 { font-size:1.1rem; font-weight:600; margin:0; color:#1f2937; }
        .modal-close { background:transparent; border:none; font-size:1.8rem; color:#9ca3af; cursor:pointer; line-height:1; padding:0; width:32px; height:32px; }
        .modal-close:hover { color:#1f2937; }
        .modal-body { padding:1.5rem; }
        .modal-subtitle { font-size:0.8rem; color:#6b7280; margin:0 0 1.25rem; }
        .form-group { margin-bottom:1rem; }
        .form-group label { display:block; font-size:0.75rem; font-weight:600; color:#374151; margin-bottom:0.4rem; }
        .form-group select, .form-group textarea { width:100%; padding:0.65rem 0.75rem; border:1px solid #d1d5db; border-radius:10px; font-size:0.75rem; font-family:inherit; background:#f9fafb; }
        .form-group select:focus, .form-group textarea:focus { outline:none; border-color:#6366f1; background:#fff; }
        .form-group select:disabled, .form-group textarea:disabled { opacity:0.6; cursor:not-allowed; }
        .error-message { background:#fee2e2; color:#dc2626; padding:0.6rem 0.75rem; border-radius:8px; font-size:0.7rem; margin-bottom:1rem; }
        .modal-actions { display:flex; gap:0.75rem; justify-content:flex-end; }
        .btn-cancel, .btn-submit { padding:0.65rem 1.25rem; border-radius:10px; font-size:0.75rem; font-weight:600; cursor:pointer; transition:all 0.15s; border:none; }
        .btn-cancel { background:#f3f4f6; color:#374151; }
        .btn-cancel:hover { background:#e5e7eb; }
        .btn-submit { background:#4f46e5; color:#fff; }
        .btn-submit:hover { background:#4338ca; }
        .btn-cancel:disabled, .btn-submit:disabled { opacity:0.5; cursor:not-allowed; }
      `}</style>
    </>
  );
}
