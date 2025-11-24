import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Register() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('CANDIDATE');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirm) return setMessage('Passwords do not match');
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role, fullName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || 'Registration failed');
      } else {
        setMessage('Registration successful. Check your email to verify.');
        setEmail('');
        setPassword('');
        setConfirm('');
        setFullName('');
      }
    } catch (err) {
      setMessage('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="register-hero">
      <div className="register-card">
        <img src="/logo.svg" alt="PMO Network Logo" className="register-logo" />
        <h1>Join PMO Network</h1>
        <h2 className="register-sub">Create your account and connect with top employers and candidates.</h2>
        <form onSubmit={handleSubmit} className="register-form">
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />

          <label>Full name</label>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} />

          <label>Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="CANDIDATE">Candidate</option>
            <option value="EMPLOYER">Employer</option>
          </select>

          <label>Password</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />

          <label>Confirm password</label>
          <input value={confirm} onChange={(e) => setConfirm(e.target.value)} type="password" required />

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 18, width: '100%' }}>{loading ? 'Registering...' : 'Create Account'}</button>
        </form>
        <button type="button" className="btn btn-secondary" style={{ marginTop: 12, width: '100%' }} onClick={() => router.push('/auth/login')}>Already have an account? Sign in</button>
        {message && <p style={{ marginTop: 12 }}>{message}</p>}
      </div>
    </div>
  );
}
