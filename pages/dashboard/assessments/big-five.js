import Head from 'next/head';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../api/auth/[...nextauth]';
import { getItems, getInfo } from '@bigfive-org/questions';
import calculateScore from '@bigfive-org/score';

const DOMAIN_LABELS = {
  openness: 'Openness to Experience',
  conscientiousness: 'Conscientiousness',
  extraversion: 'Extraversion',
  agreeableness: 'Agreeableness',
  neuroticism: 'Neuroticism',
};

export async function getServerSideProps(ctx) {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session) {
    return { redirect: { destination: '/auth/login', permanent: false } };
  }
  if ((session.user.role || '').toLowerCase() !== 'candidate') {
    return { redirect: { destination: '/dashboard', permanent: false } };
  }

  const info = getInfo();
  const questions = await getItems('en');

  return {
    props: {
      info,
      questions,
    },
  };
}

function normalizeDomainKey(rawDomain) {
  if (!rawDomain) return 'unknown';
  const key = String(rawDomain).trim().toLowerCase();
  if (key.includes('open')) return 'openness';
  if (key.includes('conscient')) return 'conscientiousness';
  if (key.includes('extra')) return 'extraversion';
  if (key.includes('agree')) return 'agreeableness';
  if (key.includes('neuro')) return 'neuroticism';
  return key;
}

function formatResult(resultData) {
  const entries = Object.entries(resultData || {}).map(([domain, data]) => {
    const avg = data.count ? data.score / data.count : 0;
    const percent = Math.round((avg / 5) * 100);
    const key = normalizeDomainKey(domain);
    return {
      key,
      title: DOMAIN_LABELS[key] || domain,
      level: data.result || 'neutral',
      percent,
      rawScore: data.score,
      count: data.count,
    };
  });

  const sortOrder = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
  entries.sort((a, b) => sortOrder.indexOf(a.key) - sortOrder.indexOf(b.key));
  return entries;
}

export default function BigFiveAssessmentPage({ info, questions }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const progress = Math.round((answeredCount / questions.length) * 100);

  const canGoNext = Boolean(answers[currentQuestion?.id]);
  const isLastQuestion = currentIndex === questions.length - 1;

  const resultCards = useMemo(() => (result ? formatResult(result) : []), [result]);

  function onSelect(question, score) {
    setError('');
    setAnswers((prev) => ({
      ...prev,
      [question.id]: {
        id: question.id,
        score: Number(score),
        domain: question.domain,
        facet: question.facet,
      },
    }));
  }

  function nextQuestion() {
    if (!canGoNext) {
      setError('Please select an answer before continuing.');
      return;
    }
    setError('');
    if (!isLastQuestion) setCurrentIndex((prev) => prev + 1);
  }

  function previousQuestion() {
    setError('');
    if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
  }

  function submitTest() {
    const answerList = Object.values(answers);
    if (answerList.length !== questions.length) {
      setError(`Please answer all questions before calculating results (${answerList.length}/${questions.length}).`);
      return;
    }

    const scores = calculateScore(answerList);
    setResult(scores);

    try {
      window.localStorage.setItem('bigFiveAssessmentResult', JSON.stringify({
        completedAt: new Date().toISOString(),
        scores,
      }));
      window.dispatchEvent(new CustomEvent('bigFiveInsightUpdated'));
    } catch {
      // no-op
    }

    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }

  return (
    <>
      <Head>
        <title>Big Five Personality Test – PMO Network</title>
        <meta
          name="description"
          content="Complete the Big Five personality assessment powered by the open-source bigfive-web questionnaire and scoring model."
        />
      </Head>

      <div className="bigfive-page">
        <header className="hero">
          <div>
            <p className="eyebrow">Professional Insights</p>
            <h1>Big Five Personality Test</h1>
            <p>
              Embedded using the open-source Big Five question inventory and scoring model from `rubynor/bigfive-web`.
              This test includes {info.questions} questions and estimates about {info.time} minutes.
            </p>
          </div>
          <div className="hero-actions">
            <Link href="/dashboard/professional-insights" className="btn-secondary">Back to Professional Insights</Link>
          </div>
        </header>

        <section className="progress-panel">
          <div>
            <span>Progress</span>
            <strong>{answeredCount}/{questions.length}</strong>
          </div>
          <div className="progress-track" aria-hidden="true">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="step-label">Question {currentIndex + 1} of {questions.length}</span>
        </section>

        <section className="question-card">
          <h2>{currentQuestion.text}</h2>
          <div className="answers-grid">
            {currentQuestion.choices.map((choice, idx) => {
              const selected = answers[currentQuestion.id]?.score === choice.score;
              return (
                <label key={`${currentQuestion.id}-${idx}`} className={`choice ${selected ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name={currentQuestion.id}
                    checked={selected}
                    onChange={() => onSelect(currentQuestion, choice.score)}
                  />
                  <span>{choice.text}</span>
                </label>
              );
            })}
          </div>

          {error && <p className="error">{error}</p>}

          <div className="actions">
            <button type="button" className="btn-secondary" disabled={currentIndex === 0} onClick={previousQuestion}>
              Previous
            </button>
            {!isLastQuestion ? (
              <button type="button" className="btn-primary" onClick={nextQuestion}>Next Question</button>
            ) : (
              <button type="button" className="btn-primary" onClick={submitTest}>Calculate Results</button>
            )}
          </div>
        </section>

        {result && (
          <section className="results-card">
            <h3>Big Five Score Summary</h3>
            <div className="result-grid">
              {resultCards.map((entry) => (
                <article key={entry.key} className="result-item">
                  <div className="result-head">
                    <span>{entry.title}</span>
                    <strong>{entry.percent}%</strong>
                  </div>
                  <div className="bar-track" aria-hidden="true">
                    <div className="bar-fill" style={{ width: `${entry.percent}%` }} />
                  </div>
                  <small>Level: {entry.level}</small>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>

      <style jsx>{`
        .bigfive-page {
          max-width: 960px;
          margin: 0 auto;
          padding: 24px;
          color: #0f172a;
        }

        .hero,
        .progress-panel,
        .question-card,
        .results-card {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.07);
        }

        .hero {
          padding: 20px;
          display: flex;
          justify-content: space-between;
          gap: 16px;
        }

        .eyebrow {
          margin: 0;
          color: #6366f1;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-size: 12px;
          font-weight: 700;
        }

        h1 {
          margin: 8px 0;
          font-size: 30px;
          letter-spacing: -0.02em;
        }

        .hero p {
          margin: 0;
          color: #475569;
          line-height: 1.55;
        }

        .progress-panel {
          margin-top: 14px;
          padding: 14px;
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 12px;
          align-items: center;
        }

        .progress-panel span { color: #64748b; font-size: 12px; }
        .progress-panel strong { font-size: 18px; }

        .progress-track {
          height: 10px;
          border-radius: 999px;
          overflow: hidden;
          background: #e2e8f0;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #6366f1, #22d3ee);
        }

        .step-label { font-size: 12px; color: #64748b; font-weight: 600; }

        .question-card {
          margin-top: 14px;
          padding: 16px;
        }

        .question-card h2 {
          margin: 0;
          font-size: 22px;
          line-height: 1.35;
        }

        .answers-grid {
          margin-top: 14px;
          display: grid;
          gap: 10px;
        }

        .choice {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          border: 1px solid #94a3b8;
          border-radius: 10px;
          background: #fff;
          padding: 11px;
          cursor: pointer;
        }

        .choice.selected {
          border-color: #6366f1;
          background: #eef2ff;
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
        }

        .choice input {
          margin-top: 2px;
          width: 16px;
          height: 16px;
          accent-color: #6366f1;
        }

        .choice span {
          color: #0f172a;
          font-size: 14px;
          line-height: 1.45;
        }

        .error {
          margin: 12px 0 0;
          color: #b91c1c;
          background: #fee2e2;
          border: 1px solid #fecaca;
          border-radius: 10px;
          padding: 10px;
          font-size: 13px;
        }

        .actions {
          margin-top: 14px;
          display: flex;
          justify-content: space-between;
          gap: 10px;
        }

        .btn-primary,
        .btn-secondary {
          border-radius: 10px;
          font-size: 12px;
          font-weight: 700;
          padding: 10px 12px;
          border: 1px solid #cbd5e1;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .btn-primary {
          background: #0f172a;
          border-color: #0f172a;
          color: #fff;
        }

        .btn-secondary {
          background: #fff;
          color: #0f172a;
        }

        .btn-secondary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .results-card {
          margin-top: 16px;
          padding: 16px;
        }

        .results-card h3 {
          margin: 0;
          font-size: 22px;
        }

        .result-grid {
          margin-top: 12px;
          display: grid;
          gap: 10px;
        }

        .result-item {
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: #f8fafc;
          padding: 10px;
        }

        .result-head {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 8px;
          font-size: 13px;
        }

        .result-head strong { color: #4338ca; }

        .bar-track {
          height: 10px;
          border-radius: 999px;
          overflow: hidden;
          background: #e2e8f0;
        }

        .bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #6366f1, #22d3ee);
        }

        .result-item small {
          display: block;
          margin-top: 7px;
          color: #475569;
          font-size: 12px;
        }

        @media (max-width: 800px) {
          .hero,
          .progress-panel {
            grid-template-columns: 1fr;
            display: grid;
          }

          .actions {
            flex-direction: column;
          }
        }
      `}</style>
    </>
  );
}
