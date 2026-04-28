import Head from 'next/head';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getServerSession } from 'next-auth/next';
import { signOut } from 'next-auth/react';
import { authOptions } from '../api/auth/[...nextauth]';

const SUPPORT_ROLES = ['SUPPORT_AGENT', 'SUPPORT_MANAGER', 'SUPER_ADMIN', 'ADMIN'];

async function fetchJson(url, options) {
  console.log(`[API] ${options?.method || 'GET'} ${url}`);
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
    console.error(`[API Error] ${error.message}`);
    throw error;
  }
  console.log(`[API] Success: ${url}`);
  return data;
}

function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function mapRoleBadge(role) {
  const normalized = (role || '').toUpperCase();
  if (['SUPER_ADMIN', 'ADMIN'].includes(normalized)) return 'critical';
  if (normalized === 'SUPPORT_MANAGER') return 'warning';
  if (normalized === 'SUPPORT_AGENT') return 'ok';
  return 'muted';
}

export async function getServerSideProps(ctx) {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session) {
    return { redirect: { destination: '/auth/login', permanent: false } };
  }

  const role = (session.user.role || '').toUpperCase();
  if (!SUPPORT_ROLES.includes(role)) {
    return { redirect: { destination: '/dashboard', permanent: false } };
  }

  return {
    props: {
      actor: {
        id: session.user.id,
        email: session.user.email,
        role,
      },
    },
  };
}

export default function AdminSupportPortal({ actor }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboard, setDashboard] = useState(null);
  const [dashboardError, setDashboardError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchRole, setSearchRole] = useState('');
  const [searchStatus, setSearchStatus] = useState('');
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userActionLoading, setUserActionLoading] = useState(false);

  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketsError, setTicketsError] = useState('');
  const [ticketForm, setTicketForm] = useState({
    targetUserId: '',
    targetType: 'USER',
    category: 'LOGIN_ISSUE',
    priority: 'MEDIUM',
    subject: '',
    description: '',
  });
  const [selectedTicketId, setSelectedTicketId] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketNote, setTicketNote] = useState('');
  const [ticketNoteVisibility, setTicketNoteVisibility] = useState('public');

  const [auditItems, setAuditItems] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const [templates, setTemplates] = useState([]);
  const [messageForm, setMessageForm] = useState({ templateKey: '', subject: '', body: '' });
  const [messageToUserId, setMessageToUserId] = useState('');
  const [messageLoading, setMessageLoading] = useState(false);
  const [messageStatus, setMessageStatus] = useState('');

  const managerOrAbove = useMemo(
    () => ['SUPPORT_MANAGER', 'SUPER_ADMIN', 'ADMIN'].includes((actor?.role || '').toUpperCase()),
    [actor?.role],
  );

  const loadDashboard = useCallback(async () => {
    try {
      setDashboardError('');
      const data = await fetchJson('/api/admin/support/dashboard');
      setDashboard(data);
    } catch (error) {
      setDashboardError(error.message);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      setUsersError('');
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (searchRole) params.set('role', searchRole);
      if (searchStatus) params.set('accountStatus', searchStatus);
      const data = await fetchJson(`/api/admin/support/users/search?${params.toString()}`);
      setUsers(data.users || []);
    } catch (error) {
      setUsersError(error.message);
    } finally {
      setUsersLoading(false);
    }
  }, [searchQuery, searchRole, searchStatus]);

  const loadUserDetail = useCallback(async (userId) => {
    const data = await fetchJson(`/api/admin/support/users/${userId}`);
    setSelectedUser(data.user || null);
  }, []);

  const runUserAction = useCallback(async (action, payload = {}) => {
    if (!selectedUser?.id) return;
    try {
      setUserActionLoading(true);
      await fetchJson(`/api/admin/support/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
      });
      await Promise.all([loadUserDetail(selectedUser.id), loadDashboard(), loadUsers()]);
    } catch (error) {
      alert(error.message);
    } finally {
      setUserActionLoading(false);
    }
  }, [selectedUser?.id, loadDashboard, loadUserDetail, loadUsers]);

  const loadTickets = useCallback(async () => {
    try {
      setTicketsLoading(true);
      setTicketsError('');
      const data = await fetchJson('/api/admin/support/tickets');
      setTickets(data.tickets || []);
      if (!selectedTicketId && data.tickets?.[0]?.id) setSelectedTicketId(data.tickets[0].id);
    } catch (error) {
      setTicketsError(error.message);
    } finally {
      setTicketsLoading(false);
    }
  }, [selectedTicketId]);

  const loadTicketDetail = useCallback(async (ticketId) => {
    if (!ticketId) {
      setSelectedTicket(null);
      return;
    }
    const data = await fetchJson(`/api/admin/support/tickets/${ticketId}`);
    setSelectedTicket(data.ticket || null);
  }, []);

  const loadAudit = useCallback(async () => {
    try {
      setAuditLoading(true);
      const data = await fetchJson('/api/admin/support/audit?pageSize=25');
      setAuditItems(data.items || []);
    } catch {
      setAuditItems([]);
    } finally {
      setAuditLoading(false);
    }
  }, []);

  const loadTemplates = useCallback(async () => {
    try {
      const data = await fetchJson('/api/admin/support/communications/templates');
      setTemplates(data.templates || []);
      if (data.templates?.length > 0) {
        setMessageForm({
          templateKey: data.templates[0].key,
          subject: data.templates[0].subject,
          body: data.templates[0].body,
        });
      }
    } catch {
      setTemplates([]);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
    loadUsers();
    loadTickets();
    loadAudit();
    loadTemplates();
  }, [loadAudit, loadDashboard, loadTemplates, loadTickets, loadUsers]);

  useEffect(() => {
    if (selectedTicketId) loadTicketDetail(selectedTicketId);
  }, [selectedTicketId, loadTicketDetail]);

  const handleCreateTicket = useCallback(async (event) => {
    event.preventDefault();
    try {
      await fetchJson('/api/admin/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketForm),
      });
      setTicketForm((current) => ({ ...current, subject: '', description: '' }));
      await Promise.all([loadTickets(), loadDashboard(), loadAudit()]);
    } catch (error) {
      alert(error.message);
    }
  }, [ticketForm, loadAudit, loadDashboard, loadTickets]);

  const handleTicketStatus = useCallback(async (status) => {
    if (!selectedTicketId) return;
    try {
      await fetchJson(`/api/admin/support/tickets/${selectedTicketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'UPDATE_STATUS', payload: { status } }),
      });
      await Promise.all([loadTickets(), loadTicketDetail(selectedTicketId), loadDashboard(), loadAudit()]);
    } catch (error) {
      alert(error.message);
    }
  }, [selectedTicketId, loadAudit, loadDashboard, loadTicketDetail, loadTickets]);

  const handleAddNote = useCallback(async () => {
    if (!selectedTicketId || !ticketNote.trim()) return;
    try {
      await fetchJson(`/api/admin/support/tickets/${selectedTicketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ADD_NOTE', payload: { note: ticketNote.trim(), isInternal: ticketNoteVisibility === 'internal' } }),
      });
      setTicketNote('');
      setTicketNoteVisibility('public');
      await Promise.all([loadTicketDetail(selectedTicketId), loadTickets(), loadAudit()]);
    } catch (error) {
      alert(error.message);
    }
  }, [selectedTicketId, ticketNote, ticketNoteVisibility, loadAudit, loadTicketDetail, loadTickets]);

  const handleTemplateSelect = useCallback((key) => {
    const selected = templates.find((template) => template.key === key);
    if (!selected) return;
    setMessageForm({
      templateKey: selected.key,
      subject: selected.subject,
      body: selected.body,
    });
  }, [templates]);

  const handleSendMessage = useCallback(async (event) => {
    event.preventDefault();
    try {
      setMessageLoading(true);
      setMessageStatus('');
      await fetchJson('/api/admin/support/communications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: messageToUserId || selectedUser?.id || null,
          subject: messageForm.subject,
          body: messageForm.body,
          variables: {
            name: selectedUser?.candidateCandidateProfile?.fullName || selectedUser?.employerEmployerProfile?.contactName || selectedUser?.email || 'there',
            verificationStatus: selectedUser?.verificationStatus || '',
            userId: selectedUser?.id || '',
          },
          ticketId: selectedTicketId || null,
        }),
      });
      setMessageStatus('Support email sent successfully.');
      await loadAudit();
    } catch (error) {
      setMessageStatus(error.message);
    } finally {
      setMessageLoading(false);
    }
  }, [messageForm.body, messageForm.subject, messageToUserId, selectedTicketId, selectedUser, loadAudit]);

  return (
    <>
      <Head>
        <title>Admin Support Portal – PMO Network</title>
        <meta name="description" content="Internal support operations portal for PMO Network." />
      </Head>

      <div className="support-portal">
        <header className="portal-header">
          <div>
            <h1>Admin Support Portal</h1>
            <p>Security-first tooling for user management, issue triage, and operational visibility.</p>
          </div>
          <div className="header-actions">
            <span className={`role-chip ${mapRoleBadge(actor.role)}`}>{actor.role}</span>
            <button type="button" className="ghost-btn" onClick={() => signOut({ callbackUrl: '/auth/login' })}>Sign out</button>
          </div>
        </header>

        <nav className="tabs" aria-label="Admin Support Sections">
          {[
            { key: 'dashboard', label: 'Dashboard' },
            { key: 'users', label: 'User Management' },
            { key: 'tickets', label: 'Issue Triage' },
            { key: 'communications', label: 'Communications' },
            { key: 'audit', label: 'Audit Logs' },
          ].map((tab) => (
            <button
              key={tab.key}
              className={`tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {activeTab === 'dashboard' && (
          <section className="section-grid">
            <div className="card card-span-2">
              <div className="row-between">
                <h2>System Health</h2>
                <button className="ghost-btn" onClick={loadDashboard} type="button">↻ Refresh</button>
              </div>
              {dashboardError ? <p className="error">{dashboardError}</p> : !dashboard ? (
                <p style={{ color: '#9ca3af' }}>Loading metrics…</p>
              ) : (
                <div className="metrics-grid">
                  <div className="metric"><span>Active Users</span><strong>{dashboard?.metrics?.activeUsers ?? '—'}</strong></div>
                  <div className="metric"><span>Flagged Accounts</span><strong>{dashboard?.metrics?.flaggedAccounts ?? '—'}</strong></div>
                  <div className="metric"><span>Open Support Issues</span><strong>{dashboard?.metrics?.openSupportIssues ?? '—'}</strong></div>
                  <div className="metric"><span>Urgent Cases</span><strong>{dashboard?.metrics?.urgentCases ?? '—'}</strong></div>
                </div>
              )}
            </div>

            <div className="card">
              <h2>Alerts</h2>
              <ul className="simple-list">
                {(dashboard?.alerts || []).length === 0 && <li>No urgent alerts.</li>}
                {(dashboard?.alerts || []).map((alert, index) => (
                  <li key={`${alert.level}-${index}`} className={`alert ${alert.level}`}>{alert.message}</li>
                ))}
              </ul>
            </div>

            <div className="card">
              <h2>Suspicious Activity (24h)</h2>
              <ul className="simple-list">
                {(dashboard?.suspicious || []).length === 0 && <li>No suspicious clusters detected.</li>}
                {(dashboard?.suspicious || []).map((item) => (
                  <li key={item.email}>{item.email} — {item.failedAttempts24h} failed attempts</li>
                ))}
              </ul>
            </div>

            <div className="card card-span-2">
              <h2>Recent Admin Actions</h2>
              <ul className="simple-list">
                {(dashboard?.recentAdminActions || []).length === 0 && <li>No actions logged yet.</li>}
                {(dashboard?.recentAdminActions || []).map((entry) => (
                  <li key={entry.id}>
                    <strong>{entry.action}</strong> · {entry.summary}<br />
                    <span className="muted">{entry.actor?.email || 'Unknown'} · {formatDateTime(entry.createdAt)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {activeTab === 'users' && (
          <section className="section-grid">
            <div className="card card-span-2">
              <h2>User Search & Segmentation</h2>
              <form
                className="inline-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  loadUsers();
                }}
              >
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by ID, email, username, full name, company"
                />
                <select value={searchRole} onChange={(event) => setSearchRole(event.target.value)}>
                  <option value="">All roles</option>
                  <option value="CANDIDATE">Candidate</option>
                  <option value="EMPLOYER">Employer</option>
                  <option value="USER">User</option>
                  <option value="SUPPORT_AGENT">Support Agent</option>
                  <option value="SUPPORT_MANAGER">Support Manager</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="ADMIN">Admin</option>
                </select>
                <select value={searchStatus} onChange={(event) => setSearchStatus(event.target.value)}>
                  <option value="">All statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="LOCKED">Locked</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="DEACTIVATED">Deactivated</option>
                </select>
                <button type="submit" className="primary-btn">Search</button>
              </form>
              {usersError && <p className="error">{usersError}</p>}
              <div className="user-list">
                {usersLoading && <p className="muted">Loading users…</p>}
                {!usersLoading && users.length === 0 && <p className="muted">No users found.</p>}
                {users.map((user) => (
                  <button
                    key={user.id}
                    className={`user-item ${selectedUser?.id === user.id ? 'active' : ''}`}
                    type="button"
                    onClick={() => loadUserDetail(user.id)}
                  >
                    <div>
                      <strong>{user.email}</strong>
                      <p>{user.candidateCandidateProfile?.fullName || user.employerEmployerProfile?.companyName || user.username || '—'}</p>
                    </div>
                    <span className="muted">{user.role} · {user.accountStatus}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="card">
              <h2>Account Detail & Actions</h2>
              {!selectedUser && <p className="muted">Select a user to manage account actions.</p>}
              {selectedUser && (
                <>
                  <p><strong>ID:</strong> {selectedUser.id}</p>
                  <p><strong>Email:</strong> {selectedUser.email}</p>
                  <p><strong>Username:</strong> {selectedUser.username || '—'}</p>
                  <p><strong>Role:</strong> {selectedUser.role}</p>
                  <p><strong>Status:</strong> {selectedUser.accountStatus}</p>
                  <p><strong>Verification:</strong> {selectedUser.verificationStatus}</p>
                  <p><strong>Failed Logins:</strong> {selectedUser.failedLoginAttempts ?? 0}</p>
                  <p><strong>Last Login:</strong> {formatDateTime(selectedUser.lastLoginAt)}</p>

                  <div className="actions-grid">
                    <button className="primary-btn" type="button" disabled={userActionLoading} onClick={() => runUserAction('TRIGGER_PASSWORD_RESET', { sendEmail: true })}>Trigger Password Reset</button>
                    <button className="ghost-btn" type="button" disabled={userActionLoading} onClick={() => runUserAction('LOCK_ACCOUNT')}>Lock Account</button>
                    <button className="ghost-btn" type="button" disabled={userActionLoading} onClick={() => runUserAction('UNLOCK_ACCOUNT')}>Unlock Account</button>
                    <button className="ghost-btn" type="button" disabled={userActionLoading} onClick={() => runUserAction('SUSPEND_ACCOUNT')}>Suspend Account</button>
                    <button className="ghost-btn" type="button" disabled={userActionLoading} onClick={() => runUserAction('UNSUSPEND_ACCOUNT')}>Unsuspend Account</button>
                    <button className="ghost-btn" type="button" disabled={userActionLoading} onClick={() => runUserAction('SET_VERIFICATION_STATUS', { status: 'VERIFIED' })}>Mark Verified</button>
                    <button className="ghost-btn" type="button" disabled={userActionLoading} onClick={() => runUserAction('SET_VERIFICATION_STATUS', { status: 'REJECTED' })}>Mark Rejected</button>
                    {managerOrAbove && (
                      <button className="danger-btn" type="button" disabled={userActionLoading} onClick={() => runUserAction('DEACTIVATE_ACCOUNT', { reason: 'Support deactivation' })}>Deactivate Account</button>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="card">
              <h2>Recent User Audit Trail</h2>
              <ul className="simple-list">
                {selectedUser?.adminActionsTargeted?.length ? selectedUser.adminActionsTargeted.map((entry) => (
                  <li key={entry.id}>
                    <strong>{entry.action}</strong> · {entry.summary}<br />
                    <span className="muted">by {entry.actor?.email || 'Unknown'} on {formatDateTime(entry.createdAt)}</span>
                  </li>
                )) : <li>No admin actions for selected user.</li>}
              </ul>
            </div>
          </section>
        )}

        {activeTab === 'tickets' && (
          <section className="section-grid">
            <div className="card">
              <h2>Create Support Ticket</h2>
              <form className="stack-form" onSubmit={handleCreateTicket}>
                <input placeholder="Target user ID (optional)" value={ticketForm.targetUserId} onChange={(event) => setTicketForm((current) => ({ ...current, targetUserId: event.target.value }))} />
                <select value={ticketForm.targetType} onChange={(event) => setTicketForm((current) => ({ ...current, targetType: event.target.value }))}>
                  <option value="USER">User</option>
                  <option value="CANDIDATE">Candidate</option>
                  <option value="EMPLOYER">Employer</option>
                </select>
                <select value={ticketForm.category} onChange={(event) => setTicketForm((current) => ({ ...current, category: event.target.value }))}>
                  <option value="LOGIN_ISSUE">Login Issue</option>
                  <option value="PROFILE_ISSUE">Profile Issue</option>
                  <option value="DATA_REQUEST">Data Request</option>
                  <option value="FRAUD">Fraud</option>
                  <option value="ACCOUNT_ACCESS">Account Access</option>
                  <option value="BILLING">Billing</option>
                  <option value="OTHER">Other</option>
                </select>
                <select value={ticketForm.priority} onChange={(event) => setTicketForm((current) => ({ ...current, priority: event.target.value }))}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
                <input required placeholder="Subject" value={ticketForm.subject} onChange={(event) => setTicketForm((current) => ({ ...current, subject: event.target.value }))} />
                <textarea required rows={4} placeholder="Issue details and triage context" value={ticketForm.description} onChange={(event) => setTicketForm((current) => ({ ...current, description: event.target.value }))} />
                <button className="primary-btn" type="submit">Create Ticket</button>
              </form>
            </div>

            <div className="card card-span-2">
              <h2>Ticket Queue</h2>
              {ticketsError && <p className="error">{ticketsError}</p>}
              {ticketsLoading && <p className="muted">Loading tickets…</p>}
              {!ticketsLoading && tickets.length === 0 && <p className="muted">No support tickets found.</p>}
              <div className="ticket-list">
                {tickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    type="button"
                    className={`ticket-item ${selectedTicketId === ticket.id ? 'active' : ''}`}
                    onClick={() => setSelectedTicketId(ticket.id)}
                  >
                    <div>
                      <strong>{ticket.reference}</strong>
                      <p>{ticket.subject}</p>
                    </div>
                    <span className="muted">{ticket.status} · {ticket.priority}</span>
                  </button>
                ))}
              </div>

              {selectedTicket && (
                <div className="ticket-detail">
                  <h3>{selectedTicket.reference} · {selectedTicket.subject}</h3>
                  <p>{selectedTicket.description}</p>
                  <p className="muted">Category: {selectedTicket.category} · SLA Due: {formatDateTime(selectedTicket.slaDueAt)}</p>
                  <div className="actions-grid">
                    <button className={`status-btn ${selectedTicket.status === 'IN_PROGRESS' ? 'active in-progress' : ''}`} type="button" onClick={() => handleTicketStatus('IN_PROGRESS')}>Start</button>
                    <button className={`status-btn ${selectedTicket.status === 'ON_HOLD' ? 'active on-hold' : ''}`} type="button" onClick={() => handleTicketStatus('ON_HOLD')}>On Hold</button>
                    <button className={`status-btn ${selectedTicket.status === 'ESCALATED' ? 'active escalated' : ''}`} type="button" onClick={() => handleTicketStatus('ESCALATED')}>Escalate</button>
                    <button className={`status-btn ${selectedTicket.status === 'RESOLVED' ? 'active resolved' : ''}`} type="button" onClick={() => handleTicketStatus('RESOLVED')}>Resolve</button>
                    {managerOrAbove && <button className={`status-btn ${selectedTicket.status === 'CLOSED' ? 'active closed' : ''}`} type="button" onClick={() => handleTicketStatus('CLOSED')}>Close</button>}
                  </div>

                  <div className="note-box">
                    <select value={ticketNoteVisibility} onChange={(event) => setTicketNoteVisibility(event.target.value)}>
                      <option value="public">Reply to user</option>
                      <option value="internal">Internal note</option>
                    </select>
                    <textarea rows={3} placeholder={ticketNoteVisibility === 'internal' ? 'Internal note' : 'Reply visible to the ticket raiser'} value={ticketNote} onChange={(event) => setTicketNote(event.target.value)} />
                    <button type="button" className="primary-btn" onClick={handleAddNote}>{ticketNoteVisibility === 'internal' ? 'Add Internal Note' : 'Send Reply'}</button>
                  </div>

                  <ul className="simple-list">
                    {(selectedTicket.notes || []).length === 0 && <li>No notes yet.</li>}
                    {(selectedTicket.notes || []).map((note) => (
                      <li key={note.id}>
                        {note.note}
                        <br />
                        <span className="muted">{note.author?.email || 'Unknown'} · {note.isInternal ? 'Internal' : 'Visible to user'} · {formatDateTime(note.createdAt)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === 'communications' && (
          <section className="section-grid">
            <div className="card card-span-2">
              <h2>Support Communication Tools</h2>
              <form className="stack-form" onSubmit={handleSendMessage}>
                <input
                  placeholder="Target User ID (optional if selected in User Management)"
                  value={messageToUserId}
                  onChange={(event) => setMessageToUserId(event.target.value)}
                />
                <select value={messageForm.templateKey} onChange={(event) => handleTemplateSelect(event.target.value)}>
                  {templates.map((template) => (
                    <option key={template.key} value={template.key}>{template.name}</option>
                  ))}
                </select>
                <input
                  required
                  placeholder="Email subject"
                  value={messageForm.subject}
                  onChange={(event) => setMessageForm((current) => ({ ...current, subject: event.target.value }))}
                />
                <textarea
                  required
                  rows={7}
                  placeholder="Message body"
                  value={messageForm.body}
                  onChange={(event) => setMessageForm((current) => ({ ...current, body: event.target.value }))}
                />
                <button className="primary-btn" type="submit" disabled={messageLoading}>{messageLoading ? 'Sending…' : 'Send Message'}</button>
                {messageStatus && <p className="muted">{messageStatus}</p>}
              </form>
              <p className="muted">Template variables supported: {'{{name}}'}, {'{{verificationStatus}}'}, {'{{userId}}'}, {'{{resetUrl}}'}.</p>
            </div>
          </section>
        )}

        {activeTab === 'audit' && (
          <section className="section-grid">
            <div className="card card-span-3">
              <div className="row-between">
                <h2>Admin Action Audit Log</h2>
                <button className="ghost-btn" type="button" onClick={loadAudit}>Refresh</button>
              </div>
              {auditLoading && <p className="muted">Loading audit trail…</p>}
              <ul className="simple-list">
                {!auditLoading && auditItems.length === 0 && <li>No audit actions found.</li>}
                {auditItems.map((item) => (
                  <li key={item.id}>
                    <strong>{item.action}</strong> · {item.summary}<br />
                    <span className="muted">
                      actor: {item.actor?.email || 'Unknown'} · target: {item.target?.email || '—'} · {formatDateTime(item.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </div>

      <style jsx>{`
        .support-portal { max-width: 1320px; margin: 0 auto; padding: 2rem 1rem 3rem; color: #111827; }
        .portal-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap; }
        .portal-header h1 { margin: 0; font-size: 1.85rem; }
        .portal-header p { margin: 0.35rem 0 0; color: #6b7280; }
        .header-actions { display: flex; align-items: center; gap: 0.75rem; }
        .role-chip { padding: 0.3rem 0.65rem; border-radius: 9999px; font-size: 0.78rem; font-weight: 700; letter-spacing: 0.03em; }
        .role-chip.ok { background: #dcfce7; color: #166534; }
        .role-chip.warning { background: #fef3c7; color: #92400e; }
        .role-chip.critical { background: #fee2e2; color: #991b1b; }
        .role-chip.muted { background: #f3f4f6; color: #374151; }

        .tabs { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; }
        .tab { border: 1px solid #d1d5db; background: #fff; color: #374151; border-radius: 0.6rem; padding: 0.55rem 0.85rem; font-size: 0.88rem; font-weight: 600; cursor: pointer; }
        .tab.active { border-color: #4f46e5; color: #4338ca; background: #eef2ff; }

        .section-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; }
        .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 0.85rem; padding: 1rem; box-shadow: 0 1px 2px rgba(0,0,0,0.03); }
        .card h2 { margin: 0 0 0.75rem; font-size: 1.05rem; }
        .card h3 { margin: 1rem 0 0.5rem; font-size: 0.98rem; }
        .card-span-2 { grid-column: span 2; }
        .card-span-3 { grid-column: span 3; }

        .metrics-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.75rem; }
        .metric { border: 1px solid #e5e7eb; border-radius: 0.65rem; padding: 0.8rem; background: #fafafa; display: flex; flex-direction: column; gap: 0.25rem; }
        .metric span { color: #6b7280; font-size: 0.8rem; }
        .metric strong { font-size: 1.4rem; }

        .inline-form, .stack-form { display: flex; gap: 0.6rem; flex-wrap: wrap; margin-bottom: 0.75rem; }
        .stack-form { flex-direction: column; }
        input, select, textarea { border: 1px solid #d1d5db; border-radius: 0.55rem; padding: 0.55rem 0.65rem; font-size: 0.9rem; width: 100%; background: #fff; }
        .inline-form input { min-width: 290px; flex: 1; }
        .inline-form select, .inline-form button { min-width: 140px; }

        .user-list, .ticket-list { display: flex; flex-direction: column; gap: 0.5rem; max-height: 340px; overflow: auto; }
        .user-item, .ticket-item { border: 1px solid #e5e7eb; border-radius: 0.6rem; background: #fff; text-align: left; padding: 0.65rem; display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; cursor: pointer; }
        .user-item.active, .ticket-item.active { border-color: #4f46e5; background: #f5f3ff; }
        .user-item p, .ticket-item p { margin: 0.2rem 0 0; color: #6b7280; font-size: 0.82rem; }

        .actions-grid { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.7rem; }
        .primary-btn, .ghost-btn, .danger-btn { border: none; border-radius: 0.55rem; padding: 0.5rem 0.8rem; font-size: 0.84rem; font-weight: 600; cursor: pointer; }
        .primary-btn { background: #4f46e5; color: #fff; }
        .primary-btn:hover { background: #4338ca; }
        .ghost-btn { border: 1px solid #d1d5db; background: #fff; color: #374151; }
        .ghost-btn:hover { border-color: #a5b4fc; color: #4338ca; }
        .danger-btn { background: #b91c1c; color: #fff; }
        .danger-btn:hover { background: #991b1b; }
        .status-btn { border: 1px solid #d1d5db; background: #fff; color: #374151; border-radius: 0.55rem; padding: 0.5rem 0.8rem; font-size: 0.84rem; font-weight: 600; cursor: pointer; transition: all 0.15s ease; }
        .status-btn:hover { border-color: #a5b4fc; color: #4338ca; }
        .status-btn.active { color: #fff; border-color: transparent; box-shadow: 0 1px 2px rgba(0,0,0,0.08); }
        .status-btn.active.in-progress { background: #2563eb; }
        .status-btn.active.on-hold { background: #d97706; }
        .status-btn.active.escalated { background: #b91c1c; }
        .status-btn.active.resolved { background: #059669; }
        .status-btn.active.closed { background: #4b5563; }

        .ticket-detail { margin-top: 0.8rem; border-top: 1px solid #e5e7eb; padding-top: 0.8rem; }
        .note-box { display: flex; flex-direction: column; gap: 0.5rem; margin: 0.8rem 0; }

        .simple-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.55rem; }
        .simple-list li { border: 1px solid #f1f5f9; border-radius: 0.55rem; padding: 0.6rem 0.7rem; background: #fcfcfd; }
        .alert.high { border-color: #fecaca; background: #fef2f2; color: #991b1b; }
        .alert.medium { border-color: #fde68a; background: #fffbeb; color: #92400e; }
        .muted { color: #6b7280; font-size: 0.82rem; }
        .error { color: #b91c1c; margin: 0.5rem 0; }
        .row-between { display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; }

        @media (max-width: 1080px) {
          .section-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .card-span-3 { grid-column: span 2; }
          .metrics-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }

        @media (max-width: 760px) {
          .section-grid { grid-template-columns: 1fr; }
          .card-span-2, .card-span-3 { grid-column: span 1; }
          .metrics-grid { grid-template-columns: 1fr; }
          .support-portal { padding: 1rem 0.75rem 2rem; }
        }
      `}</style>
    </>
  );
}
