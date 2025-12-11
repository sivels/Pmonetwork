import React, { useState } from 'react';

export default function AccountSettingsSection({ userEmail }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [completionStyle, setCompletionStyle] = useState('ring');

  async function changePassword(e) {
    e.preventDefault();
    if (next !== confirm) {
      setStatus('New passwords do not match');
      return;
    }
    setLoading(true);
    setStatus('');
    try {
      const res = await fetch('/api/account/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current, next })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setStatus('Password updated');
      setCurrent(''); setNext(''); setConfirm('');
    } catch (e) {
      setStatus(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card xl">
      <header className="card-header">
        <h2>Account Settings</h2>
        <p className="muted">Manage your security and notifications.</p>
      </header>
      <div className="grid two">
        <div className="card inner">
          <h3>Change Password</h3>
          <form onSubmit={changePassword} className="form vstack">
            <input type="password" placeholder="Current password" value={current} onChange={(e)=>setCurrent(e.target.value)} required />
            <input type="password" placeholder="New password" value={next} onChange={(e)=>setNext(e.target.value)} required />
            <input type="password" placeholder="Confirm new password" value={confirm} onChange={(e)=>setConfirm(e.target.value)} required />
            <button className="btn primary" disabled={loading}>{loading ? 'Updating…' : 'Update password'}</button>
            {status && <div className="muted small">{status}</div>}
          </form>
        </div>
        <div className="card inner">
          <h3>Two-Factor Authentication</h3>
          <p className="muted">Coming soon</p>
        </div>
        <div className="card inner">
          <h3>Notifications</h3>
          <p className="muted">Coming soon</p>
        </div>
        <div className="card inner">
          <h3>Profile Completion Display</h3>
          <p className="muted">Completion is shown as a ring in your banner.</p>
          <div className="form vstack">
            <label>
              <input
                type="radio"
                name="completion-style"
                checked={completionStyle === 'ring'}
                onChange={() => setCompletionStyle('ring')}
              />
              Ring only
            </label>
            <button
              className="btn primary"
              onClick={async () => {
                const res = await fetch('/api/candidate/profile', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ completionStyle: 'ring' })
                });
                if (res.ok) {
                  setStatus('Display updated');
                  setTimeout(() => setStatus(''), 1500);
                }
              }}
            >
              Save Display Preference
            </button>
            {status && <div className="muted small">{status}</div>}
          </div>
        </div>
      </div>
    </section>
  );
}
