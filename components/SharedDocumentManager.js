import { useState, useEffect } from 'react';

export default function SharedDocumentManager() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocs();
  }, []);

  async function fetchDocs() {
    setLoading(true);
    const res = await fetch('/api/candidate/shared-documents');
    if (res.ok) setDocs(await res.json());
    setLoading(false);
  }

  async function mark(id, action) {
    await fetch('/api/candidate/shared-documents', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action }),
    });
    fetchDocs();
  }

  return (
    <div style={{ marginTop: 32, background: '#e3eafc', padding: 16, borderRadius: 8 }}>
      <h3>Shared Documents (Contracts/Terms)</h3>
      {loading ? <div>Loading...</div> : (
        <ul>
          {docs.map(doc => (
            <li key={doc.id} style={{ marginBottom: 12 }}>
              <a href={doc.url} target="_blank" rel="noopener noreferrer">{doc.filename}</a>
              <span style={{ marginLeft: 8 }}>[{doc.status}]</span>
              <button onClick={() => mark(doc.id, 'VIEWED')} style={{ marginLeft: 8 }}>Mark Viewed</button>
              <button onClick={() => mark(doc.id, 'SIGNED')} style={{ marginLeft: 8 }}>Sign</button>
              <button onClick={() => mark(doc.id, 'RETURNED')} style={{ marginLeft: 8 }}>Return</button>
              <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>
                Audit: {Array.isArray(doc.auditTrail) && doc.auditTrail.map((a, i) => (
                  <span key={i}>{a.action} by {a.by} at {a.at}; </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
