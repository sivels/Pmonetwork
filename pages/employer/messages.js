import { useState } from 'react';
import Head from 'next/head';

export default function EmployerMessages() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageText, setMessageText] = useState('');

  const filters = [
    { id: 'all', label: 'All Messages' },
    { id: 'applicants', label: 'Applicants' },
    { id: 'candidates', label: 'Candidates' },
    { id: 'unread', label: 'Unread' }
  ];

  const mockConversations = [
    {
      id: 1,
      candidateName: 'Sarah Johnson',
      avatar: '👩‍💼',
      role: 'Senior PMO Lead',
      preview: 'Thank you for considering my application. I would be happy to discuss...',
      timestamp: '1 hour ago',
      unread: true,
      type: 'applicant',
      jobTitle: 'Senior PMO Manager',
      messages: [
        {
          id: 1,
          sender: 'Sarah Johnson',
          message: 'Thank you for considering my application. I would be happy to discuss the Senior PMO Manager position and how my 10 years of experience can benefit your team.',
          timestamp: '1 hour ago',
          isYou: false
        }
      ]
    },
    {
      id: 2,
      candidateName: 'Michael Chen',
      avatar: '👨‍💼',
      role: 'Project Manager',
      preview: 'I noticed the Project Analyst role and would love to learn more about...',
      timestamp: '3 hours ago',
      unread: true,
      type: 'candidate',
      messages: [
        {
          id: 1,
          sender: 'Michael Chen',
          message: 'I noticed the Project Analyst role and would love to learn more about the team structure and reporting lines.',
          timestamp: '3 hours ago',
          isYou: false
        }
      ]
    },
    {
      id: 3,
      candidateName: 'Emma Rodriguez',
      avatar: '👩‍💻',
      role: 'Scrum Master',
      preview: "I'm available for an interview next week. Would Tuesday or Wednesday work...",
      timestamp: '1 day ago',
      unread: false,
      type: 'applicant',
      jobTitle: 'Agile PMO Lead',
      messages: [
        {
          id: 1,
          sender: 'You',
          message: 'Hi Emma, thank you for your application. We would like to schedule an interview to discuss the Agile PMO Lead position. Are you available next week?',
          timestamp: '2 days ago',
          isYou: true
        },
        {
          id: 2,
          sender: 'Emma Rodriguez',
          message: "I'm available for an interview next week. Would Tuesday or Wednesday work for you? I'm flexible with timing.",
          timestamp: '1 day ago',
          isYou: false
        }
      ]
    },
    {
      id: 4,
      candidateName: 'James Taylor',
      avatar: '👨‍💼',
      role: 'Portfolio Manager',
      preview: 'Thank you for the feedback on my application. I have updated my CV...',
      timestamp: '2 days ago',
      unread: false,
      type: 'applicant',
      jobTitle: 'Portfolio PMO Director',
      messages: [
        {
          id: 1,
          sender: 'You',
          message: 'Hi James, your profile looks great but we need more details about your portfolio management experience. Could you provide specific examples?',
          timestamp: '3 days ago',
          isYou: true
        },
        {
          id: 2,
          sender: 'James Taylor',
          message: 'Thank you for the feedback on my application. I have updated my CV with detailed case studies of the three major portfolio transformations I led at previous companies.',
          timestamp: '2 days ago',
          isYou: false
        }
      ]
    }
  ];

  const filteredConversations = mockConversations.filter(conv => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'applicants') return conv.type === 'applicant';
    if (activeFilter === 'candidates') return conv.type === 'candidate';
    if (activeFilter === 'unread') return conv.unread;
    return true;
  });

  const unreadCount = mockConversations.filter(c => c.unread).length;

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    // Here you would send the message to your backend
    console.log('Sending message:', messageText);
    setMessageText('');
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
                filteredConversations.map(conv => (
                  <div
                    key={conv.id}
                    className={`conversation-item ${selectedConversation?.id === conv.id ? 'active' : ''} ${conv.unread ? 'unread' : ''}`}
                    onClick={() => setSelectedConversation(conv)}
                  >
                    {conv.unread && <span className="unread-dot" />}
                    <div className="conv-avatar">{conv.avatar}</div>
                    <div className="conv-content">
                      <div className="conv-header">
                        <span className="conv-name">{conv.candidateName}</span>
                        <span className="conv-time">{conv.timestamp}</span>
                      </div>
                      <p className="conv-role">{conv.role}</p>
                      {conv.jobTitle && <p className="conv-job">Re: {conv.jobTitle}</p>}
                      <p className="conv-preview">{conv.preview}</p>
                    </div>
                  </div>
                ))
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
                    <div className="chat-avatar">{selectedConversation.avatar}</div>
                    <div>
                      <h3>{selectedConversation.candidateName}</h3>
                      <p className="chat-role">{selectedConversation.role}</p>
                      {selectedConversation.jobTitle && (
                        <p className="chat-job-ref">Applied for: {selectedConversation.jobTitle}</p>
                      )}
                    </div>
                  </div>
                  <div className="chat-actions">
                    <button className="action-btn" title="View Profile">
                      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </button>
                    <button className="action-btn" title="More Options">
                      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="messages-thread">
                  {selectedConversation.messages.map(msg => (
                    <div key={msg.id} className={`message-bubble ${msg.isYou ? 'outbound' : 'inbound'}`}>
                      <div className="message-content">
                        <div className="message-sender">{msg.isYou ? 'You' : msg.sender}</div>
                        <p className="message-text">{msg.message}</p>
                        <span className="message-timestamp">{msg.timestamp}</span>
                      </div>
                    </div>
                  ))}
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
            display: ${!selectedConversation ? 'flex' : 'none'};
          }

          .chat-main {
            display: ${selectedConversation ? 'flex' : 'none'};
          }

          .message-bubble {
            max-width: 85%;
          }
        }
      `}</style>
    </>
  );
}
