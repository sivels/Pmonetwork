export default function ProfileOverview({ profile }) {
  if (!profile) return <div className="bg-white rounded-lg shadow p-4">Loading profile...</div>;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-xl font-semibold">{(profile.name || 'U').slice(0,1)}</div>
        <div>
          <h2 className="text-xl font-semibold">{profile.name}</h2>
          <p className="text-sm text-gray-600">{profile.title} — {profile.location}</p>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-700">{profile.summary}</div>

      <div className="mt-4">
        <h3 className="text-sm font-medium text-gray-700">Top skills</h3>
        <div className="flex gap-2 mt-2 flex-wrap">
          {profile.skills && profile.skills.map(s => (
            <span key={s.name} className="text-xs bg-gray-100 px-2 py-1 rounded">{s.name}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
