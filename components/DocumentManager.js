import { useState, useEffect, useRef } from 'react';

export default function DocumentManager() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const fileInput = useRef();

  useEffect(() => {
    fetchDocs();
  }, []);

  async function fetchDocs() {
    setLoading(true);
    const res = await fetch('/api/candidate/documents');
    if (res.ok) setDocs(await res.json());
    setLoading(false);
  }

  async function upload(e) {
    e.preventDefault();
    const file = fileInput.current.files[0];
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    await fetch('/api/candidate/documents', { method: 'POST', body: form });
    fileInput.current.value = '';
    fetchDocs();
  }

  async function toggle(id, isPublic) {
    await fetch('/api/candidate/documents', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isPublic: !isPublic }),
    });
    fetchDocs();
  }

  async function remove(id) {
    await fetch('/api/candidate/documents', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchDocs();
  }

  return (
    <div style={{ marginTop: 24, background: '#e3eafc', padding: 16, borderRadius: 8 }}>
      <h3>Document Repository</h3>
      <form onSubmit={upload} style={{ marginBottom: 12 }}>
        <input type="file" ref={fileInput} />
        <button type="submit">Upload</button>
      </form>
      {loading ? <div>Loading...</div> : (
        <ul>
          {docs.map(doc => (
            <li key={doc.id} style={{ marginBottom: 8 }}>
              <a href={doc.url} target="_blank" rel="noopener noreferrer">{doc.filename}</a>
              {' '}
              <button onClick={() => toggle(doc.id, doc.isPublic)} style={{ marginLeft: 8 }}>
                {doc.isPublic ? 'Make Private' : 'Make Public'}
              </button>
              <button onClick={() => remove(doc.id)} style={{ marginLeft: 8, color: 'red' }}>Delete</button>
              {doc.isPublic && <span style={{ color: '#1976d2', marginLeft: 8 }}>[Public]</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
