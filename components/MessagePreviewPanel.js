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
          background: rgba(0, 0, 0, 0.3);
          z-index: 999;
          animation: fadeIn 0.2s ease;
        }

        .message-preview-panel {
          position: fixed;
          top: 60px;
          right: 20px;
          width: 380px;
          max-height: 500px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
          z-index: 1000;
          display: flex;
          flex-direction: column;
          animation: slideDown 0.25s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideDown {
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
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #e5e7eb;
        }

        .message-preview-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #111827;
        }

        .message-preview-badge {
          background: #7c3aed;
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .message-preview-list {
          flex: 1;
          overflow-y: auto;
          max-height: 380px;
        }

        .message-preview-item {
          display: flex;
          gap: 12px;
          padding: 12px 20px;
          border-bottom: 1px solid #f3f4f6;
          cursor: pointer;
          text-decoration: none;
          color: inherit;
          position: relative;
          transition: background 0.15s ease;
        }

        .message-preview-item:hover {
          background: #f9fafb;
        }

        .message-preview-item.unread {
          background: #eff6ff;
        }

        .message-preview-item.unread:hover {
          background: #dbeafe;
        }

        .message-preview-avatar {
          font-size: 32px;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f3f4f6;
          border-radius: 50%;
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
          margin-bottom: 2px;
        }

        .message-preview-company {
          font-weight: 600;
          font-size: 14px;
          color: #111827;
        }

        .message-preview-time {
          font-size: 12px;
          color: #6b7280;
        }

        .message-preview-job {
          font-size: 13px;
          color: #4b5563;
          margin-bottom: 4px;
          font-weight: 500;
        }

        .message-preview-text {
          font-size: 13px;
          color: #6b7280;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .message-preview-dot {
          position: absolute;
          right: 20px;
          top: 50%;
          transform: translateY(-50%);
          width: 8px;
          height: 8px;
          background: #7c3aed;
          border-radius: 50%;
        }

        .message-preview-empty {
          padding: 40px 20px;
          text-align: center;
          color: #6b7280;
        }

        .message-preview-empty p {
          margin: 0 0 4px 0;
          font-weight: 500;
          color: #111827;
        }

        .message-preview-empty span {
          font-size: 13px;
        }

        .message-preview-footer {
          padding: 12px 20px;
          border-top: 1px solid #e5e7eb;
        }

        .message-preview-viewall {
          display: block;
          text-align: center;
          color: #7c3aed;
          font-weight: 500;
          font-size: 14px;
          text-decoration: none;
          padding: 8px;
          border-radius: 6px;
          transition: background 0.15s ease;
        }

        .message-preview-viewall:hover {
          background: #f5f3ff;
        }

        @media (max-width: 768px) {
          .message-preview-panel {
            right: 10px;
            width: calc(100vw - 20px);
            max-width: 380px;
          }
        }
      `}</style>
    </>
  );
}
