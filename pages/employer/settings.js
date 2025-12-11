import Head from 'next/head';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]';
import { prisma } from '../../lib/prisma';
import Link from 'next/link';
import { useState } from 'react';

export async function getServerSideProps(ctx) {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session) {
    return { redirect: { destination: '/employer-login', permanent: false } };
  }
  if ((session.user.role || '').toLowerCase() !== 'employer') {
    return { redirect: { destination: '/dashboard/candidate', permanent: false } };
  }
  
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { 
      employerEmployerProfile: true
    }
  });

  const profile = user?.employerEmployerProfile || null;

  return { 
    props: { 
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt.toISOString()
      },
      profile: profile ? {
        id: profile.id,
        companyName: profile.companyName || '',
        contactName: profile.contactName || '',
        phone: profile.phone || '',
        website: profile.website || ''
      } : null
    } 
  };
}

export default function EmployerSettings({ user, profile }) {
  const [activeTab, setActiveTab] = useState('company');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  // Form states
  const [companyData, setCompanyData] = useState({
    companyName: profile?.companyName || '',
    legalName: '',
    industry: '',
    companySize: '',
    location: '',
    description: '',
    website: profile?.website || '',
    linkedin: '',
    twitter: ''
  });

  const [contactData, setContactData] = useState({
    primaryName: profile?.contactName || '',
    primaryEmail: user.email,
    primaryPhone: profile?.phone || '',
    billingEmail: ''
  });

  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false
  });

  const [notificationPrefs, setNotificationPrefs] = useState({
    newApplicants: true,
    applicationUpdates: true,
    weeklyReports: true,
    jobAnalytics: true,
    billingAlerts: true,
    systemMessages: true,
    marketingEmails: false
  });

  const [subscription, setSubscription] = useState({
    plan: 'Free Trial',
    renewalDate: '2025-12-28',
    jobCredits: 5,
    aiCredits: 10
  });

  const tabs = [
    { id: 'company', label: 'Company Information', icon: '🏢' },
    { id: 'contact', label: 'Contact Details', icon: '📧' },
    { id: 'subscription', label: 'Subscription & Billing', icon: '💳' },
    { id: 'security', label: 'Security & Login', icon: '🔒' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'team', label: 'Team Management', icon: '👥' },
    { id: 'danger', label: 'Danger Zone', icon: '⚠️' }
  ];

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };

  const handleSaveCompany = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/employer/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'company', data: companyData })
      });
      if (res.ok) {
        showToast('Company information saved');
      } else {
        showToast('Failed to save');
      }
    } catch (error) {
      showToast('Error saving changes');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveContact = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/employer/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'contact', data: contactData })
      });
      if (res.ok) {
        showToast('Contact details saved');
      } else {
        showToast('Failed to save');
      }
    } catch (error) {
      showToast('Error saving changes');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSecurity = async (e) => {
    e.preventDefault();
    if (securityData.newPassword !== securityData.confirmPassword) {
      showToast('Passwords do not match');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/employer/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          currentPassword: securityData.currentPassword,
          newPassword: securityData.newPassword
        })
      });
      if (res.ok) {
        showToast('Password updated successfully');
        setSecurityData({ currentPassword: '', newPassword: '', confirmPassword: '', twoFactorEnabled: false });
      } else {
        showToast('Failed to update password');
      }
    } catch (error) {
      showToast('Error updating password');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/employer/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'notifications', data: notificationPrefs })
      });
      if (res.ok) {
        showToast('Notification preferences saved');
      } else {
        showToast('Failed to save');
      }
    } catch (error) {
      showToast('Error saving changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Head>
        <title>Account Settings – Employer Dashboard</title>
        <meta name="description" content="Manage your employer account settings" />
      </Head>

      <div className="settings-page">
        {/* Header */}
        <header className="settings-header">
          <div className="header-content">
            <Link href="/dashboard/employer" className="back-link">
              ← Back to Dashboard
            </Link>
            <div className="header-title">
              <h1>Account Settings</h1>
              <p className="subtitle">Manage your employer account and preferences</p>
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

          {/* Tab Content */}
          <main className="settings-content">
            {/* Company Information */}
            {activeTab === 'company' && (
              <div className="settings-section">
                <div className="section-header">
                  <h2>Company Information</h2>
                  <p>Update your company details and branding</p>
                </div>
                <form onSubmit={handleSaveCompany} className="settings-form">
                  <div className="form-group">
                    <label>Company Name *</label>
                    <input
                      type="text"
                      value={companyData.companyName}
                      onChange={(e) => setCompanyData({...companyData, companyName: e.target.value})}
                      placeholder="Acme Corporation"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Legal Entity Name</label>
                    <input
                      type="text"
                      value={companyData.legalName}
                      onChange={(e) => setCompanyData({...companyData, legalName: e.target.value})}
                      placeholder="Acme Corp Ltd."
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Industry</label>
                      <select
                        value={companyData.industry}
                        onChange={(e) => setCompanyData({...companyData, industry: e.target.value})}
                      >
                        <option value="">Select industry</option>
                        <option value="technology">Technology</option>
                        <option value="finance">Finance & Banking</option>
                        <option value="healthcare">Healthcare</option>
                        <option value="retail">Retail</option>
                        <option value="manufacturing">Manufacturing</option>
                        <option value="consulting">Consulting</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Company Size</label>
                      <select
                        value={companyData.companySize}
                        onChange={(e) => setCompanyData({...companyData, companySize: e.target.value})}
                      >
                        <option value="">Select size</option>
                        <option value="1-10">1-10 employees</option>
                        <option value="11-50">11-50 employees</option>
                        <option value="51-200">51-200 employees</option>
                        <option value="201-500">201-500 employees</option>
                        <option value="501-1000">501-1000 employees</option>
                        <option value="1000+">1000+ employees</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Headquarters Location</label>
                    <input
                      type="text"
                      value={companyData.location}
                      onChange={(e) => setCompanyData({...companyData, location: e.target.value})}
                      placeholder="London, UK"
                    />
                  </div>
                  <div className="form-group">
                    <label>Company Description</label>
                    <textarea
                      value={companyData.description}
                      onChange={(e) => setCompanyData({...companyData, description: e.target.value})}
                      placeholder="Brief description of your company..."
                      rows={4}
                    />
                  </div>
                  <div className="form-group">
                    <label>Website</label>
                    <input
                      type="url"
                      value={companyData.website}
                      onChange={(e) => setCompanyData({...companyData, website: e.target.value})}
                      placeholder="https://example.com"
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>LinkedIn</label>
                      <input
                        type="url"
                        value={companyData.linkedin}
                        onChange={(e) => setCompanyData({...companyData, linkedin: e.target.value})}
                        placeholder="https://linkedin.com/company/..."
                      />
                    </div>
                    <div className="form-group">
                      <label>Twitter</label>
                      <input
                        type="url"
                        value={companyData.twitter}
                        onChange={(e) => setCompanyData({...companyData, twitter: e.target.value})}
                        placeholder="https://twitter.com/..."
                      />
                    </div>
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn-primary" disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Contact Details */}
            {activeTab === 'contact' && (
              <div className="settings-section">
                <div className="section-header">
                  <h2>Contact Details</h2>
                  <p>Manage your primary contact information</p>
                </div>
                <form onSubmit={handleSaveContact} className="settings-form">
                  <div className="form-group">
                    <label>Primary Contact Name *</label>
                    <input
                      type="text"
                      value={contactData.primaryName}
                      onChange={(e) => setContactData({...contactData, primaryName: e.target.value})}
                      placeholder="John Smith"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Primary Contact Email *</label>
                    <input
                      type="email"
                      value={contactData.primaryEmail}
                      onChange={(e) => setContactData({...contactData, primaryEmail: e.target.value})}
                      placeholder="john@company.com"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Primary Contact Phone</label>
                    <input
                      type="tel"
                      value={contactData.primaryPhone}
                      onChange={(e) => setContactData({...contactData, primaryPhone: e.target.value})}
                      placeholder="+44 20 1234 5678"
                    />
                  </div>
                  <div className="form-group">
                    <label>Billing Email</label>
                    <input
                      type="email"
                      value={contactData.billingEmail}
                      onChange={(e) => setContactData({...contactData, billingEmail: e.target.value})}
                      placeholder="billing@company.com"
                    />
                    <span className="help-text">Invoices and payment receipts will be sent here</span>
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn-primary" disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Subscription & Billing */}
            {activeTab === 'subscription' && (
              <div className="settings-section">
                <div className="section-header">
                  <h2>Subscription & Billing</h2>
                  <p>Manage your subscription plan and billing details</p>
                </div>
                
                {/* Current Plan Summary */}
                <div className="plan-card">
                  <div className="plan-header">
                    <div>
                      <h3>{subscription.plan}</h3>
                      <p className="plan-meta">Renews on {subscription.renewalDate}</p>
                    </div>
                    <button className="btn-primary">Upgrade Plan</button>
                  </div>
                  <div className="plan-stats">
                    <div className="stat">
                      <span className="stat-value">{subscription.jobCredits}</span>
                      <span className="stat-label">Job Credits Remaining</span>
                    </div>
                    <div className="stat">
                      <span className="stat-value">{subscription.aiCredits}</span>
                      <span className="stat-label">AI Screening Credits</span>
                    </div>
                  </div>
                </div>

                {/* Billing History */}
                <div className="billing-section">
                  <h3>Billing History</h3>
                  <div className="billing-table">
                    <div className="billing-row header">
                      <span>Date</span>
                      <span>Description</span>
                      <span>Amount</span>
                      <span>Status</span>
                      <span>Invoice</span>
                    </div>
                    <div className="billing-row">
                      <span>Nov 28, 2025</span>
                      <span>Monthly Subscription</span>
                      <span>£99.00</span>
                      <span className="status-paid">Paid</span>
                      <button className="btn-link">Download</button>
                    </div>
                    <div className="billing-row">
                      <span>Oct 28, 2025</span>
                      <span>Monthly Subscription</span>
                      <span>£99.00</span>
                      <span className="status-paid">Paid</span>
                      <button className="btn-link">Download</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security & Login */}
            {activeTab === 'security' && (
              <div className="settings-section">
                <div className="section-header">
                  <h2>Security & Login</h2>
                  <p>Manage your password and security settings</p>
                </div>
                <form onSubmit={handleSaveSecurity} className="settings-form">
                  <div className="form-group">
                    <label>Current Password *</label>
                    <input
                      type="password"
                      value={securityData.currentPassword}
                      onChange={(e) => setSecurityData({...securityData, currentPassword: e.target.value})}
                      placeholder="Enter current password"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>New Password *</label>
                    <input
                      type="password"
                      value={securityData.newPassword}
                      onChange={(e) => setSecurityData({...securityData, newPassword: e.target.value})}
                      placeholder="Enter new password"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Confirm New Password *</label>
                    <input
                      type="password"
                      value={securityData.confirmPassword}
                      onChange={(e) => setSecurityData({...securityData, confirmPassword: e.target.value})}
                      placeholder="Confirm new password"
                      required
                    />
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn-primary" disabled={saving}>
                      {saving ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </form>

                <div className="security-card">
                  <h3>Two-Factor Authentication</h3>
                  <p>Add an extra layer of security to your account</p>
                  <button className="btn-secondary">Enable 2FA</button>
                </div>
              </div>
            )}

            {/* Notifications */}
            {activeTab === 'notifications' && (
              <div className="settings-section">
                <div className="section-header">
                  <h2>Notification Preferences</h2>
                  <p>Choose which notifications you want to receive</p>
                </div>
                <form onSubmit={handleSaveNotifications} className="settings-form">
                  <div className="toggle-group">
                    <div className="toggle-item">
                      <div className="toggle-info">
                        <strong>New Applicants</strong>
                        <span>Get notified when candidates apply to your jobs</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={notificationPrefs.newApplicants}
                        onChange={(e) => setNotificationPrefs({...notificationPrefs, newApplicants: e.target.checked})}
                      />
                    </div>
                    <div className="toggle-item">
                      <div className="toggle-info">
                        <strong>Application Updates</strong>
                        <span>Status changes and candidate responses</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={notificationPrefs.applicationUpdates}
                        onChange={(e) => setNotificationPrefs({...notificationPrefs, applicationUpdates: e.target.checked})}
                      />
                    </div>
                    <div className="toggle-item">
                      <div className="toggle-info">
                        <strong>Weekly Talent Reports</strong>
                        <span>Summary of hiring activity and insights</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={notificationPrefs.weeklyReports}
                        onChange={(e) => setNotificationPrefs({...notificationPrefs, weeklyReports: e.target.checked})}
                      />
                    </div>
                    <div className="toggle-item">
                      <div className="toggle-info">
                        <strong>Job Analytics</strong>
                        <span>Performance metrics for your job postings</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={notificationPrefs.jobAnalytics}
                        onChange={(e) => setNotificationPrefs({...notificationPrefs, jobAnalytics: e.target.checked})}
                      />
                    </div>
                    <div className="toggle-item">
                      <div className="toggle-info">
                        <strong>Billing Alerts</strong>
                        <span>Subscription renewals and payment reminders</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={notificationPrefs.billingAlerts}
                        onChange={(e) => setNotificationPrefs({...notificationPrefs, billingAlerts: e.target.checked})}
                      />
                    </div>
                    <div className="toggle-item">
                      <div className="toggle-info">
                        <strong>System Messages</strong>
                        <span>Important updates about the platform</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={notificationPrefs.systemMessages}
                        onChange={(e) => setNotificationPrefs({...notificationPrefs, systemMessages: e.target.checked})}
                      />
                    </div>
                    <div className="toggle-item">
                      <div className="toggle-info">
                        <strong>Marketing Emails</strong>
                        <span>Product updates and hiring tips</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={notificationPrefs.marketingEmails}
                        onChange={(e) => setNotificationPrefs({...notificationPrefs, marketingEmails: e.target.checked})}
                      />
                    </div>
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn-primary" disabled={saving}>
                      {saving ? 'Saving...' : 'Save Preferences'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Team Management */}
            {activeTab === 'team' && (
              <div className="settings-section">
                <div className="section-header">
                  <h2>Team Management</h2>
                  <p>Invite team members and manage permissions</p>
                </div>
                <div className="team-invite">
                  <input type="email" placeholder="Enter email address" className="invite-input" />
                  <button className="btn-primary">Send Invite</button>
                </div>
                <div className="team-list">
                  <div className="team-member">
                    <div className="member-info">
                      <div className="member-avatar">JS</div>
                      <div>
                        <strong>John Smith</strong>
                        <span className="member-email">john@company.com</span>
                      </div>
                    </div>
                    <span className="member-role">Admin</span>
                    <span className="member-status active">Active</span>
                  </div>
                </div>
              </div>
            )}

            {/* Danger Zone */}
            {activeTab === 'danger' && (
              <div className="settings-section">
                <div className="section-header">
                  <h2>Danger Zone</h2>
                  <p>Irreversible account actions</p>
                </div>
                <div className="danger-card">
                  <div className="danger-info">
                    <strong>Export Company Data</strong>
                    <span>Download all your company data and applicant information</span>
                  </div>
                  <button className="btn-secondary">Export Data</button>
                </div>
                <div className="danger-card">
                  <div className="danger-info">
                    <strong>Delete Employer Account</strong>
                    <span>Permanently delete your account and all associated data</span>
                  </div>
                  <button className="btn-danger">Delete Account</button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      <style jsx>{`
        .settings-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding-bottom: 4rem;
        }

        .settings-header {
          background: white;
          border-bottom: 1px solid #e5e7eb;
          padding: 2rem 0;
          margin-bottom: 2rem;
        }

        .header-content {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: #6b7280;
          text-decoration: none;
          font-size: 0.875rem;
          margin-bottom: 1rem;
          transition: color 0.2s;
        }

        .back-link:hover {
          color: #111827;
        }

        .header-title h1 {
          font-size: 2rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 0.5rem 0;
        }

        .subtitle {
          color: #6b7280;
          margin: 0;
        }

        .toast-notification {
          position: fixed;
          top: 2rem;
          right: 2rem;
          background: #10b981;
          color: white;
          padding: 1rem 1.5rem;
          border-radius: 0.5rem;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          z-index: 1000;
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .settings-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 2rem;
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 2rem;
          align-items: start;
        }

        .settings-nav {
          background: white;
          border-radius: 1rem;
          padding: 1rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          position: sticky;
          top: 2rem;
        }

        .nav-tab {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.875rem 1rem;
          border: none;
          background: transparent;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
          font-size: 0.9375rem;
          color: #6b7280;
        }

        .nav-tab:hover {
          background: #f3f4f6;
          color: #111827;
        }

        .nav-tab.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .tab-icon {
          font-size: 1.25rem;
        }

        .settings-content {
          background: white;
          border-radius: 1rem;
          padding: 2rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          min-height: 600px;
        }

        .settings-section {
          max-width: 800px;
        }

        .section-header {
          margin-bottom: 2rem;
        }

        .section-header h2 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 0.5rem 0;
        }

        .section-header p {
          color: #6b7280;
          margin: 0;
        }

        .settings-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-weight: 500;
          color: #374151;
          font-size: 0.875rem;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          padding: 0.75rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          font-size: 0.9375rem;
          transition: border-color 0.2s;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #667eea;
        }

        .form-group textarea {
          resize: vertical;
          font-family: inherit;
        }

        .help-text {
          font-size: 0.8125rem;
          color: #6b7280;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 0.5rem;
          font-weight: 500;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .btn-primary:hover:not(:disabled) {
          opacity: 0.9;
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: white;
          color: #374151;
          padding: 0.75rem 1.5rem;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .btn-secondary:hover {
          background: #f9fafb;
        }

        .btn-danger {
          background: #ef4444;
          color: white;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 0.5rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .btn-danger:hover {
          background: #dc2626;
        }

        .btn-link {
          background: none;
          border: none;
          color: #667eea;
          cursor: pointer;
          font-size: 0.875rem;
          text-decoration: underline;
        }

        .plan-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 2rem;
          border-radius: 1rem;
          margin-bottom: 2rem;
        }

        .plan-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .plan-header h3 {
          font-size: 1.5rem;
          margin: 0 0 0.5rem 0;
        }

        .plan-meta {
          font-size: 0.875rem;
          opacity: 0.9;
          margin: 0;
        }

        .plan-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2rem;
        }

        .stat {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 700;
        }

        .stat-label {
          font-size: 0.875rem;
          opacity: 0.9;
        }

        .billing-section {
          margin-top: 2rem;
        }

        .billing-section h3 {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0 0 1rem 0;
        }

        .billing-table {
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          overflow: hidden;
        }

        .billing-row {
          display: grid;
          grid-template-columns: 1fr 2fr 1fr 1fr 1fr;
          gap: 1rem;
          padding: 1rem;
          align-items: center;
        }

        .billing-row.header {
          background: #f9fafb;
          font-weight: 600;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .billing-row:not(.header) {
          border-top: 1px solid #e5e7eb;
          font-size: 0.9375rem;
        }

        .status-paid {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          background: #d1fae5;
          color: #065f46;
          border-radius: 9999px;
          font-size: 0.8125rem;
          font-weight: 500;
        }

        .security-card {
          background: #f9fafb;
          padding: 1.5rem;
          border-radius: 0.5rem;
          margin-top: 2rem;
        }

        .security-card h3 {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0 0 0.5rem 0;
        }

        .security-card p {
          color: #6b7280;
          margin: 0 0 1rem 0;
        }

        .toggle-group {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .toggle-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: #f9fafb;
          border-radius: 0.5rem;
        }

        .toggle-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .toggle-info strong {
          font-size: 0.9375rem;
          color: #111827;
        }

        .toggle-info span {
          font-size: 0.8125rem;
          color: #6b7280;
        }

        .toggle-item input[type="checkbox"] {
          width: 44px;
          height: 24px;
          cursor: pointer;
        }

        .team-invite {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .invite-input {
          flex: 1;
          padding: 0.75rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
        }

        .team-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .team-member {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          background: #f9fafb;
          border-radius: 0.5rem;
        }

        .member-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .member-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
        }

        .member-email {
          display: block;
          font-size: 0.8125rem;
          color: #6b7280;
        }

        .member-role {
          padding: 0.25rem 0.75rem;
          background: #e0e7ff;
          color: #4338ca;
          border-radius: 9999px;
          font-size: 0.8125rem;
          font-weight: 500;
        }

        .member-status {
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.8125rem;
          font-weight: 500;
        }

        .member-status.active {
          background: #d1fae5;
          color: #065f46;
        }

        .danger-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border: 1px solid #fecaca;
          background: #fef2f2;
          border-radius: 0.5rem;
          margin-bottom: 1rem;
        }

        .danger-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .danger-info strong {
          color: #991b1b;
        }

        .danger-info span {
          font-size: 0.875rem;
          color: #6b7280;
        }

        @media (max-width: 1024px) {
          .settings-container {
            grid-template-columns: 1fr;
          }

          .settings-nav {
            position: static;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          }
        }

        @media (max-width: 640px) {
          .form-row {
            grid-template-columns: 1fr;
          }

          .billing-row {
            grid-template-columns: 1fr;
            gap: 0.5rem;
          }

          .billing-row span {
            display: flex;
            justify-content: space-between;
          }

          .billing-row.header span::before {
            content: attr(data-label);
            font-weight: 600;
          }
        }
      `}</style>
    </>
  );
}