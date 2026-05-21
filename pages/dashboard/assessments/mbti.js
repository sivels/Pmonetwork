import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../api/auth/[...nextauth]';

const QUESTIONS = [
  { id: 1, prompt: 'At a party do you:', options: [{ value: 'e', label: 'Interact with many, including strangers' }, { value: 'i', label: 'Interact with a few, known to you' }] },
  { id: 2, prompt: 'Are you more:', options: [{ value: 's', label: 'Realistic than speculative' }, { value: 'n', label: 'Speculative than realistic' }] },
  { id: 3, prompt: 'Is it worse to:', options: [{ value: 's', label: 'Have your “head in the clouds”' }, { value: 'n', label: 'Be “in a rut”' }] },
  { id: 4, prompt: 'Are you more impressed by:', options: [{ value: 't', label: 'Principles' }, { value: 'f', label: 'Emotions' }] },
  { id: 5, prompt: 'Are more drawn toward the:', options: [{ value: 't', label: 'Convincing' }, { value: 'f', label: 'Touching' }] },
  { id: 6, prompt: 'Do you prefer to work:', options: [{ value: 'j', label: 'To deadlines' }, { value: 'p', label: 'Just “whenever”' }] },
  { id: 7, prompt: 'Do you tend to choose:', options: [{ value: 'j', label: 'Rather carefully' }, { value: 'p', label: 'Somewhat impulsively' }] },
  { id: 8, prompt: 'At parties do you:', options: [{ value: 'e', label: 'Stay late, with increasing energy' }, { value: 'i', label: 'Leave early with decreased energy' }] },
  { id: 9, prompt: 'Are you more attracted to:', options: [{ value: 's', label: 'Sensible people' }, { value: 'n', label: 'Imaginative people' }] },
  { id: 10, prompt: 'Are you more interested in:', options: [{ value: 's', label: 'What is actual' }, { value: 'n', label: 'What is possible' }] },
  { id: 11, prompt: 'In judging others are you more swayed by:', options: [{ value: 't', label: 'Laws than circumstances' }, { value: 'f', label: 'Circumstances than laws' }] },
  { id: 12, prompt: 'In approaching others is your inclination to be somewhat:', options: [{ value: 't', label: 'Objective' }, { value: 'f', label: 'Personal' }] },
  { id: 13, prompt: 'Are you more:', options: [{ value: 'j', label: 'Punctual' }, { value: 'p', label: 'Leisurely' }] },
  { id: 14, prompt: 'Does it bother you more having things:', options: [{ value: 'j', label: 'Incomplete' }, { value: 'p', label: 'Completed' }] },
  { id: 15, prompt: 'In your social groups do you:', options: [{ value: 'e', label: 'Keep abreast of other’s happenings' }, { value: 'i', label: 'Get behind on the news' }] },
  { id: 16, prompt: 'In doing ordinary things are you more likely to:', options: [{ value: 's', label: 'Do it the usual way' }, { value: 'n', label: 'Do it your own way' }] },
  { id: 17, prompt: 'Writers should:', options: [{ value: 's', label: 'Say what they mean and mean what they say' }, { value: 'n', label: 'Express things more by use of analogy' }] },
  { id: 18, prompt: 'Which appeals to you more:', options: [{ value: 't', label: 'Consistency of thought' }, { value: 'f', label: 'Harmonious human relationships' }] },
  { id: 19, prompt: 'Are you more comfortable in making:', options: [{ value: 't', label: 'Logical judgments' }, { value: 'f', label: 'Value judgments' }] },
  { id: 20, prompt: 'Do you want things:', options: [{ value: 'j', label: 'Settled and decided' }, { value: 'p', label: 'Unsettled and undecided' }] },
  { id: 21, prompt: 'Would you say you are more:', options: [{ value: 'j', label: 'Serious and determined' }, { value: 'p', label: 'Easy-going' }] },
  { id: 22, prompt: 'In phoning do you:', options: [{ value: 'e', label: 'Rarely question that it will all be said' }, { value: 'i', label: 'Rehearse what you’ll say' }] },
  { id: 23, prompt: 'Facts:', options: [{ value: 's', label: 'Speak for themselves' }, { value: 'n', label: 'Illustrate principles' }] },
  { id: 24, prompt: 'Are visionaries:', options: [{ value: 's', label: 'somewhat annoying' }, { value: 'n', label: 'rather fascinating' }] },
  { id: 25, prompt: 'Are you more often:', options: [{ value: 't', label: 'a cool-headed person' }, { value: 'f', label: 'a warm-hearted person' }] },
  { id: 26, prompt: 'Is it worse to be:', options: [{ value: 't', label: 'unjust' }, { value: 'f', label: 'merciless' }] },
  { id: 27, prompt: 'Should one usually let events occur:', options: [{ value: 'j', label: 'by careful selection and choice' }, { value: 'p', label: 'randomly and by chance' }] },
  { id: 28, prompt: 'Do you feel better about:', options: [{ value: 'j', label: 'having purchased' }, { value: 'p', label: 'having the option to buy' }] },
  { id: 29, prompt: 'In company do you:', options: [{ value: 'e', label: 'initiate conversation' }, { value: 'i', label: 'wait to be approached' }] },
  { id: 30, prompt: 'Common sense is:', options: [{ value: 's', label: 'rarely questionable' }, { value: 'n', label: 'frequently questionable' }] },
  { id: 31, prompt: 'Children often do not:', options: [{ value: 's', label: 'make themselves useful enough' }, { value: 'n', label: 'exercise their fantasy enough' }] },
  { id: 32, prompt: 'In making decisions do you feel more comfortable with:', options: [{ value: 't', label: 'standards' }, { value: 'f', label: 'feelings' }] },
  { id: 33, prompt: 'Are you more:', options: [{ value: 't', label: 'firm than gentle' }, { value: 'f', label: 'gentle than firm' }] },
  { id: 34, prompt: 'Which is more admirable:', options: [{ value: 'j', label: 'the ability to organize and be methodical' }, { value: 'p', label: 'the ability to adapt and make do' }] },
  { id: 35, prompt: 'Do you put more value on:', options: [{ value: 'j', label: 'infinite' }, { value: 'p', label: 'open-minded' }] },
  { id: 36, prompt: 'Does new and non-routine interaction:', options: [{ value: 'e', label: 'stimulate and energize you' }, { value: 'i', label: 'tax your reserves' }] },
  { id: 37, prompt: 'Are you more frequently:', options: [{ value: 's', label: 'a practical sort of person' }, { value: 'n', label: 'a fanciful sort of person' }] },
  { id: 38, prompt: 'Are you more likely to:', options: [{ value: 's', label: 'see how others are useful' }, { value: 'n', label: 'see how others see' }] },
  { id: 39, prompt: 'Which is more satisfying:', options: [{ value: 't', label: 'to discuss an issue thoroughly' }, { value: 'f', label: 'to arrive at agreement on an issue' }] },
  { id: 40, prompt: 'Which rules you more:', options: [{ value: 't', label: 'your head' }, { value: 'f', label: 'your heart' }] },
  { id: 41, prompt: 'Are you more comfortable with work that:', options: [{ value: 'j', label: 'contracted' }, { value: 'p', label: 'done on a casual basis' }] },
  { id: 42, prompt: 'Do you tend to look for:', options: [{ value: 'j', label: 'the orderly' }, { value: 'p', label: 'whatever turns up' }] },
  { id: 43, prompt: 'Do you prefer:', options: [{ value: 'e', label: 'many friends with brief contact' }, { value: 'i', label: 'a few friends with more lengthy contact' }] },
  { id: 44, prompt: 'Do you go more by:', options: [{ value: 's', label: 'facts' }, { value: 'n', label: 'principles' }] },
  { id: 45, prompt: 'Are you more interested in:', options: [{ value: 's', label: 'production and distribution' }, { value: 'n', label: 'design and research' }] },
  { id: 46, prompt: 'Which is more of a compliment:', options: [{ value: 't', label: '“There is a very logical person.”' }, { value: 'f', label: '“There is a very sentimental person.”' }] },
  { id: 47, prompt: 'Do you value in yourself more that you are:', options: [{ value: 't', label: 'unwavering' }, { value: 'f', label: 'devoted' }] },
  { id: 48, prompt: 'Do you more often prefer the:', options: [{ value: 'j', label: 'final and unalterable statement' }, { value: 'p', label: 'tentative and preliminary statement' }] },
  { id: 49, prompt: 'Are you more comfortable:', options: [{ value: 'j', label: 'after a decision' }, { value: 'p', label: 'before a decision' }] },
  { id: 50, prompt: 'Do you:', options: [{ value: 'e', label: 'speak easily and at length with strangers' }, { value: 'i', label: 'find little to say to strangers' }] },
  { id: 51, prompt: 'Are you more likely to trust your:', options: [{ value: 's', label: 'experience' }, { value: 'n', label: 'hunch' }] },
  { id: 52, prompt: 'Do you feel:', options: [{ value: 's', label: 'more practical than ingenious' }, { value: 'n', label: 'more ingenious than practical' }] },
  { id: 53, prompt: 'Which person is more to be complimented - one of:', options: [{ value: 't', label: 'clear reason' }, { value: 'f', label: 'strong feeling' }] },
  { id: 54, prompt: 'Are you inclined more to be:', options: [{ value: 't', label: 'fair-minded' }, { value: 'f', label: 'sympathetic' }] },
  { id: 55, prompt: 'Is it preferable mostly to:', options: [{ value: 'j', label: 'make sure things are arranged' }, { value: 'p', label: 'just let things happen' }] },
  { id: 56, prompt: 'In relationships should most things be:', options: [{ value: 'j', label: 're-negotiable' }, { value: 'p', label: 'random and circumstantial' }] },
  { id: 57, prompt: 'When the phone rings do you:', options: [{ value: 'e', label: 'hasten to get to it first' }, { value: 'i', label: 'hope someone else will answer' }] },
  { id: 58, prompt: 'Do you prize more in yourself:', options: [{ value: 's', label: 'a strong sense of reality' }, { value: 'n', label: 'a vivid imagination' }] },
  { id: 59, prompt: 'Are you drawn more to:', options: [{ value: 's', label: 'fundamentals' }, { value: 'n', label: 'overtones' }] },
  { id: 60, prompt: 'Which seems the greater error:', options: [{ value: 't', label: 'to be too passionate' }, { value: 'f', label: 'to be too objective' }] },
  { id: 61, prompt: 'Do you see yourself as basically:', options: [{ value: 't', label: 'hard-headed' }, { value: 'f', label: 'soft-hearted' }] },
  { id: 62, prompt: 'Which situation appeals to you more:', options: [{ value: 'j', label: 'the structured and scheduled' }, { value: 'p', label: 'the unstructured and unscheduled' }] },
  { id: 63, prompt: 'Are you a person that is more:', options: [{ value: 'j', label: 'routinized than whimsical' }, { value: 'p', label: 'whimsical than routinized' }] },
  { id: 64, prompt: 'Are you more inclined to be:', options: [{ value: 'e', label: 'easy to approach' }, { value: 'i', label: 'somewhat reserved' }] },
  { id: 65, prompt: 'In writings do you prefer:', options: [{ value: 's', label: 'the more literal' }, { value: 'n', label: 'the more figurative' }] },
  { id: 66, prompt: 'Is it harder for you to:', options: [{ value: 's', label: 'identify with others' }, { value: 'n', label: 'utilize others' }] },
  { id: 67, prompt: 'Which do you wish more for yourself:', options: [{ value: 't', label: 'clarity of reason' }, { value: 'f', label: 'strength of compassion' }] },
  { id: 68, prompt: 'Which is the greater fault:', options: [{ value: 't', label: 'being indiscriminate' }, { value: 'f', label: 'being critical' }] },
  { id: 69, prompt: 'Do you prefer the:', options: [{ value: 'j', label: 'planned event' }, { value: 'p', label: 'unplanned event' }] },
  { id: 70, prompt: 'Do you tend to be more:', options: [{ value: 'j', label: 'deliberate than spontaneous' }, { value: 'p', label: 'spontaneous than deliberate' }] },
];

const TYPE_NOTES = {
  INTJ: 'Strategic planner with long-range systems thinking and strong structure preferences.',
  INTP: 'Analytical problem-solver who values logic, patterns, and independent thinking.',
  ENTJ: 'Decisive organizer who drives outcomes, strategy, and high-accountability execution.',
  ENTP: 'Innovative challenger who enjoys ideas, experimentation, and rethinking assumptions.',
  INFJ: 'Purpose-led integrator focused on impact, people, and thoughtful long-term alignment.',
  INFP: 'Values-driven contributor who brings empathy, reflection, and thoughtful creativity.',
  ENFJ: 'People-focused coordinator who aligns teams around growth, trust, and shared direction.',
  ENFP: 'Energetic connector with strong idea generation and collaborative momentum building.',
  ISTJ: 'Reliable operator who excels in consistency, detail, and process-driven delivery.',
  ISFJ: 'Supportive executor with strong ownership, care for quality, and steady follow-through.',
  ESTJ: 'Practical leader who structures teams and drives clear, measurable execution.',
  ESFJ: 'Relationship-oriented organizer who fosters cohesion and dependable team support.',
  ISTP: 'Hands-on troubleshooter who adapts quickly and solves practical operational challenges.',
  ISFP: 'Calm and flexible contributor who values craft, autonomy, and practical harmony.',
  ESTP: 'Action-oriented problem-solver who thrives in dynamic, high-responsibility environments.',
  ESFP: 'Engaging team contributor who brings energy, responsiveness, and people awareness.',
};

const PAIR_CONFIG = [
  { left: 'e', right: 'i', title: 'Extraversion vs Introversion', color: '#f59e0b' },
  { left: 's', right: 'n', title: 'Sensing vs Intuition', color: '#3b82f6' },
  { left: 't', right: 'f', title: 'Thinking vs Feeling', color: '#10b981' },
  { left: 'j', right: 'p', title: 'Judging vs Perceiving', color: '#ef4444' },
];

function calculateResult(answerMap) {
  const counts = { e: 0, i: 0, s: 0, n: 0, t: 0, f: 0, j: 0, p: 0 };
  Object.values(answerMap).forEach((value) => {
    if (counts[value] !== undefined) counts[value] += 1;
  });

  const pairScores = PAIR_CONFIG.map((pair) => {
    const total = counts[pair.left] + counts[pair.right];
    const leftPct = total ? Math.round((counts[pair.left] / total) * 100) : 0;
    const rightPct = total ? 100 - leftPct : 0;
    return {
      ...pair,
      total,
      leftPct,
      rightPct,
      winner: counts[pair.left] >= counts[pair.right] ? pair.left.toUpperCase() : pair.right.toUpperCase(),
      leftCount: counts[pair.left],
      rightCount: counts[pair.right],
    };
  });

  const type = pairScores.map((pair) => pair.winner).join('');

  return {
    type,
    counts,
    pairScores,
    completedAt: new Date().toISOString(),
  };
}

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

export default function MBTIAssessmentPage() {
  const router = useRouter();
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [visibleToEmployers, setVisibleToEmployers] = useState(false);
  const [saveState, setSaveState] = useState('');

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);
  const progress = Math.round((answeredCount / QUESTIONS.length) * 100);

  useEffect(() => {
    const isRetake = router.query.retake === '1';

    async function loadAssessmentState() {
      if (isRetake) {
        try {
          window.localStorage.removeItem('mbtiAssessmentAnswers');
          window.localStorage.removeItem('mbtiAssessmentResult');
        } catch {
          // no-op
        }
        setAnswers({});
        setResult(null);
        setError('');
        return;
      }

      try {
        const savedAnswers = window.localStorage.getItem('mbtiAssessmentAnswers');
        const savedResult = window.localStorage.getItem('mbtiAssessmentResult');

        if (savedAnswers) {
          setAnswers(JSON.parse(savedAnswers));
        }

        if (savedResult) {
          setResult(JSON.parse(savedResult));
        }
      } catch {
        // no-op
      }

      try {
        const response = await fetch('/api/candidate/insights/mbti');
        if (!response.ok) return;
        const payload = await response.json();
        if (payload?.mbti?.type) {
          setResult(payload.mbti);
          setVisibleToEmployers(Boolean(payload.mbti.visibleToEmployers));
          window.localStorage.setItem('mbtiAssessmentResult', JSON.stringify(payload.mbti));
        }
      } catch {
        // no-op
      }
    }

    loadAssessmentState();
  }, [router.query.retake]);

  async function persistMBTI(nextResult, visibility) {
    setSaveState('Saving...');
    try {
      const response = await fetch('/api/candidate/insights/mbti', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result: nextResult, visibleToEmployers: visibility }),
      });
      if (!response.ok) throw new Error('Failed to save MBTI insight');
      const payload = await response.json();
      if (payload?.mbti) {
        setResult(payload.mbti);
        window.localStorage.setItem('mbtiAssessmentResult', JSON.stringify(payload.mbti));
        window.dispatchEvent(new CustomEvent('mbtiInsightUpdated', { detail: payload.mbti }));
      }
      setSaveState('Saved');
      setTimeout(() => setSaveState(''), 1800);
    } catch {
      setSaveState('Could not save');
      setTimeout(() => setSaveState(''), 2200);
    }
  }

  const handleSelect = (questionId, value) => {
    setError('');
    setAnswers((prev) => {
      const next = { ...prev, [questionId]: value };
      try {
        window.localStorage.setItem('mbtiAssessmentAnswers', JSON.stringify(next));
      } catch {
        // no-op
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (answeredCount < QUESTIONS.length) {
      setError(`Please answer all questions before calculating results (${answeredCount}/${QUESTIONS.length} complete).`);
      return;
    }

    const computed = calculateResult(answers);
    setResult(computed);

    try {
      window.localStorage.setItem('mbtiAssessmentResult', JSON.stringify(computed));
    } catch {
      // no-op
    }

    await persistMBTI(computed, visibleToEmployers);
  };

  const handleReset = () => {
    setAnswers({});
    setResult(null);
    setError('');
    try {
      window.localStorage.removeItem('mbtiAssessmentAnswers');
      window.localStorage.removeItem('mbtiAssessmentResult');
    } catch {
      // no-op
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <Head>
        <title>Myers-Briggs Assessment – PMO Network</title>
        <meta
          name="description"
          content="Complete the Myers-Briggs assessment to generate structured behavioural and communication insights for your candidate profile."
        />
      </Head>

      <div className="mbti-page">
        <header className="hero">
          <div>
            <p className="eyebrow">Professional Insights</p>
            <h1>Myers-Briggs Assessment</h1>
            <p>
              Complete all 70 questions to generate a structured communication and collaboration profile for your
              candidate insights.
            </p>
          </div>
          <div className="hero-actions">
            <Link href="/dashboard/professional-insights" className="btn-secondary">Back to Professional Insights</Link>
            <button type="button" className="btn-secondary" onClick={handleReset}>Reset Assessment</button>
          </div>
        </header>

        <section className="progress-panel">
          <div>
            <span>Completion</span>
            <strong>{answeredCount}/{QUESTIONS.length}</strong>
          </div>
          <div className="progress-track" aria-hidden="true">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <button type="button" className="btn-primary" onClick={handleSubmit}>Calculate Results</button>
        </section>

        <section className="visibility-panel">
          <label className="visibility-toggle">
            <input
              type="checkbox"
              checked={visibleToEmployers}
              onChange={async (event) => {
                const checked = event.target.checked;
                setVisibleToEmployers(checked);
                if (result) {
                  await persistMBTI(result, checked);
                }
              }}
            />
            <span>Visible to employers on your candidate profile</span>
          </label>
          {saveState && <small className="save-state">{saveState}</small>}
        </section>

        {error && <p className="error">{error}</p>}

        <ol className="question-list">
          {QUESTIONS.map((question) => (
            <li key={question.id} className="question-card">
              <h2>{question.id}. {question.prompt}</h2>
              <div className="option-grid">
                {question.options.map((option) => (
                  <label key={option.value} className={`option ${answers[question.id] === option.value ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name={`q${question.id}`}
                      checked={answers[question.id] === option.value}
                      onChange={() => handleSelect(question.id, option.value)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </li>
          ))}
        </ol>

        <section className="calculate-panel">
          <p>
            {answeredCount === QUESTIONS.length
              ? 'All questions complete. You can calculate your results now.'
              : `Complete all questions to calculate results (${answeredCount}/${QUESTIONS.length}).`}
          </p>
          <button type="button" className="btn-primary" onClick={handleSubmit}>Calculate Results</button>
        </section>

        {result && (
          <section className="results">
            <h2>Your MBTI-style profile: <span>{result.type}</span></h2>
            <p>{TYPE_NOTES[result.type] || 'Balanced multi-style profile with flexible communication and decision patterns.'}</p>

            <div className="score-grid">
              {result.pairScores.map((pair) => (
                <article key={pair.title} className="score-card">
                  <h3>{pair.title}</h3>
                  <div className="score-labels">
                    <span>{pair.left.toUpperCase()} ({pair.leftPct}%)</span>
                    <span>{pair.right.toUpperCase()} ({pair.rightPct}%)</span>
                  </div>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{ width: `${pair.leftPct}%`, background: pair.color }}
                    />
                    <div className="midline" />
                  </div>
                  <small>{pair.leftCount} vs {pair.rightCount} responses</small>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>

      <style jsx>{`
        .mbti-page {
          max-width: 1100px;
          margin: 0 auto;
          padding: 24px;
          color: #0f172a;
        }

        .hero,
        .progress-panel,
        .visibility-panel,
        .question-card,
        .calculate-panel,
        .results {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.07);
        }

        .hero {
          padding: 22px;
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: flex-start;
        }

        .eyebrow {
          margin: 0;
          color: #6366f1;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 700;
          font-size: 12px;
        }

        h1 {
          margin: 8px 0;
          font-size: 32px;
          letter-spacing: -0.02em;
        }

        .hero p {
          margin: 0;
          color: #475569;
          line-height: 1.5;
          max-width: 68ch;
        }

        .hero-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .progress-panel {
          margin-top: 14px;
          padding: 14px;
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: 14px;
        }

        .visibility-panel {
          margin-top: 10px;
          padding: 12px 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
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

        .progress-panel span {
          display: block;
          font-size: 12px;
          color: #64748b;
        }

        .progress-panel strong {
          font-size: 18px;
        }

        .progress-track {
          height: 10px;
          background: #e2e8f0;
          border-radius: 999px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #6366f1, #22d3ee);
        }

        .btn-primary,
        .btn-secondary {
          border-radius: 10px;
          font-weight: 700;
          font-size: 12px;
          padding: 10px 12px;
          cursor: pointer;
          border: 1px solid #cbd5e1;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .btn-primary {
          border-color: #0f172a;
          background: #0f172a;
          color: #fff;
        }

        .btn-secondary {
          background: #fff;
          color: #0f172a;
        }

        .error {
          margin: 12px 0;
          color: #b91c1c;
          background: #fee2e2;
          border: 1px solid #fecaca;
          border-radius: 10px;
          padding: 10px 12px;
        }

        .question-list {
          list-style: none;
          padding: 0;
          margin: 14px 0 0;
          display: grid;
          gap: 10px;
        }

        .question-card {
          padding: 14px;
          background: #ffffff;
        }

        .question-card h2 {
          margin: 0;
          font-size: 15px;
          color: #0f172a;
          line-height: 1.45;
        }

        .option-grid {
          margin-top: 10px;
          display: grid;
          gap: 8px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .option {
          border: 1px solid #94a3b8;
          border-radius: 10px;
          padding: 12px;
          display: flex;
          gap: 10px;
          align-items: flex-start;
          font-size: 14px;
          color: #0f172a;
          background: #ffffff;
          transition: border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
          cursor: pointer;
        }

        .option.selected {
          border-color: #6366f1;
          background: #eef2ff;
          color: #1e1b4b;
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
        }

        .option input {
          margin-top: 1px;
          accent-color: #6366f1;
          cursor: pointer;
          width: 16px;
          height: 16px;
          min-width: 16px;
          min-height: 16px;
          appearance: auto !important;
          opacity: 1 !important;
          position: static !important;
        }

        .option span {
          display: block;
          color: inherit;
          line-height: 1.4;
          font-weight: 500;
        }

        .calculate-panel {
          margin-top: 14px;
          padding: 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .calculate-panel p {
          margin: 0;
          color: #334155;
          font-size: 14px;
        }

        .results {
          margin-top: 16px;
          padding: 16px;
        }

        .results h2 {
          margin: 0;
          font-size: 24px;
        }

        .results h2 span {
          color: #4338ca;
        }

        .results > p {
          margin: 8px 0 0;
          color: #475569;
        }

        .score-grid {
          margin-top: 14px;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .score-card {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 12px;
          background: #f8fafc;
        }

        .score-card h3 {
          margin: 0;
          font-size: 14px;
        }

        .score-labels {
          margin-top: 8px;
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #475569;
        }

        .bar-track {
          margin-top: 8px;
          height: 10px;
          border-radius: 999px;
          background: #e2e8f0;
          position: relative;
          overflow: hidden;
        }

        .bar-fill {
          height: 100%;
        }

        .midline {
          position: absolute;
          left: 50%;
          top: 0;
          bottom: 0;
          width: 2px;
          background: #94a3b8;
          transform: translateX(-1px);
        }

        .score-card small {
          margin-top: 8px;
          display: block;
          color: #64748b;
        }

        @media (max-width: 900px) {
          .hero,
          .progress-panel {
            grid-template-columns: 1fr;
            display: grid;
          }

          .progress-panel {
            gap: 10px;
          }

          .option-grid,
          .score-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (prefers-color-scheme: dark) {
          .mbti-page {
            color: #e2e8f0;
          }

          .hero,
          .progress-panel,
          .visibility-panel,
          .question-card,
          .calculate-panel,
          .results,
          .score-card {
            background: #0b1220;
            border-color: #1f2a3a;
          }

          .hero p,
          .results > p,
          .score-labels,
          .score-card small,
          .progress-panel span {
            color: #94a3b8;
          }

          .visibility-toggle,
          .save-state {
            color: #cbd5e1;
          }

          .progress-track,
          .bar-track {
            background: #1e293b;
          }

          .btn-secondary {
            background: #111827;
            color: #e2e8f0;
            border-color: #334155;
          }

          .option {
            border-color: #475569;
            color: #e2e8f0;
            background: #111827;
          }

          .option.selected {
            background: #1e1b4b;
            border-color: #6366f1;
            color: #e0e7ff;
          }

          .question-card h2,
          .option span,
          .calculate-panel p {
            color: #e2e8f0;
          }
        }

        @media (max-width: 700px) {
          .calculate-panel {
            flex-direction: column;
            align-items: stretch;
          }
        }
      `}</style>
    </>
  );
}
