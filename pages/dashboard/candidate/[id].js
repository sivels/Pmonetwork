import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import ShareDocumentForm from '../../../components/ShareDocumentForm';

export default function CandidateProfileView() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = router.query;
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) router.replace('/auth/login');
    else if (session.user.role !== 'EMPLOYER') router.replace('/dashboard');
    else if (id) fetchProfile();
    // eslint-disable-next-line
  }, [session, status, id]);

  async function fetchProfile() {
    setLoading(true);
    const res = await fetch(`/api/employer/candidate?id=${id}`);
    if (res.ok) setProfile(await res.json());
    setLoading(false);
  }

  async function shortlist() {
    await fetch('/api/employer/shortlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidateId: id }),
    });
    alert('Candidate saved to shortlist!');
  }

  async function contact() {
    const message = prompt('Enter your message to the candidate:');
    if (!message) return;
    await fetch('/api/employer/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidateId: id, message }),
    });
    alert('Contact request sent!');
  }

  if (loading) return <div>Loading...</div>;
  if (!profile) return <div>Profile not found.</div>;

  return (
    <div style={{ maxWidth: 800, margin: '48px auto', padding: 16 }}>
      <h1>{profile.fullName}</h1>
      <p><b>Job Title:</b> {profile.jobTitle}</p>
      <p><b>Summary:</b> {profile.summary}</p>
      <p><b>Skills:</b> {profile.skills?.map(s => s.name).join(', ')}</p>
      <p><b>Certifications:</b> {profile.certifications?.map(c => c.name).join(', ')}</p>
      <p><b>Experience:</b> {profile.yearsExperience} years</p>
      <p><b>Sector:</b> {profile.sector}</p>
      <p><b>Personality:</b> {profile.personalityType} {profile.personalityDesc && `- ${profile.personalityDesc}`}</p>
      <p><b>Availability:</b> {profile.availability}</p>
      <p><b>Day Rate:</b> {profile.dayRate}</p>
      <p><b>Location:</b> {profile.location}</p>
      <p><b>Remote:</b> {profile.remotePreference ? 'Yes' : 'No'}</p>
      {profile.cvUrl && <p><a href={profile.cvUrl} target="_blank" rel="noopener noreferrer">Download CV</a></p>}
      {profile.videoUrl && <p><a href={profile.videoUrl} target="_blank" rel="noopener noreferrer">Video Introduction</a></p>}
      <h3>Public Documents</h3>
      <ul>
        {profile.documents?.filter(doc => doc.isPublic).map(doc => (
          <li key={doc.id}>
            <a href={doc.url} target="_blank" rel="noopener noreferrer">{doc.filename}</a>
          </li>
        ))}
      </ul>
      <ShareDocumentForm candidateId={profile.id} />
      <button onClick={shortlist} style={{ marginRight: 8 }}>Shortlist</button>
      <button onClick={contact}>Contact</button>
      <button onClick={() => router.back()} style={{ marginLeft: 8 }}>Back</button>
    </div>
  );
}
