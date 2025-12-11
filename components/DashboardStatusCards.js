export default function DashboardStatusCards() {
  const statusOverview = {
    applications: { total: 12, inProgress: 8, interviews: 3, accepted: 1, rejected: 0 },
    profileViews: 47,
    messagesWaiting: 3
  };

  return (
    <div className="status-cards-container">
      {/* My Status Overview Card */}
      <div className="status-card overview-card">
        <div className="card-header">
          <div className="header-icon">📊</div>
          <h3>My Status Overview</h3>
        </div>
        <div className="card-content">
          <div className="overview-metrics">
            <div className="metric-row">
              <div className="metric-item primary">
                <span className="metric-icon">📋</span>
                <div className="metric-info">
                  <span className="metric-value">{statusOverview.applications.inProgress}</span>
                  <span className="metric-label">In Progress</span>
                </div>
              </div>
              <div className="metric-item success">
                <span className="metric-icon">📞</span>
                <div className="metric-info">
                  <span className="metric-value">{statusOverview.applications.interviews}</span>
                  <span className="metric-label">Interviews</span>
                </div>
              </div>
            </div>
            <div className="metric-row">
              <div className="metric-item info">
                <span className="metric-icon">✅</span>
                <div className="metric-info">
                  <span className="metric-value">{statusOverview.applications.accepted}</span>
                  <span className="metric-label">Accepted</span>
                </div>
              </div>
              <div className="metric-item warning">
                <span className="metric-icon">❌</span>
                <div className="metric-info">
                  <span className="metric-value">{statusOverview.applications.rejected}</span>
                  <span className="metric-label">Rejected</span>
                </div>
              </div>
            </div>
            <div className="metric-separator"></div>
            <div className="metric-row">
              <div className="metric-item chart">
                <span className="metric-icon">👁️</span>
                <div className="metric-info">
                  <span className="metric-value">{statusOverview.profileViews}</span>
                  <span className="metric-label">Profile Views (7 days)</span>
                </div>
                <div className="sparkline">
                  <svg width="60" height="20" viewBox="0 0 60 20">
                    <polyline
                      points="0,15 10,12 20,14 30,8 40,10 50,6 60,4"
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              </div>
            </div>
            <div className="metric-row">
              <div className="metric-item message">
                <span className="metric-icon">💬</span>
                <div className="metric-info">
                  <span className="metric-value">{statusOverview.messagesWaiting}</span>
                  <span className="metric-label">Messages Waiting</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .status-cards-container {
          margin: 24px 0;
        }

        .status-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .status-card:hover {
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
          transform: translateY(-4px);
        }

        .card-header {
          padding: 20px 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-icon {
          font-size: 28px;
        }

        .card-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
        }

        .card-content {
          padding: 24px;
        }

        .overview-metrics {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .metric-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .metric-item {
          padding: 14px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          border: 2px solid;
          transition: all 0.2s;
        }

        .metric-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .metric-item.primary {
          background: #eef2ff;
          border-color: #c7d2fe;
        }

        .metric-item.success {
          background: #f0fdf4;
          border-color: #bbf7d0;
        }

        .metric-item.info {
          background: #ecfeff;
          border-color: #a5f3fc;
        }

        .metric-item.warning {
          background: #fef2f2;
          border-color: #fecaca;
        }

        .metric-item.chart {
          grid-column: 1 / -1;
          background: #fafbfc;
          border-color: #e2e8f0;
          justify-content: space-between;
        }

        .metric-item.message {
          grid-column: 1 / -1;
          background: #fefce8;
          border-color: #fef08a;
        }

        .metric-icon {
          font-size: 24px;
          flex-shrink: 0;
        }

        .metric-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .metric-value {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          line-height: 1;
        }

        .metric-label {
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .sparkline {
          flex-shrink: 0;
        }

        .metric-separator {
          height: 2px;
          background: #f1f5f9;
          margin: 8px 0;
        }
      `}</style>
    </div>
  );
}
