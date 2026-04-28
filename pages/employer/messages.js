import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]';
import { prisma } from '../../lib/prisma';

export async function getServerSideProps(ctx) {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session) {
    return { redirect: { destination: '/auth/login', permanent: false } };
  }
  if ((session.user.role || '').toLowerCase() !== 'employer') {
    return { redirect: { destination: '/dashboard', permanent: false } };
  }

  // Get employer profile
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { employerEmployerProfile: true }
  });

  const employerProfile = user?.employerEmployerProfile;

  if (!employerProfile) {
    return { props: { conversations: [], employerProfile: null } };
  }

  // Fetch conversations for this employer
  const conversations = await prisma.conversation.findMany({
    where: { employerId: employerProfile.id },
    include: {
      candidate: {
        include: {
          user: { select: { email: true } }
        }
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    },
    orderBy: { updatedAt: 'desc' }
  });

  return {
    props: {
      conversations: JSON.parse(JSON.stringify(conversations)),
      employerProfile: JSON.parse(JSON.stringify(employerProfile))
    }
  };
}

export default function EmployerMessages({ conversations: initialConversations, employerProfile }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [conversations, setConversations] = useState(initialConversations);
  const [messages, setMessages] = useState([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const messagesEndRef = useRef(null);
  const menuDropdownRef = useRef(null);

  // Close menu dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuDropdownRef.current && !menuDropdownRef.current.contains(e.target)) {
        setShowMenuDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch messages for selected conversation
  useEffect(() => {
    if (!selectedConversation) return;
    
    const loadMessages = () => {
      fetch(`/api/conversations/${selectedConversation.id}/messages`)
        .then(res => res.json())
        .then(data => setMessages(data.items || []))
        .catch(err => console.error('Failed to load messages:', err));
    };

    loadMessages();
    
    // Poll for new messages every 3 seconds
    const interval = setInterval(loadMessages, 3000);
    
    return () => clearInterval(interval);
  }, [selectedConversation]);

  // Refresh conversations list every 10 seconds
  useEffect(() => {
    if (!employerProfile) return;

    const refreshConversations = async () => {
      try {
        const res = await fetch(`/api/conversations?employerId=${employerProfile.id}`);
        const data = await res.json();
        setConversations(data.items || []);
      } catch (err) {
        console.error('Failed to refresh conversations:', err);
      }
    };

    const interval = setInterval(refreshConversations, 10000);
    return () => clearInterval(interval);
  }, [employerProfile]);

  const filters = [
    { id: 'all', label: 'All Messages' },
    { id: 'applicants', label: 'Applicants' },
    { id: 'candidates', label: 'Candidates' },
    { id: 'unread', label: 'Unread' }
  ];

  const filteredConversations = conversations.filter(conv => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'applicants') return conv.jobId; // Has a job = applicant
    if (activeFilter === 'candidates') return !conv.jobId; // No job = general candidate
    if (activeFilter === 'unread') return conv.unread;
    return true;
  });

  // Calculate unread count
  const unreadCount = conversations
    .filter(c => !c.archivedByEmployer)
    .reduce((sum, c) => sum + (c.unread || 0), 0);

  // Publish unread count to employer header (localStorage + custom event)
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('employerUnreadMessagesCount', String(unreadCount));
        window.dispatchEvent(new CustomEvent('employerUnreadMessages', { detail: unreadCount }));
      }
    } catch {}
  }, [unreadCount]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConversation || !employerProfile) return;

    try {
      const res = await fetch(`/api/conversations/${selectedConversation.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderUserId: employerProfile.userId,
          receiverUserId: selectedConversation.candidate.userId,
          text: messageText
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
      setMessageText('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message');
    }
  };

  const handleArchiveConversation = async () => {
    if (!selectedConversation) return;
    try {
      const res = await fetch(`/api/conversations/${selectedConversation.id}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employerId: employerProfile.id })
      });

      if (!res.ok) throw new Error('Failed to archive');

      // Remove from conversations list
      setConversations(conversations.filter(c => c.id !== selectedConversation.id));
      setSelectedConversation(null);
      setShowMenuDropdown(false);
    } catch (error) {
      console.error('Error archiving conversation:', error);
      alert('Failed to archive conversation');
    }
  };

  const handleReportCandidate = async () => {
    if (!selectedConversation) return;
    const reason = prompt('Please provide a reason for reporting this candidate:');
    if (!reason) return;

    try {
      const res = await fetch('/api/reports/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportedByEmployerId: employerProfile.id,
          reportedCandidateId: selectedConversation.candidateId,
          reason: reason,
          type: 'CANDIDATE_BEHAVIOR'
        })
      });

      if (!res.ok) throw new Error('Failed to report');

      alert('Report submitted successfully');
      setShowMenuDropdown(false);
    } catch (error) {
      console.error('Error reporting candidate:', error);
      alert('Failed to submit report');
    }
  };

  return (
    <>
      <Head>
        <title>Messages – Employer Dashboard</title>
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
                      className={`conversation-item ${selectedConversation?.id === conv.id ? 'active' : ''}`}
                      onClick={() => setSelectedConversation(conv)}
                    >
                      <div className="conv-avatar">
                        <img src={conv.candidate?.profilePhotoUrl || '/images/avatar-placeholder.svg'} alt={conv.candidate?.fullName} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                      </div>
                      <div className="conv-content">
                        <div className="conv-header">
                          <span className="conv-name">{conv.candidate?.fullName || 'Candidate'}</span>
                          <span className="conv-time">{timestamp}</span>
                        </div>
                        <p className="conv-role">{conv.candidate?.jobTitle || ''}</p>
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
            {!selectedConversation ? (
              <div className="no-conversation">
                <div className="no-conv-icon">💬</div>
                <h3>Select a conversation</h3>
                <p>Choose a candidate from the left to view messages</p>
              </div>
            ) : (
              <>
                <div className="chat-header">
                  <div className="chat-header-info">
                    <div className="chat-avatar">
                      <img src={selectedConversation.candidate?.profilePhotoUrl || '/images/avatar-placeholder.svg'} alt={selectedConversation.candidate?.fullName} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
                    </div>
                    <div>
                      <h3>{selectedConversation.candidate?.fullName || 'Candidate'}</h3>
                      <p className="chat-role">{selectedConversation.candidate?.jobTitle || ''}</p>
                      {selectedConversation.jobId && (
                        <p className="chat-job-ref">Re: Job Application</p>
                      )}
                    </div>
                  </div>
                  <div className="chat-actions">
                    <button 
                      className="action-btn" 
                      title="View Profile"
                      onClick={() => setShowProfileModal(true)}
                    >
                      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </button>
                    <div className="menu-wrapper" ref={menuDropdownRef}>
                      <button 
                        className="action-btn" 
                        title="More Options"
                        onClick={() => setShowMenuDropdown(!showMenuDropdown)}
                      >
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                      {showMenuDropdown && (
                        <div className="action-menu">
                          <button 
                            className="menu-item"
                            onClick={() => setShowInviteModal(true)}
                          >
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m0 0h6" />
                            </svg>
                            Invite to Interview
                          </button>
                          <button 
                            className="menu-item"
                            onClick={handleArchiveConversation}
                          >
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" />
                            </svg>
                            Archive Conversation
                          </button>
                          <button 
                            className="menu-item menu-item-danger"
                            onClick={handleReportCandidate}
                          >
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 0v2m0-6h2m0 0h2" />
                            </svg>
                            Report Candidate
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="messages-thread">
                  {messages.map(msg => {
                    const isEmployer = msg.senderUserId === employerProfile?.userId;
                    return (
                      <div key={msg.id} className={`message-bubble ${isEmployer ? 'outbound' : 'inbound'}`}>
                        <div className="message-content">
                          <div className="message-sender">{isEmployer ? 'You' : selectedConversation.candidate?.fullName}</div>
                          <p className="message-text">{msg.text}</p>
                          <span className="message-timestamp">{new Date(msg.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <form className="message-composer" onSubmit={handleSendMessage}>
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type your message..."
                    className="composer-input"
                  />
                  <button type="submit" className="send-btn" disabled={!messageText.trim()}>
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

      {/* Profile Modal */}
      {showProfileModal && selectedConversation && (
        <div className="profile-modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h2>Candidate Profile</h2>
              <button className="close-btn" onClick={() => setShowProfileModal(false)}>×</button>
            </div>
            <div className="profile-modal-content">
              <div className="profile-section">
                <img 
                  src={selectedConversation.candidate?.profilePhotoUrl || '/images/avatar-placeholder.svg'} 
                  alt={selectedConversation.candidate?.fullName}
                  className="profile-photo"
                />
                <h3>{selectedConversation.candidate?.fullName || 'Candidate'}</h3>
                <p className="profile-title">{selectedConversation.candidate?.jobTitle || 'No title specified'}</p>
              </div>

              <div className="profile-details">
                {selectedConversation.candidate?.summary && (
                  <div className="detail-block">
                    <h4>Summary</h4>
                    <p>{selectedConversation.candidate.summary}</p>
                  </div>
                )}

                {selectedConversation.candidate?.yearsExperience && (
                  <div className="detail-block">
                    <h4>Experience</h4>
                    <p>{selectedConversation.candidate.yearsExperience} years</p>
                  </div>
                )}

                {selectedConversation.candidate?.sector && (
                  <div className="detail-block">
                    <h4>Sector</h4>
                    <p>{selectedConversation.candidate.sector}</p>
                  </div>
                )}

                {selectedConversation.candidate?.location && (
                  <div className="detail-block">
                    <h4>Location</h4>
                    <p>{selectedConversation.candidate.location}</p>
                  </div>
                )}

                {selectedConversation.candidate?.remotePreference && (
                  <div className="detail-block">
                    <h4>Remote Preference</h4>
                    <p>{selectedConversation.candidate.remotePreference}</p>
                  </div>
                )}

                {selectedConversation.candidate?.dayRate && (
                  <div className="detail-block">
                    <h4>Day Rate</h4>
                    <p>£{selectedConversation.candidate.dayRate.toLocaleString()}</p>
                  </div>
                )}

                <div className="detail-block">
                  <h4>Contact</h4>
                  {selectedConversation.candidate?.email && <p>Email: {selectedConversation.candidate.email}</p>}
                  {selectedConversation.candidate?.phone && <p>Phone: {selectedConversation.candidate.phone}</p>}
                </div>

                <div className="profile-links">
                  {selectedConversation.candidate?.linkedinUrl && (
                    <a href={selectedConversation.candidate.linkedinUrl} target="_blank" rel="noopener noreferrer" className="link-btn">LinkedIn</a>
                  )}
                  {selectedConversation.candidate?.portfolioUrl && (
                    <a href={selectedConversation.candidate.portfolioUrl} target="_blank" rel="noopener noreferrer" className="link-btn">Portfolio</a>
                  )}
                  {selectedConversation.candidate?.cvUrl && (
                    <a href={selectedConversation.candidate.cvUrl} target="_blank" rel="noopener noreferrer" className="link-btn">CV</a>
                  )}
                  {selectedConversation.candidate?.githubUrl && (
                    <a href={selectedConversation.candidate.githubUrl} target="_blank" rel="noopener noreferrer" className="link-btn">GitHub</a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite to Interview Modal */}
      {showInviteModal && selectedConversation && (
        <div className="invite-modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="invite-modal" onClick={(e) => e.stopPropagation()}>
            <div className="invite-modal-header">
              <h2>Invite to Interview</h2>
              <button className="close-btn" onClick={() => setShowInviteModal(false)}>×</button>
            </div>

            <div className="invite-candidate-info">
              <p><strong>Candidate:</strong> {selectedConversation.candidate?.fullName}</p>
            </div>

            <form className="invite-form" onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              
              try {
                const res = await fetch('/api/interviews/schedule-direct', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    conversationId: selectedConversation.id,
                    candidateId: selectedConversation.candidateId,
                    employerId: employerProfile.id,
                    startTime: new Date(`${formData.get('date')}T${formData.get('time')}`).toISOString(),
                    duration: parseInt(formData.get('duration') || 60),
                    meetingUrl: formData.get('meetingUrl'),
                    message: formData.get('message')
                  })
                });

                if (!res.ok) {
                  const error = await res.json();
                  throw new Error(error.error || 'Failed to schedule interview');
                }

                alert('Interview scheduled successfully!');
                setShowInviteModal(false);
                setShowMenuDropdown(false);
              } catch (error) {
                console.error('Error scheduling interview:', error);
                alert(error.message);
              }
            }}>
              <div className="form-group">
                <label htmlFor="date">Interview Date *</label>
                <input type="date" id="date" name="date" required min={new Date().toISOString().split('T')[0]} />
              </div>

              <div className="form-group">
                <label htmlFor="time">Interview Time *</label>
                <input type="time" id="time" name="time" required />
              </div>

              <div className="form-group">
                <label htmlFor="duration">Duration (minutes)</label>
                <input type="number" id="duration" name="duration" defaultValue="60" min="15" step="15" />
              </div>

              <div className="form-group">
                <label htmlFor="meetingUrl">Meeting URL</label>
                <input type="url" id="meetingUrl" name="meetingUrl" placeholder="https://zoom.us/..." />
              </div>

              <div className="form-group">
                <label htmlFor="message">Message to Candidate</label>
                <textarea id="message" name="message" rows="4" placeholder="Invite message..." />
              </div>

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowInviteModal(false)}>Cancel</button>
                <button type="submit" className="btn-submit">Schedule Interview</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0.375rem;
          padding: 0.875rem;
          background: #fafbfc;
          border-bottom: 2px solid #f1f5f9;
          overflow: hidden;
        }

        .filter-btn {
          min-width: 0;
          padding: 0.5rem 0.45rem;
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 500;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          text-align: center;
          overflow: hidden;
          text-overflow: ellipsis;
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

        /* Menu Dropdown Styles */
        .menu-wrapper {
          position: relative;
        }

        .action-menu {
          position: absolute;
          top: 100%;
          right: 0;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          z-index: 1000;
          min-width: 180px;
          margin-top: 0.5rem;
        }

        .menu-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          padding: 0.75rem 1rem;
          background: none;
          border: none;
          border-bottom: 1px solid #f3f4f6;
          font-size: 0.875rem;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }

        .menu-item:last-child {
          border-bottom: none;
        }

        .menu-item:hover {
          background: #f9fafb;
          color: #4f46e5;
        }

        .menu-item-danger:hover {
          background: #fee2e2;
          color: #dc2626;
        }

        .menu-item svg {
          flex-shrink: 0;
        }

        /* Profile Modal Styles */
        .profile-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1001;
        }

        .profile-modal {
          background: white;
          border-radius: 12px;
          max-width: 500px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .profile-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 2px solid #f3f4f6;
        }

        .profile-modal-header h2 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 700;
          color: #111827;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #6b7280;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .close-btn:hover {
          color: #111827;
          background: #f3f4f6;
          border-radius: 6px;
        }

        .profile-modal-content {
          padding: 2rem 1.5rem;
        }

        .profile-section {
          text-align: center;
          margin-bottom: 2rem;
          padding-bottom: 2rem;
          border-bottom: 2px solid #f3f4f6;
        }

        .profile-photo {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          object-fit: cover;
          margin-bottom: 1rem;
          border: 3px solid #e5e7eb;
        }

        .profile-section h3 {
          margin: 0 0 0.5rem;
          font-size: 1.25rem;
          font-weight: 700;
          color: #111827;
        }

        .profile-title {
          margin: 0;
          color: #6b7280;
          font-size: 0.9375rem;
        }

        .profile-details {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .detail-block {
          border-left: 3px solid #4f46e5;
          padding-left: 1rem;
        }

        .detail-block h4 {
          margin: 0 0 0.5rem;
          font-size: 0.875rem;
          font-weight: 700;
          color: #4f46e5;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .detail-block p {
          margin: 0;
          font-size: 0.9375rem;
          color: #374151;
          line-height: 1.5;
        }

        .profile-links {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          padding-top: 1.5rem;
          border-top: 2px solid #f3f4f6;
        }

        .link-btn {
          padding: 0.5rem 1rem;
          background: #f3f4f6;
          color: #4f46e5;
          border: none;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-block;
        }

        .link-btn:hover {
          background: #4f46e5;
          color: white;
        }

        /* Invite Modal Styles */
        .invite-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1002;
        }

        .invite-modal {
          background: white;
          border-radius: 12px;
          max-width: 450px;
          width: 90%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .invite-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 2px solid #f3f4f6;
          flex-shrink: 0;
        }

        .invite-modal-header h2 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 700;
          color: #111827;
        }

        .invite-candidate-info {
          padding: 1rem 1.5rem;
          background: #f9fafb;
          border-bottom: 2px solid #f3f4f6;
          flex-shrink: 0;
        }

        .invite-candidate-info p {
          margin: 0;
          font-size: 0.9375rem;
          color: #374151;
        }

        .invite-form {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          flex: 1;
          overflow-y: auto;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
        }

        .form-group input,
        .form-group textarea {
          padding: 0.75rem;
          border: 2px solid #e5e7eb;
          border-radius: 6px;
          font-size: 0.9375rem;
          font-family: inherit;
          transition: all 0.2s;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          padding: 1.5rem;
          border-top: 2px solid #f3f4f6;
          background: white;
          flex-shrink: 0;
        }

        .btn-cancel,
        .btn-submit {
          flex: 1;
          padding: 0.75rem;
          border: none;
          border-radius: 6px;
          font-size: 0.9375rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-cancel {
          background: #f3f4f6;
          color: #374151;
        }

        .btn-cancel:hover {
          background: #e5e7eb;
        }

        .btn-submit {
          background: #4f46e5;
          color: white;
        }

        .btn-submit:hover {
          background: #4338ca;
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

          .filter-tabs {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .conversations-sidebar {
            display: ${!selectedConversation ? 'flex' : 'none'};
          }

          .chat-main {
            display: ${selectedConversation ? 'flex' : 'none'};
          }

          .message-bubble {
            max-width: 85%;
          }

          .profile-modal,
          .invite-modal {
            width: 95%;
            max-height: 90vh;
          }
        }
      `}</style>
    </>
  );
}
