import { useState } from 'react';
import Link from 'next/link';

export default function MessagePreviewPanel({ isOpen, onClose }) {
  // Mock recent conversations - will be replaced with real data
  const recentConversations = [
    {
      id: 1,
      companyName: 'HSBC',
      jobTitle: 'PMO Lead',
      lastMessage: 'Thank you for your application. We would like to schedule an interview...',
      timestamp: '1h ago',
      unread: true,
      avatar: '🏦'
    },
    {
      id: 2,
      companyName: 'Barclays',
      jobTitle: 'Senior PMO Analyst',
      lastMessage: 'Your profile is impressive. Could you provide more details about...',
      timestamp: '3h ago',
      unread: true,
      avatar: '🏛️'
    },
    {
      id: 3,
      companyName: 'PMO Network Support',
      jobTitle: 'Profile Optimization',
      lastMessage: 'Your profile score has increased to 85%! Keep going...',
      timestamp: '2d ago',
      unread: false,
      avatar: '💼'
    }
  ];

  const unreadCount = recentConversations.filter(c => c.unread).length;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="message-preview-backdrop" 
        onClick={onClose}
      />
      
      {/* Preview Panel */}
      <div className="message-preview-panel">
        <div className="message-preview-header">
          <h3>Messages Preview</h3>
          {unreadCount > 0 && (
            <span className="message-preview-badge">{unreadCount} new</span>
          )}
        </div>

        <div className="message-preview-list">
          {recentConversations.length > 0 ? (
            recentConversations.map((conversation) => (
              <Link 
                key={conversation.id}
                href={`/dashboard/messages?conversation=${conversation.id}`}
                className={`message-preview-item ${conversation.unread ? 'unread' : ''}`}
                onClick={onClose}
              >
                <div className="message-preview-avatar">
                  {conversation.avatar}
                </div>
                <div className="message-preview-content">
                  <div className="message-preview-top">
                    <span className="message-preview-company">{conversation.companyName}</span>
                    <span className="message-preview-time">{conversation.timestamp}</span>
                  </div>
                  <div className="message-preview-job">{conversation.jobTitle}</div>
                  <div className="message-preview-text">{conversation.lastMessage}</div>
                </div>
                {conversation.unread && <div className="message-preview-dot"></div>}
              </Link>
            ))
          ) : (
            <div className="message-preview-empty">
              <p>No messages yet</p>
              <span>Conversations with employers will appear here</span>
            </div>
          )}
        </div>

        <div className="message-preview-footer">
          <Link href="/dashboard/messages" className="message-preview-viewall" onClick={onClose}>
            View All Messages
          </Link>
        </div>
      </div>

      <style jsx>{`
        .message-preview-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: transparent;
          z-index: 1098;
        }

        .message-preview-panel {
          position: fixed;
          top: 70px;
          right: 20px;
          width: 420px;
          max-height: 600px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
          z-index: 1099;
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

        .message-preview-header {
          padding: 20px 24px;
          border-bottom: 2px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px 16px 0 0;
        }

        .message-preview-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          color: white;
        }

        .message-preview-badge {
          background: rgba(255, 255, 255, 0.3);
          color: white;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .message-preview-list {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          background: #fafbfc;
        }

        .message-preview-item {
          position: relative;
          background: white;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 12px;
          display: flex;
          gap: 12px;
          cursor: pointer;
          text-decoration: none;
          color: inherit;
          transition: all 0.2s;
          border: 2px solid transparent;
        }

        .message-preview-item:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          transform: translateY(-2px);
        }

        .message-preview-item.unread {
          border-color: #e0e7ff;
          background: linear-gradient(to right, #fefefe, #f5f7ff);
        }

        .message-preview-avatar {
          font-size: 28px;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .message-preview-content {
          flex: 1;
          min-width: 0;
        }

        .message-preview-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }

        .message-preview-company {
          font-weight: 600;
          font-size: 14px;
          color: #1f2937;
        }

        .message-preview-time {
          font-size: 12px;
          color: #94a3b8;
          font-weight: 500;
        }

        .message-preview-job {
          font-size: 13px;
          color: #6366f1;
          margin-bottom: 6px;
          font-weight: 500;
        }

        .message-preview-text {
          font-size: 13px;
          color: #64748b;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          line-height: 1.4;
        }

        .message-preview-dot {
          position: absolute;
          top: 20px;
          left: 8px;
          width: 8px;
          height: 8px;
          background: #6366f1;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .message-preview-empty {
          padding: 60px 20px;
          text-align: center;
        }

        .message-preview-empty p {
          margin: 0 0 8px 0;
          font-weight: 600;
          font-size: 15px;
          color: #334155;
        }

        .message-preview-empty span {
          font-size: 13px;
          color: #94a3b8;
        }

        .message-preview-footer {
          padding: 16px 20px;
          border-top: 2px solid #f1f5f9;
          background: white;
          border-radius: 0 0 16px 16px;
        }

        .message-preview-viewall {
          display: block;
          text-align: center;
          color: #6366f1;
          font-weight: 600;
          font-size: 14px;
          text-decoration: none;
          padding: 10px;
          border-radius: 8px;
          transition: all 0.2s;
          background: #f8fafc;
        }

        .message-preview-viewall:hover {
          background: #e0e7ff;
          transform: translateY(-1px);
        }

        @media (max-width: 768px) {
          .message-preview-panel {
            right: 10px;
            width: calc(100vw - 20px);
            max-width: 420px;
          }
        }
      `}</style>
    </>
  );
}
