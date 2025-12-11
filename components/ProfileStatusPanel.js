import Link from 'next/link';

export default function ProfileStatusPanel({ isOpen, onClose, profile, user }) {
  const profileCompleteness = 85; // This would come from props

  const statusMetrics = [
    {
      icon: '📋',
      title: 'Applications',
      count: 12,
      trend: 'up',
      link: '/dashboard/candidate?tab=applications'
    },
    {
      icon: '📞',
      title: 'Interviews',
      count: 3,
      trend: 'up',
      link: '/dashboard/candidate?tab=interviews'
    },
    {
      icon: '👁️',
      title: 'Profile Views',
      count: 47,
      subtitle: 'Last 7 days',
      trend: 'up',
      link: '/dashboard/analytics'
    },
    {
      icon: '💼',
      title: 'Companies Reached Out',
      count: 8,
      trend: 'up',
      link: '/dashboard/candidate?tab=messages'
    },
    {
      icon: '📄',
      title: 'Documents',
      count: 5,
      trend: 'neutral',
      link: '/dashboard/documents'
    }
  ];

  if (!isOpen) return null;

  return (
    <>
      <div className="status-overlay" onClick={onClose} />
      <div className="status-panel">
        <div className="panel-header">
          <div className="profile-summary">
            <div className="profile-photo">
              <img src={profile?.profilePhotoUrl || '/images/avatar-placeholder.svg'} alt={profile?.fullName} />
            </div>
            <div className="profile-info">
              <h3>{profile?.fullName || 'Complete Profile'}</h3>
              <p className="job-title">{profile?.jobTitle || 'Add job title'}</p>
              <span className="user-email">{user?.email}</span>
            </div>
          </div>

          <div className="profile-progress">
            <div className="progress-header">
              <span className="progress-label">Profile Completeness</span>
              <span className="progress-value">{profileCompleteness}%</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${profileCompleteness}%` }}
              />
            </div>
          </div>
        </div>

        <div className="metrics-grid">
          {statusMetrics.map((metric, idx) => (
            <Link href={metric.link} key={idx} className="metric-card" onClick={onClose}>
              <div className="metric-icon">{metric.icon}</div>
              <div className="metric-content">
                <div className="metric-header">
                  <span className="metric-title">{metric.title}</span>
                  {metric.trend === 'up' && <span className="trend-indicator up">↗</span>}
                  {metric.trend === 'down' && <span className="trend-indicator down">↘</span>}
                </div>
                <div className="metric-count">{metric.count}</div>
                {metric.subtitle && <span className="metric-subtitle">{metric.subtitle}</span>}
              </div>
            </Link>
          ))}
        </div>

        <div className="quick-actions">
          <Link href="/candidate/preview" className="action-btn secondary" onClick={onClose}>
            <span>👁️</span>
            View My Profile
          </Link>
          <Link href="/dashboard/profile" className="action-btn secondary" onClick={onClose}>
            <span>✏️</span>
            Edit Profile
          </Link>
          <Link href="/dashboard/settings" className="action-btn secondary" onClick={onClose}>
            <span>⚙️</span>
            Account Settings
          </Link>
          <button className="action-btn danger" onClick={() => {
            // Handle logout
            window.location.href = '/api/auth/signout';
          }}>
            <span>🚪</span>
            Log Out
          </button>
        </div>
      </div>

      <style jsx>{`
        .status-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: transparent;
          z-index: 998;
        }

        .status-panel {
          position: fixed;
          top: 70px;
          right: 20px;
          width: 380px;
          max-height: 600px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
          z-index: 999;
          overflow: hidden;
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
          padding: 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .profile-summary {
          display: flex;
          gap: 16px;
          align-items: center;
          margin-bottom: 20px;
        }

        .profile-photo {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          overflow: hidden;
          border: 3px solid rgba(255, 255, 255, 0.3);
          flex-shrink: 0;
        }

        .profile-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .profile-info h3 {
          margin: 0 0 4px 0;
          font-size: 18px;
          font-weight: 700;
        }

        .job-title {
          margin: 0 0 4px 0;
          font-size: 14px;
          opacity: 0.9;
        }

        .user-email {
          font-size: 12px;
          opacity: 0.7;
        }

        .profile-progress {
          background: rgba(255, 255, 255, 0.15);
          padding: 14px;
          border-radius: 12px;
          backdrop-filter: blur(10px);
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .progress-label {
          font-size: 13px;
          font-weight: 600;
        }

        .progress-value {
          font-size: 15px;
          font-weight: 700;
        }

        .progress-bar {
          height: 8px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: white;
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          padding: 20px;
          background: #fafbfc;
          max-height: 300px;
          overflow-y: auto;
        }

        .metric-card {
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 14px;
          display: flex;
          gap: 12px;
          align-items: flex-start;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
          color: inherit;
        }

        .metric-card:hover {
          border-color: #6366f1;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.1);
          transform: translateY(-2px);
        }

        .metric-icon {
          font-size: 28px;
          flex-shrink: 0;
        }

        .metric-content {
          flex: 1;
          min-width: 0;
        }

        .metric-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .metric-title {
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .trend-indicator {
          font-size: 16px;
          font-weight: 700;
        }

        .trend-indicator.up {
          color: #10b981;
        }

        .trend-indicator.down {
          color: #ef4444;
        }

        .metric-count {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
        }

        .metric-subtitle {
          font-size: 11px;
          color: #94a3b8;
        }

        .quick-actions {
          padding: 20px;
          background: white;
          border-top: 2px solid #f1f5f9;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 12px 20px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
          border: none;
          width: 100%;
        }

        .action-btn span {
          font-size: 18px;
        }

        .action-btn.secondary {
          background: #f8fafc;
          color: #475569;
          border: 2px solid #e2e8f0;
        }

        .action-btn.secondary:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
        }

        .action-btn.danger {
          background: #fef2f2;
          color: #dc2626;
          border: 2px solid #fecaca;
        }

        .action-btn.danger:hover {
          background: #fee2e2;
          border-color: #fca5a5;
        }

        @media (max-width: 500px) {
          .status-panel {
            right: 10px;
            left: 10px;
            width: auto;
            top: 60px;
          }

          .metrics-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
