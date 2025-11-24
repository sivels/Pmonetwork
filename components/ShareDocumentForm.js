import { useState, useRef } from 'react';

export default function ShareDocumentForm({ candidateId, onShared }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const fileInput = useRef();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const file = fileInput.current.files[0];
    if (!file) {
      setMessage('Please select a file');
      setLoading(false);
      return;
    }
    const form = new FormData();
    form.append('file', file);
    form.append('candidateId', candidateId);
    const res = await fetch('/api/employer/share-document', {
      method: 'POST',
      body: form,
    });
    if (res.ok) {
      setMessage('Document shared!');
      fileInput.current.value = '';
      if (onShared) onShared();
    } else {
      const d = await res.json();
      setMessage(d.error || 'Failed to share');
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 16, background: '#e3eafc', padding: 12, borderRadius: 8 }}>
      <label>Share contract/terms with candidate:</label>
      <input type="file" ref={fileInput} style={{ marginLeft: 8 }} />
      <button type="submit" disabled={loading} style={{ marginLeft: 8 }}>{loading ? 'Sharing...' : 'Share'}</button>
      {message && <span style={{ marginLeft: 12 }}>{message}</span>}
    </form>
  );
}
