import Head from 'next/head';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]';
import { prisma } from '../../lib/prisma';
import Link from 'next/link';
import { useState } from 'react';

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
      candidateCandidateProfile: true,
      accounts: true
    }
  });

  const profile = user?.candidateCandidateProfile || null;

  return { 
    props: { 
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt.toISOString()
      },
      profile: profile ? {
        id: profile.id,
        fullName: profile.fullName || '',
        phone: profile.phone || '',
        location: profile.location || '',
        profilePhotoUrl: profile.profilePhotoUrl || null,
        isPublic: profile.isPublic ?? true,
        anonymousMode: profile.anonymousMode ?? false
      } : null,
      connectedAccounts: user.accounts.map(acc => ({
        provider: acc.provider,
        createdAt: acc.createdAt?.toISOString() || null
      }))
    } 
  };
}

export default function AccountSettings({ user, profile, connectedAccounts }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const tabs = [
    { id: 'profile', label: 'Profile Information', icon: '👤' },
    { id: 'security', label: 'Security & Login', icon: '🔒' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'privacy', label: 'Privacy & Visibility', icon: '👁️' },
    { id: 'connected', label: 'Connected Accounts', icon: '🔗' },
    { id: 'account', label: 'Account Management', icon: '⚙️' }
  ];

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };

  return (
    <>
      <Head>
        <title>Account Settings – PMO Network</title>
        <meta name="description" content="Manage your account preferences and security" />
      </Head>

      <div className="settings-page">
        {/* Header */}
        <header className="settings-header">
          <div className="header-content">
            <Link href="/dashboard/candidate" className="back-link">
              ← Back to Dashboard
            </Link>
            <div className="header-title">
              <h1>Account Settings</h1>
              <p className="subtitle">Manage your account preferences and security</p>
            </div>
          </div>
        </header>

        {/* Toast Notification */}
        {toast && <div className="toast-notification">{toast}</div>}

        <div className="settings-container">
          {/* Tab Navigation */}
          <nav className="settings-nav">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </nav>

          {/* Content Area */}
          <div className="settings-content">
            {activeTab === 'profile' && <ProfileInformation user={user} profile={profile} onSave={showToast} />}
            {activeTab === 'security' && <SecurityLogin user={user} onSave={showToast} />}
            {activeTab === 'notifications' && <Notifications user={user} onSave={showToast} />}
            {activeTab === 'privacy' && <PrivacyVisibility profile={profile} onSave={showToast} />}
            {activeTab === 'connected' && <ConnectedAccounts accounts={connectedAccounts} onSave={showToast} />}
            {activeTab === 'account' && <AccountManagement user={user} onSave={showToast} />}
          </div>
        </div>
      </div>

      <style jsx>{`
        .settings-page {
          max-width: 1400px;
          margin: 0 auto;
          padding: 24px;
          background: #f8f9fa;
          min-height: 100vh;
        }

        .settings-header {
          background: white;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .back-link {
          color: #6366f1;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          display: inline-block;
          margin-bottom: 12px;
          transition: color 0.2s;
        }

        .back-link:hover {
          color: #4f46e5;
        }

        .header-title h1 {
          font-size: 28px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .subtitle {
          color: #64748b;
          font-size: 14px;
          margin: 4px 0 0 0;
        }

        .toast-notification {
          position: fixed;
          top: 20px;
          right: 20px;
          background: #10b981;
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 1000;
          animation: slideIn 0.3s ease;
        }

        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .settings-container {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 24px;
        }

        .settings-nav {
          background: white;
          border-radius: 12px;
          padding: 16px;
          height: fit-content;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          position: sticky;
          top: 24px;
        }

        .nav-tab {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border: none;
          background: transparent;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
          margin-bottom: 4px;
        }

        .nav-tab:hover {
          background: #f8fafc;
        }

        .nav-tab.active {
          background: #eef2ff;
          color: #6366f1;
          font-weight: 600;
        }

        .tab-icon {
          font-size: 20px;
        }

        .tab-label {
          font-size: 14px;
        }

        .settings-content {
          background: white;
          border-radius: 12px;
          padding: 32px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          min-height: 600px;
        }

        @media (max-width: 968px) {
          .settings-container {
            grid-template-columns: 1fr;
          }

          .settings-nav {
            position: static;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 8px;
          }

          .tab-label {
            display: none;
          }

          .nav-tab {
            justify-content: center;
          }
        }
      `}</style>
    </>
  );
}

// Profile Information Component
function ProfileInformation({ user, profile, onSave }) {
  const [formData, setFormData] = useState({
    firstName: profile?.fullName?.split(' ')[0] || '',
    lastName: profile?.fullName?.split(' ').slice(1).join(' ') || '',
    email: user.email,
    phone: profile?.phone || '',
    country: profile?.location || '',
    timezone: 'GMT',
    language: 'English',
    theme: 'light'
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // API call would go here
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    onSave('Profile information updated successfully');
  };

  return (
    <div className="section-content">
      <h2 className="section-title">Profile Information</h2>
      <p className="section-description">Update your personal account information</p>

      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">First Name</label>
          <input
            type="text"
            className="form-input"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Last Name</label>
          <input
            type="text"
            className="form-input"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
          />
        </div>

        <div className="form-group full-width">
          <label className="form-label">Email Address</label>
          <input
            type="email"
            className="form-input"
            value={formData.email}
            disabled
          />
          <span className="form-hint">Contact support to change your email address</span>
        </div>

        <div className="form-group">
          <label className="form-label">Phone Number</label>
          <input
            type="tel"
            className="form-input"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+44 7700 900000"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Country</label>
          <select className="form-input" value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })}>
            <option>United Kingdom</option>
            <option>United States</option>
            <option>Canada</option>
            <option>Australia</option>
            <option>Other</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Timezone</label>
          <select className="form-input" value={formData.timezone} onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}>
            <option>GMT (London)</option>
            <option>EST (New York)</option>
            <option>PST (Los Angeles)</option>
            <option>CET (Paris)</option>
            <option>IST (Mumbai)</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Language</label>
          <select className="form-input" value={formData.language} onChange={(e) => setFormData({ ...formData, language: e.target.value })}>
            <option>English</option>
            <option>French</option>
            <option>German</option>
            <option>Spanish</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Theme Preference</label>
          <select className="form-input" value={formData.theme} onChange={(e) => setFormData({ ...formData, theme: e.target.value })}>
            <option value="light">Light Mode</option>
            <option value="dark">Dark Mode</option>
            <option value="auto">System Default</option>
          </select>
        </div>
      </div>

      <div className="form-actions">
        <button className="btn secondary">Cancel</button>
        <button className="btn primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <style jsx>{`
        .section-title {
          font-size: 22px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 8px 0;
        }

        .section-description {
          color: #64748b;
          font-size: 14px;
          margin: 0 0 32px 0;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 32px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .form-label {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 8px;
        }

        .form-input {
          padding: 10px 14px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.2s;
        }

        .form-input:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .form-input:disabled {
          background: #f1f5f9;
          color: #94a3b8;
          cursor: not-allowed;
        }

        .form-hint {
          font-size: 12px;
          color: #64748b;
          margin-top: 6px;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          padding-top: 24px;
          border-top: 2px solid #f1f5f9;
        }

        .btn {
          padding: 10px 24px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn.primary {
          background: #6366f1;
          color: white;
        }

        .btn.primary:hover:not(:disabled) {
          background: #4f46e5;
        }

        .btn.secondary {
          background: white;
          color: #6366f1;
          border: 2px solid #e2e8f0;
        }

        .btn.secondary:hover {
          background: #f8fafc;
        }

        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

// Security & Login Component
function SecurityLogin({ user, onSave }) {
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '' };
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;

    if (strength <= 2) return { strength, label: 'Weak', color: '#ef4444' };
    if (strength <= 3) return { strength, label: 'Fair', color: '#f59e0b' };
    if (strength <= 4) return { strength, label: 'Good', color: '#10b981' };
    return { strength, label: 'Strong', color: '#059669' };
  };

  const passwordStrength = getPasswordStrength(passwords.new);

  const handlePasswordChange = async () => {
    if (passwords.new !== passwords.confirm) {
      alert('Passwords do not match');
      return;
    }
    // API call
    onSave('Password updated successfully');
    setPasswords({ current: '', new: '', confirm: '' });
  };

  return (
    <div className="section-content">
      <h2 className="section-title">Security & Login</h2>
      <p className="section-description">Manage your password and security preferences</p>

      {/* Change Password */}
      <div className="security-card">
        <h3 className="card-title">Change Password</h3>
        <div className="form-grid">
          <div className="form-group full-width">
            <label className="form-label">Current Password</label>
            <input
              type="password"
              className="form-input"
              value={passwords.current}
              onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
            />
          </div>

          <div className="form-group full-width">
            <label className="form-label">New Password</label>
            <input
              type="password"
              className="form-input"
              value={passwords.new}
              onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
            />
            {passwords.new && (
              <div className="password-strength">
                <div className="strength-bar">
                  <div 
                    className="strength-fill" 
                    style={{ 
                      width: `${(passwordStrength.strength / 5) * 100}%`,
                      backgroundColor: passwordStrength.color
                    }}
                  />
                </div>
                <span className="strength-label" style={{ color: passwordStrength.color }}>
                  {passwordStrength.label}
                </span>
              </div>
            )}
          </div>

          <div className="form-group full-width">
            <label className="form-label">Confirm New Password</label>
            <input
              type="password"
              className="form-input"
              value={passwords.confirm}
              onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
            />
          </div>
        </div>
        <button className="btn primary" onClick={handlePasswordChange}>
          Update Password
        </button>
      </div>

      {/* Two-Factor Authentication */}
      <div className="security-card">
        <div className="card-header-row">
          <div>
            <h3 className="card-title">Two-Factor Authentication</h3>
            <p className="card-description">Add an extra layer of security to your account</p>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={twoFactorEnabled}
              onChange={(e) => {
                setTwoFactorEnabled(e.target.checked);
                if (e.target.checked) setShowQR(true);
              }}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
        {twoFactorEnabled && (
          <div className="twofa-setup">
            <p>Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)</p>
            <div className="qr-placeholder">
              <div className="qr-code">QR CODE</div>
            </div>
            <p className="form-hint">Or enter this code manually: <strong>ABCD EFGH IJKL MNOP</strong></p>
          </div>
        )}
      </div>

      {/* Active Sessions */}
      <div className="security-card">
        <h3 className="card-title">Active Sessions</h3>
        <p className="card-description">Manage devices where you're currently logged in</p>
        <div className="sessions-list">
          <div className="session-item">
            <div className="session-info">
              <span className="session-device">🖥️ Chrome on macOS</span>
              <span className="session-meta">London, UK • Active now</span>
            </div>
            <button className="btn-text danger">Revoke</button>
          </div>
          <div className="session-item">
            <div className="session-info">
              <span className="session-device">📱 Safari on iPhone</span>
              <span className="session-meta">London, UK • 2 days ago</span>
            </div>
            <button className="btn-text danger">Revoke</button>
          </div>
        </div>
        <button className="btn secondary danger-outline" style={{ marginTop: '16px' }}>
          Log Out of All Devices
        </button>
      </div>

      <style jsx>{`
        .security-card {
          background: #fafbfc;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
        }

        .card-title {
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 4px 0;
        }

        .card-description {
          font-size: 14px;
          color: #64748b;
          margin: 0 0 20px 0;
        }

        .card-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .password-strength {
          margin-top: 8px;
        }

        .strength-bar {
          height: 6px;
          background: #e2e8f0;
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 6px;
        }

        .strength-fill {
          height: 100%;
          transition: all 0.3s;
        }

        .strength-label {
          font-size: 12px;
          font-weight: 600;
        }

        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 48px;
          height: 26px;
        }

        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #cbd5e1;
          transition: 0.3s;
          border-radius: 26px;
        }

        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 20px;
          width: 20px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: 0.3s;
          border-radius: 50%;
        }

        input:checked + .toggle-slider {
          background-color: #6366f1;
        }

        input:checked + .toggle-slider:before {
          transform: translateX(22px);
        }

        .twofa-setup {
          margin-top: 20px;
          padding: 20px;
          background: white;
          border-radius: 8px;
          text-align: center;
        }

        .qr-placeholder {
          margin: 20px 0;
          display: flex;
          justify-content: center;
        }

        .qr-code {
          width: 200px;
          height: 200px;
          background: white;
          border: 2px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: #94a3b8;
          border-radius: 8px;
        }

        .sessions-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .session-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
        }

        .session-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .session-device {
          font-weight: 600;
          color: #1e293b;
          font-size: 14px;
        }

        .session-meta {
          font-size: 13px;
          color: #64748b;
        }

        .btn-text {
          background: none;
          border: none;
          color: #6366f1;
          font-weight: 600;
          cursor: pointer;
          font-size: 14px;
        }

        .btn-text.danger {
          color: #dc2626;
        }

        .danger-outline {
          border-color: #fecaca !important;
          color: #dc2626 !important;
        }

        .danger-outline:hover {
          background: #fef2f2 !important;
        }
      `}</style>
    </div>
  );
}

// Notifications Component
function Notifications({ user, onSave }) {
  const [settings, setSettings] = useState({
    emailJobMatches: true,
    emailMessages: true,
    emailApplications: true,
    emailInterviews: true,
    emailNews: false,
    pushEnabled: false,
    smsEnabled: false
  });

  const handleToggle = (key) => {
    setSettings({ ...settings, [key]: !settings[key] });
    onSave(`Notification preferences updated`);
  };

  return (
    <div className="section-content">
      <h2 className="section-title">Notification Preferences</h2>
      <p className="section-description">Choose how and when you want to receive updates</p>

      <div className="notification-card">
        <h3 className="card-title">Email Notifications</h3>
        <div className="notification-list">
          <NotificationToggle
            label="Job Matches"
            description="Receive notifications when new jobs match your profile"
            checked={settings.emailJobMatches}
            onChange={() => handleToggle('emailJobMatches')}
          />
          <NotificationToggle
            label="New Messages"
            description="Get notified when hiring companies message you"
            checked={settings.emailMessages}
            onChange={() => handleToggle('emailMessages')}
          />
          <NotificationToggle
            label="Application Updates"
            description="Updates on your job applications and their status"
            checked={settings.emailApplications}
            onChange={() => handleToggle('emailApplications')}
          />
          <NotificationToggle
            label="Interview Invitations"
            description="Immediate notifications for interview requests"
            checked={settings.emailInterviews}
            onChange={() => handleToggle('emailInterviews')}
          />
          <NotificationToggle
            label="Platform News & Updates"
            description="Monthly newsletter with platform updates and PMO insights"
            checked={settings.emailNews}
            onChange={() => handleToggle('emailNews')}
          />
        </div>
      </div>

      <div className="notification-card">
        <h3 className="card-title">Push Notifications</h3>
        <p className="card-description">Coming soon - Real-time browser notifications</p>
        <NotificationToggle
          label="Enable Push Notifications"
          description="Get instant updates in your browser"
          checked={settings.pushEnabled}
          onChange={() => handleToggle('pushEnabled')}
          disabled={true}
        />
      </div>

      <div className="notification-card">
        <h3 className="card-title">SMS Notifications</h3>
        <p className="card-description">Verify your phone number to enable SMS alerts</p>
        <NotificationToggle
          label="Enable SMS Notifications"
          description="Receive urgent updates via text message"
          checked={settings.smsEnabled}
          onChange={() => handleToggle('smsEnabled')}
          disabled={!user.phone}
        />
        {!user.phone && (
          <div className="warning-box">
            <span>⚠️</span>
            <span>Add and verify your phone number in Profile Information to enable SMS</span>
          </div>
        )}
      </div>

      <style jsx>{`
        .notification-card {
          background: #fafbfc;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
        }

        .notification-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .warning-box {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: #fef3c7;
          border: 1px solid #fde68a;
          border-radius: 8px;
          margin-top: 16px;
          font-size: 14px;
          color: #92400e;
        }
      `}</style>
    </div>
  );
}

function NotificationToggle({ label, description, checked, onChange, disabled }) {
  return (
    <div className="notification-toggle">
      <div className="toggle-info">
        <span className="toggle-label">{label}</span>
        <span className="toggle-description">{description}</span>
      </div>
      <label className="toggle-switch">
        <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} />
        <span className="toggle-slider"></span>
      </label>

      <style jsx>{`
        .notification-toggle {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
        }

        .toggle-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .toggle-label {
          font-weight: 600;
          color: #1e293b;
          font-size: 14px;
        }

        .toggle-description {
          font-size: 13px;
          color: #64748b;
        }

        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 48px;
          height: 26px;
          flex-shrink: 0;
        }

        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #cbd5e1;
          transition: 0.3s;
          border-radius: 26px;
        }

        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 20px;
          width: 20px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: 0.3s;
          border-radius: 50%;
        }

        input:checked + .toggle-slider {
          background-color: #6366f1;
        }

        input:checked + .toggle-slider:before {
          transform: translateX(22px);
        }

        input:disabled + .toggle-slider {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

// Privacy & Visibility Component
function PrivacyVisibility({ profile, onSave }) {
  const [settings, setSettings] = useState({
    profileVisible: profile?.isPublic ?? true,
    allowMessages: true,
    hideFromCurrentEmployer: false,
    showEmploymentHistory: true
  });

  const handleToggle = (key) => {
    setSettings({ ...settings, [key]: !settings[key] });
    onSave('Privacy settings updated');
  };

  return (
    <div className="section-content">
      <h2 className="section-title">Privacy & Visibility</h2>
      <p className="section-description">Control who can see your information</p>

      <div className="privacy-card">
        <NotificationToggle
          label="Make my profile visible to hiring companies"
          description="Allow employers to discover and view your profile"
          checked={settings.profileVisible}
          onChange={() => handleToggle('profileVisible')}
        />
        <NotificationToggle
          label="Allow companies to message me directly"
          description="Receive direct messages from hiring managers"
          checked={settings.allowMessages}
          onChange={() => handleToggle('allowMessages')}
        />
        <NotificationToggle
          label="Hide from my current employer"
          description="Block your profile from being viewed by your current company's domain"
          checked={settings.hideFromCurrentEmployer}
          onChange={() => handleToggle('hideFromCurrentEmployer')}
        />
        <NotificationToggle
          label="Show my full employment history"
          description="Display all previous positions on your public profile"
          checked={settings.showEmploymentHistory}
          onChange={() => handleToggle('showEmploymentHistory')}
        />
      </div>

      <div className="preview-section">
        <h3 className="card-title">Profile Preview</h3>
        <p className="card-description">See how hiring managers view your profile</p>
        <Link href="/candidate/preview" className="btn primary">
          Preview My Public Profile
        </Link>
      </div>

      <style jsx>{`
        .privacy-card {
          background: #fafbfc;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .preview-section {
          background: #fafbfc;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 24px;
        }

        .btn {
          padding: 10px 24px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-block;
          text-decoration: none;
          text-align: center;
        }

        .btn.primary {
          background: #6366f1;
          color: white;
        }

        .btn.primary:hover {
          background: #4f46e5;
        }
      `}</style>
    </div>
  );
}

// Connected Accounts Component
function ConnectedAccounts({ accounts, onSave }) {
  const availableProviders = [
    { id: 'google', name: 'Google', icon: '🔵', description: 'Sign in with Google' },
    { id: 'linkedin', name: 'LinkedIn', icon: '💼', description: 'Import profile data from LinkedIn' },
    { id: 'microsoft', name: 'Microsoft', icon: '🪟', description: 'Sign in with Microsoft' }
  ];

  const isConnected = (providerId) => accounts.some(acc => acc.provider === providerId);

  const handleConnect = (providerId) => {
    onSave(`${providerId} account connected`);
  };

  const handleDisconnect = (providerId) => {
    if (confirm(`Are you sure you want to disconnect your ${providerId} account?`)) {
      onSave(`${providerId} account disconnected`);
    }
  };

  return (
    <div className="section-content">
      <h2 className="section-title">Connected Accounts</h2>
      <p className="section-description">Link external accounts for easier sign-in and data import</p>

      <div className="accounts-list">
        {availableProviders.map(provider => (
          <div key={provider.id} className="account-card">
            <div className="account-info">
              <span className="account-icon">{provider.icon}</span>
              <div>
                <h3 className="account-name">{provider.name}</h3>
                <p className="account-description">{provider.description}</p>
              </div>
            </div>
            {isConnected(provider.id) ? (
              <button className="btn secondary danger-outline" onClick={() => handleDisconnect(provider.id)}>
                Disconnect
              </button>
            ) : (
              <button className="btn primary" onClick={() => handleConnect(provider.id)}>
                Connect
              </button>
            )}
          </div>
        ))}
      </div>

      <style jsx>{`
        .accounts-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .account-card {
          background: #fafbfc;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .account-info {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .account-icon {
          font-size: 32px;
        }

        .account-name {
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 4px 0;
        }

        .account-description {
          font-size: 13px;
          color: #64748b;
          margin: 0;
        }

        .btn {
          padding: 10px 24px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn.primary {
          background: #6366f1;
          color: white;
        }

        .btn.primary:hover {
          background: #4f46e5;
        }

        .btn.secondary {
          background: white;
          color: #6366f1;
          border: 2px solid #e2e8f0;
        }

        .danger-outline {
          border-color: #fecaca !important;
          color: #dc2626 !important;
        }

        .danger-outline:hover {
          background: #fef2f2 !important;
        }
      `}</style>
    </div>
  );
}

// Account Management Component
function AccountManagement({ user, onSave }) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  return (
    <div className="section-content">
      <h2 className="section-title">Account Management</h2>
      <p className="section-description">Manage your account data and preferences</p>

      {/* Data Export */}
      <div className="management-card">
        <div className="card-content">
          <h3 className="card-title">Download Your Data</h3>
          <p className="card-description">Request a copy of all your account data (GDPR compliant)</p>
        </div>
        <button className="btn secondary">
          Download Data
        </button>
      </div>

      {/* Profile Export */}
      <div className="management-card">
        <div className="card-content">
          <h3 className="card-title">Export Profile as PDF</h3>
          <p className="card-description">Download a formatted PDF version of your profile</p>
        </div>
        <button className="btn secondary">
          Export PDF
        </button>
      </div>

      {/* Danger Zone */}
      <div className="danger-zone">
        <h3 className="danger-title">🚨 Danger Zone</h3>
        <div className="danger-card">
          <div className="card-content">
            <h4 className="card-title">Delete Account</h4>
            <p className="card-description">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
          </div>
          <button className="btn danger" onClick={() => setShowDeleteModal(true)}>
            Delete Account
          </button>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <DeleteAccountModal
          onClose={() => setShowDeleteModal(false)}
          userEmail={user.email}
        />
      )}

      <style jsx>{`
        .management-card {
          background: #fafbfc;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .card-content {
          flex: 1;
        }

        .danger-zone {
          margin-top: 48px;
          padding-top: 32px;
          border-top: 2px solid #f1f5f9;
        }

        .danger-title {
          font-size: 18px;
          font-weight: 700;
          color: #dc2626;
          margin: 0 0 16px 0;
        }

        .danger-card {
          background: #fef2f2;
          border: 2px solid #fecaca;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .btn {
          padding: 10px 24px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .btn.secondary {
          background: white;
          color: #6366f1;
          border: 2px solid #e2e8f0;
        }

        .btn.secondary:hover {
          background: #f8fafc;
        }

        .btn.danger {
          background: #dc2626;
          color: white;
        }

        .btn.danger:hover {
          background: #b91c1c;
        }
      `}</style>
    </div>
  );
}

function DeleteAccountModal({ onClose, userEmail }) {
  const [reason, setReason] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const handleDelete = async () => {
    if (confirmEmail !== userEmail) {
      alert('Email does not match');
      return;
    }
    if (!confirmed) {
      alert('Please confirm you understand this action is permanent');
      return;
    }
    // API call to delete account
    alert('Account deletion initiated');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Delete Account</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="warning-banner">
            <span className="warning-icon">⚠️</span>
            <div>
              <strong>This action is permanent and cannot be undone</strong>
              <p>All your data, applications, and profile information will be permanently deleted.</p>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Why are you leaving? (Optional)</label>
            <textarea
              className="form-textarea"
              rows="4"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Help us improve by sharing your feedback..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Type your email to confirm: <strong>{userEmail}</strong></label>
            <input
              type="email"
              className="form-input"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              placeholder="Enter your email"
            />
          </div>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            <span>I understand this action is permanent and cannot be reversed</span>
          </label>
        </div>

        <div className="modal-footer">
          <button className="btn secondary" onClick={onClose}>Cancel</button>
          <button 
            className="btn danger" 
            onClick={handleDelete}
            disabled={confirmEmail !== userEmail || !confirmed}
          >
            Permanently Delete Account
          </button>
        </div>

        <style jsx>{`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 20px;
          }

          .modal-content {
            background: white;
            border-radius: 16px;
            max-width: 600px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 24px;
            border-bottom: 2px solid #f1f5f9;
          }

          .modal-header h2 {
            font-size: 22px;
            font-weight: 700;
            color: #dc2626;
            margin: 0;
          }

          .modal-close {
            background: none;
            border: none;
            font-size: 24px;
            color: #64748b;
            cursor: pointer;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
          }

          .modal-close:hover {
            background: #f1f5f9;
          }

          .modal-body {
            padding: 24px;
          }

          .warning-banner {
            display: flex;
            gap: 12px;
            background: #fef2f2;
            border: 2px solid #fecaca;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 24px;
          }

          .warning-icon {
            font-size: 24px;
          }

          .warning-banner strong {
            color: #dc2626;
            display: block;
            margin-bottom: 4px;
          }

          .warning-banner p {
            color: #7f1d1d;
            font-size: 14px;
            margin: 0;
          }

          .form-group {
            margin-bottom: 20px;
          }

          .form-label {
            display: block;
            font-size: 14px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 8px;
          }

          .form-input, .form-textarea {
            width: 100%;
            padding: 10px 14px;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            font-size: 14px;
            font-family: inherit;
            box-sizing: border-box;
          }

          .form-input:focus, .form-textarea:focus {
            outline: none;
            border-color: #dc2626;
          }

          .checkbox-label {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            color: #1e293b;
            cursor: pointer;
          }

          .checkbox-label input {
            width: 18px;
            height: 18px;
            cursor: pointer;
          }

          .modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            padding: 24px;
            border-top: 2px solid #f1f5f9;
          }

          .btn {
            padding: 10px 24px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
            border: none;
            cursor: pointer;
            transition: all 0.2s;
          }

          .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .btn.secondary {
            background: white;
            color: #6366f1;
            border: 2px solid #e2e8f0;
          }

          .btn.danger {
            background: #dc2626;
            color: white;
          }

          .btn.danger:hover:not(:disabled) {
            background: #b91c1c;
          }
        `}</style>
      </div>
    </div>
  );
}
