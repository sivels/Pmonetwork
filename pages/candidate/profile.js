import { useEffect, useState } from 'react';

export default function CandidateProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  

  useEffect(() => {
    if (userId) fetchProfile();
  }, [userId]);

  async function fetchProfile() {
    setLoading(true);
    try {
      const res = await fetch(`/api/candidate/profile`);
      const data = await res.json();
      setProfile(data || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(path, value) {
    setProfile((p) => ({ ...p, [path]: value }));
  }

  async function save() {
    setLoading(true);
    try {
      const res = await fetch('/api/candidate/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, profile }),
      });
      const data = await res.json();
      setProfile(data);
      alert('Profile saved');
    } catch (err) {
      console.error(err);
      alert('Save failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      {status !== 'authenticated' && (
        <div className="py-8">
          <p className="text-yellow-700">You must be signed in to edit your profile. <a href="/auth/login" className="text-blue-600">Sign in</a></p>
        </div>
      )}
      <div className="py-8">
        <h1 className="text-3xl font-bold text-blue-600">Candidate Profile</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <section className="mb-6 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Full name</label>
                <input value={profile?.full_name || ''} onChange={(e) => handleChange('full_name', e.target.value)} className="mt-1 block w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Location</label>
                <input value={profile?.location || ''} onChange={(e) => handleChange('location', e.target.value)} className="mt-1 block w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Work preference</label>
                <select value={profile?.work_pref || 'remote'} onChange={(e) => handleChange('work_pref', e.target.value)} className="mt-1 block w-full border rounded p-2">
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="onsite">On-site</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Contact email</label>
                <input value={profile?.contact_email || ''} onChange={(e) => handleChange('contact_email', e.target.value)} className="mt-1 block w-full border rounded p-2" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-600">LinkedIn URL</label>
                <input value={profile?.linkedin || ''} onChange={(e) => handleChange('linkedin', e.target.value)} className="mt-1 block w-full border rounded p-2" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-600">Short bio</label>
                <textarea value={profile?.bio || ''} onChange={(e) => handleChange('bio', e.target.value)} className="mt-1 block w-full border rounded p-2" rows={4} />
              </div>
            </div>
          </section>

          <section className="mb-6 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">PMO Skill Matrix</h2>
            <p className="mb-4 text-sm text-gray-600">Self-rate 1 (Novice) to 5 (Expert)</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['RAID Management','Planning & Scheduling','Resource Management','Governance & Reporting','Financial Tracking','Dependency Management','Change Control','Risk Management','Programme Oversight','Portfolio Support'].map((skill) => (
                <div key={skill} className="flex items-center gap-4">
                  <div className="w-48 text-sm">{skill}</div>
                  <select value={profile?.skills?.[skill] || '3'} onChange={(e) => {
                    const next = { ...(profile?.skills || {}) };
                    next[skill] = e.target.value;
                    handleChange('skills', next);
                  }} className="border rounded p-2">
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                  </select>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-6 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Project Delivery Experience</h2>
            <p className="mb-4 text-sm text-gray-600">Add project entries (title, org, dates, method, description, role, tools, achievements)</p>
            {/* Simple inline projects editor */}
            {(profile?.projects || []).map((proj, idx) => (
              <div key={idx} className="mb-4 border rounded p-3">
                <input value={proj.title || ''} onChange={(e) => {
                  const p = { ...(profile || {}) };
                  p.projects = [...(p.projects || [])];
                  p.projects[idx] = { ...(p.projects[idx] || {}), title: e.target.value };
                  setProfile(p);
                }} placeholder="Project Title" className="w-full p-2 border rounded mb-2" />
                <textarea value={proj.description || ''} onChange={(e) => {
                  const p = { ...(profile || {}) };
                  p.projects = [...(p.projects || [])];
                  p.projects[idx] = { ...(p.projects[idx] || {}), description: e.target.value };
                  setProfile(p);
                }} placeholder="Description" className="w-full p-2 border rounded mb-2" />
              </div>
            ))}
            <div>
              <button className="btn btn-secondary" onClick={() => {
                setProfile((p) => ({ ...(p || {}), projects: [ ...(p?.projects||[]), { title: '', description: '' } ] }));
              }}>Add Project</button>
            </div>
          </section>

        </div>

        <aside className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-3">Profile Completion</h3>
          <CompletionWidget profile={profile} />
          <div className="mt-6">
            <button className="btn btn-primary w-full" onClick={save} disabled={loading}>{loading ? 'Saving...' : 'Save Profile'}</button>
            <button className="btn btn-secondary w-full mt-3" onClick={() => alert('Preview not implemented yet')}>Preview My Public Profile</button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function CompletionWidget({ profile }) {
  const checks = [
    { ok: !!(profile?.bio && profile.bio.length > 10), text: 'Filled bio' },
    { ok: !!(profile?.projects && profile.projects.length > 0), text: 'At least 1 project' },
    { ok: !!(profile?.skills && Object.keys(profile.skills || {}).length >= 5), text: 'Skills matrix started' },
    { ok: !!profile?.cv_url, text: 'Upload CV' },
    { ok: !!(profile?.certifications && profile.certifications.length > 0), text: 'Add certifications' },
  ];
  const score = Math.round((checks.filter(c=>c.ok).length / checks.length) * 100);
  return (
    <div>
      <div className="w-full bg-gray-200 rounded h-4 mb-3">
        <div className="bg-green-500 h-4 rounded" style={{ width: `${score}%` }} />
      </div>
      <div className="text-sm font-semibold">{score}% complete</div>
      <ul className="mt-3 text-sm text-gray-600 list-disc list-inside">
        {checks.map((c, i) => (
          <li key={i} className={c.ok ? 'text-gray-500' : 'text-red-600'}>{c.text}</li>
        ))}
      </ul>
    </div>
  );
}
