export default function ProfileCard({ profile, onShortlist, onContact, onView }) {
  return (
    <div style={{
      border: '1px solid #1976d2',
      borderRadius: 8,
      padding: 20,
      marginBottom: 20,
      background: '#f7fbff',
      boxShadow: '0 2px 8px #e3eafc',
    }}>
      <h2 style={{ color: '#1976d2', margin: 0 }}>{profile.fullName}</h2>
      <div style={{ color: '#333', marginBottom: 8 }}>{profile.jobTitle}</div>
      <div style={{ color: '#555', marginBottom: 8 }}>{profile.summary}</div>
      <div style={{ fontSize: 14, color: '#1976d2', marginBottom: 8 }}>
        {profile.skills?.map(s => s.name).join(', ')}
      </div>
      <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>
        {profile.location} | {profile.remotePreference ? 'Remote' : 'On-site'}
      </div>
      <div style={{ marginTop: 10 }}>
        {onShortlist && <button onClick={onShortlist} style={{ marginRight: 8 }}>Shortlist</button>}
        {onContact && <button onClick={onContact} style={{ marginRight: 8 }}>Contact</button>}
        {onView && <button onClick={onView}>View Profile</button>}
      </div>
    </div>
  );
}
