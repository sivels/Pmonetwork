
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import ProfileCard from '../../components/ProfileCard';
import SearchFilters from '../../components/SearchFilters';

export default function EmployerSearch() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [candidates, setCandidates] = useState([]);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) router.replace('/auth/login');
    else if (session.user.role !== 'EMPLOYER') router.replace('/dashboard');
  }, [session, status, router]);

  async function search() {
    setLoading(true);
    const params = new URLSearchParams(filters).toString();
    const res = await fetch(`/api/employer/search?${params}`);
    if (res.ok) setCandidates(await res.json());
    setLoading(false);
  }

  async function shortlist(candidateId) {
    await fetch('/api/employer/shortlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidateId }),
    });
    alert('Candidate saved to shortlist!');
  }

  async function contact(candidateId) {
    const message = prompt('Enter your message to the candidate:');
    if (!message) return;
    await fetch('/api/employer/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidateId, message }),
    });
    alert('Contact request sent!');
  }

  return (
    <div style={{ maxWidth: 900, margin: '48px auto', padding: 16, background: '#f7fbff', borderRadius: 12 }}>
      <h1 style={{ color: '#1976d2' }}>Candidate Search</h1>
      <SearchFilters filters={filters} setFilters={setFilters} onSearch={search} />
      <div>
        {candidates.map(c => (
          <ProfileCard
            key={c.id}
            profile={c}
            onShortlist={() => shortlist(c.id)}
            onContact={() => contact(c.id)}
            onView={() => router.push(`/dashboard/candidate/${c.id}`)}
          />
        ))}
      </div>
      <button onClick={() => signOut()} style={{ marginTop: 24 }}>Sign out</button>
    </div>
  );
}
