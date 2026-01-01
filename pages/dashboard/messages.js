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
  
  // Fetch conversations for this candidate (including archived for the archived tab)
  const conversations = profile ? await prisma.conversation.findMany({
    where: { 
      candidateId: profile.id
    },
    include: {
      employer: true,
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1
      },
      _count: {
        select: {
          messages: {
            where: {
              receiverUserId: session.user.id,
              readAt: null
            }
          }
        }
      }
    },
    orderBy: { updatedAt: 'desc' }
  }) : [];
  
  // Add unread count to each conversation
  const conversationsWithUnread = conversations.map(conv => ({
    ...conv,
    unread: conv._count.messages
  }));
  
  return { 
    props: { 
      profile: profile ? JSON.parse(JSON.stringify(profile)) : null, 
      userEmail: session.user.email,
      initialConversations: JSON.parse(JSON.stringify(conversationsWithUnread))
    } 
  };
}

export default function CandidateMessages({ profile, userEmail, initialConversations }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [moreOptionsOpen, setMoreOptionsOpen] = useState(false);

  // Conversations data from database
  const [conversations, setConversations] = useState(initialConversations || []);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const messagesEndRef = useRef(null);
  const moreOptionsRef = useRef(null);

  const filters = [
    { id: 'all', label: 'All Messages' },
    { id: 'unread', label: 'Unread' },
    { id: 'companies', label: 'Companies' },
    { id: 'archived', label: 'Archived' }
  ];

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close more options dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (moreOptionsRef.current && !moreOptionsRef.current.contains(event.target)) {
        setMoreOptionsOpen(false);
      }
    }
    if (moreOptionsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [moreOptionsOpen]);

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

  // Fetch messages for selected conversation with polling
  useEffect(() => {
    if (!activeConversationId) return;
    
    const loadMessages = () => {
      fetch(`/api/conversations/${activeConversationId}/messages`)
        .then(res => res.json())
        .then(data => setMessages(data.items || []))
        .catch(err => console.error('Failed to load messages:', err));
    };

    loadMessages();
    
    // Poll for new messages every 3 seconds
    const interval = setInterval(loadMessages, 3000);
    
    return () => clearInterval(interval);
  }, [activeConversationId]);

  // Refresh conversations list every 10 seconds
  useEffect(() => {
    if (!profile) return;

    const refreshConversations = async () => {
      try {
        const res = await fetch(`/api/conversations?candidateId=${profile.id}`);
        const data = await res.json();
        setConversations(data.items || []);
      } catch (err) {
        console.error('Failed to refresh conversations:', err);
      }
    };

    const interval = setInterval(refreshConversations, 10000);
    return () => clearInterval(interval);
  }, [profile]);

  const activeConversation = conversations.find(c => c.id === activeConversationId) || null;

  const filteredConversations = conversations.filter(c => {
    if (activeFilter === 'archived') {
      return c.archivedByCandidate === true;
    }
    // For all other filters, exclude archived
    if (c.archivedByCandidate) return false;
    
    if (activeFilter === 'unread' && (!c.unread || c.unread === 0)) return false;
    if (activeFilter === 'companies' && !c.employerId) return false;
    return true;
  });

  const sendMessage = async () => {
    if (!draft.trim() || !activeConversationId || !profile || !activeConversation) return;

    try {
      const res = await fetch(`/api/conversations/${activeConversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderUserId: profile.userId,
          receiverUserId: activeConversation.employer.userId,
          text: draft
        })
      });

      if (!res.ok) {
        const error = await res.json();
        console.error('Failed to send message:', error);
        alert('Failed to send message');
        return;
      }

      const newMessage = await res.json();
      setMessages([...messages, newMessage]);
      setDraft('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message');
    }
  };

  const handleViewCompany = () => {
    const employer = activeConversation?.employer;
    if (!employer) return;
    
    // If employer has a website, open it
    if (employer.website) {
      const website = employer.website.startsWith('http') 
        ? employer.website 
        : `https://${employer.website}`;
      window.open(website, '_blank');
    } else {
      // Show company info in an alert if no website
      alert(`${employer.companyName || 'Company'}\n${employer.contactName ? `Contact: ${employer.contactName}` : ''}${employer.phone ? `\nPhone: ${employer.phone}` : ''}\n\nNo website available.`);
    }
  };

  const handleArchiveConversation = async () => {
    if (!activeConversationId || !activeConversation) return;
    
    const isArchived = activeConversation.archivedByCandidate;
    const action = isArchived ? 'unarchive' : 'archive';
    const confirmMessage = isArchived 
      ? 'Unarchive this conversation? It will return to your messages list.'
      : 'Archive this conversation? You can unarchive it later from your archived conversations.';
    
    if (confirm(confirmMessage)) {
      try {
        const res = await fetch(`/api/conversations/${activeConversationId}/archive`, {
          method: isArchived ? 'DELETE' : 'POST'
        });

        if (!res.ok) {
          throw new Error(`Failed to ${action}`);
        }

        // Update the conversation in the list
        setConversations(conversations.map(c => 
          c.id === activeConversationId 
            ? { ...c, archivedByCandidate: !isArchived }
            : c
        ));
        
        // If we archived it and we're not in archived view, clear selection
        if (!isArchived && activeFilter !== 'archived') {
          setActiveConversationId(null);
          setMessages([]);
        }
        
        setMoreOptionsOpen(false);
        alert(`Conversation ${isArchived ? 'unarchived' : 'archived'} successfully`);
      } catch (error) {
        console.error(`Error ${action}ing conversation:`, error);
        alert(`Failed to ${action} conversation`);
      }
    }
  };

  const handleBlockConversation = () => {
    if (confirm('Block this company? You will no longer receive messages from them.')) {
      // TODO: Implement block API
      alert('Block functionality coming soon');
      setMoreOptionsOpen(false);
    }
  };

  const handleReportConversation = () => {
    if (confirm('Report this conversation for inappropriate content?')) {
      // TODO: Implement report API
      alert('Report functionality coming soon');
      setMoreOptionsOpen(false);
    }
  };

  const unreadCount = conversations.filter(c => c.unread).length;

  return (
    <>
      <Head>
        <title>Messages – Candidate Dashboard</title>
      </Head>
      
      <div className="messages-container">
        <div className="messages-header">
          <div>
            <h1>Messages</h1>
            {unreadCount > 0 && <span className="unread-count">{unreadCount} unread</span>}
          </div>
        </div>

        <div className="messages-layout">
          {/* Sidebar with conversation list */}
          <aside className="conversations-sidebar">
            <div className="filter-tabs">
              {filters.map(filter => (
                <button
                  key={filter.id}
                  className={`filter-btn ${activeFilter === filter.id ? 'active' : ''}`}
                  onClick={() => setActiveFilter(filter.id)}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="conversations-list">
              {filteredConversations.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📭</div>
                  <p>No messages in this category</p>
                </div>
              ) : (
                filteredConversations.map(conv => {
                  const lastMessage = conv.messages?.[0];
                  const messagePreview = lastMessage?.text || 'No messages yet';
                  const timestamp = lastMessage ? new Date(lastMessage.createdAt).toLocaleDateString() : '';
                  
                  return (
                    <div
                      key={conv.id}
                      className={`conversation-item ${activeConversationId === conv.id ? 'active' : ''}`}
                      onClick={() => setActiveConversationId(conv.id)}
                    >
                      <div className="conv-avatar">
                        <img src={conv.employer?.companyLogoUrl || '/images/avatar-placeholder.svg'} alt={conv.employer?.companyName} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                      </div>
                      <div className="conv-content">
                        <div className="conv-header">
                          <span className="conv-name">{conv.employer?.companyName || 'Company'}</span>
                          <span className="conv-time">{timestamp}</span>
                        </div>
                        {conv.jobId && <p className="conv-job">Re: Job Application</p>}
                        <p className="conv-preview">{messagePreview.substring(0, 60)}{messagePreview.length > 60 ? '...' : ''}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </aside>

          {/* Main chat area */}
          <main className="chat-main">
            {!activeConversation ? (
              <div className="no-conversation">
                <div className="no-conv-icon">💬</div>
                <h3>Select a conversation</h3>
                <p>Choose a company from the left to view messages</p>
              </div>
            ) : (
              <>
                <div className="chat-header">
                  <div className="chat-header-info">
                    <div className="chat-avatar">
                      <img src={activeConversation.employer?.companyLogoUrl || '/images/avatar-placeholder.svg'} alt={activeConversation.employer?.companyName} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
                    </div>
                    <div>
                      <h3>{activeConversation.employer?.companyName || 'Company'}</h3>
                      {activeConversation.jobId && (
                        <p className="chat-job-ref">Re: Job Application</p>
                      )}
                    </div>
                  </div>
                  <div className="chat-actions">
                    <button className="action-btn" title="View Company" onClick={handleViewCompany}>
                      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </button>
                    <div className="more-options-container" ref={moreOptionsRef}>
                      <button 
                        className="action-btn" 
                        title="More Options"
                        onClick={() => setMoreOptionsOpen(!moreOptionsOpen)}
                      >
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                      {moreOptionsOpen && (
                        <div className="more-options-dropdown">
                          <button className="dropdown-option" onClick={handleArchiveConversation}>
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              {activeConversation.archivedByCandidate ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                              ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                              )}
                            </svg>
                            {activeConversation.archivedByCandidate ? 'Unarchive Conversation' : 'Archive Conversation'}
                          </button>
                          <button className="dropdown-option" onClick={handleBlockConversation}>
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                            Block Company
                          </button>
                          <button className="dropdown-option danger" onClick={handleReportConversation}>
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Report Conversation
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="messages-thread">
                  {messages.map(msg => {
                    const isCandidate = msg.senderUserId === profile?.userId;
                    return (
                      <div key={msg.id} className={`message-bubble ${isCandidate ? 'outbound' : 'inbound'}`}>
                        <div className="message-content">
                          <div className="message-sender">{isCandidate ? 'You' : activeConversation.employer?.companyName}</div>
                          <p className="message-text">{msg.text}</p>
                          <span className="message-timestamp">{new Date(msg.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <form className="message-composer" onSubmit={(e) => { e.preventDefault(); sendMessage(); }}>
                  <input
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Type your message..."
                    className="composer-input"
                  />
                  <button type="submit" className="send-btn" disabled={!draft.trim()}>
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </form>
              </>
            )}
          </main>
        </div>
      </div>

      <style jsx>{`
        .messages-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0;
          height: calc(100vh - 120px);
          display: flex;
          flex-direction: column;
        }

        .messages-header {
          padding: 1.5rem 2rem;
          background: white;
          border-bottom: 2px solid #f1f5f9;
        }

        .messages-header > div {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .messages-header h1 {
          margin: 0;
          font-size: 1.75rem;
          font-weight: 700;
          color: #111827;
        }

        .unread-count {
          background: #ef4444;
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .messages-layout {
          display: grid;
          grid-template-columns: 380px 1fr;
          flex: 1;
          overflow: hidden;
          background: #fafbfc;
        }

        .conversations-sidebar {
          background: white;
          border-right: 2px solid #f1f5f9;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .filter-tabs {
          display: flex;
          gap: 0.5rem;
          padding: 1rem;
          background: #fafbfc;
          border-bottom: 2px solid #f1f5f9;
          overflow-x: auto;
        }

        .filter-btn {
          padding: 0.5rem 1rem;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .filter-btn:hover {
          border-color: #cbd5e1;
          background: #f8fafc;
        }

        .filter-btn.active {
          background: #4f46e5;
          color: white;
          border-color: #4f46e5;
        }

        .conversations-list {
          flex: 1;
          overflow-y: auto;
        }

        .conversation-item {
          position: relative;
          display: flex;
          gap: 0.75rem;
          padding: 1rem;
          border-bottom: 1px solid #f1f5f9;
          cursor: pointer;
          transition: all 0.2s;
        }

        .conversation-item:hover {
          background: #f8fafc;
        }

        .conversation-item.active {
          background: #eef2ff;
          border-left: 3px solid #4f46e5;
        }

        .conversation-item.unread {
          background: #fefefe;
          font-weight: 600;
        }

        .unread-dot {
          position: absolute;
          top: 1.25rem;
          left: 0.5rem;
          width: 8px;
          height: 8px;
          background: #ef4444;
          border-radius: 50%;
        }

        .conv-avatar {
          font-size: 2.5rem;
          flex-shrink: 0;
        }

        .conv-content {
          flex: 1;
          min-width: 0;
        }

        .conv-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.25rem;
        }

        .conv-name {
          font-size: 0.9375rem;
          font-weight: 600;
          color: #111827;
        }

        .conv-time {
          font-size: 0.75rem;
          color: #9ca3af;
        }

        .conv-role {
          font-size: 0.8125rem;
          color: #6b7280;
          margin: 0 0 0.25rem;
        }

        .conv-job {
          font-size: 0.75rem;
          color: #4f46e5;
          margin: 0 0 0.25rem;
          font-weight: 500;
        }

        .conv-preview {
          font-size: 0.8125rem;
          color: #9ca3af;
          margin: 0.25rem 0 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 1.5rem;
          text-align: center;
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .empty-state p {
          color: #6b7280;
          font-size: 0.875rem;
          margin: 0;
        }

        .chat-main {
          display: flex;
          flex-direction: column;
          background: white;
          overflow: hidden;
        }

        .no-conversation {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          text-align: center;
          color: #6b7280;
        }

        .no-conv-icon {
          font-size: 5rem;
          margin-bottom: 1.5rem;
          opacity: 0.5;
        }

        .no-conversation h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 0.5rem;
        }

        .no-conversation p {
          font-size: 0.875rem;
          margin: 0;
        }

        .chat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 1.5rem;
          border-bottom: 2px solid #f1f5f9;
          background: #fafbfc;
        }

        .chat-header-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .chat-avatar {
          font-size: 3rem;
        }

        .chat-header h3 {
          margin: 0;
          font-size: 1.125rem;
          font-weight: 700;
          color: #111827;
        }

        .chat-role {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0.25rem 0 0;
        }

        .chat-job-ref {
          font-size: 0.8125rem;
          color: #4f46e5;
          margin: 0.25rem 0 0;
          font-weight: 500;
        }

        .chat-actions {
          display: flex;
          gap: 0.5rem;
        }

        .more-options-container {
          position: relative;
        }

        .action-btn {
          padding: 0.5rem;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .action-btn:hover {
          background: #f8fafc;
          color: #4f46e5;
          border-color: #4f46e5;
        }

        .more-options-dropdown {
          position: absolute;
          top: calc(100% + 0.5rem);
          right: 0;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          min-width: 220px;
          z-index: 50;
          overflow: hidden;
        }

        .dropdown-option {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          padding: 0.75rem 1rem;
          background: white;
          border: none;
          text-align: left;
          font-size: 0.875rem;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s;
          border-bottom: 1px solid #f3f4f6;
        }

        .dropdown-option:last-child {
          border-bottom: none;
        }

        .dropdown-option:hover {
          background: #f8fafc;
          color: #4f46e5;
        }

        .dropdown-option.danger {
          color: #dc2626;
        }

        .dropdown-option.danger:hover {
          background: #fef2f2;
          color: #dc2626;
        }

        .dropdown-option svg {
          flex-shrink: 0;
        }

        .messages-thread {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
          background: #fafbfc;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .message-bubble {
          display: flex;
          max-width: 70%;
        }

        .message-bubble.inbound {
          align-self: flex-start;
        }

        .message-bubble.outbound {
          align-self: flex-end;
        }

        .message-content {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .message-sender {
          font-size: 0.75rem;
          font-weight: 600;
          color: #6b7280;
          margin-bottom: 0.25rem;
        }

        .message-text {
          padding: 0.75rem 1rem;
          border-radius: 12px;
          font-size: 0.9375rem;
          line-height: 1.5;
          margin: 0;
        }

        .message-bubble.inbound .message-text {
          background: white;
          color: #111827;
          border: 2px solid #e5e7eb;
        }

        .message-bubble.outbound .message-text {
          background: #4f46e5;
          color: white;
        }

        .message-timestamp {
          font-size: 0.6875rem;
          color: #9ca3af;
          margin-top: 0.25rem;
        }

        .message-composer {
          display: flex;
          gap: 0.75rem;
          padding: 1.25rem 1.5rem;
          background: white;
          border-top: 2px solid #f1f5f9;
        }

        .composer-input {
          flex: 1;
          padding: 0.75rem 1rem;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 0.9375rem;
          transition: all 0.2s;
        }

        .composer-input:focus {
          outline: none;
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        .send-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: #4f46e5;
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 0.9375rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .send-btn:hover:not(:disabled) {
          background: #4338ca;
        }

        .send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 1024px) {
          .messages-layout {
            grid-template-columns: 320px 1fr;
          }
        }

        @media (max-width: 768px) {
          .messages-layout {
            grid-template-columns: 1fr;
          }

          .conversations-sidebar {
            display: ${!activeConversation ? 'flex' : 'none'};
          }

          .chat-main {
            display: ${activeConversation ? 'flex' : 'none'};
          }

          .message-bubble {
            max-width: 85%;
          }
        }
      `}</style>
    </>
  );
}
