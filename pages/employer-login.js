import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';

export default function EmployerLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('employer@test.com');
  const [password, setPassword] = useState('Emp!Test123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });
    setLoading(false);
    if (res?.ok) {
      router.replace('/employer/applicants');
    } else {
      setError('Invalid credentials.');
    }
  };

  return (
    <main className="login" aria-labelledby="login-title">
      <h1 id="login-title">Employer Login</h1>
      <form className="card" onSubmit={onSubmit}>
        <label>Email<input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} /></label>
        <label>Password<input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} /></label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn" type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign In'}</button>
      </form>
      <style jsx>{`
        .login{max-width:420px;margin:4rem auto;padding:0 1rem}
        h1{font-size:1.4rem;color:#111827;margin-bottom:1rem}
        .card{display:grid;gap:.75rem;background:#fff;border-radius:12px;padding:1rem;box-shadow:0 1px 3px rgba(0,0,0,.06)}
        label{display:grid;gap:.25rem;color:#374151}
        input{border:1px solid #e5e7eb;border-radius:10px;padding:.55rem .7rem}
        .btn{background:#4f46e5;color:#fff;border-radius:10px;padding:.5rem .8rem;border:none}
        .error{color:#b91c1c}
      `}</style>
    </main>
  );
}
