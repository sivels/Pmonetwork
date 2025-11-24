
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import FileUploader from '../../components/FileUploader';
import DocumentManager from '../../components/DocumentManager';
import SharedDocumentManager from '../../components/SharedDocumentManager';

export default function CandidateEdit() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) router.replace('/auth/login');
    else if (session.user.role !== 'CANDIDATE') router.replace('/dashboard');
    else fetchProfile();
    // eslint-disable-next-line
  }, [session, status]);

  async function fetchProfile() {
    setLoading(true);
    const res = await fetch('/api/candidate/profile');
    if (res.ok) setProfile(await res.json());
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const form = new FormData(e.target);
    const res = await fetch('/api/candidate/profile', {
      method: 'PUT',
      body: form,
    });
    if (res.ok) setMessage('Profile updated!');
    else setMessage('Update failed');
    setLoading(false);
  }

  if (loading) return <div>Loading...</div>;
  if (!profile) return <div>No profile found.</div>;

  return (
    <div style={{ maxWidth: 800, margin: '48px auto', padding: 24, background: '#f7fbff', borderRadius: 12 }}>
      <h1 style={{ color: '#1976d2' }}>Edit Candidate Profile</h1>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <label>Full Name</label>
        <input name="fullName" defaultValue={profile.fullName || ''} />
        <label>Job Title</label>
        <input name="jobTitle" defaultValue={profile.jobTitle || ''} />
        <label>Professional Summary</label>
        <textarea name="summary" defaultValue={profile.summary || ''} />
        <label>Years Experience</label>
        <input name="yearsExperience" type="number" defaultValue={profile.yearsExperience || ''} />
        <label>Sector</label>
        <input name="sector" defaultValue={profile.sector || ''} />
        <label>Personality Type</label>
        <input name="personalityType" defaultValue={profile.personalityType || ''} />
        <label>Personality Description</label>
        <input name="personalityDesc" defaultValue={profile.personalityDesc || ''} />
        <label>Availability</label>
        <select name="availability" defaultValue={profile.availability || 'AVAILABLE_IMMEDIATE'}>
          <option value="AVAILABLE_IMMEDIATE">Immediate</option>
          <option value="AVAILABLE_2_WEEKS">2 weeks</option>
          <option value="AVAILABLE_1_MONTH">1 month</option>
          <option value="NOT_AVAILABLE">Not available</option>
        </select>
        <label>Day Rate</label>
        <input name="dayRate" type="number" defaultValue={profile.dayRate || ''} />
        <label>Location</label>
        <input name="location" defaultValue={profile.location || ''} />
        <label>Remote Preference</label>
        <input name="remotePreference" type="checkbox" defaultChecked={profile.remotePreference} />
        <FileUploader label="CV (PDF)" name="cv" accept="application/pdf" />
        <label>Video Introduction (URL)</label>
        <input name="videoUrl" defaultValue={profile.videoUrl || ''} />
        <div style={{ marginTop: 12 }}>
          <button type="submit" disabled={loading} style={{ background: '#1976d2', color: '#fff', border: 'none', padding: '8px 24px', borderRadius: 4 }}>{loading ? 'Saving...' : 'Save'}</button>
        </div>
      </form>
      {message && <p style={{ marginTop: 12 }}>{message}</p>}
      <DocumentManager />
      <SharedDocumentManager />
    </div>
  );
}
