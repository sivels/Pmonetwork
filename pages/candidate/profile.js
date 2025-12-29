import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function CandidateProfilePage() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  

  useEffect(() => {
    fetchProfile();
    fetchDocuments();
  }, []);

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

  async function fetchDocuments() {
    try {
      const res = await fetch('/api/candidate/documents');
      if (res.ok) {
        const data = await res.json();
        setDocuments(Array.isArray(data) ? data : (data.documents || []));
      }
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    }
  }

  function handleChange(path, value) {
    setProfile((p) => ({ ...p, [path]: value }));
  }

  async function handlePhotoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Photo must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);

      const res = await fetch('/api/candidate/upload-photo', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setProfile((p) => ({ ...p, profilePhotoUrl: data.photoUrl }));
        alert('Photo uploaded successfully');
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    setLoading(true);
    try {
      const res = await fetch('/api/candidate/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        console.error('Save failed:', res.status, data);
        alert(`Save failed: ${data.error || 'Unknown error'}`);
        return;
      }
      
      setProfile(data);
      alert('Profile saved');
    } catch (err) {
      console.error(err);
      alert('Save failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleDocumentUpload(e, category) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File must be less than 10MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);
      formData.append('documentName', file.name);

      const res = await fetch('/api/candidate/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        await fetchDocuments();
        alert('Document uploaded successfully');
        setShowUploadModal(false);
      } else {
        const data = await res.json();
        alert(data.error || 'Upload failed');
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function deleteDocument(docId) {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    try {
      const res = await fetch('/api/candidate/documents', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: docId })
      });

      if (res.ok) {
        setDocuments(docs => docs.filter(d => d.id !== docId));
        alert('Document deleted');
      } else {
        alert('Delete failed');
      }
    } catch (err) {
      console.error(err);
      alert('Delete failed');
    }
  }

  const getFileIcon = (filename) => {
    const ext = filename?.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return '📕';
    if (['doc', 'docx'].includes(ext)) return '📘';
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return '🖼️';
    return '📄';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

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
            
            {/* Profile Photo Upload */}
            <div className="mb-6 pb-6 border-b">
              <label className="block text-sm font-medium text-gray-600 mb-2">Profile Photo</label>
              <div className="flex items-center gap-4">
                <div 
                  className="w-24 h-24 rounded-full bg-gray-200 bg-cover bg-center"
                  style={{ backgroundImage: profile?.profilePhotoUrl ? `url(${profile.profilePhotoUrl})` : 'url(/images/avatar-placeholder.svg)' }}
                />
                <div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handlePhotoUpload}
                    disabled={uploading}
                    className="block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">Max 5MB. JPG, PNG or GIF</p>
                  {uploading && <p className="text-sm text-blue-600 mt-1">Uploading...</p>}
                </div>
              </div>
            </div>

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

          <section className="mb-6 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Documents & CVs</h2>
            <p className="mb-4 text-sm text-gray-600">Upload CVs, certificates, and other professional documents</p>
            
            <div className="mb-4">
              <button 
                className="btn btn-primary"
                onClick={() => setShowUploadModal(true)}
              >
                + Upload Document
              </button>
            </div>

            {documents.length === 0 ? (
              <p className="text-gray-500 text-sm">No documents uploaded yet</p>
            ) : (
              <div className="space-y-4">
                {/* CVs Section */}
                {documents.filter(d => d.documentType === 'cv').length > 0 && (
                  <div>
                    <h3 className="font-semibold text-sm text-gray-700 mb-2">📄 CVs & Resumes</h3>
                    <div className="space-y-2">
                      {documents.filter(d => d.documentType === 'cv').map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between border-2 border-blue-200 bg-blue-50 rounded p-3 hover:bg-blue-100">
                          <div className="flex items-center gap-3 flex-1">
                            <span className="text-2xl">{getFileIcon(doc.filename)}</span>
                            <div className="flex-1">
                              <div className="font-medium">{doc.title || doc.filename}</div>
                              <div className="text-sm text-gray-600">
                                CV/Resume • {formatFileSize(doc.fileSize)}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <a 
                              href={doc.url} 
                              download={doc.filename}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1 rounded border border-blue-600 hover:bg-blue-50"
                            >
                              Download
                            </a>
                            <button 
                              onClick={() => deleteDocument(doc.id)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1 rounded border border-red-600 hover:bg-red-50"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Other Documents Section */}
                {documents.filter(d => d.documentType !== 'cv').length > 0 && (
                  <div>
                    <h3 className="font-semibold text-sm text-gray-700 mb-2">📎 Other Documents</h3>
                    <div className="space-y-2">
                      {documents.filter(d => d.documentType !== 'cv').map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between border rounded p-3 hover:bg-gray-50">
                          <div className="flex items-center gap-3 flex-1">
                            <span className="text-2xl">{getFileIcon(doc.filename)}</span>
                            <div className="flex-1">
                              <div className="font-medium">{doc.title || doc.filename}</div>
                              <div className="text-sm text-gray-500">
                                {doc.documentType} • {formatFileSize(doc.fileSize)}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <a 
                              href={doc.url} 
                              download={doc.filename}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Download
                            </a>
                            <button 
                              onClick={() => deleteDocument(doc.id)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {showUploadModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                  <h3 className="text-lg font-semibold mb-4">Upload Document</h3>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Document Type
                    </label>
                    <select 
                      id="upload-category" 
                      className="w-full border rounded p-2"
                      defaultValue="professional"
                    >
                      <option value="cv">CV/Resume</option>
                      <option value="professional">Professional Certificate</option>
                      <option value="identity">Identity Document</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select File
                    </label>
                    <input 
                      type="file" 
                      onChange={(e) => {
                        const category = document.getElementById('upload-category').value;
                        handleDocumentUpload(e, category);
                      }}
                      disabled={uploading}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">Max 10MB</p>
                    {uploading && <p className="text-sm text-blue-600 mt-2">Uploading...</p>}
                  </div>

                  <div className="flex gap-2 justify-end">
                    <button 
                      onClick={() => setShowUploadModal(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                      disabled={uploading}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>

        </div>

        <aside className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-3">Profile Completion</h3>
          <CompletionWidget profile={profile} />
          <div className="mt-6">
            <button className="btn btn-primary w-full" onClick={save} disabled={loading}>{loading ? 'Saving...' : 'Save Profile'}</button>
            <Link href="/candidate/preview" className="btn btn-secondary w-full mt-3 block text-center">Preview My Public Profile</Link>
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
