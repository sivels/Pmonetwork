import Head from 'next/head';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './api/auth/[...nextauth]';
import Link from 'next/link';
import { useState } from 'react';

export async function getServerSideProps(ctx) {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session) {
    return { redirect: { destination: '/auth/login?returnTo=/help', permanent: false } };
  }
  return { props: { user: session.user } };
}

export default function HelpPage({ user }) {
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      id: 1,
      question: 'How do I update my profile?',
      answer: 'Go to Dashboard > My Profile. You can edit your personal details, work experience, skills, certifications, and upload documents. Changes are saved automatically.'
    },
    {
      id: 2,
      question: 'How do I apply for jobs?',
      answer: 'Browse jobs on the Jobs page. Click "Apply Now" on any job listing. You can also save jobs for later by clicking the star icon.'
    },
    {
      id: 3,
      question: 'How do I track my applications?',
      answer: 'Visit your Dashboard and click "Applications" in the sidebar. You\'ll see all your submitted applications with their current status.'
    },
    {
      id: 4,
      question: 'How do I message employers?',
      answer: 'Go to Dashboard > Messages. You can view all conversations with employers and PMO support team. Reply to messages or start new conversations.'
    },
    {
      id: 5,
      question: 'How do I save jobs for later?',
      answer: 'Click the star icon on any job listing to save it. Access your saved jobs from Dashboard > Saved Jobs.'
    },
    {
      id: 6,
      question: 'What documents should I upload?',
      answer: 'We recommend uploading your CV (required), cover letter, certifications, and portfolio samples. Supported formats: PDF, DOC, DOCX.'
    },
    {
      id: 7,
      question: 'How do I delete my account?',
      answer: 'Go to Dashboard > Account Settings > Privacy & Security. Scroll to the bottom and click "Delete Account". This action is permanent.'
    },
    {
      id: 8,
      question: 'How do I change my email or password?',
      answer: 'Visit Dashboard > Account Settings. You can update your email address and password in the Account Security section.'
    }
  ];

  return (
    <>
      <Head>
        <title>Help & Support – PMO Network</title>
      </Head>
      <div className="help-page">
        <div className="help-header">
          <h1 className="page-title">Help & Support</h1>
          <p className="page-subtitle">Find answers to common questions or contact our support team</p>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <Link href="/dashboard/messages?support=true" className="action-card">
            <div className="action-icon messages">
              <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3>Message Support</h3>
            <p>Chat with our support team</p>
          </Link>
          <a href="mailto:support@pmonetwork.com" className="action-card">
            <div className="action-icon email">
              <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3>Email Us</h3>
            <p>support@pmonetwork.com</p>
          </a>
          <Link href="/dashboard/profile" className="action-card">
            <div className="action-icon profile">
              <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3>Profile Help</h3>
            <p>Optimize your profile</p>
          </Link>
        </div>

        {/* FAQs */}
        <div className="faq-section">
          <h2 className="section-title">Frequently Asked Questions</h2>
          <div className="faq-list">
            {faqs.map(faq => (
              <div key={faq.id} className={`faq-item ${openFaq === faq.id ? 'open' : ''}`}>
                <button 
                  className="faq-question"
                  onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                >
                  <span>{faq.question}</span>
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={openFaq === faq.id ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                  </svg>
                </button>
                {openFaq === faq.id && (
                  <div className="faq-answer">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Still Need Help */}
        <div className="contact-section">
          <h2>Still need help?</h2>
          <p>Our support team is here to help you Monday - Friday, 9am - 6pm GMT</p>
          <div className="contact-buttons">
            <Link href="/dashboard/messages?support=true" className="btn-primary">
              Start a Conversation
            </Link>
            <a href="mailto:support@pmonetwork.com" className="btn-secondary">
              Email Support
            </a>
          </div>
        </div>
      </div>

      <style jsx>{`
        .help-page { max-width:1200px; margin:0 auto; padding:2rem; }
        .help-header { text-align:center; margin-bottom:3rem; }
        .page-title { font-size:2rem; font-weight:700; color:#1f2937; margin:0 0 0.75rem; }
        .page-subtitle { font-size:1.1rem; color:#6b7280; margin:0; }

        /* Quick Actions */
        .quick-actions { display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:1.5rem; margin-bottom:3rem; }
        .action-card { display:flex; flex-direction:column; align-items:center; padding:2rem; background:#ffffff; border:1px solid #e5e7eb; border-radius:16px; text-decoration:none; transition:all 0.2s; text-align:center; }
        .action-card:hover { box-shadow:0 8px 24px rgba(0,0,0,0.08); transform:translateY(-2px); }
        .action-icon { width:64px; height:64px; border-radius:50%; display:flex; align-items:center; justify-content:center; margin-bottom:1rem; }
        .action-icon.messages { background:linear-gradient(135deg, #eef2ff, #e0e7ff); color:#4f46e5; }
        .action-icon.email { background:linear-gradient(135deg, #fef3c7, #fde68a); color:#d97706; }
        .action-icon.profile { background:linear-gradient(135deg, #d1fae5, #a7f3d0); color:#059669; }
        .action-card h3 { font-size:1.1rem; font-weight:600; color:#1f2937; margin:0 0 0.5rem; }
        .action-card p { font-size:0.9rem; color:#6b7280; margin:0; }

        /* FAQ Section */
        .faq-section { margin-bottom:3rem; }
        .section-title { font-size:1.5rem; font-weight:700; color:#1f2937; margin:0 0 1.5rem; }
        .faq-list { display:flex; flex-direction:column; gap:0.75rem; }
        .faq-item { background:#ffffff; border:1px solid #e5e7eb; border-radius:12px; overflow:hidden; transition:all 0.2s; }
        .faq-item:hover { border-color:#d1d5db; }
        .faq-item.open { border-color:#6366f1; }
        .faq-question { width:100%; display:flex; align-items:center; justify-content:space-between; padding:1.25rem 1.5rem; background:transparent; border:none; text-align:left; font-size:1rem; font-weight:600; color:#1f2937; cursor:pointer; transition:all 0.15s; }
        .faq-question:hover { background:#f9fafb; }
        .faq-question svg { flex-shrink:0; color:#6b7280; transition:transform 0.2s; }
        .faq-item.open .faq-question svg { color:#6366f1; }
        .faq-answer { padding:0 1.5rem 1.25rem; font-size:0.95rem; color:#4b5563; line-height:1.6; animation:fadeIn 0.2s ease-out; }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }

        /* Contact Section */
        .contact-section { text-align:center; padding:3rem 2rem; background:linear-gradient(135deg, #eef2ff, #e0e7ff); border-radius:16px; }
        .contact-section h2 { font-size:1.75rem; font-weight:700; color:#1f2937; margin:0 0 0.75rem; }
        .contact-section p { font-size:1rem; color:#6b7280; margin:0 0 2rem; }
        .contact-buttons { display:flex; gap:1rem; justify-content:center; flex-wrap:wrap; }
        .btn-primary, .btn-secondary { padding:0.85rem 2rem; border-radius:12px; font-size:0.95rem; font-weight:600; text-decoration:none; transition:all 0.15s; }
        .btn-primary { background:#4f46e5; color:#ffffff; }
        .btn-primary:hover { background:#4338ca; transform:translateY(-1px); box-shadow:0 4px 12px rgba(79,70,229,0.3); }
        .btn-secondary { background:#ffffff; color:#374151; border:1px solid #d1d5db; }
        .btn-secondary:hover { background:#f9fafb; border-color:#9ca3af; }

        @media (max-width:768px) {
          .help-page { padding:1rem; }
          .page-title { font-size:1.5rem; }
          .quick-actions { grid-template-columns:1fr; }
          .contact-buttons { flex-direction:column; }
        }
      `}</style>
    </>
  );
}
