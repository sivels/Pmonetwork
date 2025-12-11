import { useState } from 'react';
import MessageModal from './MessageModal';

export default function MessagesPanel({ isOpen, onClose, messages }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedMessage, setSelectedMessage] = useState(null);

  const filters = [
    { id: 'all', label: 'All Messages' },
    { id: 'companies', label: 'From Companies' },
    { id: 'support', label: 'PMO Support' },
    { id: 'unread', label: 'Unread' }
  ];

  const mockMessages = [
    {
      id: 1,
      sender: 'HSBC Talent Team',
      avatar: '🏦',
      preview: 'Thank you for your application. We would like to schedule an interview to discuss the PMO Lead position...',
      timestamp: '1 hour ago',
      unread: true,
      type: 'company',
      fullThread: [
        {
          id: 1,
          sender: 'HSBC Talent Team',
          message: 'Thank you for your application. We would like to schedule an interview to discuss the PMO Lead position. Are you available next week?',
          timestamp: '1 hour ago',
          isYou: false
        }
      ]
    },
    {
      id: 2,
      sender: 'Barclays Hiring Manager',
      avatar: '🏛️',
      preview: 'Your profile is impressive. Could you provide more details about your experience with Agile transformation...',
      timestamp: '3 hours ago',
      unread: true,
      type: 'company',
      fullThread: [
        {
          id: 1,
          sender: 'Barclays Hiring Manager',
          message: 'Your profile is impressive. Could you provide more details about your experience with Agile transformation projects?',
          timestamp: '3 hours ago',
          isYou: false
        }
      ]
    },
    {
      id: 3,
      sender: 'PMO Network Support',
      avatar: '💼',
      preview: 'Welcome to PMO Network! Here are some tips to optimize your profile and increase visibility to employers...',
      timestamp: '2 days ago',
      unread: false,
      type: 'support',
      fullThread: [
        {
          id: 1,
          sender: 'PMO Network Support',
          message: 'Welcome to PMO Network! Here are some tips to optimize your profile and increase visibility to employers. Make sure to complete all sections and add relevant skills.',
          timestamp: '2 days ago',
          isYou: false
        }
      ]
    },
    {
      id: 4,
      sender: 'Goldman Sachs Recruiter',
      avatar: '💰',
      preview: 'We have reviewed your CV and would like to discuss a Senior PMO opportunity. Please let us know...',
      timestamp: '3 days ago',
      unread: false,
      type: 'company',
      fullThread: [
        {
          id: 1,
          sender: 'Goldman Sachs Recruiter',
          message: 'We have reviewed your CV and would like to discuss a Senior PMO opportunity. Please let us know your availability for a call.',
          timestamp: '3 days ago',
          isYou: false
        },
        {
          id: 2,
          sender: 'You',
          message: 'Thank you for reaching out! I would be happy to discuss this opportunity. I am available Monday-Wednesday next week.',
          timestamp: '2 days ago',
          isYou: true
        }
      ]
    }
  ];

  const filteredMessages = mockMessages.filter(msg => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'companies') return msg.type === 'company';
    if (activeFilter === 'support') return msg.type === 'support';
    if (activeFilter === 'unread') return msg.unread;
    return true;
  });

  const unreadCount = mockMessages.filter(m => m.unread).length;

  if (!isOpen) return null;

  return (
    <>
      <div className="messages-overlay" onClick={onClose} />
      <div className="messages-panel">
        <div className="panel-header">
          <div className="header-title">
            <h3>Messages</h3>
            {unreadCount > 0 && <span className="unread-badge">{unreadCount} unread</span>}
          </div>
        </div>

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

        <div className="messages-list">
          {filteredMessages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <p>No messages in this category</p>
            </div>
          ) : (
            filteredMessages.map(message => (
              <div
                key={message.id}
                className={`message-item ${message.unread ? 'unread' : ''}`}
                onClick={() => setSelectedMessage(message)}
              >
                {message.unread && <span className="unread-indicator" />}
                <div className="message-avatar">{message.avatar}</div>
                <div className="message-content">
                  <div className="message-header">
                    <span className="sender-name">{message.sender}</span>
                    <span className="message-time">{message.timestamp}</span>
                  </div>
                  <p className="message-preview">{message.preview}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedMessage && (
        <MessageModal
          message={selectedMessage}
          onClose={() => setSelectedMessage(null)}
        />
      )}

      <style jsx>{`
        .messages-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: transparent;
          z-index: 998;
        }

        .messages-panel {
          position: fixed;
          top: 70px;
          right: 20px;
          width: 400px;
          max-height: 600px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
          z-index: 999;
          display: flex;
          flex-direction: column;
          animation: slideIn 0.3s ease;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .panel-header {
          padding: 20px 24px;
          border-bottom: 2px solid #f1f5f9;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px 16px 0 0;
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-title h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          color: white;
        }

        .unread-badge {
          background: rgba(255, 255, 255, 0.3);
          color: white;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .filter-tabs {
          display: flex;
          gap: 8px;
          padding: 16px;
          background: #fafbfc;
          border-bottom: 2px solid #f1f5f9;
          overflow-x: auto;
        }

        .filter-btn {
          padding: 6px 14px;
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .filter-btn:hover {
          border-color: #cbd5e1;
          background: #f8fafc;
        }

        .filter-btn.active {
          background: #6366f1;
          color: white;
          border-color: #6366f1;
        }

        .messages-list {
          flex: 1;
          overflow-y: auto;
          background: #fafbfc;
        }

        .message-item {
          position: relative;
          display: flex;
          gap: 12px;
          padding: 16px 20px;
          background: white;
          border-bottom: 1px solid #f1f5f9;
          cursor: pointer;
          transition: all 0.2s;
        }

        .message-item:hover {
          background: #f8fafc;
        }

        .message-item.unread {
          background: linear-gradient(to right, #fefefe, #f5f7ff);
          border-left: 3px solid #6366f1;
        }

        .unread-indicator {
          position: absolute;
          top: 50%;
          left: 8px;
          width: 8px;
          height: 8px;
          background: #6366f1;
          border-radius: 50%;
          transform: translateY(-50%);
        }

        .message-avatar {
          font-size: 36px;
          flex-shrink: 0;
        }

        .message-content {
          flex: 1;
          min-width: 0;
        }

        .message-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .sender-name {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
        }

        .message-time {
          font-size: 12px;
          color: #94a3b8;
        }

        .message-preview {
          font-size: 13px;
          color: #64748b;
          margin: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          line-height: 1.4;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          text-align: center;
        }

        .empty-icon {
          font-size: 64px;
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .empty-state p {
          color: #64748b;
          font-size: 14px;
        }

        @media (max-width: 500px) {
          .messages-panel {
            right: 10px;
            left: 10px;
            width: auto;
            top: 60px;
          }
        }
      `}</style>
    </>
  );
}
