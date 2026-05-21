import Head from 'next/head';
import { useMemo, useState } from 'react';
import { useEffect } from 'react';
import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]';

const ASSESSMENTS = [
  {
    id: 'mbti',
    title: 'Myers-Briggs Type Indicator (MBTI)',
    description: 'Maps your communication and decision patterns in project and team environments.',
    time: '12 min',
    theme: 'linear-gradient(135deg, #6366f1 0%, #22d3ee 100%)',
  },
  {
    id: 'big-five',
    title: 'Big Five Personality Test',
    description: 'Builds a reliable profile of work behavior across five core dimensions.',
    time: '15 min',
    theme: 'linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%)',
  },
  {
    id: 'core-drivers',
    title: 'Core Drivers Assessment',
    description: 'Highlights what energizes your performance, ownership, and impact at work.',
    time: '10 min',
    theme: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
  },
  {
    id: 'disc',
    title: 'DiSC Personality Test',
    description: 'Shows collaboration and influence tendencies across delivery and stakeholder scenarios.',
    time: '11 min',
    theme: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
  },
  {
    id: 'enneagram',
    title: 'Enneagram Test',
    description: 'Reveals motivators and response style under pressure and changing priorities.',
    time: '14 min',
    theme: 'linear-gradient(135deg, #22c55e 0%, #06b6d4 100%)',
  },
  {
    id: 'strengthsfinder',
    title: 'StrengthsFinder',
    description: 'Identifies natural strengths that shape leadership and execution consistency.',
    time: '18 min',
    theme: 'linear-gradient(135deg, #64748b 0%, #334155 100%)',
  },
  {
    id: 'via-strengths',
    title: 'VIA Character Strengths Test',
    description: 'Highlights values-driven strengths that support trust, resilience, and team fit.',
    time: '13 min',
    theme: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  },
];

const EMPLOYER_FRIENDLY_SIGNALS = [
  'Highly analytical communicator',
  'Collaborative leadership style',
  'Strong stakeholder management tendencies',
  'Structured decision-making preference',
  'Calm under delivery pressure',
  'Strong cross-functional facilitation',
];

const SCORE_BARS = [
  { label: 'Communication Clarity', value: 84 },
  { label: 'Leadership Influence', value: 78 },
  { label: 'Team Compatibility', value: 88 },
  { label: 'Adaptability', value: 73 },
  { label: 'Execution Consistency', value: 81 },
];

const RADAR_AXES = [
  { label: 'Communication', value: 82 },
  { label: 'Leadership', value: 75 },
  { label: 'Collaboration', value: 90 },
  { label: 'Decisioning', value: 78 },
  { label: 'Resilience', value: 72 },
  { label: 'Strategic Fit', value: 80 },
];

export async function getServerSideProps(ctx) {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session) {
    return { redirect: { destination: '/auth/login', permanent: false } };
  }
  if ((session.user.role || '').toLowerCase() !== 'candidate') {
    return { redirect: { destination: '/dashboard', permanent: false } };
  }

  return { props: {} };
}

function RadarChart() {
  const center = 120;
  const radius = 88;
  const points = RADAR_AXES.map((axis, index) => {
    const angle = (Math.PI * 2 * index) / RADAR_AXES.length - Math.PI / 2;
    const pointRadius = (axis.value / 100) * radius;
    const x = center + Math.cos(angle) * pointRadius;
    const y = center + Math.sin(angle) * pointRadius;
    return { ...axis, x, y, angle };
  });

  const polygonPoints = points.map((point) => `${point.x},${point.y}`).join(' ');

  return (
    <div className="radar-wrap">
      <svg viewBox="0 0 240 240" role="img" aria-label="Professional insight radar chart">
        {[20, 40, 60, 80, 100].map((level) => (
          <circle
            key={level}
            cx={center}
            cy={center}
            r={(level / 100) * radius}
            fill="none"
            stroke="var(--grid)"
            strokeWidth="1"
          />
        ))}
        {points.map((point) => (
          <line
            key={point.label}
            x1={center}
            y1={center}
            x2={center + Math.cos(point.angle) * radius}
            y2={center + Math.sin(point.angle) * radius}
            stroke="var(--grid)"
            strokeWidth="1"
          />
        ))}
        <polygon points={polygonPoints} fill="rgba(99,102,241,0.22)" stroke="rgba(99,102,241,0.85)" strokeWidth="2" />
      </svg>
      <div className="radar-legend">
        {RADAR_AXES.map((axis) => (
          <span key={axis.label}>{axis.label}</span>
        ))}
      </div>
    </div>
  );
}

export default function ProfessionalInsightsPage() {
  const [completed, setCompleted] = useState(() =>
    ASSESSMENTS.reduce((acc, item, idx) => ({ ...acc, [item.id]: idx < 3 }), {})
  );
  const [visibleToEmployers, setVisibleToEmployers] = useState(() =>
    ASSESSMENTS.reduce((acc, item, idx) => ({ ...acc, [item.id]: idx < 2 }), {})
  );
  const [highlightStrengths, setHighlightStrengths] = useState(true);
  const [enableEmployerViewing, setEnableEmployerViewing] = useState(true);
  const [mbtiInsight, setMbtiInsight] = useState(null);

  useEffect(() => {
    async function loadMBTIInsight() {
      try {
        const response = await fetch('/api/candidate/insights/mbti');
        if (!response.ok) return;
        const payload = await response.json();
        if (!payload?.mbti?.type) return;

        setMbtiInsight(payload.mbti);
        setCompleted((prev) => ({ ...prev, mbti: true }));
        setVisibleToEmployers((prev) => ({
          ...prev,
          mbti: Boolean(payload.mbti.visibleToEmployers),
        }));
      } catch {
        // no-op
      }
    }

    function onMBTIUpdate(event) {
      const detail = event?.detail;
      if (!detail?.type) return;
      setMbtiInsight(detail);
      setCompleted((prev) => ({ ...prev, mbti: true }));
      setVisibleToEmployers((prev) => ({ ...prev, mbti: Boolean(detail.visibleToEmployers) }));
    }

    function loadBigFiveCompletion() {
      try {
        const raw = window.localStorage.getItem('bigFiveAssessmentResult');
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (parsed?.scores) {
          setCompleted((prev) => ({ ...prev, 'big-five': true }));
        }
      } catch {
        // no-op
      }
    }

    function onBigFiveUpdate() {
      setCompleted((prev) => ({ ...prev, 'big-five': true }));
    }

    loadMBTIInsight();
    loadBigFiveCompletion();
    window.addEventListener('mbtiInsightUpdated', onMBTIUpdate);
    window.addEventListener('bigFiveInsightUpdated', onBigFiveUpdate);
    return () => {
      window.removeEventListener('mbtiInsightUpdated', onMBTIUpdate);
      window.removeEventListener('bigFiveInsightUpdated', onBigFiveUpdate);
    };
  }, []);

  async function persistMBTIVisibility(visible) {
    if (!mbtiInsight?.type) return;
    try {
      const response = await fetch('/api/candidate/insights/mbti', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result: mbtiInsight, visibleToEmployers: visible }),
      });
      if (!response.ok) return;
      const payload = await response.json();
      if (payload?.mbti) {
        setMbtiInsight(payload.mbti);
        window.dispatchEvent(new CustomEvent('mbtiInsightUpdated', { detail: payload.mbti }));
      }
    } catch {
      // no-op
    }
  }

  const completedCount = useMemo(
    () => Object.values(completed).filter(Boolean).length,
    [completed]
  );

  const insightScore = Math.min(98, 45 + completedCount * 7);
  const visibilityCount = useMemo(
    () => Object.values(visibleToEmployers).filter(Boolean).length,
    [visibleToEmployers]
  );

  const analyticsSummary = [
    { label: 'Communication Style', value: 'Analytical & concise', delta: '+6%' },
    { label: 'Leadership Style', value: 'Collaborative operator', delta: '+4%' },
    { label: 'Team Compatibility', value: 'High cross-team fit', delta: '+9%' },
    { label: 'Strength Profile', value: 'Structured delivery focus', delta: '+7%' },
  ];

  return (
    <>
      <Head>
        <title>Professional Insights & Assessments – PMO Network</title>
        <meta
          name="description"
          content="Complete optional workplace and behavioural assessments to provide deeper hiring insights to employers."
        />
      </Head>

      <div className="insights-page">
        <section className="hero">
          <div>
            <p className="eyebrow">Behavioural Intelligence Layer</p>
            <h1>Professional Insights &amp; Assessments</h1>
            <p className="subtitle">
              Provide employers with deeper insight into your communication style, strengths, leadership tendencies,
              and workplace compatibility.
            </p>

            <div className="tracker-row">
              <div className="tracker-card">
                <span>Assessments completed</span>
                <strong>{completedCount} / {ASSESSMENTS.length}</strong>
              </div>
              <div className="tracker-card">
                <span>Profile insight strength score</span>
                <strong>{insightScore}%</strong>
              </div>
              <div className="tracker-card">
                <span>Visibility status</span>
                <strong>{enableEmployerViewing ? 'Employer Viewing Enabled' : 'Private Mode'}</strong>
              </div>
            </div>
          </div>

          <div className="hero-summary">
            <h2>Analytics Summary</h2>
            <div className="summary-grid">
              {analyticsSummary.map((item) => (
                <article key={item.label} className="summary-card">
                  <p>{item.label}</p>
                  <h3>{item.value}</h3>
                  <span>{item.delta}</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="assessments-section">
          <div className="section-header">
            <h2>Assessment Library</h2>
            <p>Professional Insights · Workplace Compatibility · Team Fit Analysis</p>
          </div>

          <div className="assessment-grid">
            {ASSESSMENTS.map((assessment, index) => {
              const isComplete = Boolean(completed[assessment.id]);
              const percent = isComplete ? 100 : 30 + (index % 4) * 10;
              return (
                <article key={assessment.id} className="assessment-card">
                  <div className="card-glow" style={{ background: assessment.theme }} />
                  <div className="assessment-head">
                    <div className="icon-pill">{index + 1}</div>
                    <div>
                      <h3>{assessment.title}</h3>
                      <p>{assessment.description}</p>
                    </div>
                  </div>

                  <div className="assessment-meta">
                    <span>Estimated time: {assessment.time}</span>
                    <span className={`status ${isComplete ? 'done' : 'pending'}`}>
                      {isComplete ? 'Completed' : 'Not Started'}
                    </span>
                  </div>

                  {assessment.id === 'mbti' && mbtiInsight?.type && (
                    <div className="assessment-result-note">
                      Latest result: <strong>{mbtiInsight.type}</strong>
                      {mbtiInsight.completedAt ? ` · saved ${new Date(mbtiInsight.completedAt).toLocaleDateString()}` : ''}
                    </div>
                  )}

                  <div className="progress-track" aria-hidden="true">
                    <div className="progress-fill" style={{ width: `${percent}%` }} />
                  </div>

                  <div className="assessment-actions">
                    {assessment.id === 'mbti' ? (
                      <>
                        <Link href="/dashboard/assessments/mbti" className="btn-primary">
                          Start Assessment
                        </Link>
                        <Link href="/dashboard/assessments/mbti?retake=1" className="btn-secondary">
                          Retake Assessment
                        </Link>
                      </>
                    ) : assessment.id === 'big-five' ? (
                      <>
                        <Link href="/dashboard/assessments/big-five" className="btn-primary">
                          Start Assessment
                        </Link>
                        <Link href="/dashboard/assessments/big-five" className="btn-secondary">
                          Retake Assessment
                        </Link>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={() => setCompleted((prev) => ({ ...prev, [assessment.id]: true }))}
                        >
                          Start Assessment
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => setCompleted((prev) => ({ ...prev, [assessment.id]: false }))}
                        >
                          Retake Assessment
                        </button>
                      </>
                    )}
                  </div>

                  <label className="toggle-row">
                    <span>Visible to Employers</span>
                    <input
                      type="checkbox"
                      checked={Boolean(visibleToEmployers[assessment.id])}
                      onChange={async (event) => {
                        const checked = event.target.checked;
                        setVisibleToEmployers((prev) => ({
                          ...prev,
                          [assessment.id]: checked,
                        }));

                        if (assessment.id === 'mbti') {
                          await persistMBTIVisibility(checked);
                        }
                      }}
                    />
                  </label>
                </article>
              );
            })}
          </div>
        </section>

        <section className="insights-grid">
          <article className="panel large">
            <div className="section-header">
              <h2>Results &amp; Insights</h2>
              <p>Leadership &amp; Communication Insights · Behavioural Strength Indicators</p>
            </div>

            <div className="signal-tags">
              {EMPLOYER_FRIENDLY_SIGNALS.map((signal) => (
                <span key={signal}>{signal}</span>
              ))}
            </div>

            <div className="chart-layout">
              <RadarChart />
              <div className="bar-chart">
                {SCORE_BARS.map((metric) => (
                  <div key={metric.label} className="bar-row">
                    <div className="bar-head">
                      <span>{metric.label}</span>
                      <strong>{metric.value}%</strong>
                    </div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${metric.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="compatibility-meters">
              <div>
                <p>Workplace Compatibility</p>
                <strong>86%</strong>
                <small>Strong alignment with structured, collaborative teams.</small>
              </div>
              <div>
                <p>Collaboration Style</p>
                <strong>82%</strong>
                <small>Facilitates cross-functional delivery and clear decision flow.</small>
              </div>
              <div>
                <p>Leadership Potential</p>
                <strong>79%</strong>
                <small>High potential in PMO coordination and stakeholder leadership roles.</small>
              </div>
            </div>
          </article>

          <article className="panel privacy">
            <div className="section-header">
              <h2>Employer Visibility Settings</h2>
              <p>Control exactly what employers can see.</p>
            </div>

            <label className="toggle-row">
              <span>Enable employer viewing</span>
              <input
                type="checkbox"
                checked={enableEmployerViewing}
                onChange={(event) => setEnableEmployerViewing(event.target.checked)}
              />
            </label>

            <label className="toggle-row">
              <span>Highlight selected strengths</span>
              <input
                type="checkbox"
                checked={highlightStrengths}
                onChange={(event) => setHighlightStrengths(event.target.checked)}
              />
            </label>

            <div className="privacy-metrics">
              <div>
                <span>Public assessments</span>
                <strong>{visibilityCount}</strong>
              </div>
              <div>
                <span>Private assessments</span>
                <strong>{ASSESSMENTS.length - visibilityCount}</strong>
              </div>
            </div>

            <ul>
              <li>Which assessments appear publicly</li>
              <li>Which results remain private</li>
              <li>Top strengths you want to highlight</li>
              <li>Employer viewing on/off at any time</li>
            </ul>
          </article>

          <article className="panel ai">
            <div className="section-header">
              <h2>AI Insights Panel</h2>
              <p>Intelligence summary for hiring teams.</p>
            </div>
            <div className="ai-cards">
              <div>
                <h3>Top Workplace Strengths</h3>
                <p>Structured planning, stakeholder alignment, and execution reliability.</p>
              </div>
              <div>
                <h3>Recommended Team Environment</h3>
                <p>Cross-functional squads with clear outcomes, autonomy, and transparent communication.</p>
              </div>
              <div>
                <h3>Suggested PMO Roles</h3>
                <p>Program Coordinator, PMO Analyst, Delivery Operations Lead.</p>
              </div>
              <div>
                <h3>Leadership Potential Indicators</h3>
                <p>Consistent influence, calm prioritization, and dependable team guidance.</p>
              </div>
              <div>
                <h3>Workplace Communication Summary</h3>
                <p>Clear, analytical communicator with a collaborative and outcome-focused tone.</p>
              </div>
            </div>
          </article>
        </section>
      </div>

      <style jsx>{`
        .insights-page {
          --bg: #f4f7fb;
          --panel: #ffffff;
          --text: #0f172a;
          --muted: #64748b;
          --border: #e2e8f0;
          --accent: #6366f1;
          --grid: #dbe3f0;
          max-width: 1280px;
          margin: 0 auto;
          padding: 28px;
          color: var(--text);
          background: var(--bg);
          min-height: calc(100vh - 72px);
        }

        .hero {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 22px;
          margin-bottom: 24px;
        }

        .hero > div,
        .panel,
        .assessment-card {
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 18px;
          box-shadow: 0 12px 34px rgba(15, 23, 42, 0.07);
        }

        .hero > div {
          padding: 24px;
        }

        .eyebrow {
          margin: 0 0 10px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: var(--accent);
          text-transform: uppercase;
        }

        h1 {
          margin: 0;
          font-size: clamp(28px, 4vw, 40px);
          letter-spacing: -0.02em;
          line-height: 1.05;
        }

        .subtitle {
          margin: 14px 0 0;
          color: var(--muted);
          max-width: 70ch;
          line-height: 1.6;
        }

        .tracker-row {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          margin-top: 20px;
        }

        .tracker-card {
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 14px;
          background: linear-gradient(180deg, rgba(99, 102, 241, 0.08), rgba(99, 102, 241, 0.01));
        }

        .tracker-card span {
          display: block;
          font-size: 12px;
          color: var(--muted);
          margin-bottom: 8px;
        }

        .tracker-card strong {
          font-size: 16px;
          font-weight: 700;
        }

        .hero-summary h2,
        .section-header h2 {
          margin: 0;
          font-size: 19px;
          letter-spacing: -0.01em;
        }

        .hero-summary h2 {
          margin-bottom: 14px;
        }

        .summary-grid {
          display: grid;
          gap: 10px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .summary-card {
          padding: 12px;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: #fff;
        }

        .summary-card p {
          margin: 0;
          font-size: 12px;
          color: var(--muted);
        }

        .summary-card h3 {
          margin: 8px 0 4px;
          font-size: 14px;
        }

        .summary-card span {
          color: #059669;
          font-size: 12px;
          font-weight: 600;
        }

        .assessments-section {
          margin-bottom: 24px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 14px;
        }

        .section-header p {
          margin: 0;
          color: var(--muted);
          font-size: 13px;
        }

        .assessment-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .assessment-card {
          padding: 16px;
          position: relative;
          overflow: hidden;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .assessment-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 16px 34px rgba(15, 23, 42, 0.11);
        }

        .card-glow {
          position: absolute;
          inset: 0;
          opacity: 0.12;
          pointer-events: none;
        }

        .assessment-head {
          display: flex;
          gap: 12px;
          position: relative;
        }

        .icon-pill {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          font-size: 13px;
          font-weight: 700;
          background: #eef2ff;
          color: #4338ca;
          flex-shrink: 0;
        }

        .assessment-head h3 {
          margin: 0;
          font-size: 15px;
        }

        .assessment-head p {
          margin: 6px 0 0;
          color: var(--muted);
          font-size: 13px;
          line-height: 1.45;
        }

        .assessment-meta {
          position: relative;
          margin-top: 12px;
          display: flex;
          justify-content: space-between;
          gap: 12px;
          font-size: 12px;
          color: var(--muted);
        }

        .assessment-result-note {
          margin-top: 8px;
          font-size: 12px;
          color: #4338ca;
          font-weight: 600;
          position: relative;
        }

        .status {
          padding: 4px 8px;
          border-radius: 999px;
          font-weight: 700;
          font-size: 11px;
        }

        .status.done {
          background: #dcfce7;
          color: #166534;
        }

        .status.pending {
          background: #ede9fe;
          color: #5b21b6;
        }

        .progress-track,
        .bar-track {
          margin-top: 10px;
          height: 8px;
          border-radius: 999px;
          background: #e2e8f0;
          overflow: hidden;
        }

        .progress-fill,
        .bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #6366f1, #22d3ee);
        }

        .assessment-actions {
          display: flex;
          gap: 10px;
          margin-top: 14px;
          position: relative;
        }

        .btn-primary,
        .btn-secondary {
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 9px 12px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-primary {
          background: #111827;
          color: #fff;
          border-color: #111827;
        }

        .btn-primary:hover {
          background: #000;
        }

        .btn-secondary {
          background: #fff;
          color: #0f172a;
        }

        .btn-secondary:hover {
          background: #f8fafc;
        }

        .toggle-row {
          margin-top: 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          color: var(--muted);
          position: relative;
        }

        .toggle-row input {
          width: 40px;
          height: 22px;
          accent-color: #6366f1;
          cursor: pointer;
        }

        .insights-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 14px;
          align-items: start;
        }

        .panel {
          padding: 18px;
        }

        .panel.large {
          grid-row: span 2;
        }

        .signal-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 16px;
        }

        .signal-tags span {
          border: 1px solid var(--border);
          background: #f8fafc;
          border-radius: 999px;
          padding: 7px 10px;
          font-size: 12px;
          color: #334155;
        }

        .chart-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }

        .radar-wrap {
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 10px;
          background: #fff;
        }

        .radar-wrap svg {
          width: 100%;
          height: auto;
          max-width: 260px;
          margin: 0 auto;
          display: block;
        }

        .radar-legend {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 6px;
          margin-top: 8px;
          font-size: 11px;
          color: var(--muted);
        }

        .bar-chart {
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 14px;
          background: #fff;
        }

        .bar-row + .bar-row {
          margin-top: 12px;
        }

        .bar-head {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
        }

        .bar-head span {
          color: var(--muted);
        }

        .compatibility-meters {
          margin-top: 16px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .compatibility-meters div {
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 12px;
          background: #fff;
        }

        .compatibility-meters p {
          margin: 0;
          font-size: 12px;
          color: var(--muted);
        }

        .compatibility-meters strong {
          display: block;
          margin-top: 8px;
          font-size: 24px;
        }

        .compatibility-meters small {
          margin-top: 6px;
          display: block;
          color: #475569;
          line-height: 1.4;
        }

        .privacy ul {
          margin: 12px 0 0;
          padding-left: 18px;
          color: #334155;
        }

        .privacy li + li {
          margin-top: 6px;
        }

        .privacy-metrics {
          margin-top: 12px;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }

        .privacy-metrics div {
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 10px;
          background: #f8fafc;
        }

        .privacy-metrics span {
          color: var(--muted);
          font-size: 12px;
          display: block;
        }

        .privacy-metrics strong {
          font-size: 22px;
        }

        .ai-cards {
          display: grid;
          gap: 9px;
        }

        .ai-cards div {
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 12px;
          background: linear-gradient(180deg, rgba(15, 23, 42, 0.03), rgba(15, 23, 42, 0));
        }

        .ai-cards h3 {
          margin: 0;
          font-size: 13px;
        }

        .ai-cards p {
          margin: 6px 0 0;
          color: #475569;
          font-size: 12px;
          line-height: 1.45;
        }

        @media (max-width: 1120px) {
          .hero,
          .insights-grid,
          .chart-layout,
          .assessment-grid {
            grid-template-columns: 1fr;
          }

          .compatibility-meters,
          .tracker-row,
          .summary-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 720px) {
          .insights-page {
            padding: 16px;
          }

          .section-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .compatibility-meters,
          .tracker-row,
          .summary-grid,
          .privacy-metrics {
            grid-template-columns: 1fr;
          }
        }

        @media (prefers-color-scheme: dark) {
          .insights-page {
            --bg: #020617;
            --panel: #0b1220;
            --text: #e2e8f0;
            --muted: #94a3b8;
            --border: #1f2a3a;
            --grid: #223246;
          }

          .summary-card,
          .bar-chart,
          .radar-wrap,
          .compatibility-meters div,
          .ai-cards div {
            background: #0f172a;
          }

          .signal-tags span,
          .privacy-metrics div {
            background: #0f172a;
          }

          .btn-secondary {
            background: #111827;
            color: #e2e8f0;
          }
        }
      `}</style>
    </>
  );
}
