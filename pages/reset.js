import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Reset() {
  const router = useRouter();
  const { token } = router.query;
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  async function requestReset(e) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/auth/reset-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) setMessage('If that email exists, a reset link was sent.');
      else setMessage('Unable to process request');
    } catch (err) {
      setMessage('Network error');
    } finally {
      setLoading(false);
    }
  }

  async function confirmReset(e) {
    e.preventDefault();
    if (newPassword !== confirm) return setMessage('Passwords do not match');
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/auth/reset-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      if (res.ok) {
        setMessage('Password updated. You may sign in.');
      } else {
        const d = await res.json();
        setMessage(d.error || 'Unable to reset password');
      }
    } catch (err) {
      setMessage('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: '48px auto', padding: 16 }}>
      {!token && (
        <>
          <h1>Request password reset</h1>
          <form onSubmit={requestReset}>
            <label>Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
            <div style={{ marginTop: 12 }}>
              <button type="submit" disabled={loading}>{loading ? 'Sending...' : 'Send reset link'}</button>
            </div>
          </form>
        </>
      )}

      {token && (
        <>
          <h1>Set a new password</h1>
          <form onSubmit={confirmReset}>
            <label>New password</label>
            <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" required />
            <label>Confirm password</label>
            <input value={confirm} onChange={(e) => setConfirm(e.target.value)} type="password" required />
            <div style={{ marginTop: 12 }}>
              <button type="submit" disabled={loading}>{loading ? 'Updating...' : 'Update password'}</button>
            </div>
          </form>
        </>
      )}

      {message && <p style={{ marginTop: 12 }}>{message}</p>}
    </div>
  );
}
