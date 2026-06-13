import React, { useMemo, useState } from 'react';
import { useAutosave } from '../../utils/useAutosave';

export default function ProfessionalSummarySection({ profile, onUpdate }) {
  const [text, setText] = useState(profile?.summary || '');
  const [toast, setToast] = useState('');
  const isComplete = text.trim().length > 0;
  const count = useMemo(() => ({
    chars: text.length,
    words: (text.trim().match(/\S+/g) || []).length
  }), [text]);

  const { saving, savedAt } = useAutosave(async () => {
    const res = await fetch('/api/candidate/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ summary: text })
    });
    if (res.ok) {
      const data = await res.json();
      onUpdate({ summary: data.summary });
    }
  }, [text]);

  // show subtle toast when autosave completes
  if (savedAt && !toast) {
    setToast('Summary saved');
    setTimeout(() => setToast(''), 2000);
  }

  async function aiRewrite(mode) {
    const res = await fetch('/api/ai/rewrite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, mode })
    });
    if (res.ok) {
      const { output } = await res.json();
      setText(output);
    }
  }

  async function aiOneLiner() {
    const res = await fetch('/api/ai/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    if (res.ok) {
      const { output } = await res.json();
      setText((prev) => `${output}\n\n${prev}`);
    }
  }

  return (
    <section className="card xl">
      <header className="card-header">
        <h2 className="summary-title">
          Professional Summary
          {isComplete && (
            <span className="summary-complete-badge" aria-label="Professional summary complete">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Complete
            </span>
          )}
        </h2>
        <div className="summary-tools">
          <button className="btn subtle" onClick={() => aiRewrite('professional')}>Rewrite for professionalism</button>
          <button className="btn subtle" onClick={aiOneLiner}>Summarise into one-liner</button>
          <span className={`muted ${saving ? 'saving' : 'saved'}`}>{saving ? 'saving…' : savedAt ? 'saved ✓' : ''}</span>
        </div>
      </header>
      {toast && <div className="toast" role="status" aria-live="polite">{toast}</div>}
      <div className="rich-editor">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a concise, compelling overview of your PMO experience, strengths and value."
          rows={10}
        />
        <div className="editor-footer">
          <span className="muted">{count.words} words • {count.chars} chars</span>
        </div>
      </div>

      <style jsx>{`
        .summary-title {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
        }
        .summary-complete-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.2rem 0.55rem;
          border-radius: 999px;
          background: #dcfce7;
          color: #166534;
          font-size: 0.78rem;
          font-weight: 700;
        }
      `}</style>
    </section>
  );
}
