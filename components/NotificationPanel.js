import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function NotificationPanel({ isOpen, onClose, notifications, onUnreadChange }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('job-alerts');
  const [displayCount, setDisplayCount] = useState(3);

  const tabs = [
    { id: 'job-alerts', label: 'Job Alerts', icon: '💼' },
    { id: 'applications', label: 'Application Updates', icon: '📋' },
    { id: 'news', label: 'PMO Network News', icon: '📰' }
  ];

  const initialNotifications = {
    'job-alerts': [
      {
        id: 1,
        icon: '💼',
        title: 'New PMO Role: Senior Project Manager',
        description: 'Financial Services, London - £75k-£90k - Remote available',
        timestamp: '2 hours ago',
        unread: true,
        jobId: 'j1', // Link to specific job
        linkType: 'job'
      },
      {
        id: 2,
        icon: '🎯',
        title: '5 New Jobs Match Your Profile',
        description: 'PMO Analyst roles in FinTech sector with hybrid working',
        timestamp: '5 hours ago',
        unread: true,
        linkType: 'search',
        searchParams: '?sector=fintech&workMode=hybrid'
      },
      {
        id: 3,
        icon: '⭐',
        title: 'Premium Job Alert',
        description: 'Head of PMO - Leading investment bank seeking leadership',
        timestamp: '1 day ago',
        unread: false,
        jobId: 'j2',
        linkType: 'job'
      }
    ],
    'applications': [
      {
        id: 4,
        icon: '✅',
        title: 'Application Viewed',
        description: 'HSBC reviewed your application for PMO Lead position',
        timestamp: '1 hour ago',
        unread: true,
        jobId: 'j1',
        applicationId: 'app1',
        linkType: 'application'
      },
      {
        id: 5,
        icon: '📞',
        title: 'Interview Request',
        description: 'Barclays wants to schedule an interview - 3 slots available',
        timestamp: '3 hours ago',
        unread: true,
        jobId: 'j2',
        applicationId: 'app2',
        linkType: 'application'
      },
      {
        id: 6,
        icon: '📄',
        title: 'Application Submitted',
        description: 'Your application for Senior PMO Analyst has been received',
        timestamp: '2 days ago',
        unread: false,
        jobId: 'j3',
        applicationId: 'app3',
        linkType: 'application'
      }
    ],
    'news': [
      {
        id: 7,
        icon: '🚀',
        title: 'Platform Update: New Features',
        description: 'Video interviews, skill assessments, and enhanced matching now live',
        timestamp: '4 hours ago',
        unread: true,
        linkType: 'external',
        externalUrl: '#'
      },
      {
        id: 8,
        icon: '📊',
        title: 'PMO Market Insights: November 2025',
        description: 'Day rates increase 8% year-on-year, highest demand in FinTech',
        timestamp: '1 day ago',
        unread: false,
        linkType: 'external',
        externalUrl: '#'
      },
      {
        id: 9,
        icon: '🎓',
        title: 'Free Webinar: Advanced PMO Techniques',
        description: 'Join our expert panel this Friday at 2pm GMT',
        timestamp: '2 days ago',
        unread: false,
        linkType: 'external',
        externalUrl: '#'
      }
    ]
  };

  const [notifState, setNotifState] = useState(initialNotifications);

  // total unread across all tabs
  const totalUnread = Object.values(notifState).flat().filter(n => n.unread).length;
  const allCurrentNotifications = notifState[activeTab] || [];
  const currentNotifications = allCurrentNotifications.slice(0, displayCount);
  const unreadCount = allCurrentNotifications.filter(n => n.unread).length;
  const hasMore = displayCount < allCurrentNotifications.length;

  const handleMarkAllRead = () => {
    setNotifState(prev => {
      const next = {};
      for (const key of Object.keys(prev)) {
        next[key] = prev[key].map(n => ({ ...n, unread: false }));
      }
      return next;
    });
    if (onUnreadChange) onUnreadChange(0);
  };

  // Inform parent of unread total when state changes
  useEffect(() => {
    if (onUnreadChange) onUnreadChange(totalUnread);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalUnread]);

  // Reset display count when switching tabs
  useEffect(() => {
    setDisplayCount(3);
  }, [activeTab]);

  const handleViewDetails = (notification) => {
    // Mark notification as read
    setNotifState(prev => {
      const next = { ...prev };
      next[activeTab] = next[activeTab].map(n => 
        n.id === notification.id ? { ...n, unread: false } : n
      );
      return next;
    });

    // Route based on notification's linkType
    if (notification.linkType === 'job' && notification.jobId) {
      // Navigate to specific job details page
      router.push(`/jobs/${notification.jobId}`);
    } else if (notification.linkType === 'application' && notification.jobId) {
      // Navigate to specific job page (where they can view their application)
      router.push(`/jobs/${notification.jobId}`);
    } else if (notification.linkType === 'search') {
      // Navigate to jobs search with filters
      const params = notification.searchParams || '';
      router.push(`/jobs${params}`);
    } else if (notification.linkType === 'external' && notification.externalUrl) {
      // Open external link in new tab
      window.open(notification.externalUrl, '_blank');
      return; // Don't close panel for external links
    } else {
      // Fallback to general pages
      if (activeTab === 'job-alerts') {
        router.push('/jobs');
      } else if (activeTab === 'applications') {
        router.push('/dashboard/candidate?tab=applications');
      }
    }

    // Close panel after navigation
    onClose();
  };

  const handleLoadMore = () => {
    setDisplayCount(prev => prev + 3);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="notification-overlay" onClick={onClose} />
      <div className="notification-panel">
        <div className="panel-header">
          <div className="header-title">
            <h3>Notifications</h3>
            {unreadCount > 0 && <span className="unread-badge">{unreadCount} new</span>}
          </div>
          <button className="mark-read-btn" onClick={handleMarkAllRead}>
            Mark All as Read
          </button>
        </div>

        <div className="panel-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="panel-content">
          {currentNotifications.map(notification => (
            <div key={notification.id} className={`notification-card ${notification.unread ? 'unread' : ''}`}>
              {notification.unread && <span className="unread-dot" />}
              <div className="notification-icon">{notification.icon}</div>
              <div className="notification-body">
                <h4 className="notification-title">{notification.title}</h4>
                <p className="notification-description">{notification.description}</p>
                <div className="notification-footer">
                  <span className="notification-time">{notification.timestamp}</span>
                  <button 
                    className="view-details-btn"
                    onClick={() => handleViewDetails(notification)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="panel-footer">
          {hasMore && (
            <button 
              className="load-more-btn"
              onClick={handleLoadMore}
            >
              Load More Notifications ({allCurrentNotifications.length - displayCount} remaining)
            </button>
          )}
          {!hasMore && allCurrentNotifications.length > 3 && (
            <div className="all-loaded-text">
              All notifications loaded
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .notification-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: transparent;
          z-index: 998;
        }

        .notification-panel {
          position: fixed;
          top: 70px;
          right: 20px;
          width: 420px;
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
          display: flex;
          justify-content: space-between;
          align-items: center;
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

        .mark-read-btn {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: none;
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .mark-read-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .panel-tabs {
          display: flex;
          gap: 4px;
          padding: 16px 16px 0 16px;
          background: #fafbfc;
        }

        .tab-btn {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 10px 8px;
          background: transparent;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 11px;
          color: #64748b;
        }

        .tab-btn:hover {
          background: white;
        }

        .tab-btn.active {
          background: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          color: #6366f1;
          font-weight: 600;
        }

        .tab-icon {
          font-size: 20px;
        }

        .tab-label {
          text-align: center;
          line-height: 1.2;
        }

        .panel-content {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          background: #fafbfc;
        }

        .notification-card {
          position: relative;
          background: white;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 12px;
          display: flex;
          gap: 12px;
          transition: all 0.2s;
          border: 2px solid transparent;
        }

        .notification-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          transform: translateY(-2px);
        }

        .notification-card.unread {
          border-color: #e0e7ff;
          background: linear-gradient(to right, #fefefe, #f5f7ff);
        }

        .unread-dot {
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

        .notification-icon {
          font-size: 28px;
          flex-shrink: 0;
        }

        .notification-body {
          flex: 1;
          min-width: 0;
        }

        .notification-title {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 6px 0;
        }

        .notification-description {
          font-size: 13px;
          color: #64748b;
          margin: 0 0 10px 0;
          line-height: 1.4;
        }

        .notification-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .notification-time {
          font-size: 12px;
          color: #94a3b8;
        }

        .view-details-btn {
          background: none;
          border: none;
          color: #6366f1;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .view-details-btn:hover {
          background: #eef2ff;
        }

        .panel-footer {
          padding: 16px;
          border-top: 2px solid #f1f5f9;
          background: white;
          border-radius: 0 0 16px 16px;
        }

        .load-more-btn {
          width: 100%;
          padding: 10px;
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s;
        }

        .load-more-btn:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
        }

        .all-loaded-text {
          text-align: center;
          padding: 10px;
          font-size: 13px;
          color: #94a3b8;
          font-style: italic;
        }

        @media (max-width: 500px) {
          .notification-panel {
            right: 10px;
            left: 10px;
            width: auto;
            top: 60px;
          }

          .tab-label {
            display: none;
          }
        }
      `}</style>
    </>
  );
}
