import { useEffect, useState } from 'react';
import Link from 'next/link';

function PairScoreBar({ pair }) {
  const leftLabel = pair?.left?.toUpperCase?.() || 'L';
  const rightLabel = pair?.right?.toUpperCase?.() || 'R';
  const leftPct = Number.isFinite(pair?.leftPct) ? pair.leftPct : 0;
  const rightPct = Number.isFinite(pair?.rightPct) ? pair.rightPct : 0;

  return (
    <div className="pair-row">
      <div className="pair-head">
        <span>{pair.title}</span>
        <strong>{leftLabel} {leftPct}% · {rightLabel} {rightPct}%</strong>
      </div>
      <div className="pair-track" aria-hidden="true">
        <div className="pair-fill" style={{ width: `${leftPct}%` }} />
        <div className="pair-midline" />
      </div>
    </div>
  );
}

export default function MBTIInsightsSection() {
  const [loading, setLoading] = useState(true);
  const [mbti, setMbti] = useState(null);
  const [saveState, setSaveState] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch('/api/candidate/insights/mbti');
        if (!res.ok) {
          if (active) setLoading(false);
          return;
        }
        const data = await res.json();
        if (active) {
          setMbti(data?.mbti || null);
          setLoading(false);
        }
      } catch {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  async function saveVisibility(visibleToEmployers) {
    if (!mbti?.type) return;
    setSaveState('Saving...');
    try {
      const res = await fetch('/api/candidate/insights/mbti', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result: mbti, visibleToEmployers }),
      });

      if (!res.ok) throw new Error('Save failed');
      const data = await res.json();
      setMbti(data?.mbti || null);
      setSaveState('Saved');
      window.dispatchEvent(new CustomEvent('mbtiInsightUpdated', { detail: data?.mbti || null }));
      setTimeout(() => setSaveState(''), 1800);
    } catch {
      setSaveState('Could not save');
      setTimeout(() => setSaveState(''), 2200);
    }
  }

  return (
    <section className="insights-section">
      <div className="section-head">
        <div>
          <h2>Professional Insights</h2>
          <p>View your MBTI score and control employer visibility from your profile editor.</p>
        </div>
        <Link href="/dashboard/assessments/mbti" className="take-btn">
          {mbti?.type ? 'Retake MBTI Test' : 'Take MBTI Test'}
        </Link>
      </div>

      {loading ? (
        <div className="placeholder">Loading saved insights…</div>
      ) : !mbti?.type ? (
        <div className="empty-state">
          <h3>No MBTI result yet</h3>
          <p>Complete the Myers-Briggs assessment and your score will appear here automatically.</p>
        </div>
      ) : (
        <div className="results-wrap">
          <div className="summary-card">
            <span>Saved MBTI Type</span>
            <strong>{mbti.type}</strong>
            <small>
              {mbti.completedAt
                ? `Completed ${new Date(mbti.completedAt).toLocaleDateString()}`
                : 'Completed recently'}
            </small>
          </div>

          <label className="visibility-toggle">
            <input
              type="checkbox"
              checked={Boolean(mbti.visibleToEmployers)}
              onChange={(event) => saveVisibility(event.target.checked)}
            />
            <span>Visible to employers on your candidate profile</span>
          </label>
          {saveState && <small className="save-state">{saveState}</small>}

          <div className="pair-list">
            {(mbti.pairScores || []).map((pair) => (
              <PairScoreBar key={pair.title} pair={pair} />
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .insights-section {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 10px 28px rgba(15, 23, 42, 0.06);
        }

        .section-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 16px;
        }

        h2 {
          margin: 0;
          font-size: 22px;
          color: #0f172a;
          letter-spacing: -0.01em;
        }

        .section-head p {
          margin: 6px 0 0;
          color: #475569;
          font-size: 14px;
        }

        .take-btn {
          border: 1px solid #0f172a;
          border-radius: 10px;
          background: #0f172a;
          color: #fff;
          text-decoration: none;
          font-size: 12px;
          font-weight: 700;
          padding: 10px 12px;
          white-space: nowrap;
        }

        .placeholder,
        .empty-state {
          border: 1px dashed #cbd5e1;
          border-radius: 12px;
          padding: 14px;
          color: #475569;
          background: #f8fafc;
        }

        .empty-state h3 {
          margin: 0;
          font-size: 16px;
          color: #0f172a;
        }

        .empty-state p {
          margin: 6px 0 0;
          font-size: 13px;
        }

        .results-wrap {
          display: grid;
          gap: 12px;
        }

        .summary-card {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 12px;
          background: #f8fafc;
        }

        .summary-card span {
          display: block;
          color: #64748b;
          font-size: 12px;
        }

        .summary-card strong {
          display: block;
          margin-top: 6px;
          font-size: 28px;
          color: #4338ca;
          letter-spacing: 0.04em;
        }

        .summary-card small {
          color: #64748b;
          font-size: 12px;
        }

        .visibility-toggle {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #334155;
          font-size: 13px;
          font-weight: 600;
        }

        .visibility-toggle input {
          width: 16px;
          height: 16px;
          accent-color: #6366f1;
        }

        .save-state {
          color: #475569;
          font-size: 12px;
        }

        .pair-list {
          display: grid;
          gap: 10px;
        }

        .pair-row {
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 10px;
          background: #fff;
        }

        .pair-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
          font-size: 12px;
          color: #475569;
        }

        .pair-head strong {
          color: #0f172a;
          font-size: 12px;
        }

        .pair-track {
          height: 10px;
          border-radius: 999px;
          background: #e2e8f0;
          position: relative;
          overflow: hidden;
        }

        .pair-fill {
          height: 100%;
          background: linear-gradient(90deg, #6366f1, #22d3ee);
        }

        .pair-midline {
          position: absolute;
          left: 50%;
          top: 0;
          bottom: 0;
          width: 2px;
          transform: translateX(-1px);
          background: #94a3b8;
        }

        @media (max-width: 820px) {
          .section-head {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </section>
  );
}
